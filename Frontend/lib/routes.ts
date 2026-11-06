const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/campuskart";

function normalizeBasePath(path: string): string {
  const trimmed = path.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export const basePath = normalizeBasePath(BASE_PATH);

/** Cookie path for the session cookie, so it is only sent to this app. */
export const sessionCookiePath = basePath || "/";

/**
 * Session cookie, scoped to sessionCookiePath. It has a new name because a server
 * cannot see a cookie's path: with one name, an old Path=/ cookie would be
 * indistinguishable from the scoped one, and would take precedence over it.
 */
export const SESSION_COOKIE_NAME = "campuskart_sid";

/**
 * Pre-migration session cookie (Path=/). middleware.ts moves it to
 * SESSION_COOKIE_NAME. Safe to remove once every old cookie has expired, which
 * is at most 7 days after this is deployed.
 */
export const LEGACY_SESSION_COOKIE_NAME = "campuskart_session";

export function appPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

export function apiPath(path: string): string {
  return appPath(path);
}

export function appUrl(path = "/"): string {
  const origin =
    process.env.SERVER_INTERNAL_APP_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3002";

  return new URL(appPath(path), origin).toString();
}
