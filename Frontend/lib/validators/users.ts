import { z } from "zod";

/**
 * Dynamic route params for `/api/users/:id/...`.
 * UUID format is validated before any database access.
 */
export const userIdParamsSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID."),
});

/**
 * Querystring for GET /api/users/:id/profile (pagination for active listings).
 */
export const sellerProfileQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
