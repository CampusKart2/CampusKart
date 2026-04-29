import { StreamChat } from "stream-chat";

let cached:
  | {
      client: StreamChat;
      apiKey: string;
    }
  | undefined;

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Server-side Stream Chat singleton.
 *
 * - Never import this from client components.
 * - Uses GETSTREAM_API_SECRET, which must never be exposed to the browser.
 */
export function getStreamServerClient(): { client: StreamChat; apiKey: string } {
  if (cached) return cached;

  const apiKey = getEnv("NEXT_PUBLIC_GETSTREAM_API_KEY");
  const apiSecret = getEnv("GETSTREAM_API_SECRET");

  // In dev/Next HMR, keep a single instance across reloads.
  const globalForStream = globalThis as unknown as {
    __campuskart_stream__?: StreamChat;
  };

  const client =
    globalForStream.__campuskart_stream__ ?? StreamChat.getInstance(apiKey, apiSecret);

  if (process.env.NODE_ENV !== "production") {
    globalForStream.__campuskart_stream__ = client;
  }

  cached = { client, apiKey };
  return cached;
}

