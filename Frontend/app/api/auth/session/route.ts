import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";

// ─── GET /api/auth/session ─────────────────────────────────────────────────────
//
// Returns the current user's session payload so client components can
// determine auth state without a full page reload.
//
// Responses:
//   200  { authenticated: true,  userId, email, emailVerified }
//   200  { authenticated: false }   (no 401 — unauthenticated is a valid state)

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value ?? "";
  const session = raw ? await verifySession(raw) : null;

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
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
