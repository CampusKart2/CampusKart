import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies the `X-Signature` header from a Stream Chat webhook request.
 * Algorithm matches Stream’s docs: HMAC-SHA256 of the *raw* request body, hex-encoded,
 * using the app **API secret** (same secret used for server-side token generation).
 *
 * The raw body string must be passed exactly as received (same bytes as signed),
 * e.g. `await request.text()` in Next.js before any re-serialization.
 */
export function verifyGetStreamChatWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  apiSecret: string
): boolean {
  if (signatureHeader == null || apiSecret.length === 0) {
    return false;
  }

  const expectedHex = createHmac("sha256", apiSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const received = signatureHeader.trim().toLowerCase();
  if (!/^[0-9a-f]+$/i.test(received) || expectedHex.length !== received.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(expectedHex, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}
