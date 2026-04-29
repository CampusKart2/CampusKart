"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChannelList,
  ComponentProvider,
  LoadingIndicator,
  useChatContext,
  type ChannelListProps,
  type ChannelListItemUIProps,
} from "stream-chat-react";

function ActiveChannelWatcher({
  pendingNavigationToIdRef,
}: {
  pendingNavigationToIdRef: React.MutableRefObject<string | null>;
}) {
  const router = useRouter();
  const { channel: activeChannel } = useChatContext();

  useEffect(() => {
    const id = activeChannel?.id;
    if (!id) return;

    // Only navigate when a user selection explicitly requested it.
    if (pendingNavigationToIdRef.current !== id) return;
    pendingNavigationToIdRef.current = null;
    router.push(`/messages/${id}`);
  }, [activeChannel?.id, router]);

  return null;
}

export type InboxViewProps = {
  userId: string;
  className?: string;
  channelListProps?: Partial<ChannelListProps>;
};

/**
 * Inbox list view. Must be rendered inside an active <Chat> context.
 *
 * Includes a headless watcher that pushes navigation when Stream's activeChannel changes.
 */
export default function InboxView({ userId, className, channelListProps }: InboxViewProps) {
  const router = useRouter();
  const filters = useMemo(() => ({ members: { $in: [userId] } }), [userId]);
  const sort = useMemo(() => ({ last_message_at: -1 as const }), []);
  const options = useMemo(
    () => ({
      limit: 20,
      watch: true,
      state: true,
    }),
    []
  );

  // User-driven navigation gate:
  // - Stream may set an active channel during mount/hydration; we must NOT auto-route then.
  // - When a user selects a channel from the list, we set the desired id and let the watcher route.
  const pendingNavigationToIdRef = useRef<string | null>(null);

  return (
    <div className={className ?? "h-full"}>
      {/* Headless navigation bridge inside <Chat> context */}
      <ActiveChannelWatcher pendingNavigationToIdRef={pendingNavigationToIdRef} />
      <ComponentProvider
        value={{
          ChannelListItemUI: (props: ChannelListItemUIProps) => {
            const { displayTitle, latestMessagePreview, unread, active, onSelect, channel } =
              props;
            const isUnread = (unread ?? 0) > 0;

            return (
              <button
                type="button"
                onClick={(e) => {
                  const id = channel.id ?? null;
                  pendingNavigationToIdRef.current = id;
                  onSelect?.(e);

                  // Navigate immediately on click so switching threads is always responsive.
                  // The headless watcher remains as the canonical bridge for activeChannel changes.
                  if (id) router.push(`/messages/${id}`);
                }}
                className={[
                  "w-full text-left",
                  "flex items-start gap-3 px-4 py-3",
                  "border-b border-border/60",
                  "hover:bg-primary/5 focus:bg-primary/5 focus:outline-none",
                  active ? "bg-primary/5" : "bg-card",
                ].join(" ")}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={[
                        "truncate text-sm",
                        isUnread
                          ? "font-semibold text-text-primary"
                          : "font-medium text-text-secondary",
                      ].join(" ")}
                    >
                      {displayTitle || "Chat"}
                    </div>
                    {isUnread ? (
                      <div className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unread && unread > 99 ? "99+" : unread}
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={[
                      "mt-1 truncate text-xs",
                      isUnread ? "text-text-primary" : "text-text-muted",
                    ].join(" ")}
                  >
                    {latestMessagePreview || "No messages yet"}
                  </div>
                </div>
              </button>
            );
          },
          LoadingIndicator: () => (
            <div className="flex h-40 items-center justify-center">
              <LoadingIndicator />
            </div>
          ),
        }}
      >
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          {...channelListProps}
        />
      </ComponentProvider>
    </div>
  );
}

