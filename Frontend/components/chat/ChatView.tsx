"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageComposer,
  Thread,
  LoadingIndicator,
  ComponentProvider,
  WithDragAndDropUpload,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";

import { chatTokenResponseSchema } from "@/lib/validators/chat";
import InboxView from "@/components/chat/InboxView";

interface ChatViewProps {
  userId: string;
  /**
   * Stream channel ID (NOT CID). This matches the route param at /messages/[channelId].
   */
  activeChannelId?: string | null;
  showSidebar?: boolean;
  showChat?: boolean;
}

/**
 * Main Chat UI component using GetStream React SDK v14.
 * Handles client connection, channel list, and active conversation view.
 */
export default function ChatView({ 
  userId, 
  activeChannelId, 
  showSidebar = true, 
  showChat = true 
}: ChatViewProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isActiveChannelReady, setIsActiveChannelReady] = useState(false);
  const connectingRef = useRef(false);

  const apiKey = process.env.NEXT_PUBLIC_GETSTREAM_API_KEY?.trim() ?? "";

  useEffect(() => {
    if (!apiKey || !userId || connectingRef.current) return;

    let cancelled = false;
    const chatClient = StreamChat.getInstance(apiKey);

    async function initChat() {
      if (connectingRef.current) return;
      connectingRef.current = true;

      try {
        const res = await fetch("/api/chat/token", {
          method: "POST",
          credentials: "include",
        });
        const raw = await res.json();
        
        if (!res.ok) throw new Error("Failed to fetch chat token");
        
        const parsed = chatTokenResponseSchema.safeParse(raw);
        if (!parsed.success) throw new Error("Invalid token response");

        if (cancelled) {
          connectingRef.current = false;
          return;
        }

        // Connect user. 
        await chatClient.connectUser({ id: userId }, parsed.data.token);

        if (cancelled) {
          await chatClient.disconnectUser();
          connectingRef.current = false;
          return;
        }

        setClient(chatClient);
      } catch (error) {
        console.error("[ChatView] Initialization error:", error);
        connectingRef.current = false;
      }
    }

    initChat();

    return () => {
      cancelled = true;
      if (chatClient) {
        chatClient.disconnectUser();
      }
      setClient(null);
      connectingRef.current = false;
    };
  }, [apiKey, userId]);

  const activeChannel = useMemo(() => {
    if (!client || !activeChannelId) return null;
    return client.channel("messaging", activeChannelId);
  }, [client, activeChannelId]);

  useEffect(() => {
    let cancelled = false;

    async function ensureChannelReady() {
      if (!activeChannel) {
        setIsActiveChannelReady(false);
        return;
      }

      setIsActiveChannelReady(false);
      try {
        await activeChannel.watch();
        if (!cancelled) setIsActiveChannelReady(true);
      } catch (error) {
        console.error("[ChatView] Failed to watch active channel:", error);
        if (!cancelled) setIsActiveChannelReady(false);
      }
    }

    void ensureChannelReady();
    return () => {
      cancelled = true;
    };
  }, [activeChannel?.cid]);

  if (!client) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-card border border-border bg-card">
        <div className="flex flex-col items-center gap-4">
          <LoadingIndicator />
          <p className="text-sm text-text-muted">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[600px] overflow-hidden rounded-card border border-border bg-card shadow-card lg:h-[calc(100vh-12rem)]">
      <Chat client={client} theme="str-chat__theme-light">
        <div className="flex h-full w-full overflow-hidden">
          {/* Sidebar: Channel List */}
          {showSidebar && (
            <div className={`h-full border-r border-border ${showChat ? "hidden md:block md:w-80 lg:w-96" : "w-full"}`}>
              <InboxView userId={userId} className="h-full" />
            </div>
          )}

          {/* Main: Active Channel View */}
          {showChat && (
            <div className={`flex h-full flex-1 flex-col overflow-hidden bg-surface ${!showSidebar ? "w-full" : ""}`}>
              <ComponentProvider value={{}}>
                {activeChannel ? (
                  isActiveChannelReady ? (
                    <Channel key={activeChannel.cid} channel={activeChannel}>
                      <WithDragAndDropUpload acceptedFiles={["image/*"]}>
                        <Window>
                          <MessageList />
                          <MessageComposer />
                        </Window>
                      </WithDragAndDropUpload>
                      <Thread />
                    </Channel>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <LoadingIndicator />
                    </div>
                  )
                ) : (
                  <div className="flex flex-1 items-center justify-center text-text-muted">
                    <div className="text-center px-6">
                      <p className="text-base font-semibold text-text-primary">Your Inbox</p>
                      <p className="mt-1 text-sm text-text-muted">
                        Select a conversation to start messaging.
                      </p>
                    </div>
                  </div>
                )}
              </ComponentProvider>
            </div>
          )}
        </div>
      </Chat>
    </div>
  );
}
