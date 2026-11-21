import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Download, Repeat, Search, Users } from "lucide-react";
import { useTransactions } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { type Transaction } from "@/lib/api";
import {
  downloadCSV,
  formatDate,
  formatMoney,
  formatNumber,
  timeAgo,
  transactionIdentifier,
  transactionPayer,
} from "@/lib/format";
import {
  Button,
  EmptyState,
  ErrorState,
  SearchInput,
  StatusPill,
  TableSkeleton,
} from "@/components/ui";
import { JENEVIV_LOGO } from "@/lib/brand";

/** One person, however many collections they paid into. */
interface Payer {
  key: string;
  name: string;
  identifier: string;
  email?: string;
  collections: Map<string, { id?: string; name: string }>;
  payments: number;
  total: number;
  currency: string;
  lastPayment: string;
  pending: number;
  history: Transaction[];
}

type Filter = "all" | "repeat" | "pending";
type Sort = "recent" | "total" | "name";

const LIMIT = 150;

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** A stable, quiet colour per payer so the list is easy to scan. */
const AVATAR_TONES = [
  "bg-brand-soft text-brand-dark",
  "bg-cream-deep text-ink",
  "bg-[#eef3ff] text-[#2a4bb3]",
  "bg-[#eaf5ef] text-success",
  "bg-[#fdf3e1] text-warning",
];
function toneFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

