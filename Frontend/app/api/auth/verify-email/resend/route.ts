import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { pool, query } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

// ─── POST /api/auth/verify-email/resend ────────────────────────────────────────
// Re-issues a fresh 24-hour token for the authenticated user.
// No request body needed — the user is identified from their session cookie.

export async function POST(_req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate via session cookie
  const store = await cookies();
  const rawToken = store.get("campuskart_session")?.value ?? "";
  const session = rawToken ? await verifySession(rawToken) : null;

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // 2. Guard: already verified
  if (session.emailVerified) {
    return NextResponse.json(
      { error: "Your email address is already verified." },
      { status: 409 }
    );
  }

  // 3. Confirm user still exists in DB (session could outlive account deletion)
  const userRows = await query<{ id: string }>(
    `SELECT id FROM users WHERE id = $1 LIMIT 1`,
    [session.userId]
  );
  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // 4. Generate and store fresh token (replace any existing one — atomic TX)
  const token = randomBytes(32).toString("hex");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM email_verification_tokens WHERE user_id = $1`,
      [session.userId]
    );
    await client.query(
      `INSERT INTO email_verification_tokens (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [token, session.userId]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[verify-email/resend] DB error:", err);
    return NextResponse.json(
      { error: "Failed to generate token. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  // 5. Send email
  try {
    await sendVerificationEmail(session.email, token);
  } catch (err) {
    console.error("[verify-email/resend] Email error:", err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Verification email sent. Please check your inbox." },
    { status: 200 }
  );
}
