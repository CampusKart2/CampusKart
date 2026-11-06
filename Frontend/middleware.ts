import { NextRequest, NextResponse } from "next/server";
import {
  appPath,
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  sessionCookiePath,
} from "@/lib/routes";
import { verifySession, signSession } from "@/lib/session";

const COOKIE_NAME = SESSION_COOKIE_NAME;
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
  "/sellers",
  "/chat",
  "/messages",
  "/saves",
  "/profile",
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

  // ── 0. Migrate the old Path=/ session cookie ──────────────────────────────
  // A valid old token moves to the scoped cookie so nobody is logged out; the
  // old cookie is always expired. A scoped cookie wins if both are present.
  const hasLegacyCookie = request.cookies.has(LEGACY_SESSION_COOKIE_NAME);
  const legacyToken = request.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value ?? "";
  const currentToken = request.cookies.get(COOKIE_NAME)?.value ?? "";
  const adoptedToken =
    !currentToken && legacyToken && (await verifySession(legacyToken)) ? legacyToken : "";

  // Downstream handlers read cookies from the request, so this request must
  // already carry the migrated cookie, not only the response.
  function next(): NextResponse {
    if (!hasLegacyCookie) return NextResponse.next();
    request.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
    if (adoptedToken) request.cookies.set(COOKIE_NAME, adoptedToken);
    return NextResponse.next({ request: { headers: request.headers } });
  }

  function withMigration(res: NextResponse): NextResponse {
    if (adoptedToken) {
      res.cookies.set(COOKIE_NAME, adoptedToken, {
        httpOnly: true,
        secure:   false, // Temporarily disabled for EC2 HTTP testing
        sameSite: "lax",
        maxAge:   COOKIE_TTL,
        path:     sessionCookiePath,
      });
    }
    if (hasLegacyCookie) {
      res.cookies.delete({ name: LEGACY_SESSION_COOKIE_NAME, path: "/" });
    }
    return res;
  }

  // ── 1. Verify the session JWT ─────────────────────────────────────────────
  const rawToken = currentToken || adoptedToken;
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
      return withMigration(NextResponse.redirect(new URL(appPath("/"), request.url)));
    }
    // Unauthenticated users pass through — no further checks needed for these pages.
    return withMigration(next());
  }

  // ── 2b. Authentication gate (protected pages) ─────────────────────────────
  if (!isApiRoute && matchesPrefix(pathname, AUTH_REQUIRED_PAGES)) {
    if (!session) {
      const loginUrl = new URL(appPath("/login"), request.url);
      loginUrl.searchParams.set("from", pathname);
      return withMigration(NextResponse.redirect(loginUrl));
    }
  }

  // ── 3. Email-verification gate ────────────────────────────────────────────
  //
  //  API routes: return 401 JSON for write methods on restricted prefixes.
  //
  if (isApiRoute) {
    if (
      WRITE_METHODS.has(request.method) &&
      matchesPrefix(pathname, VERIFIED_REQUIRED_API_PREFIXES)
    ) {
      if (!session) {
        return withMigration(unauthorized("Authentication required."));
      }
      if (!session.emailVerified) {
        return withMigration(
          unauthorized(
            "Email verification required. Please verify your .edu address before continuing."
          )
        );
      }
    }
  }

  const res = withMigration(next());

  // Attach the refreshed token if one was issued
  if (refreshedToken) {
    res.cookies.set(COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure:   false, // Temporarily disabled for EC2 HTTP testing
      sameSite: "lax",
      maxAge:   COOKIE_TTL,
      path:     sessionCookiePath,
    });
  }

  return res;
}

// ─── Matcher ───────────────────────────────────────────────────────────────────
// Runs on every route except static assets, because the old session cookie must
// be migrated wherever a user lands. Route gating is done by the tables above.

export const config = {
  matcher: [
    // With a basePath the pattern below does not match the app root itself.
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
