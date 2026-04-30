import { z } from "zod";

/** CampusKart uses UUID string user ids in Stream; skip obviously invalid ids. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MessageFeedInsert = {
  recipientUserId: string;
  streamWebhookId: string;
  senderStreamUserId: string;
  senderDisplayName: string;
  snippet: string;
  channelType: string;
  channelId: string;
};

const streamUserSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    text: z.string().optional(),
    user: streamUserSchema.optional(),
  })
  .passthrough();

const memberSchema = z
  .object({
    user_id: z.string().optional(),
    user: streamUserSchema.optional(),
  })
  .passthrough();

const membersSchema = z.union([
  z.record(z.string(), memberSchema),
  z.array(memberSchema),
]);

const channelSchema = z
  .object({
    type: z.string().optional(),
    id: z.string().optional(),
    cid: z.string().optional(),
    members: membersSchema.optional(),
  })
  .passthrough();

const messageEventPayloadSchema = z
  .object({
    cid: z.string().optional(),
    user: streamUserSchema.optional(),
    message: messageSchema.optional(),
    channel: channelSchema.optional(),
    members: membersSchema.optional(),
  })
  .passthrough();

const SNIPPET_MAX = 160;

function truncateSnippet(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= SNIPPET_MAX) return t;
  return `${t.slice(0, SNIPPET_MAX - 1)}…`;
}

function parseChannelTypeId(
  channel: z.infer<typeof channelSchema> | null,
  fallbackCid?: string
): { channelType: string; channelId: string } | null {
  if (channel?.type && channel.id) {
    return { channelType: channel.type, channelId: channel.id };
  }
  const cid = channel?.cid ?? fallbackCid;
  if (typeof cid === "string" && cid.includes(":")) {
    const idx = cid.indexOf(":");
    const channelType = cid.slice(0, idx);
    const channelId = cid.slice(idx + 1);
    if (channelType.length > 0 && channelId.length > 0) {
      return { channelType, channelId };
    }
  }
  return null;
}

function collectRecipientIds(
  members: z.infer<typeof membersSchema>,
  senderStreamUserId: string
): Set<string> {
  const recipientIds = new Set<string>();

  if (Array.isArray(members)) {
    for (const entry of members) {
      const uid = entry.user?.id ?? entry.user_id;
      if (typeof uid === "string" && UUID_RE.test(uid) && uid !== senderStreamUserId) {
        recipientIds.add(uid);
      }
    }
    return recipientIds;
  }

  for (const [key, entry] of Object.entries(members)) {
    if (UUID_RE.test(key) && key !== senderStreamUserId) {
      recipientIds.add(key);
    }
    const uid = entry.user?.id ?? entry.user_id;
    if (typeof uid === "string" && UUID_RE.test(uid) && uid !== senderStreamUserId) {
      recipientIds.add(uid);
    }
  }

  return recipientIds;
}

/**
 * Builds per-recipient rows for message-style Stream webhook events so the DB can
 * power a user-scoped notification feed. Returns empty when the payload is not a
 * supported shape or has no channel members.
 */
export function deriveMessageFeedRows(
  streamWebhookId: string,
  eventType: string,
  payload: Record<string, unknown>
): MessageFeedInsert[] {
  if (
    eventType !== "notification.message_new" &&
    eventType !== "message.new"
  ) {
    return [];
  }

  const parsed = messageEventPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const p = parsed.data;
  const typed = p.channel ? channelSchema.safeParse(p.channel) : null;
  const ch = typed?.success ? typed.data : null;

  const ids = parseChannelTypeId(ch, p.cid);
  if (!ids) {
    return [];
  }

  const msg = p.message ? messageSchema.safeParse(p.message) : null;
  const messageUser =
    msg?.success && msg.data.user ? streamUserSchema.safeParse(msg.data.user) : null;
  const topUser = p.user ? streamUserSchema.safeParse(p.user) : null;

  const senderParsed =
    messageUser?.success
      ? messageUser.data
      : topUser?.success
        ? topUser.data
        : null;
  if (!senderParsed) {
    return [];
  }

  const senderStreamUserId = senderParsed.id;
  const senderDisplayName =
    typeof senderParsed.name === "string" && senderParsed.name.trim().length > 0
      ? senderParsed.name.trim()
      : senderStreamUserId;

  const rawText =
    msg?.success && typeof msg.data.text === "string" ? msg.data.text : "";
  const snippet =
    rawText.trim().length > 0 ? truncateSnippet(rawText) : "(no text)";

  const members = p.members ?? ch?.members;
  if (!members) {
    return [];
  }

  const recipientIds = collectRecipientIds(members, senderStreamUserId);

  const rows: MessageFeedInsert[] = [];
  for (const recipientUserId of recipientIds) {
    rows.push({
      recipientUserId,
      streamWebhookId,
      senderStreamUserId,
      senderDisplayName,
      snippet,
      channelType: ids.channelType,
      channelId: ids.channelId,
    });
  }
  return rows;
}
