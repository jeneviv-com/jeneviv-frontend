import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  merchantsAPI,
  payoutsAPI,
  withdrawalsAPI,
  type BankAccount,
} from "@/lib/api";
import {
  useAction,
  useBankAccounts,
  useBanks,
  useKyc,
  usePayouts,
  useTransactions,
  useWithdrawals,
} from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { computeBalances } from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  pick,
  statusTone,
  timeAgo,
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
  Pill,
  Select,
  StatCard,
  StatusPill,
  TableSkeleton,
  Toggle,
} from "@/components/ui";

export default function Payouts() {
  const { merchant, refreshMerchant } = useAuth();
  const { success, error: toastError } = useToast();

  const payouts = usePayouts();
  const accounts = useBankAccounts();
  const banks = useBanks("NG");
  const transactions = useTransactions();
  const kyc = useKyc();
  const withdrawals = useWithdrawals();

  const escrow = kyc.data?.escrow_enabled ?? false;
  const canWithdraw = kyc.data?.can_withdraw ?? false;
  const available = (kyc.data?.withdrawable_minor ?? 0) / 100;

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BankAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    bank_code: "",
    account_number: "",
    is_default: false,
  });
  const [payoutForm, setPayoutForm] = useState({ accountId: "", amount: "" });
  const [approvalLink, setApprovalLink] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const addAccount = useAction((data: {
    bank_code: string;
    account_number: string;
    is_default?: boolean;
  }) => merchantsAPI.bankAccounts.add(data));
  const setDefaultAccount = useAction((id: string) =>
    merchantsAPI.bankAccounts.setDefault(id),
  );
  const deleteAccount = useAction((id: string) =>
    merchantsAPI.bankAccounts.delete(id),
  );
  const initiatePayout = useAction((accountId: string, amount: number) =>
    payoutsAPI.initiate(accountId, amount),
  );
  const createWithdrawal = useAction((amount: number) =>
    withdrawalsAPI.create(amount),
  );
  const updateSettings = useAction((settings: Parameters<typeof merchantsAPI.updateSettings>[0]) =>
    merchantsAPI.updateSettings(settings),
  );

  const accountDetails = (account: BankAccount | undefined) => {
    const source = account as unknown as Record<string, unknown> | undefined;
    return {
      bankCode: pick<string>(source, "bank_code", "bankCode") ?? "",
      bankName: pick<string>(source, "bank_name", "bankName") ?? "",
      accountNumber: pick<string>(source, "account_number", "accountNumber") ?? "",
      accountName: pick<string>(source, "account_name", "accountName") ?? "",
      isDefault: Boolean(pick<boolean>(source, "is_default", "isDefault")),
    };
  };

  const balances = useMemo(() => {
    const computed = computeBalances({
      transactions: transactions.data ?? [],
      payouts: payouts.data ?? [],
      refunds: [],
    });
    return {
      available: merchant?.payouts_balance_ngn ?? computed.available,
      collected: merchant?.wallet_balance_ngn ?? computed.collected,
      pending: computed.pendingPayouts,
    };
  }, [merchant, transactions.data, payouts.data]);

  const settledThisMonth = useMemo(() => {
    const now = new Date();
    return (payouts.data ?? [])
      .filter((payout) => {
        if (payout.status !== "success") return false;
        const created = new Date(
          pick<string>(payout as unknown as Record<string, unknown>, "created_at", "createdAt") ??
            "",
        );
        if (Number.isNaN(created.getTime())) return false;
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, payout) => sum + payout.amount, 0);
  }, [payouts.data]);

  const defaultAccount =
    (accounts.data ?? []).find(
      (account) => accountDetails(account).isDefault,
    ) ?? (accounts.data ?? [])[0];
  const defaultAccountDetails = accountDetails(defaultAccount);

  const mode =
    pick<string>(
      merchant as unknown as Record<string, unknown>,
      "payoutMode",
      "payout_mode",
    ) ??
    merchant?.settings?.payout_mode ??
    "manual";

  const submitAccount = async () => {
    try {
      await addAccount.run({
        bank_code: accountForm.bank_code,
        account_number: accountForm.account_number,
        is_default: accountForm.is_default,
      });
      await accounts.refetch();
      success(
        "Bank account linked",
        "Settlement will use this account once it is verified.",
      );
      setShowAddAccount(false);
      setAccountForm({ bank_code: "", account_number: "", is_default: false });
    } catch (err) {
      toastError("Could not add the account", err instanceof Error ? err.message : "");
    }
  };

  const submitPayout = async () => {
    const amount = Number(payoutForm.amount.replace(/[,\s]/g, ""));
    if (!amount) return;
    if (escrow) {
      try {
        const result = await createWithdrawal.run(Math.round(amount * 100));
        setApprovalLink(result.approval_link ?? null);
        setDevOtp(result.dev_otp ?? null);
        await withdrawals.refetch();
        await refreshMerchant();
        success(
          "Sweep sent to the treasurer",
          "Money leaves only after their OTP approval.",
        );
      } catch (err) {
        toastError("Sweep failed", err instanceof Error ? err.message : "");
      }
      return;
    }
    if (!payoutForm.accountId) return;
    try {
      await initiatePayout.run(payoutForm.accountId, amount);
      await payouts.refetch();
      await refreshMerchant();
      success(
        "Payout requested",
        `${formatMoney(amount)} is on its way to your bank.`,
      );
      setShowPayout(false);
      setPayoutForm({ accountId: "", amount: "" });
    } catch (err) {
      toastError("Payout failed", err instanceof Error ? err.message : "");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Payouts"
        description="What is available to withdraw, where it settles, and every transfer we have made for you."
        actions={
          <Button
            icon={<Wallet size={15} />}
            onClick={() => {
              setApprovalLink(null);
              setDevOtp(null);
              setPayoutForm({
                accountId: defaultAccount?.id ?? "",
                amount: String(available || ""),
              });
              setShowPayout(true);
            }}
            disabled={escrow ? !canWithdraw : !accounts.data?.length}
          >
            {escrow ? "Sweep funds" : "Withdraw funds"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available now"
          value={formatMoney(escrow ? available : balances.available)}
          hint={
            escrow
              ? "Held in escrow until two approvals"
              : "Confirmed payments minus payouts and refunds"
          }
          tone="brand"
          icon={<Banknote size={16} />}
        />
        <StatCard
          label="Lifetime collected"
          value={formatMoney(balances.collected)}
          hint="All successful payments"
        />
        <StatCard
          label="Settled this month"
          value={formatMoney(settledThisMonth)}
          hint="Successful payouts in the current month"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          label="Settlement account"
          value={
            defaultAccount
              ? `••${defaultAccountDetails.accountNumber.slice(-4)}`
              : "None"
          }
          hint={defaultAccountDetails.bankName || "Add a bank account to withdraw"}
          icon={<Building2 size={16} />}
        />
      </div>

      {escrow ? (
        <Card className="mt-5" padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="section-title">Sweep approvals</h2>
              <p className="muted mt-0.5">
                The rep requests, the treasurer approves with an OTP, then the
                bank transfer is sent.
              </p>
            </div>
            <Pill tone={kyc.data?.treasurer_phone ? "green" : "amber"}>
              {kyc.data?.treasurer_phone
                ? `Treasurer · ${kyc.data.treasurer_name}`
                : "Treasurer not set"}
            </Pill>
          </div>
          {withdrawals.loading ? (
            <TableSkeleton rows={3} cols={4} />
          ) : (withdrawals.data ?? []).length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={20} />}
              title="No sweeps yet"
              description="When the rep requests a sweep, both approval timestamps appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Rep approved</th>
                    <th>Treasurer approved</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {(withdrawals.data ?? []).slice(0, 8).map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="tabular font-semibold">
                        {formatMoney(withdrawal.amount / 100, withdrawal.currency)}
                      </td>
                      <td>
                        <StatusPill status={withdrawal.status} />
                        {withdrawal.failure_reason ? (
                          <p className="mt-1 max-w-[220px] text-[11px] text-danger">
                            {withdrawal.failure_reason}
                          </p>
                        ) : null}
                      </td>
                      <td className="text-ink-muted">
                        {formatDateTime(withdrawal.requested_at)}
                      </td>
                      <td className="text-ink-muted">
                        {withdrawal.treasurer_approved_at ? (
                          formatDateTime(withdrawal.treasurer_approved_at)
                        ) : withdrawal.status === "pending_treasurer" ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Clock3 size={12} /> waiting
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="font-mono text-3xs text-ink-muted">
                        {withdrawal.gateway_ref ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="section-title">Payout history</h2>
              <p className="muted mt-0.5">
                Automatic settlements run at 10:00 and 22:00, every day
              </p>
            </div>
            <Pill tone="green">T+0</Pill>
          </div>

          {payouts.loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : payouts.error ? (
            <ErrorState message={payouts.error} onRetry={payouts.refetch} />
          ) : (payouts.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Banknote size={20} />}
              title="No payouts yet"
              description="Your first settlement lands after the next scheduled run. You can also withdraw manually at any time."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Initiated</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {(payouts.data ?? []).map((payout) => (
                    <tr key={payout.id}>
                      <td>
                        <p className="font-semibold">
                          {pick<string>(
                            payout as unknown as Record<string, unknown>,
                            "bank_code",
                            "bankCode",
                          )
                            ? `Bank ••${(
                                pick<string>(
                                  payout as unknown as Record<string, unknown>,
                                  "account_number",
                                  "accountNumber",
                                ) ?? ""
                              ).slice(-4)}`
                            : "Bank account"}
                        </p>
                        <p className="font-mono text-3xs text-ink-muted">
                          {pick<string>(
                            payout as unknown as Record<string, unknown>,
                            "gateway_ref",
                            "gatewayRef",
                          ) ?? "—"}
                        </p>
                      </td>
                      <td className="tabular font-semibold">
                        {formatMoney(payout.amount, payout.currency)}
                      </td>
                      <td>
                        <StatusPill status={payout.status} />
                        {pick<string>(
                          payout as unknown as Record<string, unknown>,
                          "failure_reason",
                          "failureReason",
                        ) ? (
                          <p className="mt-1 max-w-[220px] text-[11px] text-danger">
                            {pick<string>(
                              payout as unknown as Record<string, unknown>,
                              "failure_reason",
                              "failureReason",
                            )}
                          </p>
                        ) : null}
                      </td>
                      <td className="text-ink-muted">
                        <span
                          title={formatDateTime(
                            pick<string>(
                              payout as unknown as Record<string, unknown>,
                              "created_at",
                              "createdAt",
                            ),
                          )}
                        >
                          {timeAgo(
                            pick<string>(
                              payout as unknown as Record<string, unknown>,
                              "created_at",
                              "createdAt",
                            ),
                          )}
                        </span>
                        <span className="block font-mono text-3xs">
                          {pick<string>(
                            payout as unknown as Record<string, unknown>,
                            "initiated_by",
                            "initiatedBy",
                          ) === "cron"
                            ? "auto"
                            : "manual"}
                        </span>
                      </td>
                      <td className="text-ink-muted">
                        {payout.status === "success"
                          ? formatDateTime(
                              pick<string>(
                                payout as unknown as Record<string, unknown>,
                                "updated_at",
                                "updatedAt",
                                "created_at",
                                "createdAt",
                              ),
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Settlement schedule"
              subtitle="How often money leaves the platform"
              icon={<CalendarClock size={16} />}
            />
            <Field label="Payout mode" htmlFor="payout-mode">
              <Select
                id="payout-mode"
                value={mode}
                onChange={async (event) => {
                  try {
                    await updateSettings.run({
                      payout_mode: event.target.value as
                        | "manual"
                        | "auto_daily"
                        | "auto_weekly",
                    });
                    await refreshMerchant();
                    success("Settlement schedule updated");
                  } catch (err) {
                    toastError(
                      "Could not update",
                      err instanceof Error ? err.message : "",
                    );
                  }
                }}
              >
                <option value="manual">Manual — withdraw yourself</option>
                <option value="auto_daily">Automatic — twice daily</option>
                <option value="auto_weekly">Automatic — weekly</option>
              </Select>
            </Field>
            <div className="mt-4 space-y-2">
              {[
                ["Morning run", "10:00 daily"],
                ["Evening run", "22:00 daily"],
                ["Weekends", "Included"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-line-soft pb-2 text-[12.5px] last:border-b-0"
                >
                  <span className="text-ink-muted">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Bank accounts"
              subtitle="Settlement only goes to verified accounts"
              icon={<Building2 size={16} />}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => setShowAddAccount(true)}
                >
                  Add
                </Button>
              }
            />

            {accounts.loading ? (
              <TableSkeleton rows={2} cols={2} />
            ) : (accounts.data ?? []).length === 0 ? (
              <p className="muted">
                No bank account linked yet. Add one to receive settlements.
              </p>
            ) : (
              <ul className="space-y-3">
                {(accounts.data ?? []).map((account) => {
                  const details = accountDetails(account);
                  return (
                  <li
                    key={account.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-[13.5px] font-semibold">
                        {details.bankName || details.bankCode}
                        {details.isDefault ? (
                          <span className="pill pill-green">
                            <Star size={11} /> Default
                          </span>
                        ) : null}
                      </p>
                      <p className="font-mono text-3xs text-ink-muted">
                        {details.accountNumber} · {details.accountName || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!details.isDefault ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await setDefaultAccount.run(account.id);
                              await accounts.refetch();
                              success("Default account updated");
                            } catch (err) {
                              toastError(
                                "Could not update",
                                err instanceof Error ? err.message : "",
                              );
                            }
                          }}
                        >
                          Make default
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-[#fdecea]"
                        icon={<Trash2 size={13} />}
                        onClick={() => setPendingDelete(account)}
                        aria-label={`Remove ${details.bankName}`}
                      />
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        title="Add a bank account"
        description="We verify the account name against your workspace before settlement is enabled."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddAccount(false)}>
              Cancel
            </Button>
            <Button
              loading={addAccount.loading}
              disabled={
                !accountForm.bank_code || accountForm.account_number.length !== 10
              }
              onClick={submitAccount}
            >
              Add account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Bank" htmlFor="bank">
            <Select
              id="bank"
              value={accountForm.bank_code}
              onChange={(event) =>
                setAccountForm({ ...accountForm, bank_code: event.target.value })
              }
            >
              <option value="">Select your bank</option>
              {(banks.data ?? []).map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Account number"
            htmlFor="account-number"
            hint="10 digits (NUBAN)."
          >
            <Input
              id="account-number"
              inputMode="numeric"
              maxLength={10}
              value={accountForm.account_number}
              onChange={(event) =>
                setAccountForm({
                  ...accountForm,
                  account_number: event.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              placeholder="0123456789"
              className="font-mono"
            />
          </Field>
          <div className="rounded-xl border border-line bg-cream px-4 py-3">
            <Toggle
              checked={accountForm.is_default}
              onChange={(value) =>
                setAccountForm({ ...accountForm, is_default: value })
              }
              label="Use for automatic settlement"
              description="Payments settle into this account twice daily."
            />
          </div>
          <InlineNote tone="info">
            Settlement only works to an account in the same name as your
            workspace — this is how the gateway protects against fraud.
          </InlineNote>
        </div>
      </Modal>

      <Modal
        open={showPayout}
        onClose={() => {
          setShowPayout(false);
          setApprovalLink(null);
          setDevOtp(null);
        }}
        title={escrow ? "Sweep funds" : "Withdraw funds"}
        description={
          escrow
            ? "A sweep needs the rep and the treasurer. The transfer is sent only after both approve."
            : "Manual payouts leave the platform on the next gateway run."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPayout(false)}>
              Close
            </Button>
            <Button
              loading={escrow ? createWithdrawal.loading : initiatePayout.loading}
              disabled={
                escrow
                  ? !canWithdraw || !Number(payoutForm.amount) || Boolean(approvalLink)
                  : !payoutForm.accountId || !Number(payoutForm.amount)
              }
              onClick={submitPayout}
            >
              {escrow ? "Send to treasurer" : "Request payout"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-cream px-4 py-3">
            <p className="eyebrow">Available</p>
            <p className="tabular mt-1 text-[20px] font-extrabold">
              {formatMoney(escrow ? available : balances.available)}
            </p>
          </div>

          {escrow ? (
            <InlineNote tone={canWithdraw ? "info" : "warning"}>
              {canWithdraw
                ? `Treasurer: ${kyc.data?.treasurer_name} · ${kyc.data?.treasurer_phone}. They will get an SMS with a link and a one-time code.`
                : "Finish identity and bank verification in Settings before sweeping."}
            </InlineNote>
          ) : (
            <Field label="Destination account" htmlFor="payout-account">
              <Select
                id="payout-account"
                value={payoutForm.accountId}
                onChange={(event) =>
                  setPayoutForm({ ...payoutForm, accountId: event.target.value })
                }
              >
                <option value="">Select an account</option>
              {(accounts.data ?? []).map((account) => {
                const details = accountDetails(account);
                return (
                  <option key={account.id} value={account.id}>
                    {details.bankName || details.bankCode} ·{" "}
                    {details.accountNumber}
                    {details.isDefault ? " (default)" : ""}
                  </option>
                );
              })}
              </Select>
            </Field>
          )}

          <Field label="Amount" htmlFor="payout-amount">
            <Input
              id="payout-amount"
              inputMode="decimal"
              value={payoutForm.amount}
              onChange={(event) =>
                setPayoutForm({ ...payoutForm, amount: event.target.value })
              }
              className="tabular"
            />
          </Field>

          {approvalLink ? (
            <InlineNote tone="success" title="Waiting for the treasurer">
              <p className="break-all font-mono text-[11px]">{approvalLink}</p>
              {devOtp ? (
                <p className="mt-2 font-semibold">
                  Local test OTP: <span className="font-mono">{devOtp}</span>
                </p>
              ) : null}
            </InlineNote>
          ) : (
            <InlineNote tone="warning">
              {escrow
                ? "Funds stay in escrow until the treasurer approves. The rep alone can never move money."
                : "Payouts cannot be reversed once the gateway has processed them. Double-check the account number."}
            </InlineNote>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this bank account?"
        description="Settlements in progress will still complete."
        confirmLabel="Remove account"
        destructive
        loading={deleteAccount.loading}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteAccount.run(pendingDelete.id);
            await accounts.refetch();
            success("Bank account removed");
            setPendingDelete(null);
          } catch (err) {
            toastError("Could not remove", err instanceof Error ? err.message : "");
          }
        }}
        onClose={() => setPendingDelete(null)}
      />

      <p className="muted mt-5">
        Last checked {formatDate(new Date().toISOString())} ·{" "}
        <Pill tone={statusTone("approved")}>Payouts enabled</Pill>
      </p>
    </>
  );
}