/** The jeneviv mark and wordmark, as on the sidebar. */
function BrandLockup() {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={JENEVIV_LOGO}
        alt="jeneviv"
        width={32}
        height={32}
        className="h-8 w-8 rounded-[10px] bg-white object-cover shadow-[0_1px_2px_rgba(18,16,14,0.12)]"
      />
      <span className="flex items-baseline gap-0.5" aria-hidden="true">
        <span className="text-[17px] font-extrabold tracking-[-0.05em] text-ink">jeneviv</span>
        <span className="text-[19px] leading-none text-brand">.</span>
      </span>
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 bg-white/95 px-4 py-3.5 sm:px-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="tabular mt-1.5 truncate text-[20px] font-extrabold leading-none tracking-[-0.03em] sm:text-[22px]">
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-[11.5px] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export default function Payers() {
  const transactions = useTransactions();
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [open, setOpen] = useState<string | null>(null);

  const payers = useMemo<Payer[]>(() => {
    const map = new Map<string, Payer>();
    (transactions.data ?? []).forEach((transaction) => {
      const name = transactionPayer(transaction);
      const identifier = transactionIdentifier(transaction);
      const email = transaction.payer_email?.trim().toLowerCase();
      // Email is the strongest identity; otherwise name plus what they submitted.
      const key = email || `${name.toLowerCase()}|${identifier}`;
      const isPaid = transaction.status === "success";

      let payer = map.get(key);
      if (!payer) {
        payer = {
          key,
          name,
          identifier,
          email: transaction.payer_email,
          collections: new Map(),
          payments: 0,
          total: 0,
          currency: transaction.currency,
          lastPayment: transaction.created_at,
          pending: 0,
          history: [],
        };
        map.set(key, payer);
      }
      payer.history.push(transaction);
      if (transaction.collection_id || transaction.collection_name) {
        payer.collections.set(transaction.collection_id ?? transaction.collection_name!, {
          id: transaction.collection_id,
          name: transaction.collection_name || "Collection",
        });
      }
      if (transaction.status === "pending") payer.pending += 1;
      if (isPaid) {
        payer.payments += 1;
        payer.total += transaction.amount;
      }
      if (transaction.created_at > payer.lastPayment) payer.lastPayment = transaction.created_at;
    });
    map.forEach((payer) =>
      payer.history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    );
    return Array.from(map.values());
  }, [transactions.data]);

  const counts = useMemo(
    () => ({
      all: payers.length,
      repeat: payers.filter((payer) => payer.payments > 1 || payer.collections.size > 1).length,
      pending: payers.filter((payer) => payer.pending > 0).length,
    }),
    [payers],
  );

  const rows = useMemo(() => {
    let list = payers;
    if (filter === "repeat") list = list.filter((payer) => payer.payments > 1 || payer.collections.size > 1);
    if (filter === "pending") list = list.filter((payer) => payer.pending > 0);
    const needle = search.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (payer) =>
          payer.name.toLowerCase().includes(needle) ||
          payer.identifier.toLowerCase().includes(needle) ||
          (payer.email ?? "").toLowerCase().includes(needle) ||
          Array.from(payer.collections.values()).some((c) => c.name.toLowerCase().includes(needle)),
      );
    }
    const sorted = [...list];
    if (sort === "recent")
      sorted.sort((a, b) => new Date(b.lastPayment).getTime() - new Date(a.lastPayment).getTime());
    if (sort === "total") sorted.sort((a, b) => b.total - a.total);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [payers, filter, search, sort]);

  const totals = useMemo(() => {
    const paid = payers.filter((payer) => payer.payments > 0);
    const collected = paid.reduce((sum, payer) => sum + payer.total, 0);
    return {
      unique: paid.length,
      collected,
      average: paid.length ? collected / paid.length : 0,
      top: [...paid].sort((a, b) => b.total - a.total)[0],
    };
  }, [payers]);

  const exportCsv = () => {
    downloadCSV(
      `jeneviv-payers-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((payer) => ({
        name: payer.name,
        identifier: payer.identifier,
        email: payer.email ?? "",
        collections: Array.from(payer.collections.values())
          .map((c) => c.name)
          .join("; "),
        payments: payer.payments,
        total: payer.total,
        awaiting_confirmation: payer.pending,
        last_payment: payer.lastPayment,
      })),
    );
    success("Export ready", `${rows.length} payer rows downloaded as CSV.`);
  };

  const loading = transactions.loading;

  return (
    <div className="mx-auto w-full max-w-[1200px] pb-10">
      {/* branded header */}
      <header className="relative isolate mb-5 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <img
          src={JENEVIV_LOGO}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-12 -z-10 h-52 w-52 rotate-6 opacity-[0.09] sm:h-64 sm:w-64"
        />
        <div className="flex flex-wrap items-start justify-between gap-4 px-4 pb-4 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <BrandLockup />
            <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.035em] sm:text-[30px]">Payers</h1>
          </div>
          <Button variant="secondary" icon={<Download size={14} />} onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-line-soft bg-line-soft sm:grid-cols-4">
          <Stat label="Payers" value={loading ? "—" : formatNumber(totals.unique)} hint="Paid at least once" />
          <Stat label="Received" value={loading ? "—" : formatMoney(totals.collected)} hint="Successful payments" />
          <Stat label="Average" value={loading ? "—" : formatMoney(Math.round(totals.average))} hint="Per payer" />
          <Stat
            label="Top payer"
            value={loading || !totals.top ? "—" : formatMoney(totals.top.total)}
            hint={totals.top?.name}
          />
        </div>
      </header>

      {/* toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email, ID or collection"
          className="w-full sm:w-[320px]"
        />
        <div role="tablist" aria-label="Filter payers" className="flex gap-1 rounded-full border border-line bg-white p-1">
          {(
            [
              ["all", "All"],
              ["repeat", "Repeat"],
              ["pending", "Awaiting"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                filter === value ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              {label}
              <span className={`tabular text-[11px] ${filter === value ? "text-white/60" : "text-ink-faint"}`}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-[12px] text-ink-muted">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <option value="recent">Most recent</option>
            <option value="total">Highest total</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={3} />
          </div>
        ) : transactions.error ? (
          <ErrorState message={transactions.error} onRetry={transactions.refetch} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={search ? <Search size={20} /> : <Users size={20} />}
            title={search ? "No payers match that search" : filter !== "all" ? "No payers here yet" : "No payers yet"}
            description={
              search
                ? "Try a different name, email, identifier or collection."
                : "Once payments start arriving, every payer appears here with what they paid and when."
            }
          />
        ) : (
          <>
            {/* column labels, laptop only */}
            <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_90px_130px_110px_28px] items-center gap-4 border-b border-line-soft bg-cream/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted md:grid">
              <span>Payer</span>
              <span>Collections</span>
              <span className="text-right">Payments</span>
              <span className="text-right">Total paid</span>
              <span className="text-right">Last seen</span>
              <span />
            </div>

            <ul className="divide-y divide-line-soft">
              {rows.slice(0, LIMIT).map((payer) => {
                const expanded = open === payer.key;
                const collectionList = Array.from(payer.collections.values());
                return (
                  <li key={payer.key}>
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : payer.key)}
                      aria-expanded={expanded}
                      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_90px_130px_110px_28px] md:gap-4 md:px-5 ${
                        expanded ? "bg-cream/60" : "hover:bg-cream/40"
                      }`}
                    >
                      {/* payer */}
                      <span className="flex min-w-0 items-center gap-3 md:col-auto">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11.5px] font-bold ${toneFor(payer.key)}`}
                        >
                          {initialsOf(payer.name)}
                        </span>
                        <span className="hidden min-w-0 md:block">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[13.5px] font-semibold">{payer.name}</span>
                            {payer.payments > 1 || payer.collections.size > 1 ? (
                              <Repeat size={12} className="shrink-0 text-ink-faint" aria-label="Repeat payer" />
                            ) : null}
                          </span>
                          <span className="block truncate text-[11.5px] text-ink-muted">
                            {payer.email || payer.identifier || "—"}
                          </span>
                        </span>
                      </span>

                      {/* phone: name + summary in one block */}
                      <span className="min-w-0 md:hidden">
                        <span className="block truncate text-[13.5px] font-semibold">{payer.name}</span>
                        <span className="block truncate text-[11.5px] text-ink-muted">
                          {collectionList[0]?.name ?? "—"}
                          {collectionList.length > 1 ? ` +${collectionList.length - 1}` : ""} ·{" "}
                          {timeAgo(payer.lastPayment)}
                        </span>
                      </span>
                      <span className="text-right md:hidden">
                        <span className="tabular block text-[13.5px] font-bold">{formatMoney(payer.total, payer.currency)}</span>
                        {payer.pending ? (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" /> Awaiting
                          </span>
                        ) : (
                          <span className="block text-[11px] text-ink-faint">
                            {payer.payments} payment{payer.payments === 1 ? "" : "s"}
                          </span>
                        )}
                      </span>

                      {/* laptop columns */}
                      <span className="hidden min-w-0 flex-wrap gap-1 md:flex">
                        {collectionList.slice(0, 2).map((collection) => (
                          <span
                            key={collection.id ?? collection.name}
                            className="max-w-full truncate rounded-full bg-cream px-2 py-0.5 text-[11.5px] font-medium text-ink-soft"
                          >
                            {collection.name}
                          </span>
                        ))}
                        {collectionList.length > 2 ? (
                          <span className="rounded-full px-1.5 py-0.5 text-[11.5px] text-ink-faint">
                            +{collectionList.length - 2}
                          </span>
                        ) : null}
                      </span>
                      <span className="tabular hidden text-right text-[13px] md:block">
                        {payer.payments}
                        {payer.pending ? (
                          <span
                            className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle"
                            title={`${payer.pending} awaiting confirmation`}
                          />
                        ) : null}
                      </span>
                      <span className="tabular hidden text-right text-[13.5px] font-bold md:block">
                        {formatMoney(payer.total, payer.currency)}
                      </span>
                      <span
                        className="hidden text-right text-[12px] text-ink-muted md:block"
                        title={formatDate(payer.lastPayment)}
                      >
                        {timeAgo(payer.lastPayment)}
                      </span>
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`hidden justify-self-end text-ink-faint transition-transform duration-200 md:block ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expanded ? (
                      <div className="animate-fade-in border-t border-line-soft bg-cream/40 px-4 pb-4 pt-3 md:px-5 md:pl-[68px]">
                        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
                          {payer.identifier ? <span>ID: <span className="font-semibold text-ink">{payer.identifier}</span></span> : null}
                          {payer.email ? <span>{payer.email}</span> : null}
                        </div>
                        <ul className="overflow-hidden rounded-[14px] border border-line bg-white">
                          {payer.history.slice(0, 8).map((tx) => (
                            <li
                              key={tx.id}
                              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-soft px-3.5 py-2.5 last:border-b-0"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12.5px] font-semibold">
                                  {tx.collection_id ? (
                                    <Link to={`/collections/${tx.collection_id}`} className="hover:text-brand">
                                      {tx.collection_name || "Collection"}
                                    </Link>
                                  ) : (
                                    tx.collection_name || "Collection"
                                  )}
                                </span>
                                <span className="block truncate font-mono text-[10.5px] text-ink-faint">
                                  {tx.reference} · {formatDate(tx.created_at)}
                                </span>
                              </span>
                              <StatusPill status={tx.status} />
                              <span className="tabular w-[96px] text-right text-[12.5px] font-bold">
                                {formatMoney(tx.amount, tx.currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {payer.history.length > 8 ? (
                          <p className="mt-2 text-[11.5px] text-ink-muted">
                            Showing the latest 8 of {payer.history.length}.{" "}
                            <Link to="/transactions" className="font-semibold text-ink hover:text-brand">
                              See all in Transactions
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-5 py-3 text-[12px] text-ink-muted">
              <span>
                {rows.length > LIMIT
                  ? `Showing ${LIMIT} of ${formatNumber(rows.length)} payers. Export the CSV for the full list.`
                  : `${formatNumber(rows.length)} ${rows.length === 1 ? "payer" : "payers"}`}
              </span>
              <span className="inline-flex items-center gap-1.5 text-ink-faint">
                <img
                  src={JENEVIV_LOGO}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4"
                />
                Records kept by jeneviv
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

