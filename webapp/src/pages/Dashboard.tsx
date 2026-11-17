import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Plus,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
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
import { AreaChart, Sparkline, type SeriesPoint } from "@/components/charts";
import { useGateway } from "@/lib/gateway";
import {
  Card,
  SimpleCard,
  CardHeader,
  EmptyState,
  ErrorState,
  Pill,
  ProgressBar,
  StatusPill,
  TableSkeleton,
  FilterMenu,
} from "@/components/ui";
import { JENEVIV_LOGO } from "@/lib/brand";

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

const valueSkeleton = (
  <span aria-hidden="true" className="skeleton inline-block h-5 w-16 rounded-md" />
);

/* ------------------------------------------------------------------ cards */

/**
 * The headline: one dark card, one big number. The Jeneviv mark sits in the
 * corner as a watermark, the only place the orange is allowed to be large.
 */
function HeadlineCard({
  value,
  loading,
  count,
  delta,
  rangeLabel,
  series,
}: {
  value: string;
  loading: boolean;
  count: number;
  delta: number | null;
  rangeLabel: string;
  series: number[];
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <section
      aria-label="Collected"
      className="relative isolate overflow-hidden rounded-[24px] bg-ink px-5 pb-5 pt-5 text-white lg:px-7 lg:pb-6 lg:pt-6"
    >
      <img
        src={JENEVIV_LOGO}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 -z-10 h-48 w-48 rotate-6 opacity-[0.16] lg:h-60 lg:w-60"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/55">
          Collected · {rangeLabel}
        </p>
        {delta !== null && !loading ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
              up ? "bg-white/10 text-white" : "bg-brand/20 text-brand-peach"
            }`}
            title="Compared with the previous period of the same length"
          >
            {up ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownRight size={12} aria-hidden="true" />}
            {delta >= 200
              ? `${(delta / 100 + 1).toFixed(0)}×`
              : `${Math.abs(delta).toFixed(delta !== 0 && Math.abs(delta) < 10 ? 1 : 0)}%`}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular text-[34px] font-extrabold leading-none tracking-[-0.04em] lg:text-[44px]">
            {loading ? <span aria-hidden="true" className="skeleton inline-block h-9 w-40 rounded-lg opacity-30" /> : value}
          </p>
          <p className="mt-2.5 text-[12.5px] text-white/60">
            {count} successful payment{count === 1 ? "" : "s"}
          </p>
        </div>
        {series.some((point) => point > 0) ? (
          <div className="hidden shrink-0 sm:block">
            <Sparkline values={series} width={132} height={40} tone="#ff4800" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * A metric card: label and icon on top, the figure, a line of context, then a
 * footer that shows *why* the number matters (a target, a rate, a balance).
 */
function StatCard({
  label,
  icon,
  value,
  context,
  footer,
  href,
  loading,
  accent = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  context: string;
  footer?: React.ReactNode;
  href: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group relative flex h-full flex-col rounded-[20px] border border-line bg-white p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink lg:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full ${
              accent ? "bg-brand text-white" : "bg-cream text-ink"
            }`}
          >
            {icon}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
        </span>
        <ArrowUpRight
          size={15}
          aria-hidden="true"
          className="text-ink-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
        />
      </div>
      <p className="tabular mt-4 text-[26px] font-extrabold leading-none tracking-[-0.035em] lg:text-[28px]">
        {loading ? valueSkeleton : value}
      </p>
      <p className="mt-1.5 truncate text-[12px] text-ink-muted">{context}</p>
      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </Link>
  );
}

