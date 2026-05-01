import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export type ReviewPrompt = {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  soldAt: string;
};

type ReviewPromptRow = {
  listing_id: string;
  listing_title: string;
  seller_id: string;
  seller_name: string;
  seller_avatar_url: string | null;
  sold_at: string;
};

/**
 * GET /api/users/me/review-prompts
 *
 * Returns listings where:
 *  - The current user is the buyer (buyer_id = current user)
 *  - The listing was marked sold at least 24 h ago
 *  - The current user has NOT yet reviewed the seller
 *
 * Used by the client to decide whether to show the post-purchase review modal.
 */
export async function GET(): Promise<NextResponse> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const rows = await query<ReviewPromptRow>(
    `
    SELECT
      l.id          AS listing_id,
      l.title       AS listing_title,
      l.seller_id,
      u.full_name   AS seller_name,
      u.avatar_url  AS seller_avatar_url,
      l.sold_at
    FROM listings l
    JOIN users u ON u.id = l.seller_id
    WHERE l.buyer_id  = $1
      AND l.status    = 'sold'
      -- 24-hour gate: only show prompt once enough time has passed
      AND l.sold_at  <= NOW() - INTERVAL '24 hours'
      -- skip if the buyer already reviewed this seller
      AND NOT EXISTS (
        SELECT 1
        FROM   reviews r
        WHERE  r.reviewer_id = $1
          AND  r.seller_id   = l.seller_id
      )
    ORDER BY l.sold_at DESC
    `,
    [session.userId]
  );

  const prompts: ReviewPrompt[] = rows.map((r) => ({
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    sellerAvatarUrl: r.seller_avatar_url,
    soldAt: r.sold_at,
  }));

  return NextResponse.json({ prompts }, { status: 200 });
}
