"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signupSchema, loginSchema } from "@/lib/validators/auth";
import { db } from "@/lib/db";
import { signSession } from "@/lib/session";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const COOKIE_NAME = "campuskart_session";
const COOKIE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
const BCRYPT_ROUNDS = 12;

/** Write the signed JWT into the session cookie. */
async function setSessionCookie(
  userId: string,
  email: string,
  emailVerified: boolean
): Promise<void> {
  const token = await signSession({ userId, email, emailVerified });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_TTL,
    path: "/",
  });
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const from = (formData.get("from") as string) || "/";

  const parsed = loginSchema.safeParse({
    email: (formData.get("email") as string ?? "").trim(),
    password: formData.get("password") as string ?? "",
  });

  if (!parsed.success) {
    return parsed.error.issues[0].message;
  }

  const { email, password } = parsed.data;

  // Fetch user — use a generic error to avoid revealing whether address is registered
  const result = await db.query<{
    id: string;
    password_hash: string;
    email_verified: boolean;
  }>(
    `SELECT id, password_hash, email_verified FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  const user = result.rows[0];
  const isValid = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !isValid) {
    return "Invalid email or password.";
  }

  await setSessionCookie(user.id, email, user.email_verified);
  redirect(from);
}

// ─── Signup ────────────────────────────────────────────────────────────────────

export async function signupAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const from = (formData.get("from") as string) || "/";

  const parsed = signupSchema.safeParse({
    name: (formData.get("name") as string ?? "").trim(),
    email: (formData.get("email") as string ?? "").trim(),
    password: formData.get("password") as string ?? "",
  });

  if (!parsed.success) {
    return parsed.error.issues[0].message;
  }

  const { name, email, password } = parsed.data;

  // Check for duplicate email before hashing (cheaper query first)
  const existing = await db.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  if ((existing.rowCount ?? 0) > 0) {
    return "An account with that email address already exists.";
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Wrap user insert + token insert in one transaction so a user row
  // is never persisted without a corresponding verification token.
  let newUserId: string;
  let verificationToken: string;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, email_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id`,
      [name, email, passwordHash]
    );
    newUserId = insertResult.rows[0].id;

    // Issue a 24-hour email-verification token inside the same transaction
    verificationToken = await issueVerificationToken(client, newUserId);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("[signupAction] DB error:", err);
    return "Registration failed. Please try again.";
  }
  client.release();

  // Send verification email after commit — failure is non-fatal;
  // the user can request a resend from /verify-email (T-03).
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (emailErr) {
    console.error("[signupAction] Verification email failed:", emailErr);
  }

  // New accounts start unverified — middleware blocks write actions
  // until the user confirms their email.
  await setSessionCookie(newUserId, email, false);

  // T-08: always land on the "Check Your Email" confirmation screen
  // after signup, regardless of the original `from` destination.
  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/login");
}
