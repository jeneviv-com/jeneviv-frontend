import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Inbox, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateTime, timeAgo } from "@/lib/format";
import {
  Button,
  EmptyState,
  PageHeader,
  SegmentedControl,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

type FeedTone = "success" | "error" | "warning" | "info";

/** Feed tones mapped onto the shared meaning palette. */
const TONE_KIND: Record<FeedTone, { kind: ToneKind; label: string }> = {
  success: { kind: "money", label: "Payment" },
  error: { kind: "attention", label: "Issue" },
  warning: { kind: "attention", label: "Attention" },
  info: { kind: "neutral", label: "Update" },
};

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function Notifications() {
  const { feed, unreadCount, markAllRead, markRead, clearFeed } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const rows = useMemo(
    () => (filter === "unread" ? feed.filter((item) => !item.read) : feed),
    [feed, filter],
  );

  // Split the feed into "Today" and "Earlier" so the timeline has rhythm.
  const groups = useMemo(() => {
    const today = rows.filter((item) => isToday(item.createdAt));
    const earlier = rows.filter((item) => !isToday(item.createdAt));
    return [
      { label: "Today", items: today },
      { label: "Earlier", items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [rows]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Payment confirmations, settlement updates and account activity from this session."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<CheckCheck size={14} />}
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              icon={<Trash2 size={14} />}
              onClick={clearFeed}
              disabled={feed.length === 0}
            >
              Clear
            </Button>
          </>
        }
      />

      {/* typographic summary, no boxes */}
      <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-5 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            Unread
          </p>
          <p className="tabular mt-1 text-[44px] font-extrabold leading-none tracking-tight">
            {unreadCount}
          </p>
          <p className="mt-1.5 text-[12px] text-ink-muted">Since you last opened this page</p>
        </div>
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            In feed
          </p>
          <p className="tabular mt-1 text-[28px] font-bold leading-none tracking-tight">
            {feed.length}
          </p>
          <p className="mt-1.5 text-[12px] text-ink-muted">Kept on this device</p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-[#c8f58e] px-3.5 py-2 text-[12px] font-semibold text-ink">
          <span className="h-2 w-2 rounded-full bg-ink" />
          Live · payments arrive as the gateway confirms them
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: feed.length },
            { value: "unread", label: "Unread", count: unreadCount },
          ]}
        />
        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          most recent first
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title={filter === "unread" ? "Nothing unread" : "No notifications yet"}
          description="Payments, refunds and settlement events appear here as they happen. You can also have them emailed to you from Settings."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                {group.label}
              </p>

              <ol className="relative">
                {/* the timeline spine */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-3 left-[7px] top-3 w-px bg-line"
                />
                {group.items.map((item) => {
                  const tone = TONE_KIND[item.tone as FeedTone] ?? TONE_KIND.info;
                  return (
                    <li
                      key={item.id}
                      className="dash-rise relative flex gap-4 pb-6 last:pb-0"
                    >
                      {/* marker, coloured by meaning */}
                      <span
                        className={`relative z-10 mt-1 grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border border-ink ${
                          item.read ? "bg-white" : TONE_MEANING[tone.kind]
                        }`}
                      >
                        {!item.read ? <span className="h-1.5 w-1.5 rounded-full bg-ink" /> : null}
                      </span>

                      <button
                        type="button"
                        onClick={() => !item.read && markRead(item.id)}
                        className="group min-w-0 flex-1 rounded-[12px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${TONE_MEANING[tone.kind]}`}
                          >
                            {tone.label}
                          </span>
                          <span
                            className="font-mono text-[11px] text-ink-muted"
                            title={formatDateTime(item.createdAt)}
                          >
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`mt-1.5 text-[15px] tracking-tight ${
                            item.read ? "font-medium text-ink-soft" : "font-bold text-ink"
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.body ? (
                          <p className="muted mt-1">{item.body}</p>
                        ) : null}
                        {!item.read ? (
                          <p className="mt-2 text-[12px] font-semibold text-ink-muted group-hover:text-ink">
                            Tap to mark as read
                          </p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 border-t border-line pt-5 text-[13px] text-ink-muted">
        Want these by email? Open{" "}
        <Link to="/settings" className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand">
          Settings · Payment notifications
        </Link>{" "}
        to choose immediate, hourly, 6-hourly, 12-hourly or daily summaries.
        Settlement confirmations are always sent.
      </p>
    </>
  );
}
