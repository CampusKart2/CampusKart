import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/session";

const COOKIE_NAME = "campuskart_session";

/**
 * Returns the verified session payload for the current request, or null.
 * Safe to call from Server Components, Server Actions, and API Routes.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value ?? "";
  return raw ? verifySession(raw) : null;
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
