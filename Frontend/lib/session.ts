/**
 * lib/session.ts
 *
 * Lightweight JWT helpers built on the Web Crypto API (SubtleCrypto).
 * Compatible with both the Next.js Edge Runtime (middleware) and
 * the Node.js runtime (Server Actions, API Routes).
 *
 * Algorithm: HMAC-SHA256
 * Secret:    config.jwtSecret (backed by JWT_SECRET env var, ≥ 32 chars)
 */

import { config } from "@/lib/config";
// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  email: string;
  /** Mirrors users.email_verified. Embedded so middleware needs no DB round-trip. */
  emailVerified: boolean;
}

interface JwtClaims extends SessionPayload {
  iat: number; // issued-at  (Unix seconds)
  exp: number; // expiry     (Unix seconds)
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** Encode a UTF-8 string as base64url. */
function encodeBase64url(value: string): string {
  // TextEncoder → Uint8Array → base64 → base64url
  const bytes = new TextEncoder().encode(value);
  return arrayBufferToBase64url(bytes.buffer as ArrayBuffer);
}

/** Encode a raw ArrayBuffer as base64url (used for the HMAC signature). */
function arrayBufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Decode a base64url string back to a plain string. */
function decodeBase64url(value: string): string {
  // Re-pad to standard base64, then atob
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

/** Decode a base64url string back to an ArrayBuffer (used to verify signatures). */
function base64urlToArrayBuffer(value: string): ArrayBuffer {
  const str = decodeBase64url(value);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

/** Import the raw secret bytes as an HMAC-SHA256 CryptoKey. */
async function importKey(secret: string): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// ─── Public API ────────────────────────────────────────────────────────────────

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Sign a `SessionPayload` and return a compact JWT string.
 * Throws if JWT secret is not configured.
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = config.jwtSecret;

  const now = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    ...payload,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const header = encodeBase64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encodeBase64url(JSON.stringify(claims));
  const signingInput = `${header}.${body}`;

  const key = await importKey(secret);
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput)
  );
  const signature = arrayBufferToBase64url(sigBuffer);

  return `${header}.${body}.${signature}`;
}

/**
 * Verify a JWT string and return its payload, or `null` if it is
 * invalid, has been tampered with, or has expired.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  const secret = config.jwtSecret;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  try {
    const key = await importKey(secret);
    const signingInput = new TextEncoder().encode(`${header}.${body}`);
    const sigBytes = base64urlToArrayBuffer(signature);

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, signingInput);
    if (!valid) return null;

    const claims = JSON.parse(decodeBase64url(body)) as Partial<JwtClaims>;

    // Reject expired tokens
    if (typeof claims.exp !== "number" || Math.floor(Date.now() / 1000) > claims.exp) {
      return null;
    }

    // Ensure required fields are present
    if (
      typeof claims.userId !== "string" ||
      typeof claims.email !== "string" ||
      typeof claims.emailVerified !== "boolean"
    ) {
      return null;
    }

    return {
      userId: claims.userId,
      email: claims.email,
      emailVerified: claims.emailVerified,
    };
  } catch {
    // Any decode / crypto error → treat as invalid
    return null;
  }
}
