import { NextRequest, NextResponse } from "next/server";
import type { DatabaseError } from "pg";

import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { userExists } from "@/lib/blocking";
import {
  createReviewBodySchema,
  userIdParamsSchema,
  userReviewsQuerySchema,
} from "@/lib/validators/users";

export const dynamic = "force-dynamic";

const REVIEWS_PAGE_SIZE = 10;
const REVIEW_TEXT_COLUMNS = ["body", "comment"] as const;

type ReviewTextColumn = (typeof REVIEW_TEXT_COLUMNS)[number];

type ReviewRow = {
  id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type ReviewListRow = {
  user_exists: boolean;
  average_rating: number;
  rating_count: number;
  id: string | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewer_avatar_url: string | null;
  seller_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

type PagedReviewRow = ReviewListRow & {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  seller_id: string;
  rating: number;
  created_at: string;
};

function isUniqueViolation(error: unknown): boolean {
  const dbError = error as DatabaseError | undefined;
  return dbError?.code === "23505";
}

function isReviewTextColumn(columnName: string): columnName is ReviewTextColumn {
  return REVIEW_TEXT_COLUMNS.some((candidate) => candidate === columnName);
}

function isPagedReviewRow(row: ReviewListRow): row is PagedReviewRow {
  return (
    row.id !== null &&
    row.reviewer_id !== null &&
    row.reviewer_name !== null &&
    row.seller_id !== null &&
    row.rating !== null &&
    row.created_at !== null
  );
}

async function getReviewTextColumn(): Promise<ReviewTextColumn> {
  const rows = await query<{ column_name: string }>(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'reviews'
      AND column_name IN ('body', 'comment')
    ORDER BY CASE column_name WHEN 'body' THEN 0 ELSE 1 END
    LIMIT 1
    `
  );

  const columnName = rows[0]?.column_name;
  if (columnName && isReviewTextColumn(columnName)) {
    return columnName;
  }

  throw new Error("reviews table is missing a review text column.");
}

/**
 * GET /api/users/:id/reviews
 * Public, paginated review list for seller :id with average rating computed in SQL.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const rawParams = await context.params;
  const parsedParams = userIdParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid user id.", details: parsedParams.error.format() },
      { status: 400 }
    );
  }

  const parsedQuery = userReviewsQuerySchema.safeParse({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsedQuery.error.format() },
      { status: 400 }
    );
  }

  const sellerId = parsedParams.data.id;
  const { page } = parsedQuery.data;
  const offset = (page - 1) * REVIEWS_PAGE_SIZE;

  let rows: ReviewListRow[];
  try {
    rows = await query<ReviewListRow>(
      `
      WITH target_user AS (
        SELECT EXISTS(
          SELECT 1
          FROM users
          WHERE id = $1
        ) AS user_exists
      ),
      review_stats AS (
        SELECT
          COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0)::FLOAT AS average_rating,
          COUNT(r.id)::INT AS rating_count
        FROM reviews r
        WHERE r.seller_id = $1
      ),
      paged_reviews AS (
        SELECT
          r.id,
          r.reviewer_id,
          reviewer.full_name AS reviewer_name,
          reviewer.avatar_url AS reviewer_avatar_url,
          r.seller_id,
          r.rating::INT AS rating,
          COALESCE(to_jsonb(r)->>'comment', to_jsonb(r)->>'body') AS comment,
          r.created_at::TEXT AS created_at
        FROM reviews r
        JOIN users reviewer ON reviewer.id = r.reviewer_id
        WHERE r.seller_id = $1
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT $2
        OFFSET $3
      )
      SELECT
        tu.user_exists,
        rs.average_rating,
        rs.rating_count,
        pr.id,
        pr.reviewer_id,
        pr.reviewer_name,
        pr.reviewer_avatar_url,
        pr.seller_id,
        pr.rating,
        pr.comment,
        pr.created_at
      FROM target_user tu
      CROSS JOIN review_stats rs
      LEFT JOIN paged_reviews pr ON TRUE
      ORDER BY pr.created_at DESC NULLS LAST, pr.id DESC NULLS LAST
      `,
      [sellerId, REVIEWS_PAGE_SIZE, offset]
    );
  } catch (error) {
    console.error("[GET /api/users/:id/reviews]", error);
    return NextResponse.json(
      { error: "Failed to load reviews. Please try again." },
      { status: 500 }
    );
  }

  const summary = rows[0];
  if (!summary?.user_exists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const totalPages = Math.max(
    1,
    Math.ceil(summary.rating_count / REVIEWS_PAGE_SIZE)
  );

  return NextResponse.json(
    {
      averageRating: summary.average_rating,
      ratingCount: summary.rating_count,
      reviews: rows
        .filter(isPagedReviewRow)
        .map((row) => ({
          id: row.id,
          reviewerId: row.reviewer_id,
          reviewer: {
            id: row.reviewer_id,
            name: row.reviewer_name,
            avatarUrl: row.reviewer_avatar_url,
          },
          sellerId: row.seller_id,
          rating: row.rating,
          comment: row.comment,
          createdAt: row.created_at,
        })),
      pagination: {
        page,
        limit: REVIEWS_PAGE_SIZE,
        total: summary.rating_count,
        totalPages,
      },
    },
    { status: 200 }
  );
}

/**
 * POST /api/users/:id/reviews
 * Authenticated buyer leaves a 1–5 star review for seller :id.
 * Only one review is allowed per reviewer→seller pair (409 on duplicate).
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // --- Auth: reject anonymous requests ---
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "You must be logged in to leave a review." },
      { status: 401 }
    );
  }

  // --- Validate route param ---
  const rawParams = await context.params;
  const parsedParams = userIdParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid user id.", details: parsedParams.error.format() },
      { status: 400 }
    );
  }

  const reviewerId = session.userId;
  const sellerId = parsedParams.data.id;

  // Cannot review yourself
  if (reviewerId === sellerId) {
    return NextResponse.json(
      { error: "You cannot review yourself." },
      { status: 400 }
    );
  }

  // --- Validate body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedBody = createReviewBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsedBody.error.format() },
      { status: 400 }
    );
  }

  const { rating, comment } = parsedBody.data;

  // --- Verify target user exists ---
  const targetExists = await userExists(sellerId);
  if (!targetExists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // --- Insert review (unique constraint enforces one-per-pair) ---
  try {
    const reviewTextColumn = await getReviewTextColumn();
    const rows = await query<ReviewRow>(
      `
      INSERT INTO reviews (reviewer_id, seller_id, rating, ${reviewTextColumn})
      VALUES ($1, $2, $3, $4)
      RETURNING id, reviewer_id, seller_id, rating, ${reviewTextColumn} AS comment, created_at
      `,
      [reviewerId, sellerId, rating, comment ?? null]
    );

    return NextResponse.json(
      {
        review: {
          id: rows[0].id,
          reviewerId: rows[0].reviewer_id,
          sellerId: rows[0].seller_id,
          rating: rows[0].rating,
          comment: rows[0].comment,
          createdAt: rows[0].created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Unique constraint violation → duplicate review
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "You have already reviewed this seller." },
        { status: 409 }
      );
    }
    throw error;
  }
}
