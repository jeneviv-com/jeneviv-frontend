import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, ReceiptText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useCollectionStats,
  useTransactions,
  type CollectionWithStats,
} from "@/hooks/useApi";
import {
  formatCompact,
  formatMoney,
  formatNumber,
  initials,
  percent,
  statusLabel,
  statusTone,
  timeAgo,
  transactionPayer,
} from "@/lib/format";
import { AreaChart, type SeriesPoint } from "@/components/charts";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pill,
  ProgressBar,
  SegmentedControl,
  StatusPill,
  TableSkeleton,
} from "@/components/ui";

type Range = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

/** Optional target from the API. Typed here so the code says what it expects. */
type CollectionWithTarget = CollectionWithStats & { target_payers?: number };

/* ------------------------------------------------------------- animation */

/**
 * Keyframes are scoped to `dash-` class names so they can't clash with the
 * rest of the app. Everything is switched off for users who ask for reduced
 * motion.
 */
const DASH_CSS = `
@keyframes dash-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
.dash-rise {
  animation: dash-rise 520ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .dash-rise { animation: none; }
}
`;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Eases a number from its previous value to the new one. Used for the headline
 * figure so it counts up when data arrives or the range changes.
 */
function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

/**
 * Wraps any block so it rises in after a delay. The animation lives on this
 * wrapper, so Card and other components keep their own props unchanged.
 */
function Reveal({
  delay,
  className = "",
  children,
}: {
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`dash-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ stacked cards */

const TONES = {
  ink: "bg-[#101010] text-white",
  lavender: "bg-[#dcd5f3] text-ink",
  peach: "bg-[#f9d3b0] text-ink",
  mint: "bg-[#d5e8c4] text-ink",
  aqua: "bg-[#d3e9ee] text-ink",
} as const;

type Tone = keyof typeof TONES;

/**
 * A full-width coloured card that tucks under the one above, like the LemFi
 * reference. It is a link, so it works with the keyboard and has a focus ring.
 * Each card rises in with a short delay so the stack builds from the top.
 */
function StackedCard({
  index,
  tone,
  title,
  subtitle,
  value,
  to,
}: {
  index: number;
  tone: Tone;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  to: string;
}) {
  return (
    <div
      className="dash-rise relative -mt-6 first:mt-0"
      style={{ zIndex: index + 1, animationDelay: `${120 + index * 90}ms` }}
    >
      <Link
        to={to}
        className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 lg:min-h-[92px] lg:px-6 lg:py-5 ${TONES[tone]}`}
      >
        <div className="min-w-0">
          <p className="text-[16px] font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 truncate text-[12.5px] opacity-70">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right text-[20px] font-bold tabular">
          {value}
        </div>
      </Link>
    </div>
  );
}

const valueSkeleton = (
  <span aria-hidden="true" className="skeleton inline-block h-5 w-16 rounded-md" />
);

/* ---------------------------------------------------------------- dashboard */

