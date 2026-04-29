import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ChatView from "@/components/chat/ChatView";
import { getSession } from "@/lib/auth";

interface MessagesPageProps {
  searchParams: Promise<{ channelId?: string | string[] }>;
}

/**
 * Messages inbox page — renders the GetStream Chat UI without a pre-selected channel.
 */
export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await getSession();
  if (!session) {
    notFound();
  }

  const sp = await searchParams;
  const rawChannelId = Array.isArray(sp.channelId) ? sp.channelId[0] : sp.channelId;
  
  // If a channelId is provided via query, redirect to the dynamic route for consistency
  if (rawChannelId) {
    redirect(`/messages/${rawChannelId}`);
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-surface">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Your conversations with other students.
            </p>
          </div>
          <Link
            href="/listings"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to listings
          </Link>
        </div>

        <ChatView
          userId={session.userId}
          showChat={false}
        />
      </div>
    </main>
  );
}
