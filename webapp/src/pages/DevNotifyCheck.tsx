import { useEffect, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { Button, Card } from "@/components/ui";

/**
 * `/dev/notify-check` — a local harness for the notification contract.
 *
 * The notification centre only receives items through `notify()`; `success`,
 * `info` and `error` are toast-only. Both halves of that are asserted here by
 * calling the real provider and reading the feed back, so the behaviour can be
 * checked without an admin refund or a workspace decision to trigger.
 *
 * Registered only when the app is built for development, so it does not exist
 * in a production bundle.
 */

interface Line {
  label: string;
  ok: boolean;
  detail: string;
}

const NOTIFY_SUCCESS = "check:refund-started";
const NOTIFY_ERROR = "check:refund-failed";
const TOAST_ONLY = "check:toast-only";
const TOAST_INFO = "check:toast-info";

export default function DevNotifyCheck() {
  const { notify, success, info, feed, unreadCount, markAllRead } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;

    const byTitle = new Map(feed.map((item) => [item.title, item]));
    const unread = (title: string) => byTitle.get(title)?.read === false;

    setLines([
      {
        label: "notify(…, \"success\") lands in the feed",
        ok: byTitle.has(NOTIFY_SUCCESS) && unread(NOTIFY_SUCCESS),
        detail: byTitle.has(NOTIFY_SUCCESS)
          ? `tone=${byTitle.get(NOTIFY_SUCCESS)!.tone}, unread=${unread(NOTIFY_SUCCESS)}`
          : "missing",
      },
      {
        label: "notify(…, \"error\") lands in the feed",
        ok: byTitle.has(NOTIFY_ERROR) && unread(NOTIFY_ERROR),
        detail: byTitle.has(NOTIFY_ERROR)
          ? `tone=${byTitle.get(NOTIFY_ERROR)!.tone}, unread=${unread(NOTIFY_ERROR)}`
          : "missing",
      },
      {
        label: "success() stays toast-only",
        ok: !byTitle.has(TOAST_ONLY),
        detail: byTitle.has(TOAST_ONLY) ? "found in feed (wrong)" : "not in feed",
      },
      {
        label: "info() stays toast-only",
        ok: !byTitle.has(TOAST_INFO),
        detail: byTitle.has(TOAST_INFO) ? "found in feed (wrong)" : "not in feed",
      },
      {
        label: "unread count includes the new items",
        ok: unreadCount >= 2,
        detail: `unread=${unreadCount}`,
      },
    ]);
  }, [feed, unreadCount]);

  const run = () => {
    setRunning(true);
    setLines([]);
    pending.current = true;

    // The two that must be remembered.
    notify(NOTIFY_SUCCESS, "The reversal is queued with the gateway.", "success");
    notify(NOTIFY_ERROR, "The reversal did not go through.", "error");
    // The two that must not be.
    success(TOAST_ONLY, "This is a toast, not a notification.");
    info(TOAST_INFO, "This is a toast, not a notification.");

    window.setTimeout(() => setRunning(false), 500);
  };

  const passed = lines.length > 0 && lines.every((line) => line.ok);

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-10">
      <p className="eyebrow">Development check</p>
      <h1 className="mt-2 text-[24px] font-bold tracking-[-0.03em]">
        Notification centre contract
      </h1>
      <p className="muted mt-2">
        Calls the real toast context: <code className="font-mono text-[12px]">notify()</code>{" "}
        must write to the feed, <code className="font-mono text-[12px]">success()</code> and{" "}
        <code className="font-mono text-[12px]">info()</code> must not.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={run} loading={running}>
          Run the check
        </Button>
        <Button variant="secondary" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>

      {lines.length > 0 ? (
        <Card className="mt-6 overflow-hidden" padded={false}>
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <p className="text-[13px] font-semibold">
              {passed ? "All checks passed" : "Some checks failed"}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                passed ? "bg-[#eaf5ef] text-success" : "bg-[#fbeceb] text-danger"
              }`}
            >
              {lines.filter((line) => line.ok).length}/{lines.length}
            </span>
          </div>
          <ul className="divide-y divide-line-soft">
            {lines.map((line) => (
              <li key={line.label} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    line.ok ? "bg-[#eaf5ef] text-success" : "bg-[#fbeceb] text-danger"
                  }`}
                  aria-hidden="true"
                >
                  {line.ok ? "✓" : "×"}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{line.label}</p>
                  <p className="mt-0.5 font-mono text-[11.5px] text-ink-muted">{line.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="mt-6 text-[12px] text-ink-muted">
        Feed size: {feed.length} · unread: {unreadCount} · items the feed received:{" "}
        {feed.filter((item) => item.title.startsWith("check:")).length}
      </p>
    </div>
  );
}
