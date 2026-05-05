import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators/auth";

const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query<{
      id: string;
      user_id: string;
    }>(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token = $1
         AND used = FALSE
         AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [token]
    );

    const resetToken = tokenResult.rows[0];
    if (!resetToken) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "This password reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );
    await client.query(
      `UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`,
      [resetToken.id]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Password has been reset successfully." },
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/auth/reset-password] error:", err);
    return NextResponse.json(
      { error: "Password reset failed. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
