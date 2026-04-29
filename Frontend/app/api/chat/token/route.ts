import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat/token
 *
 * Issues a short-lived Stream Chat JWT for the authenticated user so the browser
 * can open a WebSocket (unread badge / real-time alerts). Requires verified .edu
 * (same gate as other /api/chat writes via middleware).
 */
export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.emailVerified) {
      return NextResponse.json(
        { error: "Email verification required before using chat." },
        { status: 401 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GETSTREAM_API_KEY?.trim() ?? "";
    const apiSecret = process.env.GETSTREAM_API_SECRET?.trim() ?? "";
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream Chat is not configured on this server." },
        { status: 503 }
      );
    }

    const userResult = await query<{ full_name: string }>(
      "SELECT full_name FROM users WHERE id = $1",
      [session.userId]
    );
    const fullName = userResult[0]?.full_name || session.email.split("@")[0];

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    
    // Sync user info to Stream so names appear in chat
    await serverClient.upsertUser({
      id: session.userId,
      name: fullName,
    });

    const token = serverClient.createToken(session.userId);

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }
    console.error("[POST /api/chat/token]", error);
    return NextResponse.json(
      { error: "Failed to issue chat token." },
      { status: 500 }
    );
  }
}
