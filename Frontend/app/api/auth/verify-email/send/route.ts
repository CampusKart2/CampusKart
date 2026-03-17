import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { pool, query } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

// ─── Validation ────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  email: z
    .string()
    .email("Invalid email address.")
    .regex(/^[^\s@]+@[^\s@]+\.edu$/i, "Only .edu email addresses are accepted."),
});

// ─── POST /api/auth/verify-email/send ──────────────────────────────────────────
// Generates a 24-hour verification token, persists it, and emails the link.
// Supports the "resend" flow: any existing token for the user is replaced.

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // 2. Look up user — reveal only a generic message to prevent user enumeration
  const userRows = await query<{ id: string; email_verified: boolean }>(
    `SELECT id, email_verified FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (userRows.length === 0) {
    // Return 200 so attackers can't tell whether the address is registered
    return NextResponse.json(
      { message: "If that address is registered, a verification email has been sent." },
      { status: 200 }
    );
  }

  const user = userRows[0];

  // 3. Already verified — nothing to do
  if (user.email_verified) {
    return NextResponse.json(
      { error: "This email address is already verified." },
      { status: 409 }
    );
  }

  // 4. Generate a cryptographically secure token (64 hex chars = 256 bits)
  const token = randomBytes(32).toString("hex");

  // 5. Upsert: delete any existing token for this user, then insert the new one.
  //    Wrapped in a transaction so we never leave a user with zero tokens after delete.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM email_verification_tokens WHERE user_id = $1`,
      [user.id]
    );
    await client.query(
      `INSERT INTO email_verification_tokens (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [token, user.id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[verify-email/send] DB error:", err);
    return NextResponse.json(
      { error: "Failed to generate verification token. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  // 6. Send the email (fire-and-forget errors don't expose internals to client)
  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("[verify-email/send] Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Verification email sent. Please check your inbox." },
    { status: 200 }
  );
}
