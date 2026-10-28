import { useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, Ban, ShieldCheck, Undo2, XCircle } from "lucide-react";
import { adminAPI, type Merchant, type MerchantStatus } from "@/lib/api";
import {
  useAction,
  useAdminMerchants,
  useAdminStats,
  useAdminTransactions,
  useAuditLogs,
} from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  timeAgo,
  transactionPayer,
} from "@/lib/format";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  Modal,
  PageHeader,
  SegmentedControl,
  StatusPill,
  TableSkeleton,
  Tabs,
  Textarea,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

type Tab = "merchants" | "transactions" | "audit";

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
        className={`flex min-h-[108px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_MEANING[tone]}`}
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

/** Small section header used inside the console: title, subtitle, optional aside. */
function Head({ title, subtitle, aside }: { title: string; subtitle: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="muted mt-0.5">{subtitle}</p>
      </div>
      {aside}
    </div>
  );
}

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<Tab>("merchants");
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus>("pending");
  const [action, setAction] = useState<{
    merchant: Merchant;
    type: "approve" | "reject" | "suspend";
  } | null>(null);
  const [note, setNote] = useState("");
  const [refundTarget, setRefundTarget] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const stats = useAdminStats(isAdmin);
  const merchants = useAdminMerchants(merchantStatus);
  const transactions = useAdminTransactions();
  const logs = useAuditLogs();

  const approve = useAction((id: string, why: string) => adminAPI.approveMerchant(id, why));
  const reject = useAction((id: string, why: string) => adminAPI.rejectMerchant(id, why));
  const suspend = useAction((id: string, why: string) => adminAPI.suspendMerchant(id, why));
  const refund = useAction((id: string, why: string) => adminAPI.refundTransaction(id, why));

  const runAction = useMemo(
    () => ({
      approve: approve.run,
      reject: reject.run,
      suspend: suspend.run,
    }),
    [approve.run, reject.run, suspend.run],
  );

  if (!isAdmin) {
    return (
      <div className="py-10">
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Admin access required"
          description="This console is limited to platform administrators. Your account does not have that role."
        />
      </div>
    );
  }

  const merchantRows = merchants.data ?? [];
  const txnRows = transactions.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Admin"
        description="Merchant approvals, platform volume, refunds and the audit trail behind every action."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-[12px] font-semibold text-ink-soft">
            <ShieldCheck size={13} /> {user?.email}
          </span>
        }
      />

      {/* summary: one tile per meaning */}
      <div className="mb-8 lg:grid lg:grid-cols-3 lg:gap-4">
        <SummaryTile
          index={0}
          tone="people"
          label="Merchants"
          value={formatNumber(stats.data?.total_merchants ?? 0)}
          hint={`${merchantStatus === "pending" ? merchants.data?.length : stats.data?.pending_merchants ?? 0} awaiting review`}
        />
        <SummaryTile
          index={1}
          tone="money"
          label="Volume"
          value={formatMoney(stats.data?.total_volume ?? 0)}
          hint={`${formatNumber(stats.data?.total_transactions ?? 0)} transactions across all workspaces`}
        />
        <SummaryTile
          index={2}
          tone={(stats.data?.pending_payouts ?? 0) > 0 ? "attention" : "neutral"}
          label="Pending payouts"
          value={formatNumber(stats.data?.pending_payouts ?? 0)}
          hint="Awaiting gateway completion"
        />
      </div>

      <div className="mb-8">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "merchants", label: "Merchant approvals" },
            { value: "transactions", label: "Transactions" },
            { value: "audit", label: "Audit trail" },
          ]}
        />
      </div>

      {/* merchants */}
      {tab === "merchants" ? (
        <section>
          <Head
            title="Workspaces"
            subtitle="Approve, reject or suspend the workspaces that collect money"
            aside={
              <div className="flex flex-wrap items-center gap-3">
                <SegmentedControl
                  value={merchantStatus}
                  onChange={(value) => setMerchantStatus(value as MerchantStatus)}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                  {merchantRows.length} workspaces
                </span>
              </div>
            }
          />

          {merchants.loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : merchants.error ? (
            <ErrorState message={merchants.error} onRetry={merchants.refetch} />
          ) : merchantRows.length === 0 ? (
            <EmptyState
              icon={<BadgeCheck size={20} />}
              title={`No ${merchantStatus} workspaces`}
              description="Nothing to review in this state right now."
            />
          ) : (
            <>
              {/* phones: one card per workspace */}
              <ul className="divide-y divide-line-soft md:hidden">
                {merchantRows.map((merchant) => (
                  <li key={merchant.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold tracking-tight">
                          {merchant.display_name || merchant.displayName}
                        </p>
                        <p className="mt-1 text-[13px] text-ink-soft">{merchant.application_note || "—"}</p>
                      </div>
                      <StatusPill status={merchant.status} />
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-ink-muted">
                      applied {timeAgo(merchant.createdAt)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {merchant.status !== "approved" ? (
                        <Button
                          size="sm"
                          icon={<BadgeCheck size={13} />}
                          onClick={() => {
                            setAction({ merchant, type: "approve" });
                            setNote("");
                          }}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {merchant.status !== "rejected" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<XCircle size={13} />}
                          onClick={() => {
                            setAction({ merchant, type: "reject" });
                            setNote("");
                          }}
                        >
                          Reject
                        </Button>
                      ) : null}
                      {merchant.status === "approved" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Ban size={13} />}
                          onClick={() => {
                            setAction({ merchant, type: "suspend" });
                            setNote("");
                          }}
                        >
                          Suspend
                        </Button>
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
                      <th>Workspace</th>
                      <th>What they collect</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {merchantRows.map((merchant) => (
                      <tr key={merchant.id}>
                        <td>
                          <p className="font-semibold">{merchant.display_name || merchant.displayName}</p>
                          <p className="font-mono text-3xs text-ink-muted">{merchant.id}</p>
                        </td>
                        <td className="max-w-[320px] text-ink-soft">{merchant.application_note || "—"}</td>
                        <td>
                          <StatusPill status={merchant.status} />
                        </td>
                        <td className="text-ink-muted">{timeAgo(merchant.createdAt)}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {merchant.status !== "approved" ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<BadgeCheck size={13} />}
                                onClick={() => {
                                  setAction({ merchant, type: "approve" });
                                  setNote("");
                                }}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {merchant.status !== "rejected" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger hover:bg-[#fdecea]"
                                icon={<XCircle size={13} />}
                                onClick={() => {
                                  setAction({ merchant, type: "reject" });
                                  setNote("");
                                }}
                              >
                                Reject
                              </Button>
                            ) : null}
                            {merchant.status === "approved" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Ban size={13} />}
                                onClick={() => {
                                  setAction({ merchant, type: "suspend" });
                                  setNote("");
                                }}
                              >
                                Suspend
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* transactions */}
      {tab === "transactions" ? (
        <section>
          <Head
            title="Platform transactions"
            subtitle="Successful payments can be refunded from here"
            aside={
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                {formatNumber(txnRows.length)} rows
              </span>
            }
          />

          {transactions.loading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : transactions.error ? (
            <ErrorState message={transactions.error} onRetry={transactions.refetch} />
          ) : (
            <>
              {/* phones: one card per transaction */}
              <ul className="divide-y divide-line-soft md:hidden">
                {txnRows.slice(0, 60).map((transaction) => (
                  <li key={transaction.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">{transactionPayer(transaction)}</p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">{transaction.reference}</p>
                      </div>
                      <p className="tabular shrink-0 text-[14px] font-bold">
                        {formatMoney(transaction.amount, transaction.currency)}
                      </p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11.5px] text-ink-muted">
                        <StatusPill status={transaction.status} />
                        <span>{transaction.collection_name || "—"} · {formatDate(transaction.created_at)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-[#fdecea]"
                        icon={<Undo2 size={13} />}
                        disabled={transaction.status !== "success"}
                        onClick={() => {
                          setRefundTarget(transaction.id);
                          setRefundReason("");
                        }}
                      >
                        Refund
                      </Button>
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
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {txnRows.slice(0, 60).map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <p className="font-semibold">{transactionPayer(transaction)}</p>
                          <p className="font-mono text-3xs text-ink-muted">{transaction.reference}</p>
                        </td>
                        <td className="text-ink-soft">{transaction.collection_name || "—"}</td>
                        <td className="tabular font-semibold">
                          {formatMoney(transaction.amount, transaction.currency)}
                        </td>
                        <td>
                          <StatusPill status={transaction.status} />
                        </td>
                        <td className="text-ink-muted">{formatDate(transaction.created_at)}</td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-[#fdecea]"
                            icon={<Undo2 size={13} />}
                            disabled={transaction.status !== "success"}
                            onClick={() => {
                              setRefundTarget(transaction.id);
                              setRefundReason("");
                            }}
                          >
                            Refund
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* audit trail: a timeline, no card */}
      {tab === "audit" ? (
        <section>
          <Head title="Audit trail" subtitle="Every administrative and merchant action, with its actor" />
          {logs.loading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : logs.error ? (
            <ErrorState message={logs.error} onRetry={logs.refetch} />
          ) : (
            <ol className="relative ml-2 border-l border-line pl-7">
              {(logs.data ?? []).map((log) => (
                <li key={log.id} className="relative pb-7 last:pb-0">
                  <span className="absolute -left-[33px] top-1.5 grid h-[15px] w-[15px] place-items-center rounded-full border border-ink bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                  </span>
                  <p className="text-[14px] font-bold capitalize tracking-tight">
                    {log.action.replace(/[._]/g, " ")}
                  </p>
                  <p className="muted mt-1">
                    {log.entity_type} · <span className="font-mono text-[12px]">{log.entity_id}</span>
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
                    {formatDateTime(log.created_at)} · actor {log.actor_uid || "system"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {/* approve / reject / suspend */}
      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={
          action?.type === "approve"
            ? "Approve workspace"
            : action?.type === "reject"
              ? "Reject application"
              : "Suspend workspace"
        }
        description={
          action?.type === "approve"
            ? "The workspace can start collecting and settling immediately."
            : action?.type === "reject"
              ? "The applicant can correct their details and apply again."
              : "Collections and payouts are paused until the account is reviewed."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              variant={action?.type === "approve" ? "primary" : "danger"}
              loading={approve.loading || reject.loading || suspend.loading}
              onClick={async () => {
                if (!action) return;
                try {
                  await runAction[action.type](action.merchant.id, note);
                  await merchants.refetch();
                  await stats.refetch();
                  success(
                    action.type === "approve"
                      ? "Workspace approved"
                      : action.type === "reject"
                        ? "Application rejected"
                        : "Workspace suspended",
                    action.merchant.display_name ?? action.merchant.id,
                  );
                  setAction(null);
                } catch (err) {
                  toastError("Action failed", err instanceof Error ? err.message : "");
                }
              }}
            >
              {action?.type === "approve" ? "Approve" : "Confirm"}
            </Button>
          </>
        }
      >
        <Field
          label="Note for the audit trail"
          htmlFor="merchant-note"
          hint="Optional, but useful when someone asks why a decision was made."
        >
          <Textarea
            id="merchant-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. KYC documents verified against CAC record."
          />
        </Field>
        <div className="mt-3">
          <InlineNote tone="info">Actions are recorded with your user id and timestamp.</InlineNote>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(refundTarget)}
        title="Refund this transaction?"
        description="The payer receives the amount back through the gateway."
        confirmLabel="Confirm refund"
        destructive
        loading={refund.loading}
        onConfirm={async () => {
          if (!refundTarget) return;
          try {
            await refund.run(refundTarget, refundReason || "Admin refund");
            await transactions.refetch();
            success("Refund started", "The reversal is queued with the gateway.");
            setRefundTarget(null);
          } catch (err) {
            toastError("Refund failed", err instanceof Error ? err.message : "");
          }
        }}
        onClose={() => setRefundTarget(null)}
      >
        <Field label="Reason" htmlFor="admin-refund-reason">
          <Textarea
            id="admin-refund-reason"
            value={refundReason}
            onChange={(event) => setRefundReason(event.target.value)}
            placeholder="Why is this payment being returned?"
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
