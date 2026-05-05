import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// ─── GET /api/auth/session ─────────────────────────────────────────────────────
//
// Returns the current user's session payload so client components can
// determine auth state without a full page reload.
//
// Responses:
//   200  { authenticated: true,  userId, email, emailVerified }
//   200  { authenticated: false }   (no 401 — unauthenticated is a valid state)

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    const response = NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
    response.cookies.delete("campuskart_session");
    return response;
  }

  return NextResponse.json(
    {
      authenticated:  true,
      userId:         session.userId,
      email:          session.email,
      emailVerified:  session.emailVerified,
    },
    { status: 200 }
  );
}
