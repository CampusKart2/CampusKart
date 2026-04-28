import { NextResponse, type NextRequest } from "next/server";

import { query } from "@/lib/db";
import { deriveMessageFeedRows } from "@/lib/getstream/derive-message-feed-rows";
import { verifyGetStreamChatWebhookSignature } from "@/lib/getstream/verify-webhook-signature";
import { getStreamChatWebhookBodySchema } from "@/lib/validators/getstream-webhook";

export const dynamic = "force-dynamic";

const SIGNATURE_HEADER = "x-signature";
const API_KEY_HEADER = "x-api-key";
const WEBHOOK_ID_HEADER = "x-webhook-id";

type InsertRow = { id: string };

/**
 * POST /api/webhooks/getstream
 *
 * Receives Stream Chat (GetStream) webhooks, verifies HMAC with GETSTREAM_API_SECRET,
 * optionally checks GETSTREAM_API_KEY against X-Api-Key, then inserts one durable row
 * per X-Webhook-Id (idempotent for retries). Designed to complete quickly (<1s under normal load).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiSecret = process.env.GETSTREAM_API_SECRET?.trim() ?? "";
  if (!apiSecret) {
    return NextResponse.json(
      { error: "GetStream webhook is not configured." },
      { status: 503 }
    );
  }

  const expectedApiKey = process.env.GETSTREAM_API_KEY?.trim();
  const requestApiKey = request.headers.get(API_KEY_HEADER);
  if (expectedApiKey && requestApiKey !== expectedApiKey) {
    return NextResponse.json(
      { error: "Invalid API key." },
      { status: 401 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);

  if (!verifyGetStreamChatWebhookSignature(rawBody, signature, apiSecret)) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = rawBody.length === 0 ? null : JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Request body is not valid JSON." },
      { status: 400 }
    );
  }

  const parsed = getStreamChatWebhookBodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const webhookId = request.headers.get(WEBHOOK_ID_HEADER)?.trim();
  if (!webhookId) {
    return NextResponse.json(
      { error: "Missing X-Webhook-Id header." },
      { status: 400 }
    );
  }

  const eventType = parsed.data.type;

  try {
    const rows = await query<InsertRow>(
      `INSERT INTO getstream_webhook_notifications (
        getstream_webhook_id,
        getstream_event_type,
        payload
      ) VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (getstream_webhook_id) DO NOTHING
      RETURNING id`,
      [webhookId, eventType, JSON.stringify(parsed.data)]
    );

    // First delivery: 201. Retries (same X-Webhook-Id): 200, still success for Stream.
    if (rows.length > 0) {
      // Fan out per-recipient rows for the notification dropdown (T-68). Non-fatal if
      // the feed table is missing or payload shape differs between Stream versions.
      try {
        const feedRows = deriveMessageFeedRows(
          webhookId,
          eventType,
          parsed.data as Record<string, unknown>
        );
        for (const fr of feedRows) {
          await query(
            `INSERT INTO message_notification_feed (
              recipient_user_id,
              stream_webhook_id,
              sender_stream_user_id,
              sender_display_name,
              snippet,
              channel_type,
              channel_id
            ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (recipient_user_id, stream_webhook_id) DO NOTHING`,
            [
              fr.recipientUserId,
              fr.streamWebhookId,
              fr.senderStreamUserId,
              fr.senderDisplayName,
              fr.snippet,
              fr.channelType,
              fr.channelId,
            ]
          );
        }
      } catch (feedErr) {
        console.warn(
          "[POST /api/webhooks/getstream] message_notification_feed insert skipped:",
          feedErr
        );
      }

      return NextResponse.json(
        { ok: true, id: rows[0].id, stored: true },
        { status: 201 }
      );
    }
    return NextResponse.json(
      { ok: true, stored: false, reason: "duplicate_webhook" },
      { status: 200 }
    );
  } catch (err) {
    // Likely: migration not applied (undefined_table). Avoid infinite retries on 5xx for bad deploys.
    console.error("[POST /api/webhooks/getstream] DB error:", err);
    return NextResponse.json(
      { error: "Failed to store notification." },
      { status: 500 }
    );
  }
}
