import { NextRequest } from "next/server";
import { verifySession, type SessionPayload } from "@/lib/session";

export const ADMIN_EMAIL = "ss63231n@pace.edu";
export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_COOKIE_TTL = 60 * 60 * 8;

export async function getAdminSession(
  req: NextRequest
): Promise<SessionPayload | null> {
  const raw = req.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!raw) {
    return null;
  }

  const session = await verifySession(raw);
  if (!session || session.email.toLowerCase() !== ADMIN_EMAIL) {
    return null;
  }

  return session;
}
