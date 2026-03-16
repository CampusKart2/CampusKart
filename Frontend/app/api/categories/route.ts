import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** DB row shape for categories with listing count (for landing page grid). */
type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  listing_count: number;
};

/**
 * GET /api/categories
 *
 * Returns all categories ordered by id, each with listing_count for the
 * category landing page (icon + item count). Used for browse-by-category
 * and to validate category slugs in GET /api/listings?category=.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { rows } = await db.query<CategoryRow>(`
      SELECT
        c.id,
        c.slug,
        c.name,
        COUNT(l.id)::int AS listing_count
      FROM categories c
      LEFT JOIN listings l ON LOWER(l.category) = c.slug
      GROUP BY c.id, c.slug, c.name
      ORDER BY c.id
    `);

    return NextResponse.json(
      { categories: rows },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/categories] DB error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories. Please try again." },
      { status: 500 }
    );
  }
}
