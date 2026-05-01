import { NextResponse } from "next/server";
import type { DatabaseError } from "pg";

import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { userExists } from "@/lib/blocking";
import { userIdParamsSchema, createReviewBodySchema } from "@/lib/validators/users";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function isUniqueViolation(error: unknown): boolean {
  const dbError = error as DatabaseError | undefined;
  return dbError?.code === "23505";
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
    const rows = await query<ReviewRow>(
      `
      INSERT INTO reviews (reviewer_id, seller_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING id, reviewer_id, seller_id, rating, comment, created_at
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
