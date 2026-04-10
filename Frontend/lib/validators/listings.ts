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

export const createListingBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title must be at most 120 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(1500, "Description must be at most 1500 characters."),
  price: z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    z
      .number({ message: "Price must be a number." })
      .min(0, "Price must be at least 0.")
  ),
  condition: z.enum(LISTING_CONDITIONS, {
    error: "Condition must be one of: New, Like New, Good, Fair, Poor.",
  }),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(64, "Category must be at most 64 characters.")
    .transform((value) => value.toLowerCase()),
  photoUrls: z
    .array(z.string().trim().url("Each photo URL must be valid."))
    .min(1, "Add at least one photo URL.")
    .max(5, "Please provide at most 5 photos."),
});

export const createListingDetailsSchema = createListingBodySchema.pick({
  title: true,
  description: true,
  price: true,
  condition: true,
  category: true,
});

export const createListingPhotosSchema = createListingBodySchema.pick({
  photoUrls: true,
});

export type CreateListingBodyInput = z.infer<typeof createListingBodySchema>;

/**
 * Querystring validation for GET /api/listings/nearby.
 *
 * Latitude/longitude are required and constrained to valid WGS84 bounds.
 * Radius is expressed in kilometers and capped at 50 km per product rules.
 */
export const nearbyListingsQuerySchema = z.object({
  lat: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number({ message: "lat must be a number." })
      .min(-90, "lat must be between -90 and 90.")
      .max(90, "lat must be between -90 and 90.")
  ),
  lng: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number({ message: "lng must be a number." })
      .min(-180, "lng must be between -180 and 180.")
      .max(180, "lng must be between -180 and 180.")
  ),
  radius: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number({ message: "radius must be a number." })
      .positive("radius must be greater than 0.")
      .max(50, "radius must be at most 50 km.")
  ),
});

export type NearbyListingsQueryInput = z.infer<typeof nearbyListingsQuerySchema>;
