import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Listing } from "@/lib/types/listing";
import { listingsQuerySchema } from "@/lib/validators/listings";

type DbListingRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: Listing["condition"];
  category_slug: string;
  thumbnail_url: string | null;
  seller_id: string;
  created_at: string;
  view_count: number;
  total_count: number;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  // Normalize raw query params into a typed shape before validation.
  const raw = {
    q: (searchParams.get("q") ?? "").trim(),
    category: (searchParams.get("category") ?? "").trim(),
    price_min: searchParams.get("price_min") ?? "",
    price_max: searchParams.get("price_max") ?? "",
    condition: (searchParams.get("condition") ?? "").trim(),
    page: Number.parseInt(searchParams.get("page") ?? "1", 10),
    limit: Number.parseInt(searchParams.get("limit") ?? "20", 10),
  };

  const parsed = listingsQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { q, category, price_min, price_max, condition, page, limit } =
    parsed.data;

  // When a category filter is present, ensure it exists; unknown slug → 404.
  let categoryId: number | null = null;
  if (category) {
    const categoryRows = await query<{ id: number }>(
      "SELECT id FROM categories WHERE slug = $1 LIMIT 1",
      [category]
    );
    if (categoryRows.length === 0) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }
    categoryId = categoryRows[0].id;
  }

  const filters: string[] = [];
  const params: (string | number)[] = [];

  // Build WHERE clause incrementally with 1-based parameter indices.
  if (q) {
    params.push(q);
    const tsQueryParamIndex = params.length;
    // Use plainto_tsquery for simple user-entered search terms.
    filters.push(
      `l.search_vector @@ plainto_tsquery('english', $${tsQueryParamIndex})`
    );
  }

  if (categoryId != null) {
    params.push(categoryId);
    const categoryParamIndex = params.length;
    filters.push(`l.category_id = $${categoryParamIndex}`);
  }

  // Price range: API uses dollars; DB stores price as NUMERIC(10,2) in dollars.
  if (price_min != null) {
    params.push(price_min);
    const priceMinIndex = params.length;
    filters.push(`l.price >= $${priceMinIndex}`);
  }
  if (price_max != null) {
    params.push(price_max);
    const priceMaxIndex = params.length;
    filters.push(`l.price <= $${priceMaxIndex}`);
  }

  if (condition) {
    params.push(condition);
    const conditionParamIndex = params.length;
    filters.push(`l.condition = $${conditionParamIndex}`);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  // Pagination parameters
  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  // Order by relevance when searching, otherwise latest listings first.
  const orderBy = q
    ? "ORDER BY ts_rank(l.search_vector, plainto_tsquery('english', $1)) DESC, l.created_at DESC"
    : "ORDER BY created_at DESC";

  const sql = `
    SELECT
      l.id,
      l.title,
      l.description,
      l.price,
      l.condition,
      c.slug AS category_slug,
      (
        SELECT lp.url
        FROM listing_photos lp
        WHERE lp.listing_id = l.id AND lp.position = 0
        LIMIT 1
      ) AS thumbnail_url,
      l.seller_id,
      l.created_at,
      l.view_count,
      COUNT(*) OVER () AS total_count
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    ${whereClause}
    ${orderBy}
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  let rows: DbListingRow[];
  try {
    rows = await query<DbListingRow>(sql, params);
  } catch (err) {
    console.error("[GET /api/listings] DB error:", err);
    return NextResponse.json(
      { error: "Failed to fetch listings. Please try again." },
      { status: 500 }
    );
  }

  const total = Number(rows[0]?.total_count ?? 0);

  const listings: Listing[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    condition: row.condition,
    category: row.category_slug,
    thumbnail_url: row.thumbnail_url,
    seller_id: row.seller_id,
    created_at: row.created_at,
    view_count: row.view_count,
  }));

  return NextResponse.json(
    {
      listings,
      total,
      page,
      limit,
    },
    { status: 200 }
  );
}

