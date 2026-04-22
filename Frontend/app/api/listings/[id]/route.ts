import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { updateListingBodySchema } from "@/lib/validators/listings";
import type { Listing } from "@/lib/types/listing";

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

type DbListingWithSellerRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: Listing["condition"];
  category: string;
  thumbnail_url: string | null;
  seller_id: string;
  created_at: string;
  view_count: number;
  seller_name: string;
  photo_urls: string[] | null;
  status: NonNullable<Listing["status"]>;
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
          l.price,
          l.condition,
          c.slug AS category,
          lp.url AS thumbnail_url,
          l.seller_id,
          l.created_at,
          l.view_count,
          u.full_name AS seller_name,
          l.status,
          COALESCE(
            (
              SELECT array_agg(lp_all.url ORDER BY lp_all.position)
              FROM listing_photos lp_all
              WHERE lp_all.listing_id = l.id
            ),
            ARRAY[]::text[]
          ) AS photo_urls
        FROM listings l
        JOIN users u ON u.id = l.seller_id
        JOIN categories c ON c.id = l.category_id
        LEFT JOIN listing_photos lp ON lp.listing_id = l.id AND lp.position = 0
        WHERE l.id = $1
          AND l.status <> 'deleted'
        LIMIT 1
        FOR UPDATE OF l
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

      // Wrap listing_views in its own try/catch — if the table doesn't exist yet
      // (migration not run) the listing still returns 200 rather than crashing.
      try {
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
      } catch (viewErr) {
        console.warn(
          "[GET /api/listings/:id] listing_views insert failed (table may not exist):",
          viewErr
        );
        // Non-fatal — continue with existing view_count on the row.
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

  const photoUrls =
    row.photo_urls && row.photo_urls.length > 0 ? row.photo_urls : [];

  const listing: ListingWithSeller = {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    condition: row.condition,
    category: row.category,
    thumbnail_url: row.thumbnail_url ?? null,
    seller_id: row.seller_id,
    created_at: row.created_at,
    view_count: row.view_count,
    photo_urls: photoUrls,
    status: row.status,
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

// ---------------------------------------------------------------------------
// Row shapes used only by PATCH
// ---------------------------------------------------------------------------

type DbUpdatedListingRow = {
  id: string;
  title: string;
  description: string;
  price: string; // NUMERIC comes back as string from pg driver
  condition: Listing["condition"];
  category: string;
  thumbnail_url: string | null;
  seller_id: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  status: NonNullable<Listing["status"]>;
};

type DbOwnedListingRow = {
  seller_id: string;
  status: NonNullable<Listing["status"]>;
};

type DbDeletedListingRow = {
  id: string;
  status: NonNullable<Listing["status"]>;
  updated_at: string;
};

/**
 * PATCH /api/listings/:id
 *
 * Partially updates a listing. Only the listing owner may call this endpoint.
 * All provided fields are validated; omitted fields are left unchanged.
 * If `photoUrls` is included, the listing's photos are fully replaced inside
 * the same transaction so there is never a partial photo state.
 *
 * HTTP status codes:
 *   200 – listing updated successfully
 *   400 – invalid UUID param or body validation failure
 *   401 – not authenticated
 *   403 – authenticated user is not the listing owner
 *   404 – listing not found (or category slug not found)
 *   500 – unexpected server error
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // ── 2. Validate route param ────────────────────────────────────────────────
  const rawParams = await context.params;
  const paramsParsed = paramsSchema.safeParse(rawParams);
  if (!paramsParsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: paramsParsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  const { id } = paramsParsed.data;

  // ── 3. Validate request body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const bodyParsed = updateListingBodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: bodyParsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = bodyParsed.data;

  // ── 4. Resolve category slug → id (only when category is being changed) ───
  let categoryId: number | null = null;
  if (data.category !== undefined) {
    const client = await pool.connect();
    let rows: { id: number }[];
    try {
      const result = await client.query<{ id: number }>(
        "SELECT id FROM categories WHERE slug = $1 LIMIT 1",
        [data.category]
      );
      rows = result.rows;
    } finally {
      client.release();
    }
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }
    categoryId = rows[0].id;
  }

  // ── 5. Execute update inside a transaction ─────────────────────────────────
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch current seller_id to authorise before mutating.
    const ownerResult = await client.query<DbOwnedListingRow>(
      "SELECT seller_id, status FROM listings WHERE id = $1 LIMIT 1 FOR UPDATE",
      [id]
    );

    if (ownerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (ownerResult.rows[0].seller_id !== session.userId) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "You are not authorised to edit this listing." },
        { status: 403 }
      );
    }

    if (ownerResult.rows[0].status === "deleted") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Deleted listings can no longer be edited." },
        { status: 409 }
      );
    }

    // Build a dynamic SET clause from only the fields that were supplied.
    // Each field is pushed into `params` first so its placeholder index
    // (`$N`) corresponds to `params.length` at insertion time.
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) {
      params.push(data.title);
      setClauses.push(`title = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description);
      setClauses.push(`description = $${params.length}`);
    }
    if (data.price !== undefined) {
      params.push(data.price);
      setClauses.push(`price = $${params.length}`);
    }
    if (data.condition !== undefined) {
      params.push(data.condition);
      setClauses.push(`condition = $${params.length}`);
    }
    if (categoryId !== null) {
      params.push(categoryId);
      setClauses.push(`category_id = $${params.length}`);
    }
    if (data.status !== undefined) {
      params.push(data.status);
      setClauses.push(`status = $${params.length}`);
    }

    let updatedRow: DbUpdatedListingRow | undefined;

    // Only issue the UPDATE when there are scalar listing fields to change.
    // `photoUrls`-only requests still succeed — they just skip the main UPDATE.
    if (setClauses.length > 0) {
      // Always stamp updated_at so callers can rely on it for cache busting.
      setClauses.push("updated_at = NOW()");

      params.push(id);
      const idIndex = params.length;

      const updateResult = await client.query<DbUpdatedListingRow>(
        `
        UPDATE listings
        SET ${setClauses.join(", ")}
        WHERE id = $${idIndex}
        RETURNING
          id,
          title,
          description,
          price,
          condition,
          (SELECT slug FROM categories WHERE id = listings.category_id) AS category,
          seller_id,
          created_at,
          updated_at,
          view_count,
          status,
          (
            SELECT url FROM listing_photos
            WHERE listing_id = listings.id AND position = 0
            LIMIT 1
          ) AS thumbnail_url
        `,
        params
      );

      updatedRow = updateResult.rows[0];
    }

    // Replace all photos when photoUrls is provided (full replacement, not merge).
    if (data.photoUrls !== undefined) {
      await client.query(
        "DELETE FROM listing_photos WHERE listing_id = $1",
        [id]
      );
      for (let i = 0; i < data.photoUrls.length; i += 1) {
        await client.query(
          "INSERT INTO listing_photos (listing_id, url, position) VALUES ($1, $2, $3)",
          [id, data.photoUrls[i], i]
        );
      }
    }

    // If we skipped the main UPDATE (photos-only patch), fetch the current row
    // so the response always contains the full listing shape.
    if (!updatedRow) {
      const fetchResult = await client.query<DbUpdatedListingRow>(
        `
        SELECT
          l.id,
          l.title,
          l.description,
          l.price,
          l.condition,
          c.slug AS category,
          l.seller_id,
          l.created_at,
          l.updated_at,
          l.view_count,
          l.status,
          (
            SELECT lp.url FROM listing_photos lp
            WHERE lp.listing_id = l.id AND lp.position = 0
            LIMIT 1
          ) AS thumbnail_url
        FROM listings l
        JOIN categories c ON c.id = l.category_id
        WHERE l.id = $1
        LIMIT 1
        `,
        [id]
      );
      updatedRow = fetchResult.rows[0];
    }

    await client.query("COMMIT");

    const listing = {
      id: updatedRow!.id,
      title: updatedRow!.title,
      description: updatedRow!.description,
      price: Number(updatedRow!.price),
      condition: updatedRow!.condition,
      category: updatedRow!.category,
      thumbnail_url: updatedRow!.thumbnail_url ?? null,
      seller_id: updatedRow!.seller_id,
      created_at: updatedRow!.created_at,
      updated_at: updatedRow!.updated_at,
      view_count: updatedRow!.view_count,
      status: updatedRow!.status,
    };

    return NextResponse.json({ listing }, { status: 200 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PATCH /api/listings/:id] DB error:", err);
    return NextResponse.json(
      { error: "Failed to update listing. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/listings/:id
 *
 * Soft-deletes a listing by setting status = 'deleted'. The row and all
 * related records remain in the database for auditability, but the listing
 * is removed from marketplace surfaces.
 *
 * HTTP status codes:
 *   200 – listing soft-deleted successfully
 *   400 – invalid UUID param
 *   401 – not authenticated
 *   403 – authenticated user is not the listing owner
 *   404 – listing not found
 *   409 – listing is already deleted
 *   500 – unexpected server error
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const rawParams = await context.params;
  const paramsParsed = paramsSchema.safeParse(rawParams);
  if (!paramsParsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: paramsParsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { id } = paramsParsed.data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ownerResult = await client.query<DbOwnedListingRow>(
      "SELECT seller_id, status FROM listings WHERE id = $1 LIMIT 1 FOR UPDATE",
      [id]
    );

    if (ownerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (ownerResult.rows[0].seller_id !== session.userId) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "You are not authorised to delete this listing." },
        { status: 403 }
      );
    }

    if (ownerResult.rows[0].status === "deleted") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Listing is already deleted." },
        { status: 409 }
      );
    }

    const deleteResult = await client.query<DbDeletedListingRow>(
      `
      UPDATE listings
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1
      RETURNING id, status, updated_at
      `,
      [id]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        listing: {
          id: deleteResult.rows[0].id,
          status: deleteResult.rows[0].status,
          updated_at: deleteResult.rows[0].updated_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DELETE /api/listings/:id] DB error:", err);
    return NextResponse.json(
      { error: "Failed to delete listing. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
