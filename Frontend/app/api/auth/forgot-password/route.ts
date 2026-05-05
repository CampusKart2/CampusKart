import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { pool, query } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_RESPONSE = {
  message:
    "If an account exists for that email, a password reset link has been sent.",
};

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

  const parsed = forgotPasswordSchema.safeParse(
    typeof body === "object" && body !== null
      ? {
          email:
            typeof (body as Record<string, unknown>).email === "string"
              ? ((body as Record<string, unknown>).email as string)
                  .trim()
                  .toLowerCase()
              : (body as Record<string, unknown>).email,
        }
      : body
  );

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

  const { email } = parsed.data;

  try {
    const users = await query<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    const user = users[0];

    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const token = randomBytes(32).toString("hex");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE password_reset_tokens
         SET used = TRUE
         WHERE user_id = $1 AND used = FALSE`,
        [user.id]
      );
      await client.query(
        `INSERT INTO password_reset_tokens (user_id, token)
         VALUES ($1, $2)`,
        [user.id, token]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    try {
      await sendPasswordResetEmail(email, token, user.full_name);
    } catch (emailErr) {
      console.error(
        "[POST /api/auth/forgot-password] Password reset email failed:",
        emailErr
      );
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password] error:", err);
    return NextResponse.json(
      { error: "Password reset request failed. Please try again." },
      { status: 500 }
    );
  }
}
