import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifySession, type SessionPayload } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";

/**
 * Returns the verified session payload for the current request, or null.
 * Safe to call from Server Components, Server Actions, and API Routes.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value ?? "";
  const session = raw ? await verifySession(raw) : null;

  if (!session) {
    return null;
  }

  const rows = await query<{
    email: string;
    email_verified: boolean;
    is_active: boolean;
  }>(
    `SELECT email, email_verified, is_active
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [session.userId]
  );
  const user = rows[0];

  if (!user || !user.is_active) {
    return null;
  }

  return {
    userId: session.userId,
    email: user.email,
    emailVerified: user.email_verified,
  };
}

/**
 * Asserts a valid session exists. Throws if unauthenticated.
 * Use in Server Actions / Route Handlers that require auth.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthenticated");
  return session;
}
