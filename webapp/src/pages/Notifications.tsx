import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Inbox, ReceiptText, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateTime, timeAgo } from "@/lib/format";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Pill,
  SegmentedControl,
  StatCard,
} from "@/components/ui";
import type { Tone } from "@/lib/format";

const TONE_STYLES: Record<string, { tone: Tone; label: string }> = {
  success: { tone: "green", label: "Payment" },
  error: { tone: "red", label: "Issue" },
  warning: { tone: "amber", label: "Attention" },
  info: { tone: "blue", label: "Update" },
};

export default function Notifications() {
  const { feed, unreadCount, markAllRead, markRead, clearFeed } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const rows = useMemo(
    () => (filter === "unread" ? feed.filter((item) => !item.read) : feed),
    [feed, filter],
  );

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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Unread"
          value={String(unreadCount)}
          hint="Since you last opened this page"
          tone={unreadCount ? "brand" : "neutral"}
          icon={<Bell size={16} />}
        />
        <StatCard label="Total in feed" value={String(feed.length)} hint="Kept on this device" />
        <StatCard
          label="Delivery"
          value="Instant"
          hint="Payment events arrive as soon as the gateway confirms them"
          icon={<ReceiptText size={16} />}
        />
      </div>

      <Card className="mt-5" padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3">
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
          <ul className="divide-y divide-line-soft">
            {rows.map((item) => {
              const tone = TONE_STYLES[item.tone] ?? TONE_STYLES.info;
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-4 px-5 py-4 ${
                    item.read ? "" : "bg-cream/60"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.read ? "bg-line" : "bg-brand"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold">{item.title}</p>
                      <Pill tone={tone.tone}>{tone.label}</Pill>
                    </div>
                    {item.body ? <p className="muted mt-1">{item.body}</p> : null}
                    <p className="mt-1 font-mono text-3xs text-ink-muted">
                      <span title={formatDateTime(item.createdAt)}>
                        {timeAgo(item.createdAt)}
                      </span>
                    </p>
                  </div>
                  {!item.read ? (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="text-[12px] font-semibold text-brand hover:underline"
                    >
                      Mark read
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="Prefer email?"
          subtitle="Choose how often Jeneviv emails you about transactions"
        />
        <p className="muted">
          Open{" "}
          <Link to="/settings" className="font-semibold text-brand hover:underline">
            Settings · Payment notifications
          </Link>{" "}
          to switch between immediate, hourly, 6-hourly, 12-hourly or daily
          summaries. Settlement confirmations are always sent.
        </p>
      </Card>
    </>
  );
}
