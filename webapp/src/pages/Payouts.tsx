import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Plus,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  merchantsAPI,
  payoutsAPI,
  type BankAccount,
} from "@/lib/api";
import {
  useAction,
  useBankAccounts,
  useBanks,
  usePayouts,
  useTransactions,
} from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { computeBalances } from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatMoney,
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

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BankAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    bank_code: "",
    account_number: "",
    is_default: false,
  });
  const [payoutForm, setPayoutForm] = useState({ accountId: "", amount: "" });

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
  const updateSettings = useAction((settings: Parameters<typeof merchantsAPI.updateSettings>[0]) =>
    merchantsAPI.updateSettings(settings),
  );

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
        const created = new Date(payout.created_at);
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, payout) => sum + payout.amount, 0);
  }, [payouts.data]);

  const defaultAccount =
    (accounts.data ?? []).find((account) => account.is_default) ??
    (accounts.data ?? [])[0];

  const mode = merchant?.settings?.payout_mode ?? "manual";

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
    if (!payoutForm.accountId || !amount) return;
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
              setPayoutForm({
                accountId: defaultAccount?.id ?? "",
                amount: String(balances.available || ""),
              });
              setShowPayout(true);
            }}
            disabled={!accounts.data?.length}
          >
            Withdraw funds
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available now"
          value={formatMoney(balances.available)}
          hint="Confirmed payments minus payouts and refunds"
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
            defaultAccount ? `••${defaultAccount.account_number.slice(-4)}` : "None"
          }
          hint={defaultAccount?.bank_name ?? "Add a bank account to withdraw"}
          icon={<Building2 size={16} />}
        />
      </div>

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
                          {payout.bank_code
                            ? `Bank ••${payout.account_number.slice(-4)}`
                            : "Bank account"}
                        </p>
                        <p className="font-mono text-3xs text-ink-muted">
                          {payout.gateway_ref}
                        </p>
                      </td>
                      <td className="tabular font-semibold">
                        {formatMoney(payout.amount, payout.currency)}
                      </td>
                      <td>
                        <StatusPill status={payout.status} />
                        {payout.failure_reason ? (
                          <p className="mt-1 max-w-[220px] text-[11px] text-danger">
                            {payout.failure_reason}
                          </p>
                        ) : null}
                      </td>
                      <td className="text-ink-muted">
                        <span title={formatDateTime(payout.created_at)}>
                          {timeAgo(payout.created_at)}
                        </span>
                        <span className="block font-mono text-3xs">
                          {payout.initiated_by === "cron" ? "auto" : "manual"}
                        </span>
                      </td>
                      <td className="text-ink-muted">
                        {payout.status === "success"
                          ? formatDateTime(payout.updated_at ?? payout.created_at)
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
                {(accounts.data ?? []).map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-[13.5px] font-semibold">
                        {account.bank_name || account.bank_code}
                        {account.is_default ? (
                          <span className="pill pill-green">
                            <Star size={11} /> Default
                          </span>
                        ) : null}
                      </p>
                      <p className="font-mono text-3xs text-ink-muted">
                        {account.account_number} · {account.account_name || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!account.is_default ? (
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
                        aria-label={`Remove ${account.bank_name}`}
                      />
                    </div>
                  </li>
                ))}
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
        onClose={() => setShowPayout(false)}
        title="Withdraw funds"
        description="Manual payouts leave the platform on the next gateway run."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPayout(false)}>
              Cancel
            </Button>
            <Button
              loading={initiatePayout.loading}
              disabled={!payoutForm.accountId || !Number(payoutForm.amount)}
              onClick={submitPayout}
            >
              Request payout
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-cream px-4 py-3">
            <p className="eyebrow">Available</p>
            <p className="tabular mt-1 text-[20px] font-extrabold">
              {formatMoney(balances.available)}
            </p>
          </div>
          <Field label="Destination account" htmlFor="payout-account">
            <Select
              id="payout-account"
              value={payoutForm.accountId}
              onChange={(event) =>
                setPayoutForm({ ...payoutForm, accountId: event.target.value })
              }
            >
              <option value="">Select an account</option>
              {(accounts.data ?? []).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name || account.bank_code} ·{" "}
                  {account.account_number}
                  {account.is_default ? " (default)" : ""}
                </option>
              ))}
            </Select>
          </Field>
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
          <InlineNote tone="warning">
            Payouts cannot be reversed once the gateway has processed them.
            Double-check the account number.
          </InlineNote>
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
