import { z } from "zod";

/**
 * Querystring validation for GET /api/listings.
 *
 * All values arrive as strings (or null) via URLSearchParams and are
 * normalized at the API boundary before hitting the database.
 */
export const listingsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(256, "Search query must be at most 256 characters.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  category: z
    .string()
    .trim()
    .max(64, "Category must be at most 64 characters.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value.toLowerCase() : undefined)),
  page: z
    .number()
    .int()
    .min(1, "Page must be at least 1.")
    .max(1_000, "Page is too large."),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit must be at most 100."),
});

export type ListingsQueryInput = z.infer<typeof listingsQuerySchema>;

