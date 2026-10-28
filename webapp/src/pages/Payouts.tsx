import { useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Landmark,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { merchantsAPI, type BankAccount } from "@/lib/api";
import { useAction, useBankAccounts, useBanks, useKyc } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, pick } from "@/lib/format";
import { PLATFORM_FEE_RANGE_LABEL, PLATFORM_FEE_SUMMARY } from "@/lib/platformFee";
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Field,
  InlineNote,
  Input,
  Modal,
  PageHeader,
  Pill,
  Select,
  TONE_MEANING,
  type ToneKind,
  Toggle,
} from "@/components/ui";

/** One stacked summary tile, coloured by meaning. Matches the dashboard. */
function SummaryTile({
  index,
  tone,
  label,
  value,
  hint,
  icon,
}: {
  index: number;
  tone: ToneKind;
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="dash-rise relative -mt-6 first:mt-0 lg:mt-0"
      style={{ zIndex: index + 1, animationDelay: `${index * 80}ms` }}
    >
      <div
        className={`flex min-h-[108px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:px-6 lg:py-5 ${TONE_MEANING[tone]}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight">{label}</p>
            <p className="mt-0.5 truncate text-[12px] opacity-70">{hint}</p>
          </div>
        </div>
        <p className="shrink-0 text-right text-[19px] font-bold tabular">{value}</p>
      </div>
    </div>
  );
}

/**
 * Bank & settlement. Under Paystack's split, every payment is routed to the
 * merchant's bank at the moment it is captured, so this page manages the
 * destination account — there is no platform wallet, no withdrawable balance
 * and no payout approval to wait on.
 */
export default function Payouts() {
  const { merchant } = useAuth();
  const { success, error: toastError } = useToast();

  const accounts = useBankAccounts();
  const banks = useBanks("NG");
  const kyc = useKyc();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BankAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    bank_code: "",
    account_number: "",
    is_default: false,
  });

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

  const defaultAccount =
    (accounts.data ?? []).find((account) => accountDetails(account).isDefault) ??
    (accounts.data ?? [])[0];
  const defaultAccountDetails = accountDetails(defaultAccount);
  const verified = kyc.data?.kyc_status === "verified";

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
        "Paystack settles future collections into this account.",
      );
      setShowAddAccount(false);
      setAccountForm({ bank_code: "", account_number: "", is_default: false });
    } catch (err) {
      toastError("Could not add the account", err instanceof Error ? err.message : "");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Bank & settlement"
        description="Paystack splits every payment as it is captured. Your collection goes straight to your bank — Jeneviv never holds merchant money."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setShowAddAccount(true)}>
            Add bank account
          </Button>
        }
      />

      {/* summary: meaning-based tiles */}
      <div className="mb-6">
        <SummaryTile
          index={0}
          tone={defaultAccount ? "money" : "attention"}
          label="Settlement account"
          value={defaultAccount ? `••${defaultAccountDetails.accountNumber.slice(-4)}` : "Not set"}
          hint={
            defaultAccountDetails.bankName || "Add a verified account to receive payments"
          }
          icon={<Building2 size={16} />}
        />
        <SummaryTile
          index={1}
          tone="people"
          label="Accounts on file"
          value={String((accounts.data ?? []).length)}
          hint="Money only goes to accounts in your workspace name"
          icon={<Landmark size={16} />}
        />
        <SummaryTile
          index={2}
          tone="neutral"
          label="Platform fee"
          value={PLATFORM_FEE_RANGE_LABEL}
          hint={PLATFORM_FEE_SUMMARY}
          icon={<Banknote size={16} />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="section-title">Bank accounts</h2>
              <p className="muted mt-0.5">
                Settlement only goes to an account verified by the gateway
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setShowAddAccount(true)}
            >
              Add
            </Button>
          </div>

          {accounts.loading ? (
            <div className="px-5 pb-6">
              <div className="skeleton h-16 w-full rounded-[16px]" />
            </div>
          ) : (accounts.data ?? []).length === 0 ? (
            <div className="px-5 pb-6">
              <InlineNote tone="warning" title="No account on file">
                A verified bank account is required before a collection can
                accept payments. Add one and we will confirm the name against
                your workspace.
              </InlineNote>
            </div>
          ) : (
            <ul className="space-y-3 px-5 pb-5">
              {(accounts.data ?? []).map((account) => {
                const details = accountDetails(account);
                return (
                  <li key={account.id} className="card card-interactive rounded-[18px] border border-ink/15 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                          <span className="truncate">{details.bankName || details.bankCode}</span>
                          {details.isDefault ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-cream">
                              <Star size={10} /> Default
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 font-mono text-[12px] opacity-75">
                          {details.accountNumber} · {details.accountName || "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${details.bankName}`}
                        onClick={() => setPendingDelete(account)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-ink/20 bg-white text-danger transition-colors hover:border-danger/40 hover:bg-danger/5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {!details.isDefault ? (
                      <div className="mt-3">
                        <Button
                          variant="secondary"
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
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="How settlement works"
              subtitle="No wallet, no payout runs, no waiting"
              icon={<ShieldCheck size={16} />}
            />
            <ol className="space-y-3">
              {[
                {
                  title: "Payer pays the collection link",
                  body: "The collection amount, Jeneviv's platform fee and Paystack's processing fee are charged to the payer. The total is shown before they pay.",
                },
                {
                  title: "Paystack splits it instantly",
                  body: "The full collection amount goes to your bank account. Jeneviv's platform fee goes to the platform.",
                },
                {
                  title: "Your dashboard records it",
                  body: "The payment appears here as settled, matched to the payer and reference.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream text-3xs font-bold text-ink-soft">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{step.title}</p>
                    <p className="muted mt-0.5">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader
              title="Verification"
              subtitle="Required before a collection can accept money"
              icon={<CheckCircle2 size={16} />}
            />
            <div className="flex items-center justify-between gap-3 border-b border-line-soft py-2.5 text-[12.5px]">
              <span className="text-ink-muted">Workspace</span>
              <Pill
                tone={
                  merchant?.status === "approved"
                    ? "green"
                    : merchant?.status === "rejected"
                      ? "red"
                      : "amber"
                }
              >
                {merchant?.status ?? "pending"}
              </Pill>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
              <span className="text-ink-muted">Identity (NIN)</span>
              <Pill tone={verified ? "green" : kyc.data?.nin_last4 ? "amber" : "neutral"}>
                {verified ? "Verified" : kyc.data?.kyc_status ?? "unverified"}
              </Pill>
            </div>
            <p className="muted mt-3">
              Only a successful collection route needs this — you can build
              collections while the review is pending.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        title="Add a bank account"
        description="Paystack verifies the account name against your workspace before settlement is enabled."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddAccount(false)}>
              Cancel
            </Button>
            <Button
              loading={addAccount.loading}
              disabled={!accountForm.bank_code || accountForm.account_number.length !== 10}
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
          <Field label="Account number" htmlFor="account-number" hint="10 digits (NUBAN).">
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
          <div className="rounded-[14px] border border-line bg-cream px-4 py-3">
            <Toggle
              checked={accountForm.is_default}
              onChange={(value) => setAccountForm({ ...accountForm, is_default: value })}
              label="Use for automatic settlement"
              description="Every new collection settles into this account."
            />
          </div>
          <InlineNote tone="info">
            Settlement only works to an account in the same name as your
            workspace — this is how the gateway protects against fraud.
          </InlineNote>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this bank account?"
        description="Collections already paid out are unaffected. New payments need another verified account."
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
        <Pill tone="green">Direct settlement</Pill>
      </p>
    </>
  );
}