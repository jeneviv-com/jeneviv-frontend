import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Banknote,
  HandCoins,
  Plus,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCollectionStats, useTransactions } from "@/hooks/useApi";
import {
  formatCompact,
  formatMoney,
  formatNumber,
  initials,
  percent,
  statusTone,
  timeAgo,
  transactionPayer,
} from "@/lib/format";
import {
  AreaChart,
  Donut,
  type SeriesPoint,
} from "@/components/charts";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  Pill,
  ProgressBar,
  SegmentedControl,
  StatCard,
  StatusPill,
  TableSkeleton,
} from "@/components/ui";

type Range = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

export default function Dashboard() {
  const { user, merchant } = useAuth();
  const [range, setRange] = useState<Range>("30d");

  const collections = useCollectionStats();
  const transactions = useTransactions();

  const allTransactions = transactions.data ?? [];
  const stats = collections.data ?? [];

  const since = Date.now() - RANGE_DAYS[range] * 86_400_000;

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
    .filter((transaction) => transaction.settled_at)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const pendingCount = allTransactions.filter((t) => t.status === "pending").length;

  // Seven daily points with weekday labels keep the chart identical to the
  // laptop mockup; longer ranges fall back to weekly points.
  const buckets = useMemo<SeriesPoint[]>(() => {
    const points: SeriesPoint[] = [];
    const daily = RANGE_DAYS[range] === 7;
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
        .filter((transaction) => {
          const time = new Date(transaction.created_at).getTime();
          return (
            transaction.status === "success" && time >= start && time < end
          );
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      points.push({
        label: new Date(end).toLocaleDateString(
          "en-NG",
          daily
            ? { weekday: "short" }
            : { day: "numeric", month: "short" },
        ),
        value,
      });
    }
    return points;
  }, [allTransactions, range]);

  const productSplit = useMemo(() => {
    const map = new Map<string, number>();
    successful.forEach((transaction) => {
      const key = transaction.collection_name || "Other";
      map.set(key, (map.get(key) || 0) + transaction.amount);
    });
    const palette = ["#101010", "#5c5c5c", "#a6a6a6", "#ff4800", "#d4d4d4"];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, value], index) => ({
        label,
        value,
        color: palette[index % palette.length],
      }));
  }, [successful]);

  const uniquePayers = useMemo(() => {
    const set = new Set<string>();
    successful.forEach((transaction) => {
      set.add(
        `${transactionPayer(transaction)}|${transaction.collection_id ?? ""}`,
      );
    });
    return set.size;
  }, [successful]);

  const recent = allTransactions.slice(0, 7);
  const loading = collections.loading || transactions.loading;

  const payerTarget = stats.reduce(
    (sum, collection) =>
      sum + ((collection as { target_payers?: number }).target_payers ?? 0),
    0,
  );

  const recentPayers = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    allTransactions.forEach((transaction) => {
      if (transaction.status !== "success") return;
      const name = transactionPayer(transaction);
      if (!name || seen.has(name)) return;
      seen.add(name);
      names.push(name);
    });
    return names;
  }, [allTransactions]);

  return (
    <>
      <PageHeader
        eyebrow={`${merchant?.display_name ? merchant.display_name : "Workspace"} · ${new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}`}
        title={`Good to see you, ${(user?.name || "Coordinator").split(" ")[0]}`}
        description="Live view of what has been collected, who has paid, and what is still out there."
        actions={
          <>
            <Link to="/transactions" className="btn btn-secondary">
              <ReceiptText size={15} /> Transactions
            </Link>
            <Link to="/collections?new=1" className="btn btn-primary">
              <Plus size={15} /> New collection
            </Link>
          </>
        }
      />

      {merchant?.status === "pending" ? (
        <Card className="mb-5 border-line bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="amber">In review</Pill>
            <p className="text-[13px] text-ink-muted">
              Your workspace is awaiting approval. You can build collections
              now — they go live for payers as soon as we approve the account.
            </p>
            <Link
              to="/onboarding"
              className="ml-auto text-[12.5px] font-semibold text-ink underline decoration-line underline-offset-2 hover:text-brand-dark"
            >
              View application
            </Link>
          </div>
        </Card>
      ) : null}

      {/* The same dark prompt the laptop mockup shows. */}
      <div className="relative mb-5 overflow-hidden rounded-card bg-[#101010] px-5 py-4 text-white shadow-card">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-brand/25 blur-3xl"
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-bold tracking-tight">
              Start a collection today
            </p>
            <p className="mt-1 text-[12.5px] text-white/65">
              One link. Verified payments. No chasing receipts.
            </p>
          </div>
          <Link
            to="/collections?new=1"
            className="btn btn-sm self-start bg-white text-ink hover:bg-cream sm:self-auto"
          >
            <Plus size={14} /> New collection
          </Link>
        </div>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-3">
        <StatCard
          label={`Collected · ${range}`}
          value={formatMoney(collected)}
          hint={`${successful.length} successful payments`}
          icon={<HandCoins size={16} />}
          tone="brand"
        />
        <StatCard
          label="Payers"
          value={
            payerTarget
              ? `${formatNumber(uniquePayers)} / ${formatNumber(payerTarget)}`
              : formatNumber(uniquePayers)
          }
          hint={
            payerTarget
              ? `${percent(uniquePayers, payerTarget)}% of your target`
              : `Across ${stats.length} collections`
          }
          icon={<Users size={16} />}
        />
        <StatCard
          label="Settled to your bank"
          value={formatMoney(settled)}
          hint="Paid out by Paystack — never held by Jeneviv"
          icon={<Banknote size={16} />}
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader
            title="Collections over time"
            subtitle={
              range === "7d"
                ? "Successful payments for each day this week"
                : "Successful payments per week"
            }
            action={
              <SegmentedControl
                value={range}
                onChange={setRange}
                options={[
                  { value: "7d", label: "7 days" },
                  { value: "30d", label: "30 days" },
                  { value: "90d", label: "90 days" },
                ]}
              />
            }
          />
          {transactions.loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : transactions.error ? (
            <ErrorState message={transactions.error} onRetry={transactions.refetch} />
          ) : (
            <>
              <AreaChart data={buckets} />
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
                <div>
                  <p className="eyebrow">Total</p>
                  <p className="tabular mt-1 text-[16px] font-bold">
                    {formatMoney(collected)}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Average payment</p>
                  <p className="tabular mt-1 text-[16px] font-bold">
                    {formatMoney(
                      successful.length ? collected / successful.length : 0,
                    )}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Success rate</p>
                  <p className="tabular mt-1 text-[16px] font-bold">
                    {percent(successful.length, rangedTransactions.length)}%
                  </p>
                </div>
              </div>

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
                    : `${recentPayers.length} payers`}{" "}
                  in this range
                </p>
              </div>
            </>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Where the money came from"
              subtitle="Share of successful payments in range"
            />
            {productSplit.length ? (
              <Donut
                segments={productSplit}
                centerLabel="collected"
                centerValue={formatCompact(collected)}
              />
            ) : (
              <p className="muted py-6 text-center">
                No successful payments in this range yet.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Direct settlement"
              subtitle="Your money never sits with Jeneviv"
              icon={<ShieldCheck size={16} />}
            />
            <p className="muted">
              Every successful payment is split by Paystack at the moment it is
              captured. Your collection amount, minus Paystack&apos;s processing
              fee, reaches your verified bank account; the ₦75 platform fee goes
              to Jeneviv.
            </p>
            <ul className="mt-4 space-y-2.5 border-t border-line-soft pt-4">
              <li className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-ink-muted">Settled in this range</span>
                <span className="tabular font-semibold">
                  {formatMoney(settled)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-ink-muted">Awaiting confirmation</span>
                <span className="tabular font-semibold">
                  {formatNumber(pendingCount)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-ink-muted">Platform fee per payment</span>
                <span className="tabular font-semibold">₦75</span>
              </li>
            </ul>
            <Link to="/payouts" className="btn btn-secondary btn-sm mt-4 w-full">
              Manage bank account <ArrowUpRight size={14} />
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="section-title">Recent payments</h2>
              <p className="muted mt-0.5">The last seven movements across your collections</p>
            </div>
            <Link
              to="/transactions"
              className="text-[12.5px] font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </div>

          {transactions.loading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<ReceiptText size={20} />}
              title="No payments yet"
              description="Once someone pays into a collection link, their payment appears here within seconds of confirmation."
              action={
                <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Create a collection
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Collection</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <p className="font-semibold">{transactionPayer(transaction)}</p>
                        <p className="font-mono text-3xs text-ink-muted">
                          {transaction.reference}
                        </p>
                      </td>
                      <td className="text-ink-soft">
                        {transaction.collection_name || "—"}
                      </td>
                      <td className="tabular font-semibold">
                        {formatMoney(transaction.amount, transaction.currency)}
                      </td>
                      <td>
                        <StatusPill status={transaction.status} />
                      </td>
                      <td className="text-ink-muted">{timeAgo(transaction.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Collection progress"
            subtitle="Paid against target payers"
          />
          {collections.loading ? (
            <TableSkeleton rows={4} cols={2} />
          ) : stats.length === 0 ? (
            <p className="muted py-6 text-center">No collections yet.</p>
          ) : (
            <ul className="space-y-4">
              {stats.slice(0, 5).map((collection) => {
                const paid = collection.stats?.paid ?? 0;
                const target = (collection as { target_payers?: number })
                  .target_payers;
                const collectedSum = collection.stats?.collected ?? 0;
                return (
                  <li key={collection.id}>
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
                        value={target ? percent(paid, target) : Math.min(100, paid)}
                        tone={
                          collection.is_active ? "brand" : "ink"
                        }
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
          <Link to="/collections" className="btn btn-secondary btn-sm mt-5 w-full">
            All collections <ArrowUpRight size={14} />
          </Link>
        </Card>
      </div>

      {loading && !stats.length ? (
        <p className="muted mt-6 text-center">Loading your workspace…</p>
      ) : null}
    </>
  );
}
