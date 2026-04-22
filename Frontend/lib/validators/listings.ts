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

function parseCurrencyInput(value: unknown): unknown {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/^\$/, "").replace(/,/g, "");
    return normalized.length > 0 ? Number(normalized) : Number.NaN;
  }

  return value;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const currencySchema = z
  .preprocess(
    parseCurrencyInput,
    z
      .number({ message: "Price must be a number." })
      .finite("Price must be a number.")
      .min(0, "Price must be at least 0.")
  )
  .transform(roundCurrency);

const createListingBodyShape = {
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
  price: currencySchema,
  isFree: z.boolean().default(false),
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
} satisfies z.ZodRawShape;

const createListingBodyBaseSchema = z.object(createListingBodyShape);

function applyCreateListingPriceRules<
  T extends {
    price: number;
    isFree: boolean;
  },
>(data: T, ctx: z.RefinementCtx): void {
  if (data.isFree) {
    if (data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Free listings must have a price of 0.",
      });
    }
    return;
  }

  if (data.price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price must be greater than 0.",
    });
  }
}

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
    include_sold: z.preprocess(
      (v) => {
        if (v === "" || v === null || v === undefined) return false;
        if (typeof v === "boolean") return v;
        if (typeof v === "string") return v.toLowerCase() === "true";
        return false;
      },
      z.boolean()
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

export const createListingBodySchema = createListingBodyBaseSchema.superRefine(
  applyCreateListingPriceRules
);

export const createListingDetailsSchema = createListingBodyBaseSchema
  .pick({
    title: true,
    description: true,
    price: true,
    isFree: true,
    condition: true,
    category: true,
  })
  .superRefine(applyCreateListingPriceRules);

export const createListingPhotosSchema = createListingBodyBaseSchema.pick({
  photoUrls: true,
});

export type CreateListingBodyInput = z.infer<typeof createListingBodySchema>;

/** Valid status values for the listings.status column. */
export const LISTING_STATUSES = ["active", "sold", "deleted"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/**
 * Status values that sellers may set through the generic edit flow.
 *
 * Deletion is intentionally excluded here so soft deletes always go through
 * DELETE /api/listings/:id, which preserves the audit trail without exposing
 * "deleted" as a regular form field.
 */
export const EDITABLE_LISTING_STATUSES = ["active", "sold"] as const;
export type EditableListingStatus =
  (typeof EDITABLE_LISTING_STATUSES)[number];

const updateListingBodyShape = {
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title must be at most 120 characters.")
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(1500, "Description must be at most 1500 characters.")
    .optional(),
  price: currencySchema.optional(),
  isFree: z.boolean().optional(),
  condition: z
    .enum(LISTING_CONDITIONS, {
      error: "Condition must be one of: New, Like New, Good, Fair, Poor.",
    })
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(64, "Category must be at most 64 characters.")
    .transform((value) => value.toLowerCase())
    .optional(),
  status: z
    .enum(EDITABLE_LISTING_STATUSES, {
      error: "Status must be one of: active, sold.",
    })
    .optional(),
  photoUrls: z
    .array(z.string().trim().url("Each photo URL must be valid."))
    .min(1, "Add at least one photo URL.")
    .max(5, "Please provide at most 5 photos.")
    .optional(),
} satisfies z.ZodRawShape;

const updateListingBodyBaseSchema = z.object(updateListingBodyShape);

/**
 * Body validation for PATCH /api/listings/:id.
 *
 * Every field is optional to support partial updates, but at least one field
 * must be present — an empty body is rejected with 400.
 */
export const updateListingBodySchema = updateListingBodyBaseSchema.superRefine(
  (data, ctx) => {
    if (!Object.values(data).some((v) => v !== undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field must be provided.",
      });
      return;
    }

    if (data.isFree === true) {
      if (data.price !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: "Free listings must have a price of 0.",
        });
      }
      return;
    }

    if (data.isFree === false && data.price !== undefined && data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Price must be greater than 0.",
      });
    }
  }
);

export type UpdateListingBodyInput = z.infer<typeof updateListingBodySchema>;

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
