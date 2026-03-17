import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators/auth";
import { pool, query } from "@/lib/db";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

/** bcrypt cost factor — 12 rounds is the production-safe baseline. */
const BCRYPT_ROUNDS = 12;

// ─── POST /api/auth/register ───────────────────────────────────────────────────
//
// Creates a new user account.
//
// Request body (JSON):
//   { full_name: string, email: string (must be .edu), password: string }
//
// Responses:
//   201  Created   — { id, full_name, email, emailVerified, createdAt }
//   400  Bad Req   — Zod validation failure
//   409  Conflict  — Email already registered
//   500  Error     — Unexpected server / DB error

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // ── 2. Validate with Zod ───────────────────────────────────────────────────
  const parsed = signupSchema.safeParse(
    typeof body === "object" && body !== null
      ? {
          // Trim string fields at the API boundary before validation
          full_name: typeof (body as Record<string, unknown>).full_name === "string" ? ((body as Record<string, unknown>).full_name as string).trim() : (body as Record<string, unknown>).full_name,
          email:     typeof (body as Record<string, unknown>).email     === "string" ? ((body as Record<string, unknown>).email as string).trim().toLowerCase() : (body as Record<string, unknown>).email,
          password:  (body as Record<string, unknown>).password,
        }
      : body
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        // Return all field errors so API consumers can display them
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { full_name, email, password } = parsed.data;

  // ── 3. Duplicate-email check ───────────────────────────────────────────────
  // Run this BEFORE hashing to avoid the bcrypt cost on a certain failure.
  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with that email address already exists." },
      { status: 409 }
    );
  }

  // ── 4. Hash password ───────────────────────────────────────────────────────
  // bcrypt's output always includes the salt, so we only store the single hash column.
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // ── 5. Persist user + verification token in one atomic transaction ─────────
  //
  // Both the user row and the verification token are inserted in the same
  // transaction so we can never have a user without a token to confirm with.
  // The email is sent AFTER COMMIT so a transient SMTP error never rolls
  // back a successfully created account.
  let newUser: { id: string; full_name: string; email: string; email_verified: boolean; created_at: string };
  let verificationToken: string;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 5a. Insert the user row
    const result = await client.query<{
      id: string;
      full_name: string;
      email: string;
      email_verified: boolean;
      created_at: string;
    }>(
      `INSERT INTO users (full_name, email, password_hash, email_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, full_name, email, email_verified, created_at`,
      [full_name, email, passwordHash]
    );
    newUser = result.rows[0];

    // 5b. Issue a 24-hour verification token (inside the same transaction)
    verificationToken = await issueVerificationToken(client, newUser.id);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    const pgErr = err as { code?: string };
    // 23505 = PostgreSQL unique_violation (race-condition duplicate)
    if (pgErr.code === "23505") {
      return NextResponse.json(
        { error: "An account with that email address already exists." },
        { status: 409 }
      );
    }
    console.error("[POST /api/auth/register] DB error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  } finally {
    // Always release the client back to the pool
    client.release();
  }

  // ── 6. Send verification email (after commit, best-effort within 5 s) ─────
  //
  // A failed email send does NOT fail the registration — the user can
  // request a resend via POST /api/auth/verify-email/resend.
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (emailErr) {
    // Log but swallow: account is already persisted, user can resend
    console.error("[POST /api/auth/register] Verification email failed:", emailErr);
  }

  // ── 7. Return the created user (never include password_hash) ──────────────
  return NextResponse.json(
    {
      id:            newUser.id,
      full_name:      newUser.full_name,
      email:         newUser.email,
      emailVerified: newUser.email_verified,
      createdAt:     newUser.created_at,
    },
    { status: 201 }
  );
}
