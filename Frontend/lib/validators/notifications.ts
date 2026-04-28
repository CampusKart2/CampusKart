import { z } from "zod";

/** GET /api/notifications?limit=… (default 10, max 10). */
export const notificationsQuerySchema = z.object({
  limit: z.preprocess((v) => {
    if (v == null || v === "") return 10;
    const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : 10;
  }, z.number().int().min(1).max(10)),
});

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  senderName: z.string(),
  snippet: z.string(),
  createdAt: z.string(),
  channelCid: z.string().min(1),
});

export const notificationsListResponseSchema = z.object({
  notifications: z.array(notificationItemSchema),
});

export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationsListResponse = z.infer<
  typeof notificationsListResponseSchema
>;