export default function Dashboard() {
  const { user, merchant } = useAuth();
  const [range, setRange] = useState<Range>("30d");

  const collections = useCollectionStats();
  const transactions = useTransactions();

  const allTransactions = transactions.data ?? [];
  const stats = (collections.data ?? []) as CollectionWithTarget[];

  const since = Date.now() - RANGE_DAYS[range] * 86_400_000;

  // Totals are summed from the transactions the page loaded. For large
  // merchants this should move to a server-side summary endpoint.
  const rangedTransactions = useMemo(
    () =>
      allTransactions.filter(
        (transaction) => new Date(transaction.created_at).getTime() >= since,
      ),
    [allTransactions, since],
  );

  const successful = rangedTransactions.filter((t) => t.status === "success");
  const collected = successful.reduce((sum, t) => sum + t.amount, 0);
  const settled = successful
    .filter((t) => t.settled_at)
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = allTransactions.filter((t) => t.status === "pending").length;

  // Payers are keyed by email when the API has it, otherwise by name. Two
  // people with the same name and no email will count as one.
  const uniquePayers = useMemo(() => {
    const set = new Set<string>();
    successful.forEach((t) => set.add(t.payer_email || transactionPayer(t)));
    return set.size;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successful]);

  const payerTarget = stats.reduce((sum, c) => sum + (c.target_payers ?? 0), 0);

  const recentPayers = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    allTransactions.forEach((t) => {
      if (t.status !== "success") return;
      const name = transactionPayer(t);
      if (!name || seen.has(name)) return;
      seen.add(name);
      names.push(name);
    });
    return names;
  }, [allTransactions]);

  // Chart buckets follow the selected range.
  const buckets = useMemo<SeriesPoint[]>(() => {
    const points: SeriesPoint[] = [];
    const daily = range === "7d";
    const steps = daily ? 7 : range === "30d" ? 15 : 13;
    const stepMs = daily
      ? 86_400_000
      : range === "30d"
        ? 2 * 86_400_000
        : 7 * 86_400_000;
    for (let index = steps - 1; index >= 0; index -= 1) {
      const end = Date.now() - index * stepMs;
      const start = end - stepMs;
      const value = allTransactions
        .filter((t) => {
          const time = new Date(t.created_at).getTime();
          return t.status === "success" && time >= start && time < end;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      points.push({
        label: new Date(end).toLocaleDateString(
          "en-NG",
          daily ? { weekday: "short" } : { day: "numeric", month: "short" },
        ),
        value,
      });
    }
    return points;
  }, [allTransactions, range]);

  const recent = allTransactions.slice(0, 6);
  const firstName = (user?.name || "there").split(" ")[0];
  const loading = collections.loading || transactions.loading;

  const animatedCollected = useCountUp(collected);

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <style>{DASH_CSS}</style>

      {/* greeting */}
      <header className="dash-rise flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0">
          <p className="eyebrow truncate">
            {merchant?.display_name || "Workspace"} ·{" "}
            {new Date().toLocaleDateString("en-NG", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 text-[22px] font-bold tracking-tight lg:text-[28px]">
            Good to see you, {firstName}
          </h1>
        </div>
        <Link
          to="/collections?new=1"
          aria-label="New collection"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink bg-white transition-transform duration-200 hover:rotate-90 active:scale-95"
        >
          <Plus size={17} aria-hidden="true" />
        </Link>
      </header>

      {merchant?.status === "pending" ? (
        <Reveal delay={60} className="mt-4">
          <Card className="border-line bg-white">
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone="amber">In review</Pill>
              <p className="text-[13px] text-ink-muted">
                You can build collections now. They go live for payers once we
                approve the account.
              </p>
            </div>
          </Card>
        </Reveal>
      ) : null}

      {/* Main content grid - single column on mobile, two columns on laptop */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        {/* Left column - main metrics and charts */}
        <div className="space-y-5">
          {/* dark headline card */}
          <Reveal delay={40}>
            <section
              aria-label="Headline"
              className="rounded-[20px] bg-[#101010] px-5 py-5 text-white shadow-card lg:px-6 lg:py-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold tracking-tight lg:text-[18px]">Collected</p>
                  <p className="mt-0.5 text-[12.5px] text-white/65 lg:text-[13px]">
                    {successful.length} successful payment
                    {successful.length === 1 ? "" : "s"} in this range
                  </p>
                </div>
                <p className="text-right text-[24px] font-bold tabular lg:text-[32px]">
                  {loading ? valueSkeleton : formatMoney(Math.round(animatedCollected))}
                </p>
              </div>
            </section>
          </Reveal>

          {/* Grid of metric cards - stacked on mobile, 2x2 grid on laptop.
              The gap and the tuck both live on `lg:` so that on a phone all
              four cards sit in one continuous stack, like the other pages. */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-4">
            {/* stacked colour cards */}
            <div className="lg:mt-0">
              <StackedCard
                index={0}
                tone="lavender"
                title="Payers"
                subtitle={
                  payerTarget
                    ? `${percent(uniquePayers, payerTarget)}% of your target`
                    : `Across ${formatNumber(stats.length)} collection${stats.length === 1 ? "" : "s"}`
                }
                value={
                  loading
                    ? valueSkeleton
                    : payerTarget
                      ? `${formatNumber(uniquePayers)} / ${formatNumber(payerTarget)}`
                      : formatNumber(uniquePayers)
                }
                to="/transactions"
              />
              <StackedCard
                index={1}
                tone="mint"
                title="Settled"
                subtitle="Paid straight to your bank"
                value={loading ? valueSkeleton : formatMoney(settled)}
                to="/transactions"
              />
            </div>
            <div className="-mt-6 lg:mt-0">
              <StackedCard
                index={2}
                tone="peach"
                title="Payments"
                subtitle={`${formatNumber(pendingCount)} awaiting confirmation`}
                value={loading ? valueSkeleton : formatNumber(successful.length)}
                to="/transactions"
              />
              <StackedCard
                index={3}
                tone="aqua"
                title="Workspace"
                subtitle={merchant?.display_name || user?.name || "Your workspace"}
                value={merchant ? statusLabel(merchant.status) : "—"}
                to="/settings"
              />
            </div>
          </div>

          <Reveal delay={520} className="lg:hidden">
            <Link
              to="/collections?new=1"
              className="btn btn-primary flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 transition-transform duration-150 active:scale-[0.985]"
            >
              <Plus size={15} aria-hidden="true" /> New collection
            </Link>
          </Reveal>

          {/* chart */}
          <Reveal delay={600}>
            <Card>
              <CardHeader
                title="Collections over time"
                subtitle={
                  range === "7d"
                    ? "Successful payments per day"
                    : "Successful payments per period"
                }
                action={
                  <SegmentedControl
                    value={range}
                    onChange={setRange}
                    options={[
                      { value: "7d", label: "7d" },
                      { value: "30d", label: "30d" },
                      { value: "90d", label: "90d" },
                    ]}
                  />
                }
              />
              {transactions.loading ? (
                <TableSkeleton rows={3} cols={2} />
              ) : transactions.error ? (
                <ErrorState message={transactions.error} onRetry={transactions.refetch} />
              ) : (
                <>
                  <AreaChart data={buckets} />
                  <div className="mt-4 flex items-center gap-2.5 border-t border-line-soft pt-4">
                    <div className="flex -space-x-1.5">
                      {recentPayers.slice(0, 5).map((name) => (
                        <span
                          key={name}
                          title={name}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand-peach text-3xs font-bold text-[#79300f]"
                        >
                          {initials(name)}
                        </span>
                      ))}
                    </div>
                    <p className="text-[12px] text-ink-muted">
                      {recentPayers.length > 5
                        ? `+${recentPayers.length - 5} more payers`
                        : `${recentPayers.length} payers`}
                    </p>
                  </div>
                </>
              )}
            </Card>
          </Reveal>

          {/* settlement note - moved below chart on laptop */}
          <Reveal delay={680} className="hidden lg:block">
            <Card>
              <CardHeader
                title="Direct settlement"
                subtitle="Your money never sits with Jeneviv"
                icon={<ShieldCheck size={16} />}
              />
              <p className="muted">
                Each successful payment is split by Paystack when it is captured. The
                collection amount, less Paystack&apos;s processing fee, goes to your
                verified bank account. Jeneviv&apos;s platform fee is taken in the same
                split.
              </p>
              <Link to="/payouts" className="btn btn-secondary btn-sm mt-4 w-full">
                Manage bank account <ArrowUpRight size={14} />
              </Link>
            </Card>
          </Reveal>
        </div>

        {/* Right column - sidebar with quick actions and lists */}
        <div className="space-y-5">
          {/* Quick action button - only on laptop */}
          <Reveal delay={520} className="hidden lg:block">
            <Link
              to="/collections?new=1"
              className="btn btn-primary flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 transition-transform duration-150 active:scale-[0.985]"
            >
              <Plus size={15} aria-hidden="true" /> New collection
            </Link>
          </Reveal>

          {/* recent payments */}
          <section aria-labelledby="recent-payments">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="recent-payments" className="section-title">
                Recent payments
              </h2>
              <Link
                to="/transactions"
                className="text-[12.5px] font-semibold text-brand hover:underline"
              >
                View all
              </Link>
            </div>

            <Card padded={false} className="mt-3">
              {transactions.loading ? (
                <TableSkeleton rows={4} cols={2} />
              ) : transactions.error ? (
                <ErrorState message={transactions.error} onRetry={transactions.refetch} />
              ) : recent.length === 0 ? (
                <EmptyState
                  icon={<ReceiptText size={20} />}
                  title="No payments yet"
                  description="Payments into your collection links appear here within seconds of confirmation."
                  action={
                    <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                      <Plus size={14} aria-hidden="true" /> Create a collection
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-line-soft">
                  {recent.map((t, index) => (
                    <li
                      key={t.id}
                      className="dash-rise flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-cream/60 lg:px-5"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold">
                          {transactionPayer(t)}
                        </p>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                          {t.collection_name || "—"} · {timeAgo(t.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular text-[13.5px] font-bold">
                          {formatMoney(t.amount, t.currency)}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <StatusPill status={t.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          {/* collection progress */}
          <section aria-labelledby="collection-progress">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="collection-progress" className="section-title">
                Collections
              </h2>
              <Link
                to="/collections"
                className="text-[12.5px] font-semibold text-brand hover:underline"
              >
                All
              </Link>
            </div>

            <Card className="mt-3">
              {collections.loading ? (
                <TableSkeleton rows={3} cols={2} />
              ) : collections.error ? (
                <ErrorState message={collections.error} onRetry={collections.refetch} />
              ) : stats.length === 0 ? (
                <p className="muted py-6 text-center">No collections yet.</p>
              ) : (
                <ul className="space-y-4">
                  {stats.slice(0, 5).map((collection, index) => {
                    const paid = collection.stats?.paid ?? 0;
                    const target = collection.target_payers;
                    const collectedSum = collection.stats?.collected ?? 0;
                    const progress = target ? percent(paid, target) : Math.min(100, paid);
                    return (
                      <li
                        key={collection.id}
                        className="dash-rise"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            to={`/collections/${collection.id}`}
                            className="truncate text-[13.5px] font-semibold hover:text-brand"
                          >
                            {collection.name}
                          </Link>
                          <span className="tabular text-[12.5px] font-semibold">
                            {formatCompact(collectedSum, collection.currency)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <ProgressBar
                            value={progress}
                            tone={collection.is_active ? "brand" : "ink"}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="font-mono text-3xs text-ink-muted">
                            {paid}
                            {target ? ` / ${target}` : ""} payers
                          </p>
                          <Pill tone={statusTone(collection.is_active ? "active" : "paused")}>
                            {collection.is_active ? "Accepting" : "Paused"}
                          </Pill>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>

          {/* settlement note - shown on mobile below collections */}
          <Reveal delay={680} className="lg:hidden">
            <Card>
              <CardHeader
                title="Direct settlement"
                subtitle="Your money never sits with Jeneviv"
                icon={<ShieldCheck size={16} />}
              />
              <p className="muted">
                Each successful payment is split by Paystack when it is captured. The
                collection amount, less Paystack&apos;s processing fee, goes to your
                verified bank account. Jeneviv&apos;s platform fee is taken in the same
                split.
              </p>
              <Link to="/payouts" className="btn btn-secondary btn-sm mt-4 w-full">
                Manage bank account <ArrowUpRight size={14} />
              </Link>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}