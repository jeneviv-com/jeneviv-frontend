import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { adminAPI, refundsAPI, type Refund, type Transaction } from "@/lib/api";
import {
  useAction,
  useBanks,
  useRefunds,
  useTransactions,
} from "@/hooks/useApi";
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
  Input,
  Modal,
  PageHeader,
  Select,
  StatusPill,
  TableSkeleton,
  Textarea,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

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
        className={`flex min-h-[92px] items-center justify-between gap-3 rounded-[20px] border border-ink px-5 py-4 lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_MEANING[tone]}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight lg:text-[16px]">{label}</p>
          <p className="mt-0.5 truncate text-[12px] opacity-70 lg:text-[13px]">{hint}</p>
        </div>
        <p className="shrink-0 text-right text-[19px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[24px]">{value}</p>
      </div>
    </div>
  );
}

export default function Refunds() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const [target, setTarget] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");
  const [bankTarget, setBankTarget] = useState<Refund | null>(null);
  const [bankForm, setBankForm] = useState({
    account_number: "",
    bank_code: "",
  });

  const refunds = useRefunds();
  const transactions = useTransactions({ status: "success" });
  const banks = useBanks("NG");

  const refund = useAction((id: string, why: string) =>
    adminAPI.refundTransaction(id, why),
  );

  const retryRefund = useAction(
    (refundId: string, accountNumber: string, bankCode: string) =>
      refundsAPI.retry(refundId, accountNumber, bankCode),
  );

  const submitBankDetails = async () => {
    if (!bankTarget) return;
    try {
      await retryRefund.run(bankTarget.id, bankForm.account_number, bankForm.bank_code);
      await refunds.refetch();
      success(
        "Refund sent back to Paystack",
        "We will mark it complete as soon as the gateway confirms it.",
      );
      setBankTarget(null);
    } catch (err) {
      toastError(
        "Could not retry the refund",
        err instanceof Error ? err.message : "",
      );
    }
  };

  const totals = useMemo(() => {
    const issued = refunds.data ?? [];
    return {
      count: issued.length,
      value: issued.reduce((sum, item) => sum + item.amount, 0),
      processing: issued.filter((item) => item.status === "pending").length,
      needsAttention: issued.filter((item) => item.status === "needs_attention").length,
    };
  }, [refunds.data]);

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Refunds"
        description="Return a payment to the payer and keep the reversal attached to the original transaction."
      />

      <div className="mb-6 lg:grid lg:grid-cols-3 lg:gap-4">
        {!isAdmin ? (
          <div className="relative -mt-6 first:mt-0 lg:col-span-3 lg:mt-0">
            <InlineNote tone="warning" title="Admin access required">
              Refunds are an administrative action on the Jeneviv API. Ask a
              workspace admin to issue one — everyone else can still see the refund
              history below.
            </InlineNote>
          </div>
        ) : refunds.data && refunds.data.length === 0 && !refunds.loading ? (
          <div className="relative -mt-6 first:mt-0 lg:col-span-3 lg:mt-0">
            <InlineNote tone="info" title="Feature availability">
              The refunds feature is available in demo mode or when the backend refunds
              table is fully configured. If you're seeing this message in production,
              contact your system administrator to complete the database setup.
            </InlineNote>
          </div>
        ) : null}
      </div>

      {/* summary: one tile per meaning */}
      <div className="mb-6 lg:grid lg:grid-cols-3 lg:gap-4">
        <SummaryTile
          index={0}
          tone={totals.needsAttention ? "attention" : "neutral"}
          label="Needs attention"
          value={String(totals.needsAttention)}
          hint={
            totals.needsAttention
              ? "Add the payer's bank details to finish"
              : `${totals.processing} still processing`
          }
        />
        <SummaryTile
          index={1}
          tone="people"
          label="Refunds issued"
          value={String(totals.count)}
          hint="All time"
        />
        <SummaryTile
          index={2}
          tone="neutral"
          label="Value refunded"
          value={formatMoney(totals.value)}
          hint="Original payment amounts"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card padded={false}>
          <div className="px-5 pb-3 pt-5">
            <h2 className="section-title">Refund history</h2>
            <p className="muted mt-0.5">Refunds are returned through the original payment method</p>
          </div>

          {refunds.loading ? (
            <div className="px-5 pb-6">
              <TableSkeleton rows={3} cols={3} />
            </div>
          ) : refunds.error ? (
            <ErrorState message={refunds.error} onRetry={refunds.refetch} />
          ) : (refunds.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Undo2 size={20} />}
              title="No refunds issued"
              description="When you return a payment to a payer, the reversal appears here with its gateway reference."
            />
          ) : (
            <>
              {/* phones: one card per refund */}
              <ul className="space-y-3 px-4 pb-5 md:hidden">
                {(refunds.data ?? []).map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-[18px] border border-ink p-4 ${
                      item.status === "needs_attention" ? TONE_MEANING.attention : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] opacity-75 truncate">
                          {item.transaction_id}
                        </p>
                        <p className="mt-1 text-[13px] font-medium opacity-90">
                          {item.reason || "No reason given"}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-[15px] font-bold">
                        {formatMoney(item.amount)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11.5px]">
                        <StatusPill status={item.status} />
                        <span className="opacity-75">{timeAgo(item.created_at)}</span>
                      </div>
                      {item.status === "needs_attention" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setBankTarget(item);
                            setBankForm({ account_number: "", bank_code: "" });
                          }}
                        >
                          Add bank details
                        </Button>
                      ) : item.failure_reason ? (
                        <span className="text-[11px] opacity-75" title={item.failure_reason}>
                          {item.failure_reason.slice(0, 32)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              {/* tablets and up: the full table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(refunds.data ?? []).map((item) => (
                      <tr key={item.id}>
                        <td className="font-mono text-3xs">{item.transaction_id}</td>
                        <td className="tabular font-semibold">{formatMoney(item.amount)}</td>
                        <td className="max-w-[240px] text-ink-soft">{item.reason || "—"}</td>
                        <td>
                          <StatusPill status={item.status} />
                        </td>
                        <td className="text-ink-muted">{timeAgo(item.created_at)}</td>
                        <td className="text-right">
                          {item.status === "needs_attention" ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setBankTarget(item);
                                setBankForm({ account_number: "", bank_code: "" });
                              }}
                            >
                              Add bank details
                            </Button>
                          ) : item.failure_reason ? (
                            <span className="text-[11px] text-ink-muted" title={item.failure_reason}>
                              {item.failure_reason.slice(0, 32)}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card padded={false}>
          <div className="px-5 pb-3 pt-5">
            <h2 className="section-title">Refund a payment</h2>
            <p className="muted mt-0.5">Pick a successful payment to return to the payer</p>
          </div>
          {transactions.loading ? (
            <div className="px-5 pb-6">
              <TableSkeleton rows={4} cols={2} />
            </div>
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
            <ul className="max-h-[460px] space-y-2.5 overflow-y-auto px-4 pb-4">
              {(transactions.data ?? []).slice(0, 25).map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-line bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">
                      {transactionPayer(transaction)}
                    </p>
                    <p className="font-mono text-3xs text-ink-muted">{transaction.reference}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
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
              "Returned by Paystack",
              "The reversal leaves your settlement and returns to the original bank account or card, usually within 3–5 business days.",
            ],
            [
              "Payer details needed",
              "If Paystack cannot route the refund, the payment is marked “Needs attention”. Add the payer's account number and the refund is retried.",
            ],
          ].map(([title, body]) => (
            <li key={title} className="rounded-[16px] border border-ink/15 bg-cream px-4 py-3.5">
              <p className="text-[13px] font-semibold">{title}</p>
              <p className="muted mt-1">{body}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={Boolean(bankTarget)}
        onClose={() => setBankTarget(null)}
        title="Where should this refund go?"
        description="Paystack needs the payer's bank account to complete the reversal."
        footer={
          <>
            <Button variant="secondary" onClick={() => setBankTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={retryRefund.loading}
              disabled={!bankForm.bank_code || bankForm.account_number.length !== 10}
              onClick={submitBankDetails}
            >
              Send to Paystack
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Payer's bank" htmlFor="refund-bank">
            <Select
              id="refund-bank"
              value={bankForm.bank_code}
              onChange={(event) => setBankForm({ ...bankForm, bank_code: event.target.value })}
            >
              <option value="">Select a bank</option>
              {(banks.data ?? []).map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Payer's account number"
            htmlFor="refund-account"
            hint="Any valid account belonging to the payer — it can differ from the one used to pay."
          >
            <Input
              id="refund-account"
              inputMode="numeric"
              maxLength={10}
              className="font-mono"
              value={bankForm.account_number}
              onChange={(event) =>
                setBankForm({
                  ...bankForm,
                  account_number: event.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              placeholder="0123456789"
            />
          </Field>
          <InlineNote tone="info">
            The refund is funded from the original payment's settlement, so
            Jeneviv never fronts merchant money. The ₦75 platform fee stays with
            Jeneviv.
          </InlineNote>
          {bankTarget ? (
            <p className="hint">
              Refund {bankTarget.id.slice(0, 10)} · {formatMoney(bankTarget.amount)}
            </p>
          ) : null}
        </div>
      </Modal>

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
            success("Refund started", `${target.reference} is being returned to the payer.`);
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
