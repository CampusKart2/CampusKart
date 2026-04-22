import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Listing, NearbyListing } from "@/lib/types/listing";
import { nearbyListingsQuerySchema } from "@/lib/validators/listings";

const KM_TO_MILES = 0.621371;

type DbNearbyListingRow = {
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
  distance_meters: number;
};

/**
 * GET /api/listings/nearby?lat=&lng=&radius=
 *
 * Returns active listings within the requested radius (km), ordered by
 * nearest distance first. Radius is capped at 50 km in validation.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const raw = {
    lat: searchParams.get("lat") ?? "",
    lng: searchParams.get("lng") ?? "",
    radius: searchParams.get("radius") ?? "",
  };

  const parsed = nearbyListingsQuerySchema.safeParse(raw);

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

  const { lat, lng, radius } = parsed.data;
  const radiusMeters = radius * 1_000;

  const sql = `
    WITH origin AS (
      SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography AS point
    )
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
      ST_Distance(l.location, origin.point)::double precision AS distance_meters
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    CROSS JOIN origin
    WHERE l.status <> 'deleted'
      AND l.status = 'active'
      AND l.location IS NOT NULL
      AND ST_DWithin(l.location, origin.point, $3)
    ORDER BY distance_meters ASC, l.created_at DESC
  `;

  let rows: DbNearbyListingRow[];
  try {
    rows = await query<DbNearbyListingRow>(sql, [lng, lat, radiusMeters]);
  } catch (err) {
    console.error("[GET /api/listings/nearby] DB error:", err);
    return NextResponse.json(
      { error: "Failed to fetch nearby listings. Please try again." },
      { status: 500 }
    );
  }

  const listings: NearbyListing[] = rows.map((row) => {
    const distanceMeters = Number(row.distance_meters);

    return {
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
      // Round to 2 decimals for stable client display while preserving
      // full-meter precision for sorting/debugging.
      distance_meters: Math.round(distanceMeters),
      distance_km: Number((distanceMeters / 1_000).toFixed(2)),
      distance_miles: Number(((distanceMeters / 1_000) * KM_TO_MILES).toFixed(1)),
    };
  });

  return NextResponse.json(
    {
      listings,
      radius_km: radius,
      count: listings.length,
    },
    { status: 200 }
  );
}
