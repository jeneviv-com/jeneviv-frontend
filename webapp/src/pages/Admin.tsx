import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Ban,
  Building2,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react";
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
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  Modal,
  PageHeader,
  Pill,
  SegmentedControl,
  StatCard,
  StatusPill,
  TableSkeleton,
  Tabs,
  Textarea,
} from "@/components/ui";

type Tab = "merchants" | "transactions" | "audit";

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

  const approve = useAction((id: string, why: string) =>
    adminAPI.approveMerchant(id, why),
  );
  const reject = useAction((id: string, why: string) =>
    adminAPI.rejectMerchant(id, why),
  );
  const suspend = useAction((id: string, why: string) =>
    adminAPI.suspendMerchant(id, why),
  );
  const refund = useAction((id: string, why: string) =>
    adminAPI.refundTransaction(id, why),
  );

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
      <Card>
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Admin access required"
          description="This console is limited to platform administrators. Your account does not have that role."
        />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Admin"
        description="Merchant approvals, platform volume, refunds and the audit trail behind every action."
        actions={
          <Pill tone="blue">
            <ShieldCheck size={12} /> {user?.email}
          </Pill>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Merchants"
          value={formatNumber(stats.data?.total_merchants ?? 0)}
          hint={`${stats.data?.pending_merchants ?? 0} awaiting review`}
          icon={<Building2 size={16} />}
          tone="brand"
        />
        <StatCard
          label="Transactions"
          value={formatNumber(stats.data?.total_transactions ?? 0)}
          hint="Across all workspaces"
        />
        <StatCard
          label="Volume"
          value={formatMoney(stats.data?.total_volume ?? 0)}
          hint="Successful payments processed"
          tone="green"
        />
        <StatCard
          label="Pending payouts"
          value={formatNumber(stats.data?.pending_payouts ?? 0)}
          hint="Awaiting gateway completion"
          icon={<Activity size={16} />}
        />
      </div>

      <div className="mt-5">
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

      <div className="mt-5">
        {tab === "merchants" ? (
          <Card padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3">
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
              <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
                {merchants.data?.length ?? 0} workspaces
              </span>
            </div>

            {merchants.loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : merchants.error ? (
              <ErrorState message={merchants.error} onRetry={merchants.refetch} />
            ) : (merchants.data ?? []).length === 0 ? (
              <EmptyState
                icon={<BadgeCheck size={20} />}
                title={`No ${merchantStatus} workspaces`}
                description="Nothing to review in this state right now."
              />
            ) : (
              <div className="overflow-x-auto">
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
                    {(merchants.data ?? []).map((merchant) => (
                      <tr key={merchant.id}>
                        <td>
                          <p className="font-semibold">
                            {merchant.display_name || merchant.displayName}
                          </p>
                          <p className="font-mono text-3xs text-ink-muted">
                            {merchant.id}
                          </p>
                        </td>
                        <td className="max-w-[320px] text-ink-soft">
                          {merchant.application_note || "—"}
                        </td>
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
            )}
          </Card>
        ) : null}

        {tab === "transactions" ? (
          <Card padded={false}>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <h2 className="section-title">Platform transactions</h2>
                <p className="muted mt-0.5">
                  Successful payments can be refunded from here
                </p>
              </div>
              <Pill tone="neutral">{formatNumber(transactions.data?.length ?? 0)} rows</Pill>
            </div>
            {transactions.loading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : transactions.error ? (
              <ErrorState message={transactions.error} onRetry={transactions.refetch} />
            ) : (
              <div className="overflow-x-auto">
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
                    {(transactions.data ?? []).slice(0, 60).map((transaction) => (
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
                        <td className="text-ink-muted">
                          {formatDate(transaction.created_at)}
                        </td>
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
            )}
          </Card>
        ) : null}

        {tab === "audit" ? (
          <Card>
            <CardHeader
              title="Audit trail"
              subtitle="Every administrative and merchant action, with its actor"
            />
            {logs.loading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : logs.error ? (
              <ErrorState message={logs.error} onRetry={logs.refetch} />
            ) : (
              <ol className="relative pl-5">
                <span className="absolute left-1.5 top-2 bottom-2 w-px bg-line" />
                {(logs.data ?? []).map((log) => (
                  <li key={log.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[15px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
                    <p className="text-[13px] font-semibold">
                      {log.action.replace(/[._]/g, " ")}
                    </p>
                    <p className="muted mt-0.5">
                      {log.entity_type} · {log.entity_id}
                    </p>
                    <p className="mt-1 font-mono text-3xs text-ink-muted">
                      {formatDateTime(log.created_at)} · actor{" "}
                      {log.actor_uid || "system"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ) : null}
      </div>

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
          <InlineNote tone="info">
            Actions are recorded with your user id and timestamp.
          </InlineNote>
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
