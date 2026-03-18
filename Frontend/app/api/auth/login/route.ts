import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validators/auth";
import { query } from "@/lib/db";
import { signSession } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";
const COOKIE_TTL  = 60 * 60 * 24 * 7; // 7 days in seconds

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
//
// Verifies credentials and issues a signed JWT in an httpOnly session cookie.
//
// Request body (JSON):
//   { email: string (.edu), password: string }
//
// Responses:
//   200  OK           — { id, full_name, email, emailVerified }  +  Set-Cookie: campuskart_session
//   400  Bad Request  — Zod validation failure
//   401  Unauthorized — Wrong email or password
//   500  Server Error — Unexpected DB / crypto failure

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  // ── 2. Validate with Zod ───────────────────────────────────────────────────
  const parsed = loginSchema.safeParse(
    typeof body === "object" && body !== null
      ? {
          email:
            typeof (body as Record<string, unknown>).email === "string"
              ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
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
          field:   issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // ── 3. Look up user ────────────────────────────────────────────────────────
  // Use a constant-time error path: always run bcrypt.compare even when the
  // user isn't found so response timing doesn't reveal whether an address is
  // registered (timing-safe against user-enumeration attacks).
  let user:
    | {
        id: string;
        full_name: string;
        password_hash: string;
        email_verified: boolean;
      }
    | undefined;
  try {
    const rows = await query<{
      id: string;
      full_name: string;
      password_hash: string;
      email_verified: boolean;
    }>(
      `SELECT id, full_name, password_hash, email_verified FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    user = rows[0];
  } catch (err) {
    console.error("[POST /api/auth/login] DB error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }

  // Dummy hash keeps timing consistent when the email is not found
  const DUMMY_HASH =
    "$2b$12$invalidhashvaluethatbcryptwillalwaysrejectXXXXXXXXXXXXX";
  const hashToCompare = user?.password_hash ?? DUMMY_HASH;
  const passwordMatch  = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    // Generic message — never reveal which field was wrong
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // ── 4. Sign JWT ────────────────────────────────────────────────────────────
  let token: string;
  try {
    token = await signSession({
      userId:        user.id,
      email,
      emailVerified: user.email_verified,
    });
  } catch (err) {
    console.error("[POST /api/auth/login] error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }

  // ── 5. Set httpOnly session cookie ─────────────────────────────────────────
  const response = NextResponse.json(
    {
      id:            user.id,
      full_name:     user.full_name,
      email,
      emailVerified: user.email_verified,
    },
    { status: 200 }
  );

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   COOKIE_TTL,
    path:     "/",
  });

  return response;
}
