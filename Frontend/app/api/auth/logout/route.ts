import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";

// ─── Shared logout helper ──────────────────────────────────────────────────────
//
// Sets the clearing Set-Cookie header directly on the response object so we
// don't rely on the implicit Next.js cookies() write-back, which is only
// guaranteed to merge into a response when no other NextResponse is created
// after the set() call.
function clearSession(body: object, status: number): NextResponse {
  const res = NextResponse.json(body, { status });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0, // instructs the browser to delete the cookie immediately
    path:     "/",
  });
  return res;
}

// ─── DELETE /api/auth/logout ───────────────────────────────────────────────────
//
// Primary REST endpoint (T-14).  Requires an active session; returns 401 if
// the caller is already unauthenticated so clients can detect stale state.
//
// Responses:
//   200  { message: "Logged out." }
//   401  { error: "Not authenticated." }

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // T-15: redirectUrl tells REST/SPA consumers where to navigate post-logout.
  return clearSession({ message: "Logged out.", redirectUrl: "/login" }, 200);
}

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
//
export async function POST(_req: NextRequest): Promise<NextResponse> {
  const token = _req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return clearSession({ message: "Logged out." }, 200);
}
