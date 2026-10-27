import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { merchantsAPI } from "@/lib/api";
import KycCard from "@/components/KycCard";
import { useAction, useBankAccounts } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import {
  Button,
  Field,
  InlineNote,
  Input,
  PageHeader,
  Select,
  Toggle,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

/* ----------------------------------------------------------- building blocks */

/** A status chip: a tinted pill with a round icon well. Used for every state. */
function Chip({
  tone,
  icon,
  children,
}: {
  tone: ToneKind;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12px] font-semibold ${TONE_MEANING[tone]}`}
    >
      {icon ? (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/85 text-ink">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** A label on the left, a value on the right, separated by a hairline. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line-soft py-3.5 last:border-0">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <div className="min-w-0 text-right text-[13.5px] font-semibold">{children}</div>
    </div>
  );
}

/** A page section: a small icon well, a title and a subtitle, then content. No box. */
function Section({
  icon,
  title,
  subtitle,
  aside,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-cream text-ink-soft">
            {icon}
          </span>
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle ? <p className="muted mt-0.5">{subtitle}</p> : null}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/* --------------------------------------------------------------------- page */

export default function Settings() {
  const { user, merchant, refreshMerchant, logout, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const accounts = useBankAccounts();

  const [workspace, setWorkspace] = useState({
    display_name: merchant?.display_name ?? "",
    application_note: merchant?.application_note ?? "",
  });
  const [notify, setNotify] = useState({
    email_notification_for_transactions:
      merchant?.settings?.email_notification_for_transactions ?? true,
    email_notification_period: merchant?.settings?.email_notification_period ?? "immediate",
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
      email_notification_period: merchant.settings?.email_notification_period ?? "immediate",
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

  const statusCopy =
    merchant?.status === "approved"
      ? "Approved"
      : merchant?.status === "pending"
        ? "In review"
        : merchant?.status === "rejected"
          ? "Action needed"
          : "Not set up";

  const statusTone: ToneKind = merchant?.status === "approved" ? "money" : "attention";

  const initials = (user?.name || merchant?.display_name || "J")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Your profile, how your workspace appears to payers, and where payments settle."
      />

      {/* identity */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-[17px] font-bold text-cream">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold tracking-tight">
            {merchant?.display_name || "No workspace name yet"}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted">{user?.email}</p>
        </div>
        <div className="sm:ml-auto">
          <Chip
            tone={statusTone}
            icon={
              merchant?.status === "approved" ? (
                <BadgeCheck size={12} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-ink" />
              )
            }
          >
            {statusCopy}
          </Chip>
        </div>
      </div>

      {/* settlement strip: typography, no boxes */}
      <div className="mb-10 grid grid-cols-2 gap-y-6 border-y border-line py-6 lg:grid-cols-4">
        <div className="pr-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            Settlement
          </p>
          <p className="mt-1.5 text-[15px] font-bold tracking-tight">Direct to bank</p>
          <p className="mt-1 text-[12px] text-ink-muted">Paystack splits each payment</p>
        </div>
        <div className="border-l border-line-soft pl-4 pr-4 lg:pl-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            Platform fee
          </p>
          <p className="tabular mt-1.5 text-[15px] font-bold tracking-tight">₦75 / 1%</p>
          <p className="mt-1 text-[12px] text-ink-muted">
            ₦75 up to ₦7,500, then 1% capped at ₦1,000
          </p>
        </div>
        <div className="pr-4 lg:border-l lg:border-line-soft lg:pl-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            Default bank
          </p>
          <p className="tabular mt-1.5 text-[15px] font-bold tracking-tight">
            {defaultAccount ? `••${defaultAccount.account_number.slice(-4)}` : "None"}
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">
            {defaultAccount?.bank_name ?? "Add one under Bank & settlement"}
          </p>
        </div>
        <div className="border-l border-line-soft pl-4 lg:pl-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            Access
          </p>
          <div className="mt-2">
            <Chip tone="people" icon={<ShieldCheck size={12} />}>
              {isAdmin ? "Workspace admin" : "Coordinator"}
            </Chip>
          </div>
        </div>
      </div>

      <div className="grid gap-12 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-12">
          {/* workspace */}
          <Section
            icon={<Building2 size={16} />}
            title="Workspace profile"
            subtitle="What payers see on the payment page"
            aside={<Chip tone={statusTone}>{statusCopy}</Chip>}
          >
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
              <div className="flex flex-wrap items-center gap-3 pt-1">
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
              </div>
              {merchant?.status === "pending" ? (
                <InlineNote tone="warning">
                  Approval is usually same-day. You can create collections while
                  you wait.
                </InlineNote>
              ) : null}
            </div>
          </Section>

          {/* verification */}
          <Section
            icon={<BadgeCheck size={16} />}
            title="Verification"
            subtitle="Identity and account checks that unlock collections"
          >
            <KycCard />
          </Section>
        </div>

        <div className="space-y-12">
          {/* profile */}
          <Section
            icon={<UserIcon size={16} />}
            title="Your profile"
            subtitle="Used for sign-in and receipts"
          >
            <Row label="Name">{user?.name ?? "—"}</Row>
            <Row label="Email">
              <span className="font-mono text-[12.5px]">{user?.email ?? "—"}</span>
            </Row>
            <Row label="Email verified">
              {user?.emailVerified ? (
                <Chip tone="money" icon={<BadgeCheck size={12} />}>
                  Verified
                </Chip>
              ) : (
                <Chip tone="attention">Not yet</Chip>
              )}
            </Row>
            <Row label="Member since">{formatDate(user?.createdAt)}</Row>
            <p className="hint mt-4">
              To change your email or password, contact{" "}
              <a className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand" href="mailto:myjeneviv@gmail.com">
                myjeneviv@gmail.com
              </a>{" "}
              — this keeps account recovery auditable.
            </p>
          </Section>

          {/* notifications */}
          <Section
            icon={<Mail size={16} />}
            title="Payment notifications"
            subtitle="How Jeneviv emails you about transactions"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-5">
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
                      toastError("Could not update", err instanceof Error ? err.message : "");
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
                    const value = event.target.value as typeof notify.email_notification_period;
                    setNotify({ ...notify, email_notification_period: value });
                    try {
                      await updateSettings.run({ email_notification_period: value });
                      await refreshMerchant();
                      success("Notification preference saved");
                    } catch (err) {
                      toastError("Could not update", err instanceof Error ? err.message : "");
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
          </Section>

          {/* security */}
          <Section
            icon={<ShieldCheck size={16} />}
            title="Settlement & security"
            subtitle="Where payments land and how your account is protected"
          >
            <div className="mb-4">
              <InlineNote tone="info" title="Direct settlement">
                Paystack sends each payment to your verified bank account as it is
                captured. There is no platform wallet and no payout schedule to
                configure.
              </InlineNote>
            </div>
            <Row label="Bank accounts linked">
              <Link to="/payouts" className="inline-flex items-center gap-2 text-ink hover:text-brand">
                <Chip tone="people" icon={<Building2 size={12} />}>
                  {(accounts.data ?? []).length} · manage
                </Chip>
              </Link>
            </Row>
            <Row label="Two-factor authentication">
              <Chip tone="money" icon={<ShieldCheck size={12} />}>
                Email OTP
              </Chip>
            </Row>
            <Row label="Data protection">
              <Chip tone="neutral" icon={<ShieldCheck size={12} />}>
                NDPA 2023
              </Chip>
            </Row>
            <div className="mt-5">
              <Button
                variant="secondary"
                icon={<LogOut size={14} />}
                onClick={async () => {
                  await logout();
                }}
              >
                Sign out of this device
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
