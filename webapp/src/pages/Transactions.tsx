import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Download,
  ReceiptText,
  RotateCcw,
  Undo2,
} from "lucide-react";
import {
  adminAPI,
  transactionsAPI,
  type Transaction,
} from "@/lib/api";
import {
  useAction,
  useCollectionStats,
  useTransactions,
} from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  downloadCSV,
  formatDate,
  formatDateTime,
  formatMoney,
  statusLabel,
  transactionIdentifier,
  transactionPayer,
} from "@/lib/format";
import {
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  KeyValue,
  PageHeader,
  Pill,
  SearchInput,
  SegmentedControl,
  Select,
  StatCard,
  StatusPill,
  TableSkeleton,
  Textarea,
} from "@/components/ui";

type StatusFilter = "all" | "success" | "pending" | "failed";

export default function Transactions() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [collectionId, setCollectionId] = useState("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(60);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<Transaction | null>(null);
  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const collections = useCollectionStats();
  const transactions = useTransactions({
    status: status === "all" ? undefined : status,
    collection_id: collectionId || undefined,
  });

  const reconcile = useAction((ids: string[], value: boolean) =>
    transactionsAPI.reconcile(ids, value),
  );
  const refund = useAction((id: string, reason: string) =>
    adminAPI.refundTransaction(id, reason),
  );

  const rows = useMemo(() => {
    const list = transactions.data ?? [];
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter(
      (transaction) =>
        transaction.reference.toLowerCase().includes(needle) ||
        transactionPayer(transaction).toLowerCase().includes(needle) ||
        transactionIdentifier(transaction).toLowerCase().includes(needle) ||
        JSON.stringify(transaction.field_values ?? {})
          .toLowerCase()
          .includes(needle),
    );
  }, [transactions.data, search]);

  const totals = useMemo(() => {
    const all = transactions.data ?? [];
    const successful = all.filter((transaction) => transaction.status === "success");
    const gross = successful.reduce(
      (sum, transaction) => sum + (transaction.total_charged ?? transaction.amount),
      0,
    );
    const net = successful.reduce((sum, transaction) => sum + transaction.amount, 0);
    const fees = successful.reduce(
      (sum, transaction) =>
        sum +
        ((transaction.platform_fee ?? 0) + (transaction.gateway_fee ?? 0)),
      0,
    );
    return {
      gross,
      net,
      fees,
      unreconciled: successful.filter((transaction) => !transaction.reconciled).length,
    };
  }, [transactions.data]);

  const exportCsv = () => {
    downloadCSV(
      `jeneviv-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((transaction) => ({
        reference: transaction.reference,
        payer: transactionPayer(transaction),
        identifier: transactionIdentifier(transaction),
        collection: transaction.collection_name ?? "",
        amount: transaction.amount,
        platform_fee: transaction.platform_fee ?? 0,
        gateway_fee: transaction.gateway_fee ?? 0,
        status: statusLabel(transaction.status),
        reconciled: transaction.reconciled ? "yes" : "no",
        paid_at: transaction.paid_at ?? "",
        created_at: transaction.created_at,
      })),
    );
    success("Export ready", `${rows.length} transactions downloaded as CSV.`);
  };

  const markAll = async () => {
    try {
      const result = await reconcile.run(selected, true);
      await transactions.refetch();
      setSelected([]);
      success("Reconciled", `${result.updated} payments marked as reconciled.`);
    } catch (err) {
      toastError("Could not reconcile", err instanceof Error ? err.message : "");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Transactions"
        description="Every payment attempt, confirmed or not, with the payer details attached."
        actions={
          <>
            <Button variant="secondary" icon={<Download size={14} />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button
              variant="secondary"
              icon={<BadgeCheck size={14} />}
              disabled={selected.length === 0}
              loading={reconcile.loading}
              onClick={markAll}
            >
              Reconcile {selected.length ? `(${selected.length})` : ""}
            </Button>
          </>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross charged" value={formatMoney(totals.gross)} hint="Amount + fees" tone="brand" />
        <StatCard label="Net to you" value={formatMoney(totals.net)} hint="What settles to your bank" />
        <StatCard label="Fees" value={formatMoney(totals.fees)} hint="Platform + gateway fees" />
        <StatCard
          label="Awaiting reconciliation"
          value={String(totals.unreconciled)}
          hint={totals.unreconciled ? "Match these against your bank statement" : "Everything is matched"}
          tone={totals.unreconciled ? "neutral" : "green"}
        />
      </div>

      <Card className="mt-5" padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search reference, payer or ID"
            className="w-full sm:w-[300px]"
          />
          <SegmentedControl
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "success", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <div className="w-full sm:w-[220px]">
            <Select
              value={collectionId}
              onChange={(event) => setCollectionId(event.target.value)}
              aria-label="Filter by collection"
            >
              <option value="">All collections</option>
              {(collections.data ?? []).map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </Select>
          </div>
          <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
            {rows.length} rows
          </span>
        </div>

        {transactions.loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : transactions.error ? (
          <ErrorState message={transactions.error} onRetry={transactions.refetch} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={20} />}
            title="No transactions in this view"
            description="Adjust the filters, or share a collection link to start receiving payments."
            action={
              <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                Create a collection
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={selected.length === rows.length && rows.length > 0}
                      onChange={(event) =>
                        setSelected(event.target.checked ? rows.map((r) => r.id) : [])
                      }
                      className="h-4 w-4 rounded border-line"
                    />
                  </th>
                  <th>Payer</th>
                  <th>Collection</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, visible).map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${transaction.reference}`}
                        checked={selected.includes(transaction.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, transaction.id]
                              : current.filter((value) => value !== transaction.id),
                          )
                        }
                        className="h-4 w-4 rounded border-line"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setOpen(transaction)}
                      >
                        <span className="block font-semibold">
                          {transactionPayer(transaction)}
                        </span>
                        <span className="block font-mono text-3xs text-ink-muted">
                          {transaction.reference}
                        </span>
                      </button>
                    </td>
                    <td className="text-ink-soft">
                      {transaction.collection_id ? (
                        <Link
                          to={`/collections/${transaction.collection_id}`}
                          className="hover:text-brand"
                        >
                          {transaction.collection_name || "Collection"}
                        </Link>
                      ) : (
                        transaction.collection_name || "—"
                      )}
                    </td>
                    <td className="tabular font-semibold">
                      {formatMoney(transaction.amount, transaction.currency)}
                    </td>
                    <td>
                      <StatusPill status={transaction.status} />
                    </td>
                    <td className="text-ink-muted">
                      <span title={formatDateTime(transaction.created_at)}>
                        {formatDate(transaction.created_at)}
                      </span>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(transaction)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > visible ? (
              <div className="flex justify-center px-4 py-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setVisible((value) => value + 60)}
                >
                  Load more ({rows.length - visible} remaining)
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? transactionPayer(open) : "Transaction"}
        subtitle={open?.reference}
        footer={
          open ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<BadgeCheck size={13} />}
                loading={reconcile.loading}
                onClick={async () => {
                  try {
                    await reconcile.run([open.id], !open.reconciled);
                    await transactions.refetch();
                    success(
                      open.reconciled ? "Marked unreconciled" : "Marked reconciled",
                      open.reference,
                    );
                    setOpen(null);
                  } catch (err) {
                    toastError("Could not update", err instanceof Error ? err.message : "");
                  }
                }}
              >
                {open.reconciled ? "Mark unreconciled" : "Mark reconciled"}
              </Button>
              {isAdmin && open.status === "success" ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Undo2 size={13} />}
                  onClick={() => {
                    setRefundTarget(open);
                    setRefundReason("");
                  }}
                >
                  Refund
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {open ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-cream px-4 py-3">
              <div>
                <p className="eyebrow">Amount</p>
                <p className="tabular mt-1 text-[22px] font-extrabold">
                  {formatMoney(open.amount, open.currency)}
                </p>
              </div>
              <StatusPill status={open.status} />
            </div>

            <div>
              <h3 className="eyebrow mb-2">Payment</h3>
              <KeyValue label="Reference" value={open.reference} mono />
              <KeyValue
                label="Gateway reference"
                value={open.gateway_ref || "—"}
                mono
              />
              <KeyValue label="Collection" value={open.collection_name || "—"} />
              <KeyValue label="Created" value={formatDateTime(open.created_at)} />
              <KeyValue
                label="Paid at"
                value={open.paid_at ? formatDateTime(open.paid_at) : "Not confirmed"}
              />
              <KeyValue
                label="Settled at"
                value={open.settled_at ? formatDateTime(open.settled_at) : "Pending"}
              />
              <KeyValue
                label="Reconciled"
                value={open.reconciled ? "Yes" : "No"}
              />
            </div>

            <div>
              <h3 className="eyebrow mb-2">Money</h3>
              <KeyValue label="Payer paid" value={formatMoney(open.amount, open.currency)} />
              <KeyValue
                label="Platform fee"
                value={formatMoney(open.platform_fee ?? 0, open.currency)}
              />
              <KeyValue
                label="Gateway fee"
                value={formatMoney(open.gateway_fee ?? 0, open.currency)}
              />
              <KeyValue
                label="Total charged"
                value={formatMoney(open.total_charged ?? open.amount, open.currency)}
              />
            </div>

            <div>
              <h3 className="eyebrow mb-2">What the payer submitted</h3>
              {open.field_values && Object.keys(open.field_values).length ? (
                <dl className="rounded-xl border border-line bg-white px-4">
                  {Object.entries(open.field_values).map(([key, value]) => (
                    <KeyValue
                      key={key}
                      label={key.replace(/_/g, " ")}
                      value={String(value)}
                    />
                  ))}
                </dl>
              ) : (
                <p className="muted">
                  No payer fields were collected for this payment.
                </p>
              )}
            </div>

            {open.status === "pending" ? (
              <InlineNote tone="warning" title="Still waiting on the gateway">
                This payment is not confirmed yet. Confirmation normally arrives
                within seconds of the transfer, and within 15 minutes in the
                worst case via reconciliation.
              </InlineNote>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(refundTarget)}
        title="Refund this payment?"
        description="The payer receives the amount back through the original gateway."
        confirmLabel="Confirm refund"
        destructive
        loading={refund.loading}
        onConfirm={async () => {
          if (!refundTarget) return;
          try {
            await refund.run(refundTarget.id, refundReason || "Requested from dashboard");
            await transactions.refetch();
            success("Refund started", `${refundTarget.reference} is being returned.`);
            setRefundTarget(null);
            setOpen(null);
          } catch (err) {
            toastError("Refund failed", err instanceof Error ? err.message : "");
          }
        }}
        onClose={() => setRefundTarget(null)}
      >
        <Field label="Reason for the refund" htmlFor="refund-reason">
          <Textarea
            id="refund-reason"
            value={refundReason}
            onChange={(event) => setRefundReason(event.target.value)}
            placeholder="e.g. Paid twice by mistake."
          />
        </Field>
        <p className="hint mt-2 flex items-center gap-1.5">
          <RotateCcw size={12} /> Jeneviv fees on refunded payments are not
          returned.
        </p>
        <div className="mt-3">
          <Pill tone="amber">Admin action</Pill>
        </div>
      </ConfirmDialog>
    </>
  );
}
