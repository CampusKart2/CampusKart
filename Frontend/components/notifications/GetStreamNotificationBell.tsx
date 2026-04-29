"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { StreamChat, type Event } from "stream-chat";

import { chatTokenResponseSchema } from "@/lib/validators/chat";
import {
  notificationsListResponseSchema,
  type NotificationItem,
} from "@/lib/validators/notifications";

type Props = {
  /** CampusKart `users.id` — must match the Stream user id. */
  userId: string;
};

function readUnreadTotal(event: Event): number | undefined {
  if (typeof event.total_unread_count === "number") {
    return event.total_unread_count;
  }
  if (typeof event.unread_count === "number") {
    return event.unread_count;
  }
  return undefined;
}

function readInitialUnread(user: StreamChat["user"]): number {
  if (!user) return 0;
  const raw = user as { total_unread_count?: unknown };
  return typeof raw.total_unread_count === "number" ? raw.total_unread_count : 0;
}

function formatAlertTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return rtf.format(-diffDay, "day");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Navbar bell: Stream unread badge + dropdown of the 10 latest message alerts from
 * `GET /api/notifications`. Item click opens `/messages` with `cid` (Stream channel id).
 */
export default function GetStreamNotificationBell({ userId }: Props) {
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GETSTREAM_API_KEY?.trim() ?? "";
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">(
    "idle"
  );
  const clientRef = useRef<StreamChat | null>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);

  const applyUnreadFromEvent = useCallback((event: Event) => {
    const next = readUnreadTotal(event);
    if (next !== undefined) {
      setUnread(next);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await fetch("/api/notifications?limit=10", {
        credentials: "include",
      });
      const raw: unknown = await res.json();
      if (!res.ok) {
        setListError(
          typeof raw === "object" &&
            raw !== null &&
            "error" in raw &&
            typeof (raw as { error: unknown }).error === "string"
            ? (raw as { error: string }).error
            : "Could not load alerts."
        );
        setItems([]);
        return;
      }
      const parsed = notificationsListResponseSchema.safeParse(raw);
      if (!parsed.success) {
        setListError("Invalid notification response.");
        setItems([]);
        return;
      }
      setItems(parsed.data.notifications);
    } catch {
      setListError("Could not load alerts.");
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (ev: MouseEvent) => {
      const el = rootRef.current;
      if (!el || !(ev.target instanceof Node) || el.contains(ev.target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!apiKey) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    const client = new StreamChat(apiKey);
    clientRef.current = client;

    async function connect(): Promise<void> {
      setStatus("connecting");
      try {
        const res = await fetch("/api/chat/token", {
          method: "POST",
          credentials: "include",
        });
        const raw: unknown = await res.json();
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const parsed = chatTokenResponseSchema.safeParse(raw);
        if (!parsed.success) {
          setStatus("error");
          return;
        }
        if (cancelled) return;

        await client.connectUser({ id: userId }, parsed.data.token);
        if (cancelled) {
          await client.disconnectUser();
          return;
        }

        setUnread(readInitialUnread(client.user));
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void connect();

    const subscription = client.on((event: Event) => {
      applyUnreadFromEvent(event);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      void client.disconnectUser();
      clientRef.current = null;
    };
  }, [apiKey, userId, applyUnreadFromEvent]);

  const handleMarkAllRead = useCallback(async () => {
    const client = clientRef.current;
    if (client && status === "live") {
      try {
        await client.markAllRead();
      } catch {
        /* ignore */
      }
    }
    setUnread(0);
  }, [status]);

  const handleBellToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback(
    (item: NotificationItem) => {
      setOpen(false);
      // channelCid looks like "messaging:channelId" — our canonical route is /messages/[channelId]
      const [, channelId] = item.channelCid.split(":", 2);
      router.push(`/messages/${encodeURIComponent(channelId || item.channelCid)}`);
    },
    [router]
  );

  const onMarkAllReadClick = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      await handleMarkAllRead();
    },
    [handleMarkAllRead]
  );

  if (!apiKey) {
    return null;
  }

  const badgeLabel =
    unread > 99 ? "99+" : unread > 0 ? String(unread) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={handleBellToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-button border border-border bg-card text-text-primary hover:bg-surface transition"
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : "Notifications, open alerts"
        }
      >
        <Bell className="h-5 w-5" aria-hidden />
        {badgeLabel ? (
          <span className="pointer-events-none absolute -right-1 -top-1 min-w-[1.125rem] rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-tight text-white">
            {badgeLabel}
          </span>
        ) : null}
        {status === "connecting" ? (
          <span className="sr-only">Connecting notifications</span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-card border border-border bg-card shadow-card-hover"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Message alerts
            </p>
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
            {listLoading ? (
              <p className="px-3 py-4 text-sm text-text-secondary">Loading…</p>
            ) : listError ? (
              <p className="px-3 py-4 text-sm text-rose-600">{listError}</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-secondary">
                No recent message alerts yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleItemClick(item)}
                      className="flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-surface transition sm:px-4"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-text-primary">
                          {item.senderName}
                        </span>
                        <time
                          className="shrink-0 text-xs text-text-muted"
                          dateTime={item.createdAt}
                        >
                          {formatAlertTime(item.createdAt)}
                        </time>
                      </div>
                      <p className="line-clamp-2 text-xs text-text-secondary">
                        {item.snippet}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onMarkAllReadClick}
              className="text-left text-xs font-semibold text-primary hover:underline"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/messages");
              }}
              className="text-left text-xs font-semibold text-text-secondary hover:text-text-primary sm:text-right"
            >
              View all messages →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
