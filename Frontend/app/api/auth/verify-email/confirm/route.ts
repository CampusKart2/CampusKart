import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifySession, signSession } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";
const COOKIE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

// ─── Validation ────────────────────────────────────────────────────────────────

const querySchema = z.object({
  // 64-char lowercase hex produced by crypto.randomBytes(32).toString('hex')
  token: z
    .string()
    .length(64, "Invalid token length.")
    .regex(/^[0-9a-f]+$/, "Invalid token format."),
});

// ─── GET /api/auth/verify-email/confirm?token=<hex> ───────────────────────────
// Validates the token, marks the user as verified, and deletes the used token.
// Clients should redirect to /login (or a success page) after a 200 response.

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Validate the query param
  const rawToken = req.nextUrl.searchParams.get("token") ?? "";
  const parsed = querySchema.safeParse({ token: rawToken });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { token } = parsed.data;

  // 2. Look up token and eagerly join user data in one round-trip
  const result = await db.query<{
    user_id: string;
    expires_at: Date;
    email_verified: boolean;
  }>(
    `SELECT t.user_id, t.expires_at, u.email_verified
     FROM   email_verification_tokens t
     JOIN   users u ON u.id = t.user_id
     WHERE  t.token = $1
     LIMIT  1`,
    [token]
  );

  if (result.rowCount === 0) {
    // Token not found: may have already been used or never existed
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 }
    );
  }

  const row = result.rows[0];

  // 3. Check expiry (database stores UTC; JS Date comparison is safe)
  if (new Date() > row.expires_at) {
    // Clean up the stale token so the DB stays tidy
    await db.query(
      `DELETE FROM email_verification_tokens WHERE token = $1`,
      [token]
    );
    return NextResponse.json(
      { error: "Verification link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // 4. Guard: already verified (idempotent but we still clean up the token)
  if (row.email_verified) {
    await db.query(
      `DELETE FROM email_verification_tokens WHERE token = $1`,
      [token]
    );
    return NextResponse.json(
      { message: "Email address is already verified." },
      { status: 200 }
    );
  }

  // 5. Mark user as verified + delete the consumed token — atomic transaction.
  // Must use a single client connection so BEGIN/UPDATE/DELETE/COMMIT all
  // land on the same backend connection (Pool.query() can round-robin).
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE users SET email_verified = TRUE WHERE id = $1`,
      [row.user_id]
    );
    await client.query(
      `DELETE FROM email_verification_tokens WHERE token = $1`,
      [token]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("[verify-email/confirm] DB error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
  client.release();

  const response = NextResponse.json(
    { message: "Email verified successfully. You can now log in." },
    { status: 200 }
  );

  // 6. If the user clicked the link in the same browser session, their JWT
  //    still carries emailVerified=false.  Re-issue the cookie right now so
  //    they aren't blocked by the middleware gate on their very next request.
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(COOKIE_NAME)?.value;
    if (rawSession) {
      const existingSession = await verifySession(rawSession);
      if (existingSession && existingSession.userId === row.user_id) {
        const newToken = await signSession({ ...existingSession, emailVerified: true });
        response.cookies.set(COOKIE_NAME, newToken, {
          httpOnly: true,
          secure:   process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge:   COOKIE_TTL,
          path:     "/",
        });
      }
    }
  } catch {
    // Non-fatal: user can re-login to get an updated token
  }

  return response;
}
