import { z } from "zod";

/** Valid condition values for listings (must match DB and Listing type). */
export const LISTING_CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
] as const;

export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

/**
 * Querystring validation for GET /api/listings.
 *
 * All values arrive as strings (or null) via URLSearchParams and are
 * normalized at the API boundary before hitting the database.
 * Category, price range, and condition are combinable; invalid values return 400.
 */
export const listingsQuerySchema = z
  .object({
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
      .transform((value) =>
        value && value.length > 0 ? value.toLowerCase() : undefined
      ),
    price_min: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
      z
        .number({ message: "price_min must be a number." })
        .min(0, "price_min must be at least 0.")
        .optional()
    ),
    price_max: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
      z
        .number({ message: "price_max must be a number." })
        .min(0, "price_max must be at least 0.")
        .optional()
    ),
    condition: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z
        .enum(LISTING_CONDITIONS, {
          error: "condition must be one of: New, Like New, Good, Fair, Poor.",
        })
        .optional()
    ),
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
  })
  .refine(
    (data) =>
      data.price_min == null ||
      data.price_max == null ||
      data.price_min <= data.price_max,
    {
      message: "price_min must be less than or equal to price_max.",
      path: ["price_min"],
    }
  );

export type ListingsQueryInput = z.infer<typeof listingsQuerySchema>;

