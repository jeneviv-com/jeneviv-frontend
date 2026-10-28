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
  InlineNote,
  PageHeader,
  Pill,
  SearchInput,
  SegmentedControl,
  TableSkeleton,
  TONE_MEANING,
  type ToneKind,
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

/** One stacked summary tile, coloured by meaning. Matches the dashboard. */
function SummaryTile({
  index,
  tone,
  label,
  value,
  hint,
}: {
  index: number;
  tone: ToneKind;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="dash-rise relative -mt-6 first:mt-0 lg:mt-0"
      style={{ zIndex: index + 1, animationDelay: `${index * 80}ms` }}
    >
      <div
        className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_MEANING[tone]}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">{label}</p>
          <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">{hint}</p>
        </div>
        <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">{value}</p>
      </div>
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
        description="Everyone who has paid, grouped by the details they submitted — ready to hand to a treasurer or a department."
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

      <div className="mb-5">
        <InlineNote tone="info" title="How this list is built">
          Payers are assembled from the fields you collect on each payment, so no
          separate customer record is needed. Export it any time for an auditable
          class list.
        </InlineNote>
      </div>

      {/* summary: one tile per meaning */}
      <div className="mb-6 lg:grid lg:grid-cols-3 lg:gap-4">
        <SummaryTile
          index={0}
          tone="people"
          label="Unique payers"
          value={formatNumber(totals.unique)}
          hint={`${formatNumber(totals.repeat)} paid into more than one collection`}
        />
        <SummaryTile
          index={1}
          tone="money"
          label="Value received"
          value={formatMoney(totals.collected)}
          hint="Confirmed payments only"
        />
        <SummaryTile
          index={2}
          tone={totals.outstanding ? "attention" : "neutral"}
          label="Outstanding transfers"
          value={formatNumber(totals.outstanding)}
          hint="Payments still pending confirmation"
        />
      </div>

      <Card padded={false}>
        {/* filters */}
        <div className="flex flex-col gap-3 border-b border-line-soft px-4 py-3 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID or collection"
            className="w-full lg:w-[300px]"
          />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "repeat", label: "Repeat" },
              { value: "outstanding", label: "Outstanding" },
            ]}
          />
          <span className="font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted lg:ml-auto">
            {rows.length} rows
          </span>
        </div>

        {transactions.loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={3} />
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
            {/* phones: one card per payer */}
            <ul className="divide-y divide-line-soft md:hidden">
              {rows.slice(0, 120).map((payer) => (
                <li key={payer.key} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold">{payer.name}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">
                        {payer.identifier}
                      </p>
                    </div>
                    <p className="tabular shrink-0 text-[13.5px] font-bold">
                      {formatMoney(payer.total)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-muted">
                    {payer.payments > 0 ? (
                      <Pill tone={payer.payments > 1 ? "green" : "neutral"}>
                        {payer.payments} paid
                      </Pill>
                    ) : (
                      <Pill tone="amber">Pending</Pill>
                    )}
                    <span className="min-w-0 truncate">
                      {payer.collectionId ? (
                        <Link to={`/collections/${payer.collectionId}`} className="hover:text-brand">
                          {payer.collection}
                        </Link>
                      ) : (
                        payer.collection
                      )}{" "}
                      · {timeAgo(payer.lastPayment)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* tablets and up: the full table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Collection</th>
                    <th>Payments</th>
                    <th>Total</th>
                    <th>Last payment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 120).map((payer) => (
                    <tr key={payer.key}>
                      <td>
                        <p className="font-semibold">{payer.name}</p>
                        <p className="font-mono text-3xs text-ink-muted">{payer.identifier}</p>
                      </td>
                      <td>
                        {payer.collectionId ? (
                          <Link
                            to={`/collections/${payer.collectionId}`}
                            className="text-ink-soft hover:text-brand"
                          >
                            {payer.collection}
                          </Link>
                        ) : (
                          <span className="text-ink-soft">{payer.collection}</span>
                        )}
                      </td>
                      <td>
                        {payer.payments > 0 ? (
                          <Pill tone={payer.payments > 1 ? "green" : "neutral"}>
                            {payer.payments} paid
                          </Pill>
                        ) : (
                          <Pill tone="amber">Pending</Pill>
                        )}
                      </td>
                      <td className="tabular font-semibold">{formatMoney(payer.total)}</td>
                      <td className="text-ink-muted">
                        <span title={formatDate(payer.lastPayment)}>{timeAgo(payer.lastPayment)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payers.length > 120 ? (
              <p className="muted px-4 py-3">
                Showing the 120 most recent payers. Export the CSV for the full list.
              </p>
            ) : null}
          </>
        )}
      </Card>
    </>
  );
}
