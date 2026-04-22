import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Listing } from "@/lib/types/listing";
import type { SellerProfileApiResponse } from "@/lib/types/seller-profile";
import {
  sellerProfileQuerySchema,
  userIdParamsSchema,
} from "@/lib/validators/users";

type DbUserProfileRow = {
  full_name: string;
  avatar_url: string | null;
  average_rating: string;
  rating_count: number;
  created_at: string;
};

type DbListingSummaryRow = {
  id: string;
  title: string;
  price: string;
  condition: Listing["condition"];
  category_slug: string;
  thumbnail_url: string | null;
  created_at: string;
  view_count: number;
};

/**
 * GET /api/users/:id/profile
 * Public seller profile: avatar, name, aggregate rating, paginated active listings, join date.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const rawParams = await context.params;
  const parsedParams = userIdParamsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: parsedParams.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { id: userId } = parsedParams.data;

  const rawQuery = {
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  };
  const parsedQuery = sellerProfileQuerySchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: parsedQuery.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { page, limit } = parsedQuery.data;
  const offset = (page - 1) * limit;

  let userRows: DbUserProfileRow[];
  try {
    userRows = await query<DbUserProfileRow>(
      `
      SELECT full_name, avatar_url, average_rating, rating_count, created_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );
  } catch (err) {
    console.error("[GET /api/users/:id/profile] user query error:", err);
    return NextResponse.json(
      { error: "Failed to load profile. Please try again." },
      { status: 500 }
    );
  }

  const user = userRows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  let totalActive = 0;
  try {
    const countRows = await query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM listings
      WHERE seller_id = $1
        AND status <> 'deleted'
        AND status = 'active'
      `,
      [userId]
    );
    totalActive = Number(countRows[0]?.count ?? 0);
  } catch (err) {
    console.error("[GET /api/users/:id/profile] count query error:", err);
    return NextResponse.json(
      { error: "Failed to load profile. Please try again." },
      { status: 500 }
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalActive / limit));

  let listingRows: DbListingSummaryRow[];
  try {
    listingRows = await query<DbListingSummaryRow>(
      `
      SELECT
        l.id,
        l.title,
        l.price,
        l.condition,
        c.slug AS category_slug,
        (
          SELECT lp.url
          FROM listing_photos lp
          WHERE lp.listing_id = l.id AND lp.position = 0
          LIMIT 1
        ) AS thumbnail_url,
        l.created_at,
        l.view_count
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      WHERE l.seller_id = $1
        AND l.status <> 'deleted'
        AND l.status = 'active'
      ORDER BY l.created_at DESC
      LIMIT $2
      OFFSET $3
      `,
      [userId, limit, offset]
    );
  } catch (err) {
    console.error("[GET /api/users/:id/profile] listings query error:", err);
    return NextResponse.json(
      { error: "Failed to load profile. Please try again." },
      { status: 500 }
    );
  }

  const body: SellerProfileApiResponse = {
    profile: {
      name: user.full_name,
      avatar_url: user.avatar_url,
      rating: {
        average: Number(user.average_rating),
        count: user.rating_count,
      },
      join_date: user.created_at,
      listings: listingRows.map((row) => ({
        id: row.id,
        title: row.title,
        price: Number(row.price),
        condition: row.condition,
        category: row.category_slug,
        thumbnail_url: row.thumbnail_url,
        created_at: row.created_at,
        view_count: row.view_count,
      })),
    },
    pagination: {
      page,
      limit,
      total: totalActive,
      total_pages: totalPages,
    },
  };

  return NextResponse.json(body, { status: 200 });
}
