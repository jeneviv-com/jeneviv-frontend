import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCheck,
  Inbox,
  Info,
  MoreVertical,
  ReceiptText,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useToast, type FeedItem, type ToastTone } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/format";
import { EmptyState, FilterMenu } from "@/components/ui";

/**
 * Notifications read like a message list: a dated heading, then one row per
 * event with a small mark, the message and the time it arrived. Jeneviv's
 * orange is kept for the unread marks and the delete action.
 */

const TONE_MARK: Record<ToastTone, { icon: typeof Bell; label: string }> = {
  success: { icon: ReceiptText, label: "Payment" },
  info: { icon: Info, label: "Update" },
  warning: { icon: TriangleAlert, label: "Attention" },
  error: { icon: TriangleAlert, label: "Issue" },
};

function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const day = date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  if (date.toDateString() === today.toDateString()) return `Today, ${day}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${day}`;
  return day;
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function Row({
  item,
  onRead,
  onRemove,
}: {
  item: FeedItem;
  onRead: () => void;
  onRemove: () => void;
}) {
  const tone = TONE_MARK[item.tone] ?? TONE_MARK.info;
  const Icon = tone.icon;

  return (
    <li
      className={`group flex items-start gap-3 border-b border-line-soft px-4 py-4 last:border-b-0 sm:px-5 ${
        item.read ? "bg-white" : "bg-brand-soft/45"
      }`}
    >
      <span
        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          item.read ? "bg-cream text-ink-muted" : "bg-brand text-white"
        }`}
        title={tone.label}
      >
        <Icon size={15} aria-hidden="true" />
      </span>

      <button
        type="button"
        onClick={() => !item.read && onRead()}
        className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`truncate text-[13.5px] tracking-tight ${
              item.read ? "font-medium text-ink-soft" : "font-bold text-ink"
            }`}
          >
            {item.title}
          </p>
          <span
            className="shrink-0 text-[11px] text-ink-faint"
            title={formatDateTime(item.createdAt)}
          >
            {clock(item.createdAt)}
          </span>
        </div>
        {item.body ? (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
            {item.body}
          </p>
        ) : null}
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.title}`}
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-white hover:text-brand focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

export default function Notifications() {
  const { feed, unreadCount, markAllRead, markRead, removeItem, clearFeed } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const rows = useMemo(
    () => (filter === "unread" ? feed.filter((item) => !item.read) : feed),
    [feed, filter],
  );

  // Newest first, grouped under the day they arrived.
  const groups = useMemo(() => {
    const ordered = [...rows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const buckets = new Map<string, FeedItem[]>();
    ordered.forEach((item) => {
      const key = dayKey(item.createdAt);
      buckets.set(key, [...(buckets.get(key) ?? []), item]);
    });
    return Array.from(buckets.values()).map((items) => ({
      label: dayLabel(items[0].createdAt),
      items,
    }));
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* app-style bar: back, title, menu */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-white"
        >
          <ArrowLeft size={17} />
        </Link>
        <h1 className="flex-1 text-center text-[16px] font-bold tracking-tight">Notifications</h1>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Notification actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-white"
          >
            <MoreVertical size={17} />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-30 w-[212px] animate-pop-in overflow-hidden rounded-[14px] border border-line bg-white py-1 shadow-pop"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  markAllRead();
                  setMenuOpen(false);
                }}
                disabled={unreadCount === 0}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-cream disabled:opacity-45"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  clearFeed();
                  setMenuOpen(false);
                }}
                disabled={feed.length === 0}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] font-medium text-danger transition-colors hover:bg-[#fbeceb] disabled:opacity-45"
              >
                <Trash2 size={14} /> Clear all
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* count and filter */}
      <div className="mb-4 flex items-center gap-3">
        <p className="text-[12.5px] text-ink-muted">
          {unreadCount > 0 ? (
            <>
              <span className="font-semibold text-ink">{unreadCount}</span> unread
            </>
          ) : (
            "You are all caught up"
          )}
        </p>
        <FilterMenu
          className="ml-auto"
          groups={[
            {
              label: "Show",
              value: filter,
              onChange: (value) => setFilter(value as typeof filter),
              options: [
                { value: "all", label: "All notifications", count: feed.length },
                { value: "unread", label: "Unread only", count: unreadCount },
              ],
            },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title={filter === "unread" ? "Nothing unread" : "No notifications yet"}
          description="Payments, refunds and settlement events appear here as they happen. You can also have them emailed to you from Settings."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {group.label}
              </p>
              <ul className="overflow-hidden rounded-[18px] border border-line bg-white shadow-sm">
                {group.items.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    onRead={() => markRead(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
        <BadgeCheck size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        <span>
          Want these by email? Choose a frequency in{" "}
          <Link
            to="/settings"
            className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
          >
            Settings · Payment notifications
          </Link>
          . Settlement confirmations are always sent.
        </span>
      </p>
    </div>
  );
}
