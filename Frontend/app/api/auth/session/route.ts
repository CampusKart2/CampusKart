import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME, sessionCookiePath } from "@/lib/routes";

// ─── GET /api/auth/session ─────────────────────────────────────────────────────
//
// Returns the current user's session payload so client components can
// determine auth state without a full page reload.
//
// Responses:
//   200  { authenticated: true,  userId, email, emailVerified }
//   200  { authenticated: false }   (no 401 — unauthenticated is a valid state)

export async function GET(): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    const response = NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
    response.cookies.delete({ name: SESSION_COOKIE_NAME, path: sessionCookiePath });
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
