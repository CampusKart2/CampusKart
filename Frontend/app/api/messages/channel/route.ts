import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { hasBlockingRelation } from "@/lib/blocking";
import { query } from "@/lib/db";
import { getStreamServerClient } from "@/lib/stream";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  sellerId: z.string().uuid("Invalid seller ID"),
  listingTitle: z.string().min(1).optional(),
  sellerName: z.string().min(1).optional(),
});

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toLowerCase();
}

function deterministicChannelId(params: {
  listingId: string;
  buyerId: string;
  sellerId: string;
}): string {
  const { listingId, buyerId, sellerId } = params;
  return `listing-${shortId(listingId)}-buyer-${shortId(buyerId)}-seller-${shortId(
    sellerId
  )}`;
}

/**
 * POST /api/messages/channel
 *
 * Idempotently creates (or returns) a deterministic 1:1 messaging channel
 * between buyer & seller for a listing.
 *
 * Channel ID format:
 *   listing-{listingId[0:8]}-buyer-{buyerId[0:8]}-seller-{sellerId[0:8]}
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.emailVerified) {
      return NextResponse.json(
        { error: "Email verification required before using messaging." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const buyerId = session.userId;
    const { listingId, sellerId, listingTitle, sellerName } = parsed.data;

    if (buyerId === sellerId) {
      return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
    }

    const blocked = await hasBlockingRelation(buyerId, sellerId);
    if (blocked) {
      return NextResponse.json(
        { error: "Messaging is unavailable because one user has blocked the other." },
        { status: 403 }
      );
    }

    const { client: serverClient } = getStreamServerClient();

    // Sync buyer name into Stream so it renders nicely in channel previews.
    const buyerResult = await query<{ full_name: string }>(
      "SELECT full_name FROM users WHERE id = $1",
      [buyerId]
    );
    const buyerName = buyerResult[0]?.full_name || session.email.split("@")[0];

    await serverClient.upsertUsers([
      { id: buyerId, name: buyerName },
      ...(sellerName ? [{ id: sellerId, name: sellerName }] : []),
    ]);

    const channelId = deterministicChannelId({ listingId, buyerId, sellerId });

    const channel = serverClient.channel("messaging", channelId, {
      members: [buyerId, sellerId],
      created_by_id: buyerId,
      listingId,
      buyerId,
      sellerId,
      ...(listingTitle ? { listingTitle, name: listingTitle } : {}),
    });

    try {
      await channel.create();
    } catch (e: unknown) {
      // Treat "already exists" as success (idempotent create).
      const err = e as { status?: number; response?: { statusCode?: number } };
      const status = err.status ?? err.response?.statusCode;
      if (status !== 409) throw e;
    }

    return NextResponse.json({ channelId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    console.error("[POST /api/messages/channel]", error);
    return NextResponse.json({ error: "Failed to create channel." }, { status: 500 });
  }
}