/** A thin labelled meter for card footers. */
function Meter({ value, label, tone = "ink" }: { value: number; label: string; tone?: "ink" | "brand" }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-cream-deep">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone === "brand" ? "bg-brand" : "bg-ink"}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">{label}</p>
    </div>
  );
}

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
  const pendingCount = allTransactions.filter((t) => t.status === "pending").length;
  const gateway = useGateway();

  // The same-length window before this one, for the headline's change figure.
  const rangeMs = RANGE_DAYS[range] * 86_400_000;
  const previousCollected = allTransactions
    .filter((t) => {
      const time = new Date(t.created_at).getTime();
      return t.status === "success" && time >= since - rangeMs && time < since;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  const delta = previousCollected > 0 ? ((collected - previousCollected) / previousCollected) * 100 : null;

  // Settled attempts only: a payment still pending has not succeeded or failed yet.
  const decided = rangedTransactions.filter((t) => t.status !== "pending").length;
  const successRate = decided ? Math.round((successful.length / decided) * 100) : 0;
  const walletBalance = Number(merchant?.wallet_balance_ngn ?? 0);

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
          {merchant ? (
            <Link
              to="/settings"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-soft transition-colors hover:border-ink/20"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${merchant.status === "approved" ? "bg-success" : "bg-brand"}`}
                aria-hidden="true"
              />
              {statusLabel(merchant.status)} · {gateway.label}
            </Link>
          ) : null}
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
          {/* headline */}
          <Reveal delay={40}>
            <HeadlineCard
              value={formatMoney(Math.round(animatedCollected))}
              loading={loading}
              count={successful.length}
              delta={delta}
              rangeLabel={range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}
              series={buckets.map((point) => point.value)}
            />
          </Reveal>

          {/* three metric cards; one column on phones, three across from tablet up */}
          <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
            <Reveal delay={120} className="h-full">
              <StatCard
                label="Payers"
                icon={<Users size={14} aria-hidden="true" />}
                href="/payers"
                loading={loading}
                value={
                  payerTarget
                    ? `${formatNumber(uniquePayers)} / ${formatNumber(payerTarget)}`
                    : formatNumber(uniquePayers)
                }
                context={`Across ${formatNumber(stats.length)} collection${stats.length === 1 ? "" : "s"}`}
                footer={
                  payerTarget ? (
                    <Meter value={percent(uniquePayers, payerTarget)} label={`${percent(uniquePayers, payerTarget)}% of target`} tone="brand" />
                  ) : (
                    <Meter value={uniquePayers ? 100 : 0} label="No target set" />
                  )
                }
              />
            </Reveal>
            <Reveal delay={200} className="h-full">
              <StatCard
                label="Payments"
                icon={<ReceiptText size={14} aria-hidden="true" />}
                href="/transactions"
                loading={loading}
                value={formatNumber(successful.length)}
                context={`${formatNumber(pendingCount)} awaiting confirmation`}
                footer={<Meter value={successRate} label={`${successRate}% success rate`} />}
              />
            </Reveal>
            <Reveal delay={280} className="h-full">
              {gateway.settles_direct ? (
                <StatCard
                  label="To your bank"
                  icon={<Banknote size={14} aria-hidden="true" />}
                  href="/payouts"
                  loading={loading}
                  accent
                  value={formatMoney(collected)}
                  context={`Split by ${gateway.label} as it lands`}
                  footer={
                    <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-success">
                      <ShieldCheck size={13} aria-hidden="true" /> Settled directly
                    </p>
                  }
                />
              ) : (
                <StatCard
                  label="Wallet"
                  icon={<Wallet size={14} aria-hidden="true" />}
                  href="/payouts"
                  loading={loading}
                  accent
                  value={formatMoney(walletBalance)}
                  context={`Confirmed by ${gateway.label}, awaiting payout`}
                  footer={
                    <p className="text-[11.5px] font-semibold text-ink-soft">
                      {merchant?.settings?.payout_mode === "auto_daily"
                        ? "Paid out daily"
                        : merchant?.settings?.payout_mode === "auto_weekly"
                          ? "Paid out weekly"
                          : "Paid out when you request it"}
                    </p>
                  }
                />
              )}
            </Reveal>
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
                  <FilterMenu
                    label={range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}
                    groups={[
                      {
                        label: "Range",
                        value: range,
                        onChange: (value) => setRange(value as typeof range),
                        options: [
                          { value: "7d", label: "Last 7 days" },
                          { value: "30d", label: "Last 30 days" },
                          { value: "90d", label: "Last 90 days" },
                        ],
                      },
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
            <Card className="min-h-[180px]">
              <CardHeader
                title={gateway.settlementTitle}
                subtitle={gateway.settlementSubtitle}
                icon={<ShieldCheck size={16} />}
              />
              <p className="muted">
                {gateway.settlementBody}
              </p>
              <Link to="/payouts" className="btn btn-secondary btn-sm mt-4 w-full">
                Manage bank account <ArrowUpRight size={14} />
              </Link>
            </Card>
          </Reveal>
        </div>

        {/* Right column - full width blocks on mobile, cards on desktop */}
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

          {/* recent payments - no card wrapper on mobile */}
          <Reveal delay={640}>
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

              <Card className="mt-3" padded={false}>
                {transactions.loading ? (
                  <div className="p-5">
                    <TableSkeleton rows={4} cols={2} />
                  </div>
                ) : transactions.error ? (
                  <div className="p-5">
                    <ErrorState message={transactions.error} onRetry={transactions.refetch} />
                  </div>
                ) : recent.length === 0 ? (
                  <div className="p-5">
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
                  </div>
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
          </Reveal>

          {/* collection progress - no card wrapper on mobile */}
          <Reveal delay={720}>
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

              <Card className="mt-3" padded={true}>
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
          </Reveal>

          {/* settlement note - shown on mobile below collections */}
          <Reveal delay={800} className="lg:hidden">
            <SimpleCard padding="lg" bg="white">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-cream">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold tracking-tight">{gateway.settlementTitle}</h3>
                  <p className="text-[12px] text-ink-muted">{gateway.settlementSubtitle}</p>
                </div>
              </div>
              <p className="muted">
                {gateway.settlementBody}
              </p>
              <Link to="/payouts" className="btn btn-secondary btn-sm mt-4 w-full">
                Manage bank account <ArrowUpRight size={14} />
              </Link>
            </SimpleCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}