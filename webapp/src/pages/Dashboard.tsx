import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Banknote,
  CalendarClock,
  HandCoins,
  Plus,
  ReceiptText,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useCollectionStats,
  usePayouts,
  useTransactions,
} from "@/hooks/useApi";
import { computeBalances } from "@/lib/demo";
import {
  formatCompact,
  formatDate,
  formatMoney,
  formatNumber,
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
  Button,
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
  const payouts = usePayouts();

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
  const pendingCount = allTransactions.filter((t) => t.status === "pending").length;

  const buckets = useMemo<SeriesPoint[]>(() => {
    const points: SeriesPoint[] = [];
    const weeks = 8;
    for (let index = weeks - 1; index >= 0; index -= 1) {
      const end = Date.now() - index * 7 * 86_400_000;
      const start = end - 7 * 86_400_000;
      const value = allTransactions
        .filter((transaction) => {
          const time = new Date(transaction.created_at).getTime();
          return (
            transaction.status === "success" && time >= start && time < end
          );
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      points.push({
        label: new Date(end).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
        }),
        value,
      });
    }
    return points;
  }, [allTransactions]);

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

  const balances = useMemo(() => {
    if (!allTransactions.length && !(payouts.data ?? []).length) return null;
    return computeBalances({
      transactions: allTransactions,
      payouts: payouts.data ?? [],
      refunds: [],
    });
  }, [allTransactions, payouts.data]);

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

  const activePayout =
    (payouts.data ?? []).find((p) => p.status === "pending") ||
    (payouts.data ?? []).find((p) => p.status === "processing");

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

      <div className="md:hidden">
        <div className="stacked-cards">
          <div className="stacked-card stacked-card-black">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-bold">Collected</p>
                <p className="text-[12px] text-white/70">{range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-[20px] font-extrabold leading-tight">{formatMoney(collected)}</p>
                <p className="text-[11.5px] text-white/70">{successful.length} successful</p>
              </div>
            </div>
          </div>
          <div className="stacked-card stacked-card-purple">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] font-bold">Credit</p>
              <div className="text-right">
                <p className="tabular text-[20px] font-extrabold leading-tight">{formatMoney(balances?.available ?? merchant?.payouts_balance_ngn ?? 0)}</p>
                <p className="text-[11.5px] text-ink/70">Available limit</p>
              </div>
            </div>
          </div>
          <div className="stacked-card stacked-card-orange">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] font-bold">Savings</p>
              <div className="text-right">
                <p className="tabular text-[20px] font-extrabold leading-tight">{formatMoney(uniquePayers > 0 ? Math.round(collected * 0.01) : 0)}</p>
                <p className="text-[11.5px] text-ink/70">Payers balance</p>
              </div>
            </div>
          </div>
          <div className="stacked-card stacked-card-cyan">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] font-bold">eSIM</p>
              <div className="text-right">
                <p className="tabular text-[20px] font-extrabold leading-tight">{formatNumber(pendingCount)}</p>
                <p className="text-[11.5px] text-ink/70">Pending</p>
              </div>
            </div>
          </div>
          <div className="stacked-card stacked-card-pink">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] font-bold">Accounts</p>
              <div className="text-right">
                <p className="tabular text-[20px] font-extrabold leading-tight">{formatMoney((balances?.available ?? 0) + (balances?.collected ?? collected))}</p>
                <p className="text-[11.5px] text-ink/70">Total balance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden gap-4 sm:grid-cols-2 xl:grid-cols-4 md:grid">
        <StatCard
          label={`Collected · ${range}`}
          value={formatMoney(collected)}
          hint={`${successful.length} successful payments`}
          icon={<HandCoins size={16} />}
          tone="brand"
        />
        <StatCard
          label="Available to withdraw"
          value={formatMoney(balances?.available ?? merchant?.payouts_balance_ngn ?? 0)}
          hint={
            activePayout
              ? `${formatMoney(activePayout.amount)} payout in progress`
              : "Settles twice daily to your bank"
          }
          icon={<Banknote size={16} />}
        />
        <StatCard
          label="Payers · unique"
          value={formatNumber(uniquePayers)}
          hint={`Across ${stats.length} collections`}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Awaiting confirmation"
          value={formatNumber(pendingCount)}
          hint={
            pendingCount
              ? "Transfers not yet confirmed by the gateway"
              : "Nothing outstanding right now"
          }
          icon={<CalendarClock size={16} />}
          tone={pendingCount ? "neutral" : "green"}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader
            title="Collections over time"
            subtitle="Successful payments per week, last 8 weeks"
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
              title="Settlement schedule"
              subtitle="Payouts run at 10:00 and 22:00 daily"
              icon={<Banknote size={16} />}
            />
            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 border-b border-line-soft pb-3">
                <div>
                  <p className="text-[13px] font-semibold">Next automatic payout</p>
                  <p className="muted">
                    {formatDate(new Date(Date.now() + 6 * 3600_000).toISOString())}{" "}
                    · Wema Bank
                  </p>
                </div>
                <span className="tabular text-[14px] font-bold">
                  {formatMoney(balances?.available ?? 0)}
                </span>
              </li>
              {(payouts.data ?? []).slice(0, 3).map((payout) => (
                <li key={payout.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold">
                      {payout.bank_code ? `••${payout.account_number.slice(-4)}` : "Payout"}
                    </p>
                    <p className="muted">{timeAgo(payout.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-[13px] font-semibold">
                      {formatMoney(payout.amount)}
                    </p>
                    <StatusPill status={payout.status} />
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/payouts" className="btn btn-secondary btn-sm mt-4 w-full">
              Manage payouts <ArrowUpRight size={14} />
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
