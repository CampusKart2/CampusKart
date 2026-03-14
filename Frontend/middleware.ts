import { NextRequest, NextResponse } from "next/server";
import { verifySession, signSession } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";
const COOKIE_TTL  = 60 * 60 * 24 * 7;  // 7 days in seconds

// Refresh the JWT when fewer than this many seconds remain on the current token.
// This implements a sliding-window expiry: active users stay logged in
// indefinitely while idle users are logged out after 7 days.
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 3; // 3 days

// ─── Route tables ──────────────────────────────────────────────────────────────

/**
 * Auth pages that should NOT be accessible to already-authenticated users.
 * Authenticated visitors are redirected to "/" so they can't "go back" to
 * the login / signup page after a successful session or after logout.
 */
const AUTH_ONLY_PAGES = ["/login", "/signup"];

/**
 * Page routes that require a valid session (any verified state).
 * Unauthenticated users are redirected to /login.
 */
const AUTH_REQUIRED_PAGES = [
  "/search",
  "/listings",
  "/chat",
  "/messages",
  "/saves",
];

/**
 * Page routes that additionally require email_verified === true.
 * Authenticated-but-unverified users are redirected to /verify-email.
 */
const VERIFIED_REQUIRED_PAGES = [
  "/listings/new",
  "/messages",
  "/chat",
];

/**
 * API route prefixes whose mutating methods (POST / PUT / PATCH / DELETE)
 * require email_verified === true.
 * Unverified callers receive 401 JSON.
 */
const VERIFIED_REQUIRED_API_PREFIXES = [
  "/api/listings",
  "/api/messages",
  "/api/chat",
  "/api/offers",
];

/** HTTP methods considered "write" actions. */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function unauthorized(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  // ── 1. Verify the session JWT ─────────────────────────────────────────────
  const rawToken = request.cookies.get(COOKIE_NAME)?.value ?? "";
  // verifySession returns null for missing / expired / tampered tokens
  const session = rawToken ? await verifySession(rawToken) : null;

  // ── 1b. Sliding-window refresh ────────────────────────────────────────────
  // If the token is valid but close to expiry, re-issue it silently so the
  // user session extends as long as they remain active.
  let refreshedToken: string | null = null;
  if (session && rawToken) {
    try {
      // Decode exp without full verify (we already verified above).
      // Convert base64url → base64 and add "=" padding so atob() doesn't throw
      // on payloads whose length isn't a multiple of 4 (common for JWTs).
      const parts = rawToken.split(".");
      if (parts.length === 3) {
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
        const claims = JSON.parse(atob(padded)) as { exp?: number };
        const secondsRemaining = (claims.exp ?? 0) - Math.floor(Date.now() / 1000);
        if (secondsRemaining > 0 && secondsRemaining < REFRESH_THRESHOLD_SECONDS) {
          refreshedToken = await signSession(session);
        }
      }
    } catch {
      // Silently skip refresh on any decode error — existing token is still valid
    }
  }

  // ── 2a. Auth-only page guard ─────────────────────────────────────────────
  // Redirect authenticated users away from /login and /signup so they always
  // land on a meaningful page rather than a form they've already completed.
  if (!isApiRoute && AUTH_ONLY_PAGES.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Unauthenticated users pass through — no further checks needed for these pages.
    return NextResponse.next();
  }

  // ── 2b. Authentication gate (protected pages) ─────────────────────────────
  if (!isApiRoute && matchesPrefix(pathname, AUTH_REQUIRED_PAGES)) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 3. Email-verification gate ────────────────────────────────────────────
  //
  //  API routes: return 401 JSON for write methods on restricted prefixes.
  //  Page routes: redirect to /verify-email for restricted pages.
  //
  if (isApiRoute) {
    if (
      WRITE_METHODS.has(request.method) &&
      matchesPrefix(pathname, VERIFIED_REQUIRED_API_PREFIXES)
    ) {
      if (!session) {
        return unauthorized("Authentication required.");
      }
      if (!session.emailVerified) {
        return unauthorized(
          "Email verification required. Please verify your .edu address before continuing."
        );
      }
    }
  } else {
    if (session && !session.emailVerified && matchesPrefix(pathname, VERIFIED_REQUIRED_PAGES)) {
      const verifyUrl = new URL("/verify-email", request.url);
      return NextResponse.redirect(verifyUrl);
    }
  }

  const res = NextResponse.next();

  // Attach the refreshed token if one was issued
  if (refreshedToken) {
    res.cookies.set(COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   COOKIE_TTL,
      path:     "/",
    });
  }

  return res;
}

// ─── Matcher ───────────────────────────────────────────────────────────────────
// Include every path that the middleware needs to inspect.
// Static assets (_next/static, _next/image, favicon, etc.) are excluded automatically
// by the leading negative lookahead in the default Next.js matcher pattern.

export const config = {
  matcher: [
    // Auth-only pages (logged-in users are redirected away from these)
    "/login",
    "/signup",
    // Auth-required pages
    "/search/:path*",
    "/listings/:path*",
    "/chat/:path*",
    "/messages/:path*",
    "/saves/:path*",
    // Verified-required API routes
    "/api/listings/:path*",
    "/api/messages/:path*",
    "/api/chat/:path*",
    "/api/offers/:path*",
  ],
};

