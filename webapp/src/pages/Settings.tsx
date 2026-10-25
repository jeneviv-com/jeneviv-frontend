import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Database,
  LogOut,
  Mail,
  Save,
  ServerCog,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { apiConfig, merchantsAPI } from "@/lib/api";
import KycCard from "@/components/KycCard";
import { useAction, useBankAccounts } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatMoney } from "@/lib/format";
import {
  Button,
  Card,
  CardHeader,
  Field,
  InlineNote,
  Input,
  KeyValue,
  PageHeader,
  Pill,
  Select,
  StatCard,
  StatusPill,
  Toggle,
} from "@/components/ui";

export default function Settings() {
  const { user, merchant, refreshMerchant, logout, connection, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const accounts = useBankAccounts();

  const [workspace, setWorkspace] = useState({
    display_name: merchant?.display_name ?? "",
    application_note: merchant?.application_note ?? "",
  });
  const [notify, setNotify] = useState({
    email_notification_for_transactions:
      merchant?.settings?.email_notification_for_transactions ?? true,
    email_notification_period:
      merchant?.settings?.email_notification_period ?? "immediate",
    payout_mode: merchant?.settings?.payout_mode ?? "manual",
  });

  useEffect(() => {
    if (!merchant) return;
    setWorkspace({
      display_name: merchant.display_name ?? "",
      application_note: merchant.application_note ?? "",
    });
    setNotify({
      email_notification_for_transactions:
        merchant.settings?.email_notification_for_transactions ?? true,
      email_notification_period:
        merchant.settings?.email_notification_period ?? "immediate",
      payout_mode: merchant.settings?.payout_mode ?? "manual",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id, merchant?.updatedAt]);

  const updateSettings = useAction(
    (data: Parameters<typeof merchantsAPI.updateSettings>[0]) =>
      merchantsAPI.updateSettings(data),
  );
  const apply = useAction((name: string, note: string) =>
    merchantsAPI.apply(name, note),
  );

  const defaultAccount = (accounts.data ?? []).find((account) => account.is_default);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Your profile, how your workspace appears to payers, and how money leaves the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Workspace status"
          value={
            merchant?.status === "approved"
              ? "Approved"
              : merchant?.status === "pending"
                ? "In review"
                : merchant?.status === "rejected"
                  ? "Action needed"
                  : "Not set up"
          }
          hint={merchant?.display_name || "No workspace name yet"}
          tone={merchant?.status === "approved" ? "green" : "brand"}
          icon={<BadgeCheck size={16} />}
        />
        <StatCard
          label="Collected"
          value={formatMoney(merchant?.wallet_balance_ngn ?? 0)}
          hint="Successful payments, all time"
        />
        <StatCard
          label="Available for payout"
          value={formatMoney(merchant?.payouts_balance_ngn ?? 0)}
          hint="Minus refunds and payouts in flight"
        />
        <StatCard
          label="Default bank"
          value={defaultAccount ? `••${defaultAccount.account_number.slice(-4)}` : "None"}
          hint={defaultAccount?.bank_name ?? "Add one under Payouts"}
          icon={<Building2 size={16} />}
        />
      </div>

      <div className="mt-5">
        <KycCard />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Your profile"
            subtitle="Used for sign-in and receipts"
            icon={<UserIcon size={16} />}
          />
          <KeyValue label="Name" value={user?.name ?? "—"} />
          <KeyValue label="Email" value={user?.email ?? "—"} mono />
          <KeyValue
            label="Email verified"
            value={user?.emailVerified ? "Yes" : "Not yet"}
          />
          <KeyValue label="Member since" value={formatDate(user?.createdAt)} />
          <KeyValue
            label="Role"
            value={isAdmin ? "Workspace admin" : "Coordinator"}
          />
          <p className="hint mt-3">
            To change your email or password, contact{" "}
            <a
              className="font-semibold text-brand hover:underline"
              href="mailto:myjeneviv@gmail.com"
            >
              myjeneviv@gmail.com
            </a>{" "}
            — this keeps account recovery auditable.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Workspace profile"
            subtitle="What payers see on the payment page"
            icon={<Building2 size={16} />}
          />
          <div className="space-y-4">
            <Field label="Workspace name" htmlFor="settings-name">
              <Input
                id="settings-name"
                value={workspace.display_name}
                onChange={(event) =>
                  setWorkspace({ ...workspace, display_name: event.target.value })
                }
              />
            </Field>
            <Field label="What you collect" htmlFor="settings-note">
              <Input
                id="settings-note"
                value={workspace.application_note}
                onChange={(event) =>
                  setWorkspace({ ...workspace, application_note: event.target.value })
                }
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                icon={<Save size={14} />}
                loading={apply.loading}
                onClick={async () => {
                  try {
                    await apply.run(workspace.display_name, workspace.application_note);
                    await refreshMerchant();
                    success("Workspace updated", "Your changes are saved.");
                  } catch (err) {
                    toastError(
                      "Could not save",
                      err instanceof Error ? err.message : "",
                    );
                  }
                }}
              >
                Save workspace
              </Button>
              <span className="flex items-center gap-2">
                <StatusPill status={merchant?.status ?? "pending"} />
              </span>
            </div>
            {merchant?.status === "pending" ? (
              <InlineNote tone="warning">
                Approval is usually same-day. You can create collections while
                you wait.
              </InlineNote>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Payment notifications"
            subtitle="How Jeneviv emails you about transactions"
            icon={<Mail size={16} />}
          />
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-cream px-4 py-3">
              <Toggle
                checked={notify.email_notification_for_transactions}
                onChange={async (value) => {
                  setNotify({ ...notify, email_notification_for_transactions: value });
                  try {
                    await updateSettings.run({
                      email_notification_for_transactions: value,
                    });
                    await refreshMerchant();
                  } catch (err) {
                    toastError(
                      "Could not update",
                      err instanceof Error ? err.message : "",
                    );
                  }
                }}
                label="Email me about transactions"
                description="Settlement confirmations are always sent, regardless of this setting."
              />
            </div>
            <Field
              label="Notification frequency"
              htmlFor="notify-period"
              hint="Batch summaries reduce inbox noise for busy collections."
            >
              <Select
                id="notify-period"
                value={notify.email_notification_period}
                onChange={async (event) => {
                  const value = event.target
                    .value as typeof notify.email_notification_period;
                  setNotify({ ...notify, email_notification_period: value });
                  try {
                    await updateSettings.run({
                      email_notification_period: value,
                    });
                    await refreshMerchant();
                    success("Notification preference saved");
                  } catch (err) {
                    toastError(
                      "Could not update",
                      err instanceof Error ? err.message : "",
                    );
                  }
                }}
              >
                <option value="immediate">Immediately after each payment</option>
                <option value="hourly">Hourly summary</option>
                <option value="6hourly">Every 6 hours</option>
                <option value="12hourly">Every 12 hours</option>
                <option value="daily">Daily digest</option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Settlement & security"
            subtitle="Where money lands and how your account is protected"
            icon={<ShieldCheck size={16} />}
          />
          <Field label="Payout mode" htmlFor="settings-payout-mode">
            <Select
              id="settings-payout-mode"
              value={notify.payout_mode}
              onChange={async (event) => {
                const value = event.target.value as typeof notify.payout_mode;
                setNotify({ ...notify, payout_mode: value });
                try {
                  await updateSettings.run({ payout_mode: value });
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
              <option value="manual">Manual withdrawals only</option>
              <option value="auto_daily">Automatic — twice daily</option>
              <option value="auto_weekly">Automatic — weekly</option>
            </Select>
          </Field>

          <div className="mt-4 space-y-2">
            <KeyValue
              label="Bank accounts linked"
              value={
                <Link to="/payouts" className="text-brand hover:underline">
                  {(accounts.data ?? []).length} · manage
                </Link>
              }
            />
            <KeyValue label="Two-factor authentication" value={<Pill tone="green">Email OTP</Pill>} />
            <KeyValue label="Data protection" value={<Pill tone="blue">NDPA 2023</Pill>} />
          </div>

          <Button
            variant="secondary"
            className="mt-4"
            icon={<LogOut size={14} />}
            onClick={async () => {
              await logout();
            }}
          >
            Sign out of this device
          </Button>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Connection"
          subtitle="Where this dashboard is reading its data from"
          icon={<ServerCog size={16} />}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="API base URL"
            value={apiConfig.baseUrl.replace(/^https?:\/\//, "")}
            hint={apiConfig.baseUrl}
            icon={<Database size={16} />}
          />
          <StatCard
            label="Data source"
            value={
              connection === "demo"
                ? "Demo dataset"
                : connection === "live"
                  ? "Live API"
                  : "Checking"
            }
            hint={
              connection === "demo"
                ? "The API host did not answer, so seeded data is in use"
                : "Requests are served by the Jeneviv backend"
            }
            tone={connection === "demo" ? "brand" : "green"}
          />
          <StatCard
            label="Environment"
            value={import.meta.env.MODE === "production" ? "Production" : "Development"}
            hint={`Demo mode: ${import.meta.env.VITE_DEMO_MODE ?? "auto"}`}
          />
        </div>
        {connection === "demo" ? (
          <div className="mt-4">
            <InlineNote tone="warning" title="Running on demo data">
              Set <code className="font-mono">VITE_API_URL</code> to a running
              Jeneviv API and <code className="font-mono">VITE_DEMO_MODE=false</code>{" "}
              in <code className="font-mono">webapp/.env.local</code>, then restart
              the dev server to work against the real backend.
            </InlineNote>
          </div>
        ) : null}
      </Card>
    </>
  );
}
