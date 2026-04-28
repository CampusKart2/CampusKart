import { z } from "zod";

/**
 * Stream Chat posts JSON with at least `type` (e.g. `message.new`).
 * The rest of the keys vary by event; we allow passthrough and persist full body.
 */
export const getStreamChatWebhookBodySchema = z
  .object({
    type: z.string().min(1, "type must be a non-empty string."),
  })
  .passthrough();

export type GetStreamChatWebhookBody = z.infer<
  typeof getStreamChatWebhookBodySchema
>;
