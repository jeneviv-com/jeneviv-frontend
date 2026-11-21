import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Download,
  Hash,
  Layers,
  Mail,
  Repeat,
  Search,
  Users,
} from "lucide-react";
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
  PageHeader,
  SearchInput,
  StatusPill,
  SummaryPanel,
  SummaryRow,
  TableSkeleton,
} from "@/components/ui";
import { Drawer } from "@/components/overlays";

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

/** Black or mild orange, picked per payer so the list is easy to scan. */
function toneFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(hash) % 2 === 0 ? "bg-ink text-white" : "bg-[#ffeee3] text-brand-dark";
}

function Avatar({ payer, size = "md" }: { payer: Payer; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16 text-[19px] ring-4 ring-white" : "h-10 w-10 text-[12px]";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-bold ${dims} ${toneFor(payer.key)}`}>
      {initialsOf(payer.name)}
    </span>
  );
}

const isRepeat = (payer: Payer) => payer.payments > 1 || payer.collections.size > 1;

/** One payer as a white row, the same shape as the settings list. */
function PayerRow({ payer, onOpen }: { payer: Payer; onOpen: () => void }) {
  const collections = Array.from(payer.collections.values());
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[16px] bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(17,17,17,0.04),0_6px_18px_-10px_rgba(17,17,17,0.12)] transition-transform duration-150 hover:-translate-y-px active:scale-[0.99] md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1.4fr)_110px_auto] md:gap-4 md:px-4"
    >
      <Avatar payer={payer} />

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold text-ink">{payer.name}</span>
          {isRepeat(payer) ? <Repeat size={12} className="shrink-0 text-brand" aria-label="Repeat payer" /> : null}
        </span>
        <span className="block truncate text-[12px] text-ink-muted">
          <span className="md:hidden">
            {collections[0]?.name ?? "No collection"}
            {collections.length > 1 ? ` +${collections.length - 1}` : ""} · {timeAgo(payer.lastPayment)}
          </span>
          <span className="hidden md:inline">{payer.identifier || payer.email || "No ID"}</span>
        </span>
      </span>

      {/* laptop: collections and when */}
      <span className="hidden min-w-0 md:block">
        <span className="flex min-w-0 flex-wrap gap-1">
          {collections.slice(0, 2).map((collection) => (
            <span
              key={collection.id ?? collection.name}
              className="max-w-full truncate rounded-full bg-[#fff6f0] px-2.5 py-0.5 text-[11.5px] font-medium text-ink-soft"
            >
              {collection.name}
            </span>
          ))}
          {collections.length > 2 ? (
            <span className="px-1 py-0.5 text-[11.5px] text-ink-faint">+{collections.length - 2}</span>
          ) : null}
        </span>
        <span className="mt-1 block text-[11.5px] text-ink-faint" title={formatDate(payer.lastPayment)}>
          {timeAgo(payer.lastPayment)}
        </span>
      </span>

      <span className="text-right">
        <span className="tabular block text-[14px] font-bold text-ink">{formatMoney(payer.total, payer.currency)}</span>
        {payer.pending ? (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" /> Awaiting
          </span>
        ) : (
          <span className="block text-[11.5px] text-ink-faint">
            {payer.payments} payment{payer.payments === 1 ? "" : "s"}
          </span>
        )}
      </span>

      <ChevronRight size={17} className="shrink-0 text-ink/40" aria-hidden="true" />
    </button>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5 last:border-b-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink">{icon}</span>
      <span className="min-w-0 flex-1 text-[13px] text-ink-muted">{label}</span>
      <span className="min-w-0 truncate text-right text-[13.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}

const panelClass =
  "overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04),0_6px_18px_-10px_rgba(17,17,17,0.12)]";

