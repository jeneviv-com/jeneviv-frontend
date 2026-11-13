import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search } from "lucide-react";
import { useTransactions } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
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
  Card,
  EmptyState,
  ErrorState,
  FilterMenu,
  PageHeader,
  SearchInput,
  TableSkeleton,
} from "@/components/ui";

interface PayerRow {
  key: string;
  name: string;
  identifier: string;
  collection: string;
  collectionId?: string;
  payments: number;
  total: number;
  lastPayment: string;
  pending: boolean;
  email?: string;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** One quiet figure in the strip under the title. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[104px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="tabular mt-1 text-[17px] font-bold leading-none tracking-tight">{value}</p>
    </div>
  );
}

export default function Payers() {
  const transactions = useTransactions();
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "repeat" | "outstanding">("all");

  const payers = useMemo<PayerRow[]>(() => {
    const map = new Map<string, PayerRow>();
    (transactions.data ?? []).forEach((transaction) => {
      const name = transactionPayer(transaction);
      const identifier = transactionIdentifier(transaction);
      const key = `${name.toLowerCase()}|${identifier}|${transaction.collection_id ?? ""}`;
      const existing = map.get(key);
      const isPaid = transaction.status === "success";
      if (existing) {
        existing.payments += isPaid ? 1 : 0;
        existing.total += isPaid ? transaction.amount : 0;
        existing.pending = existing.pending || transaction.status === "pending";
        if (isPaid && transaction.created_at > existing.lastPayment)
          existing.lastPayment = transaction.created_at;
      } else {
        map.set(key, {
          key,
          name,
          identifier,
          collection: transaction.collection_name || "—",
          collectionId: transaction.collection_id,
          payments: isPaid ? 1 : 0,
          total: isPaid ? transaction.amount : 0,
          lastPayment: transaction.created_at,
          pending: transaction.status === "pending",
          email: transaction.payer_email,
        });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastPayment).getTime() - new Date(a.lastPayment).getTime(),
    );
  }, [transactions.data]);

  const rows = useMemo(() => {
    let list = payers;
    if (filter === "repeat") list = list.filter((payer) => payer.payments > 1);
    if (filter === "outstanding") list = list.filter((payer) => payer.pending);
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter(
        (payer) =>
          payer.name.toLowerCase().includes(needle) ||
          payer.identifier.toLowerCase().includes(needle) ||
          payer.collection.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [payers, filter, search]);

  const totals = useMemo(() => {
    const paid = payers.filter((payer) => payer.payments > 0);
    return {
      unique: paid.length,
      collected: paid.reduce((sum, payer) => sum + payer.total, 0),
      outstanding: payers.filter((payer) => payer.pending).length,
      repeat: payers.filter((payer) => payer.payments > 1).length,
    };
  }, [payers]);

  const exportCsv = () => {
    downloadCSV(
      `jeneviv-payers-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((payer) => ({
        name: payer.name,
        identifier: payer.identifier,
        collection: payer.collection,
        payments: payer.payments,
        total: payer.total,
        email: payer.email ?? "",
        last_payment: payer.lastPayment,
      })),
    );
    success("Export ready", `${rows.length} payer rows downloaded as CSV.`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Payers"
        description="Everyone who has paid, grouped by what they submitted."
        actions={
          <Button
            variant="secondary"
            icon={<Download size={14} />}
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      {/* three quiet figures instead of a wall of coloured tiles */}
      <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[18px] border border-line bg-white px-5 py-4">
        <Stat label="Unique payers" value={formatNumber(totals.unique)} />
        <span className="hidden h-9 w-px bg-line sm:block" />
        <Stat label="Value received" value={formatMoney(totals.collected)} />
        <span className="hidden h-9 w-px bg-line sm:block" />
        <Stat label="Outstanding" value={formatNumber(totals.outstanding)} />
        <span className="ml-auto hidden text-[11.5px] text-ink-faint sm:block">
          {formatNumber(totals.repeat)} paid into more than one collection
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, ID or collection"
          className="w-full sm:w-[300px]"
        />
        <FilterMenu
          groups={[
            {
              label: "Payers",
              value: filter,
              onChange: (value) => setFilter(value as typeof filter),
              options: [
                { value: "all", label: "All payers" },
                { value: "repeat", label: "Paid more than once" },
                { value: "outstanding", label: "Outstanding transfer" },
              ],
            },
          ]}
        />
        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} {rows.length === 1 ? "payer" : "payers"}
        </span>
      </div>

      <Card padded={false} rounded="2xl" shadow="sm" className="overflow-hidden">
        {transactions.loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={2} />
          </div>
        ) : transactions.error ? (
          <ErrorState message={transactions.error} onRetry={transactions.refetch} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title={search ? "No payers match that search" : "No payers yet"}
            description={
              search
                ? "Try a different name, identifier or collection."
                : "Once payments start arriving, every payer appears here with what they paid and when."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-line-soft">
              {rows.slice(0, 120).map((payer) => (
                <li
                  key={payer.key}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream/50 sm:px-5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-[11px] font-bold text-ink-soft">
                    {initialsOf(payer.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[13.5px] font-semibold">{payer.name}</p>
                      <p className="tabular shrink-0 text-[13.5px] font-bold">
                        {formatMoney(payer.total)}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-3">
                      <p className="truncate text-[11.5px] text-ink-muted">
                        {payer.identifier}
                        {payer.identifier && payer.collection ? " · " : ""}
                        {payer.collectionId ? (
                          <Link to={`/collections/${payer.collectionId}`} className="hover:text-brand">
                            {payer.collection}
                          </Link>
                        ) : (
                          payer.collection
                        )}
                      </p>
                      <span
                        className="shrink-0 text-[11px] text-ink-faint"
                        title={formatDate(payer.lastPayment)}
                      >
                        {timeAgo(payer.lastPayment)}
                      </span>
                    </div>
                  </div>

                  {payer.pending ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-warning"
                      title="Transfer awaiting confirmation"
                    />
                  ) : null}
                </li>
              ))}
            </ul>

            {payers.length > 120 ? (
              <p className="muted border-t border-line-soft px-5 py-3">
                Showing the 120 most recent payers. Export the CSV for the full list.
              </p>
            ) : null}
          </>
        )}
      </Card>
    </>
  );
}
