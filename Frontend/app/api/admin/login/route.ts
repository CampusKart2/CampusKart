import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_TTL, ADMIN_EMAIL } from "@/lib/admin";
import { query } from "@/lib/db";
import { signSession } from "@/lib/session";
import { loginSchema } from "@/lib/validators/auth";

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

  const parsed = loginSchema.safeParse(
    typeof body === "object" && body !== null
      ? {
          email:
            typeof (body as Record<string, unknown>).email === "string"
              ? ((body as Record<string, unknown>).email as string)
                  .trim()
                  .toLowerCase()
              : (body as Record<string, unknown>).email,
          password: (body as Record<string, unknown>).password,
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

  const { email, password } = parsed.data;
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Invalid admin credentials." },
      { status: 401 }
    );
  }

  try {
    const rows = await query<{
      id: string;
      password_hash: string;
      email_verified: boolean;
      is_active: boolean;
    }>(
      `SELECT id, password_hash, email_verified, is_active
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );
    const user = rows[0];
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !user.is_active || !passwordMatch) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const token = await signSession({
      userId: user.id,
      email,
      emailVerified: user.email_verified,
    });
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: ADMIN_COOKIE_TTL,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[POST /api/admin/login] error:", err);
    return NextResponse.json(
      { error: "Admin login failed. Please try again." },
      { status: 500 }
    );
  }
}
