import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";

// ─── Shared logout helper ──────────────────────────────────────────────────────
//
// Clears the session cookie by overwriting it with an empty value and maxAge=0,
// which instructs the browser to delete it immediately.  Any token stored only
// in the cookie is thereby invalidated — subsequent requests will carry no
// bearer credential and middleware will return 401.
async function clearSession(): Promise<NextResponse> {
  const store = await cookies();

  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });

  return NextResponse.json({ message: "Logged out." }, { status: 200 });
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

  const res = await clearSession();
  // T-15: tell REST/SPA consumers where to navigate after clearing the cookie.
  return NextResponse.json(
    { message: "Logged out.", redirectUrl: "/login" },
    { status: 200, headers: res.headers }
  );
}

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
//
// Kept for backward-compatibility: the logoutAction Server Action (used by
// form submissions in the UI) calls this method.  No auth check needed here
// because clearing an already-absent cookie is harmless.
//
// Responses:
//   200  { message: "Logged out." }

export async function POST(_req: NextRequest): Promise<NextResponse> {
  return clearSession();
}
