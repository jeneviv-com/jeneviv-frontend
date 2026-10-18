import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { adminAPI, type Transaction } from "@/lib/api";
import { useAction, useRefunds, useTransactions } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  formatDateTime,
  formatMoney,
  timeAgo,
  transactionPayer,
} from "@/lib/format";
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  PageHeader,
  StatCard,
  StatusPill,
  TableSkeleton,
  Textarea,
} from "@/components/ui";

export default function Refunds() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const [target, setTarget] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");

  const refunds = useRefunds();
  const transactions = useTransactions({ status: "success" });

  const refund = useAction((id: string, why: string) =>
    adminAPI.refundTransaction(id, why),
  );

  const totals = useMemo(() => {
    const issued = refunds.data ?? [];
    return {
      count: issued.length,
      value: issued.reduce((sum, item) => sum + item.amount, 0),
      processing: issued.filter((item) => item.status !== "success").length,
      refundable: (transactions.data ?? []).length,
    };
  }, [refunds.data, transactions.data]);

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Refunds"
        description="Return a payment to the payer and keep the reversal attached to the original transaction."
      />

      {!isAdmin ? (
        <InlineNote tone="warning" title="Admin access required">
          Refunds are an administrative action on the Jeneviv API. Ask a
          workspace admin to issue one — everyone else can still see the refund
          history below.
        </InlineNote>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Refunds issued"
          value={String(totals.count)}
          hint="All time"
          icon={<Undo2 size={16} />}
          tone="brand"
        />
        <StatCard label="Value refunded" value={formatMoney(totals.value)} hint="Original payment amounts" />
        <StatCard
          label="Still processing"
          value={String(totals.processing)}
          hint="Gateway has not confirmed the reversal"
        />
        <StatCard
          label="Refundable payments"
          value={String(totals.refundable)}
          hint="Successful payments in your ledger"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card padded={false}>
          <div className="px-5 pb-3 pt-5">
            <h2 className="section-title">Refund history</h2>
            <p className="muted mt-0.5">
              Refunds are returned through the original payment method
            </p>
          </div>
          {refunds.loading ? (
            <TableSkeleton rows={3} cols={4} />
          ) : refunds.error ? (
            <ErrorState message={refunds.error} onRetry={refunds.refetch} />
          ) : (refunds.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Undo2 size={20} />}
              title="No refunds issued"
              description="When you return a payment to a payer, the reversal appears here with its gateway reference."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {(refunds.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono text-3xs">{item.transaction_id}</td>
                      <td className="tabular font-semibold">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="max-w-[240px] text-ink-soft">{item.reason || "—"}</td>
                      <td>
                        <StatusPill status={item.status} />
                      </td>
                      <td className="text-ink-muted">{timeAgo(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="px-5 pb-3 pt-5">
            <h2 className="section-title">Refund a payment</h2>
            <p className="muted mt-0.5">
              Pick a successful payment to return to the payer
            </p>
          </div>
          {transactions.loading ? (
            <TableSkeleton rows={4} cols={2} />
          ) : (transactions.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Undo2 size={20} />}
              title="Nothing to refund"
              description="Successful payments appear here once a collection starts receiving money."
              action={
                <Link to="/transactions" className="btn btn-secondary btn-sm">
                  View transactions
                </Link>
              }
            />
          ) : (
            <ul className="max-h-[460px] divide-y divide-line-soft overflow-y-auto">
              {(transactions.data ?? []).slice(0, 25).map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">
                      {transactionPayer(transaction)}
                    </p>
                    <p className="font-mono text-3xs text-ink-muted">
                      {transaction.reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-[13px] font-semibold">
                      {formatMoney(transaction.amount, transaction.currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-[#fdecea]"
                      disabled={!isAdmin}
                      onClick={() => {
                        setTarget(transaction);
                        setReason("");
                      }}
                    >
                      Refund
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="How refunds work" />
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            [
              "Requested",
              "You confirm the payment and give a reason. The reversal is recorded against the transaction.",
            ],
            [
              "Returned by the gateway",
              "Flutterwave sends the money back to the original bank account or card, usually within 3–5 business days.",
            ],
            [
              "Visible to the payer",
              "The payer sees the credit on their statement. Jeneviv fees on the original payment are not returned.",
            ],
          ].map(([title, body]) => (
            <li key={title} className="rounded-xl border border-line bg-cream px-4 py-3">
              <p className="text-[13px] font-semibold">{title}</p>
              <p className="muted mt-1">{body}</p>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={Boolean(target)}
        title="Refund this payment?"
        description="The payer gets the full amount back through the original gateway."
        confirmLabel="Confirm refund"
        destructive
        loading={refund.loading}
        onConfirm={async () => {
          if (!target) return;
          try {
            await refund.run(target.id, reason || "Requested from dashboard");
            await refunds.refetch();
            await transactions.refetch();
            success(
              "Refund started",
              `${target.reference} is being returned to the payer.`,
            );
            setTarget(null);
          } catch (err) {
            toastError("Refund failed", err instanceof Error ? err.message : "");
          }
        }}
        onClose={() => setTarget(null)}
      >
        <Field label="Reason" htmlFor="refund-reason">
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Student withdrew from the course."
          />
        </Field>
        {target ? (
          <p className="hint mt-2">
            {target.reference} · {formatDateTime(target.created_at)} ·{" "}
            {formatMoney(target.amount, target.currency)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
