import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { pool } from "@/lib/db";
import type { Listing } from "@/lib/types/listing";

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

type DbListingWithSellerRow = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  condition: Listing["condition"];
  category: string;
  thumbnail_url: string | null;
  seller_id: string;
  created_at: string;
  view_count: number;
  seller_name: string;
};

type ListingWithSeller = Listing & { seller: { id: string; name: string } };

const SESSION_COOKIE = "campuskart_session";
const ANON_COOKIE = "campuskart_anon_session";

/**
 * GET /api/listings/:id
 * Returns the full listing plus minimal seller info.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const rawParams = await context.params;
  const parsed = paramsSchema.safeParse(rawParams);

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

  const { id } = parsed.data;

  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SESSION_COOKIE)?.value ?? "";

  // Browsing is typically authenticated (middleware-gated), but keep a fallback
  // so view tracking still works if this endpoint is ever made public.
  const existingAnon = cookieStore.get(ANON_COOKIE)?.value ?? "";
  const needsAnonCookie = !existingSession && !existingAnon;
  const sessionId = existingSession || existingAnon || randomUUID();
  const sessionHash = createHash("sha256").update(sessionId).digest("hex");

  let row: DbListingWithSellerRow | undefined;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock the row so we return a consistent view_count when incrementing.
      const listingResult = await client.query<DbListingWithSellerRow>(
        `
        SELECT
          l.id,
          l.title,
          l.description,
          l.price_cents,
          l.condition,
          l.category,
          l.thumbnail_url,
          l.seller_id,
          l.created_at,
          l.view_count,
          u.name AS seller_name
        FROM listings l
        JOIN users u ON u.id = l.seller_id
        WHERE l.id = $1
        LIMIT 1
        FOR UPDATE
        `,
        [id]
      );

      row = listingResult.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Listing not found." },
          { status: 404 }
        );
      }

      const viewInsert = await client.query<{ inserted: number }>(
        `
        INSERT INTO listing_views (listing_id, session_hash)
        VALUES ($1, $2)
        ON CONFLICT (listing_id, session_hash) DO NOTHING
        RETURNING 1 as inserted
        `,
        [id, sessionHash]
      );

      // Increment view_count only on the first view for this session.
      if (viewInsert.rows.length > 0) {
        const updated = await client.query<{ view_count: number }>(
          `UPDATE listings SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count`,
          [id]
        );
        row.view_count = updated.rows[0]?.view_count ?? row.view_count + 1;
      }

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[GET /api/listings/:id] DB error:", err);
    return NextResponse.json(
      { error: "Failed to fetch listing. Please try again." },
      { status: 500 }
    );
  }

  const listing: ListingWithSeller = {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price_cents / 100,
    condition: row.condition,
    category: row.category,
    thumbnail_url: row.thumbnail_url,
    seller_id: row.seller_id,
    created_at: row.created_at,
    view_count: row.view_count,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
    },
  };

  const response = NextResponse.json({ listing }, { status: 200 });
  if (needsAnonCookie) {
    response.cookies.set(ANON_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }
  return response;
}

