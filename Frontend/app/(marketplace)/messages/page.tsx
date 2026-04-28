import Link from "next/link";
import { z } from "zod";

/**
 * Optional deep-link from the notification dropdown (`?cid=type%3AchannelId`).
 * Validated so we never echo arbitrary strings into the page.
 */
const streamCidParamSchema = z
  .string()
  .trim()
  .min(3)
  .max(128)
  .regex(/^[\w-]+:[\w-]+$/, "cid must look like stream_type:stream_id");

interface MessagesPageProps {
  searchParams: Promise<{ cid?: string | string[] }>;
}

/**
 * Messages shell — full Stream Chat UI can mount here in a later task.
 * Notification items link with `?cid=` so a future client can open that thread.
 */
export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const sp = await searchParams;
  const rawCid = Array.isArray(sp.cid) ? sp.cid[0] : sp.cid;
  const cidParsed = rawCid ? streamCidParamSchema.safeParse(rawCid) : null;
  const activeCid = cidParsed?.success ? cidParsed.data : null;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-surface">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
        {activeCid ? (
          <p className="mt-3 rounded-card border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Selected thread:</span>{" "}
            <code className="text-xs text-primary">{activeCid}</code>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-text-secondary max-w-lg">
          Your conversations will appear here. Open a thread from the notification bell
          to jump here with a channel id.
        </p>
        <Link
          href="/listings"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
        >
          ← Back to listings
        </Link>
      </div>
    </main>
  );
}
