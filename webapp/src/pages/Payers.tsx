import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search, Users } from "lucide-react";
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
  StatCard,
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

      <InlineNote tone="info" title="How this list is built">
        Payers are assembled from the fields you collect on each payment, so no
        separate customer record is needed. Export it any time for an auditable
        class list.
      </InlineNote>

      <div className="mt-5 stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unique payers"
          value={formatNumber(totals.unique)}
          hint="Distinct name + identifier pairs"
          icon={<Users size={16} />}
          tone="brand"
        />
        <StatCard
          label="Value received"
          value={formatMoney(totals.collected)}
          hint="Confirmed payments only"
        />
        <StatCard
          label="Outstanding transfers"
          value={formatNumber(totals.outstanding)}
          hint="Payments still pending confirmation"
        />
        <StatCard
          label="Repeat payers"
          value={formatNumber(totals.repeat)}
          hint="Paid into more than one collection"
        />
      </div>

      <Card className="mt-5" padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID or collection"
            className="w-full sm:w-[300px]"
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
          <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
            {rows.length} rows
          </span>
        </div>

        {transactions.loading ? (
          <TableSkeleton rows={6} cols={5} />
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
          <div className="overflow-x-auto">
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
                      <p className="font-mono text-3xs text-ink-muted">
                        {payer.identifier}
                      </p>
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
                      <span title={formatDate(payer.lastPayment)}>
                        {timeAgo(payer.lastPayment)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payers.length > 120 ? (
              <p className="muted px-4 py-3">
                Showing the 120 most recent payers. Export the CSV for the full
                list.
              </p>
            ) : null}
          </div>
        )}
      </Card>
    </>
  );
}
