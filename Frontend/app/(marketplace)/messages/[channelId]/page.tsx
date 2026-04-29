import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import ChatView from "@/components/chat/ChatView";
import { getSession } from "@/lib/auth";

const channelIdParamSchema = z
  .string()
  .trim()
  .min(3)
  .max(128)
  .regex(/^[a-z0-9-]+$/i, "channelId must be a Stream channel id");

interface MessageChannelPageProps {
  params: Promise<{ channelId: string }>;
}

/**
 * Individual chat thread page at /messages/[channelId].
 */
export default async function MessageChannelPage({ params }: MessageChannelPageProps) {
  const session = await getSession();
  if (!session) notFound();

  const { channelId } = await params;
  const parsed = channelIdParamSchema.safeParse(decodeURIComponent(channelId));
  if (!parsed.success) notFound();

  return (
    <main className="min-h-[calc(100vh-56px)] bg-surface">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Chatting with other students about listings.
            </p>
          </div>
          <Link href="/messages" className="text-sm font-semibold text-primary hover:underline">
            ← All Messages
          </Link>
        </div>

        <ChatView userId={session.userId} activeChannelId={parsed.data} showSidebar={false} />
      </div>
    </main>
  );
}

