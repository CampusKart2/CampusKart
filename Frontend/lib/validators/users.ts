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

/**
 * Querystring for GET /api/users/:id/reviews.
 * Reviews are fixed at 10 per page by the API contract.
 */
export const userReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * Request body for POST /api/users/:id/reviews.
 */
export const createReviewBodySchema = z.object({
  rating: z
    .number({ error: "Rating is required." })
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5."),
  comment: z
    .string()
    .max(1000, "Comment must be 1000 characters or fewer.")
    .optional(),
});
