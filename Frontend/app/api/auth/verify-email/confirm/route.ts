import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

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

  // 5. Mark user as verified + delete the consumed token — atomic transaction
  await db.query("BEGIN");
  try {
    await db.query(
      `UPDATE users SET email_verified = TRUE WHERE id = $1`,
      [row.user_id]
    );
    await db.query(
      `DELETE FROM email_verification_tokens WHERE token = $1`,
      [token]
    );
    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("[verify-email/confirm] DB error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Email verified successfully. You can now log in." },
    { status: 200 }
  );
}