/** Everything about one payer: who they are, what they paid, and into what. */
function PayerSheet({ payer }: { payer: Payer }) {
  const collections = Array.from(payer.collections.values());
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-[18px] bg-gradient-to-br from-[#ffeee3] to-[#fff8f3] p-4">
        <Avatar payer={payer} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold tracking-[-0.02em] text-ink">{payer.name}</p>
          <p className="truncate text-[12.5px] text-ink-muted">{payer.email || payer.identifier || "No contact saved"}</p>
          {isRepeat(payer) ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
              <Repeat size={11} aria-hidden="true" /> Repeat payer
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Total paid", formatMoney(payer.total, payer.currency)],
          ["Payments", formatNumber(payer.payments)],
          ["Awaiting", formatNumber(payer.pending)],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`rounded-[16px] border-[1.5px] px-3 py-3 ${
              index === 0 ? "border-ink bg-ink text-white" : "border-ink bg-white text-ink"
            }`}
          >
            <p className={`text-[11.5px] ${index === 0 ? "text-white/60" : "text-ink-muted"}`}>{label}</p>
            <p className="tabular mt-1 truncate text-[17px] font-extrabold tracking-[-0.02em]">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-2.5 px-1 text-[13.5px] font-semibold text-ink">Details</h3>
        <div className={panelClass}>
          <Fact icon={<Hash size={15} />} label="ID" value={payer.identifier || "None"} />
          <Fact icon={<Mail size={15} />} label="Email" value={payer.email || "None"} />
          <Fact icon={<BadgeCheck size={15} />} label="Last payment" value={formatDate(payer.lastPayment)} />
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 px-1 text-[13.5px] font-semibold text-ink">Collections</h3>
        <div className="space-y-2">
          {collections.length === 0 ? (
            <p className="px-1 text-[13px] text-ink-muted">None</p>
          ) : (
            collections.map((collection) => {
              const inner = (
                <>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink">
                    <Layers size={15} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{collection.name}</span>
                  <ArrowUpRight size={16} className="shrink-0 text-ink/40" aria-hidden="true" />
                </>
              );
              const cls = `flex items-center gap-3 px-3.5 py-3 ${panelClass}`;
              return collection.id ? (
                <Link key={collection.id} to={`/collections/${collection.id}`} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div key={collection.name} className={cls}>
                  {inner}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 flex items-baseline justify-between px-1 text-[13.5px] font-semibold text-ink">
          Payments
          <span className="text-[12px] font-normal text-ink-faint">{payer.history.length}</span>
        </h3>
        <ul className={panelClass}>
          {payer.history.slice(0, 20).map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">
                  {tx.collection_name || "Collection"}
                </span>
                <span className="block truncate font-mono text-[10.5px] text-ink-faint">
                  {tx.reference} · {formatDate(tx.created_at)}
                </span>
              </span>
              <span className="text-right">
                <span className="tabular block text-[13.5px] font-bold">{formatMoney(tx.amount, tx.currency)}</span>
                <StatusPill status={tx.status} />
              </span>
            </li>
          ))}
        </ul>
      </section>
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
  const openPayer = open ? payers.find((payer) => payer.key === open) ?? null : null;

  return (
    <div className="mx-auto w-full max-w-[1200px] pb-10">
      <PageHeader
        title="Payers"
        actions={
          <Button variant="secondary" icon={<Download size={14} />} onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
        }
      />

      <SummaryPanel columns={4} className="mb-6">
        <SummaryRow
          title="Payers"
          loading={loading}
          value={formatNumber(totals.unique)}
          subtitle="Paid at least once"
        />
        <SummaryRow
          title="Received"
          loading={loading}
          value={formatMoney(totals.collected)}
          subtitle="Successful payments"
        />
        <SummaryRow
          title="Average"
          loading={loading}
          value={formatMoney(Math.round(totals.average))}
          subtitle="Per payer"
        />
        <SummaryRow
          title="Top payer"
          loading={loading}
          value={totals.top ? formatMoney(totals.top.total) : "None yet"}
          subtitle={totals.top?.name ?? "No payments yet"}
        />
      </SummaryPanel>

      {/* toolbar */}
      <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email, ID or collection"
          className="w-full md:w-[340px]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Filter payers" className="flex gap-1 rounded-full bg-[#ffeee3] p-1">
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  filter === value ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                {label}
                <span className={`tabular text-[11px] ${filter === value ? "text-white/60" : "text-ink/45"}`}>
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
          <select
            aria-label="Sort payers"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="rounded-full border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink md:ml-2"
          >
            <option value="recent">Most recent</option>
            <option value="total">Highest total</option>
            <option value="name">Name A to Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[18px] bg-white p-4">
          <TableSkeleton rows={6} cols={3} />
        </div>
      ) : transactions.error ? (
        <ErrorState message={transactions.error} onRetry={transactions.refetch} />
      ) : rows.length === 0 ? (
        <div className="rounded-[18px] bg-white">
          <EmptyState
            icon={search ? <Search size={20} /> : <Users size={20} />}
            title={search ? "No payers match that search" : filter !== "all" ? "No payers here yet" : "No payers yet"}
            description={search ? "Try another name, ID or collection." : ""}
          />
        </div>
      ) : (
        <>
          <p className="mb-2.5 px-1 text-[13.5px] font-semibold text-ink">
            {formatNumber(rows.length)} {rows.length === 1 ? "payer" : "payers"}
          </p>
          <ul className="space-y-2">
            {rows.slice(0, LIMIT).map((payer) => (
              <li key={payer.key}>
                <PayerRow payer={payer} onOpen={() => setOpen(payer.key)} />
              </li>
            ))}
          </ul>
          {rows.length > LIMIT ? (
            <p className="mt-4 px-1 text-[12px] text-ink-muted">
              Showing {LIMIT} of {formatNumber(rows.length)}. Export the CSV for everyone.
            </p>
          ) : null}
        </>
      )}

      <Drawer
        open={Boolean(openPayer)}
        onClose={() => setOpen(null)}
        title={openPayer?.name ?? "Payer"}
        footer={
          <Link to="/transactions" className="btn btn-secondary w-full justify-center">
            Open transactions
          </Link>
        }
      >
        {openPayer ? <PayerSheet payer={openPayer} /> : null}
      </Drawer>
    </div>
  );
}
