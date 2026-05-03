import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import type { ListingStatus } from "@/lib/types/listing";

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

/** Optional body: seller can record which user bought the item. */
const soldBodySchema = z.object({
  buyerId: z.string().uuid("Buyer id must be a valid UUID.").optional(),
});

type DbSoldListingRow = {
  id: string;
  status: ListingStatus;
};

/**
 * PATCH /api/listings/:id/sold
 *
 * Marks a listing as sold. Only the listing owner may perform this action.
 * Optionally records the buyer (buyerId in JSON body) and stamps sold_at.
 */
export async function PATCH(
  request: Request,
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
  const parsedParams = paramsSchema.safeParse(rawParams);

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

  const { id } = parsedParams.data;

  // Parse optional body (buyer_id for review-prompt tracking)
  let buyerId: string | undefined;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const rawBody: unknown = await request.json();
      const parsedBody = soldBodySchema.safeParse(rawBody);
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: "Validation failed.", fields: parsedBody.error.issues },
          { status: 400 }
        );
      }
      buyerId = parsedBody.data.buyerId;
    }
  } catch {
    // Body is optional — ignore parse errors
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ownerResult = await client.query<{
      seller_id: string;
      status: ListingStatus;
    }>(
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
        { error: "You are not authorised to update this listing." },
        { status: 403 }
      );
    }

    if (ownerResult.rows[0].status === "deleted") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Deleted listings can no longer be updated." },
        { status: 409 }
      );
    }

    const updateResult = await client.query<DbSoldListingRow>(
      `
      UPDATE listings
      SET status     = 'sold',
          sold_at    = NOW(),
          buyer_id   = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, status
      `,
      [id, buyerId ?? null]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        listing: {
          id: updateResult.rows[0].id,
          status: updateResult.rows[0].status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[PATCH /api/listings/:id/sold] DB error:", error);
    return NextResponse.json(
      { error: "Failed to mark listing as sold. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
