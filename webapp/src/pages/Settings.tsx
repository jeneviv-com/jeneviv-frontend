import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bell,
  Building2,
  ChevronRight,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { MAX_AVATAR_BYTES, merchantsAPI, profileAPI } from "@/lib/api";
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
  Select,
  Toggle,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

/* ----------------------------------------------------------- building blocks */

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
      className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11.5px] font-semibold ${TONE_MEANING[tone]}`}
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

/** A labelled group of rows, the way an app's settings screen reads. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {title}
      </h2>
      <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-sm">
        {children}
      </div>
    </section>
  );
}

/** One row: icon well, label, then whatever belongs on the right. */
function Row({
  icon,
  label,
  hint,
  children,
  onClick,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  children?: ReactNode;
  onClick?: () => void;
  tone?: "neutral" | "danger";
}) {
  const inner = (
    <>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${
          tone === "danger" ? "bg-[#fbeceb] text-danger" : "bg-cream text-ink-soft"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[13.5px] font-semibold ${
            tone === "danger" ? "text-danger" : "text-ink"
          }`}
        >
          {label}
        </span>
        {hint ? <span className="mt-0.5 block truncate text-[11.5px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </>
  );

  const className =
    "flex w-full items-center gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-cream/45";

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  );
}

/* --------------------------------------------------------------------- page */

export default function Settings() {
  const { user, merchant, refreshMerchant, logout, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const accounts = useBankAccounts();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [avatar, setAvatar] = useState<string | null>(user?.image ?? null);
  const [uploading, setUploading] = useState(false);
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
    setAvatar(user?.image ?? null);
  }, [user?.image]);

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
    (data: Parameters<typeof merchantsAPI.updateSettings>[0]) => merchantsAPI.updateSettings(data),
  );
  const apply = useAction((name: string, note: string) => merchantsAPI.apply(name, note));

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

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toastError("Picture too large", "Choose an image under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const { image } = await profileAPI.uploadAvatar(file);
      setAvatar(image);
      success("Profile picture updated");
    } catch (err) {
      toastError("Could not upload", err instanceof Error ? err.message : "");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const clearAvatar = async () => {
    setUploading(true);
    try {
      await profileAPI.removeAvatar();
      setAvatar(null);
      success("Profile picture removed");
    } catch (err) {
      toastError("Could not remove", err instanceof Error ? err.message : "");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[760px]">
      {/* app-style bar */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-white"
        >
          <ArrowLeft size={17} />
        </Link>
        <h1 className="flex-1 text-center text-[16px] font-bold tracking-tight">Settings</h1>
        <span className="h-9 w-9" aria-hidden="true" />
      </div>

      {/* identity */}
      <div className="mb-7 flex items-center gap-4">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[18px] font-bold text-cream">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[19px] font-bold tracking-tight">
            {merchant?.display_name || user?.name || "Your workspace"}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">{user?.email}</p>
          <div className="mt-2">
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
      </div>

      {/* ------------------------------------------------------------ account */}
      <Group title="Account settings">
        <Row
          icon={<UserIcon size={15} />}
          label="Profile picture"
          hint="PNG, JPEG or WebP · up to 5 MB"
        >
          <div className="flex shrink-0 items-center gap-2">
            {avatar ? (
              <button
                type="button"
                onClick={clearAvatar}
                disabled={uploading}
                aria-label="Remove profile picture"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-cream hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              icon={<Upload size={13} />}
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {avatar ? "Change" : "Upload"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => pickAvatar(event.target.files?.[0])}
            />
          </div>
        </Row>

        <Row icon={<UserIcon size={15} />} label="Name">
          <span className="truncate text-[13px] font-semibold">{user?.name ?? "—"}</span>
        </Row>

        <Row icon={<Mail size={15} />} label="Email" hint={user?.email ?? undefined}>
          {user?.emailVerified ? (
            <Chip tone="money" icon={<BadgeCheck size={12} />}>
              Verified
            </Chip>
          ) : (
            <Chip tone="attention">Not yet</Chip>
          )}
        </Row>

        <Row icon={<ShieldCheck size={15} />} label="Two-factor authentication">
          <Chip tone="money" icon={<ShieldCheck size={12} />}>
            Email OTP
          </Chip>
        </Row>

        <Row icon={<BadgeCheck size={15} />} label="Member since">
          <span className="text-[13px] text-ink-muted">{formatDate(user?.createdAt)}</span>
        </Row>
      </Group>

      {/* ---------------------------------------------------------- workspace */}
      <Group title="Workspace">
        <div className="border-b border-line-soft px-4 py-3.5">
          <Field label="Workspace name" htmlFor="settings-name">
            <Input
              id="settings-name"
              value={workspace.display_name}
              onChange={(event) =>
                setWorkspace({ ...workspace, display_name: event.target.value })
              }
            />
          </Field>
          <div className="mt-3">
            <Field label="What you collect" htmlFor="settings-note">
              <Input
                id="settings-note"
                value={workspace.application_note}
                onChange={(event) =>
                  setWorkspace({ ...workspace, application_note: event.target.value })
                }
              />
            </Field>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-ink-muted">Shown on the page payers see.</p>
            <Button
              size="sm"
              icon={<Save size={13} />}
              loading={apply.loading}
              onClick={async () => {
                try {
                  await apply.run(workspace.display_name, workspace.application_note);
                  await refreshMerchant();
                  success("Workspace updated", "Your changes are saved.");
                } catch (err) {
                  toastError("Could not save", err instanceof Error ? err.message : "");
                }
              }}
            >
              Save
            </Button>
          </div>
          {merchant?.status === "pending" ? (
            <div className="mt-3">
              <InlineNote tone="warning">
                Approval is usually same-day. You can create collections while you wait.
              </InlineNote>
            </div>
          ) : null}
        </div>

        <Row icon={<Building2 size={15} />} label="Bank accounts" hint={defaultAccount ? `${defaultAccount.bank_name} ••${defaultAccount.account_number.slice(-4)}` : "No default account"}>
          <Link
            to="/payouts"
            className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand"
          >
            Manage <ChevronRight size={14} />
          </Link>
        </Row>

        <Row
          icon={<Banknote size={15} />}
          label="Access level"
          hint={isAdmin ? "Platform admin" : "Coordinator"}
        >
          <Chip tone="people" icon={<ShieldCheck size={12} />}>
            {isAdmin ? "Admin" : "Owner"}
          </Chip>
        </Row>
      </Group>

      {/* -------------------------------------------------------- verification */}
      <Group title="Verification">
        <div className="p-4">
          <KycCard />
        </div>
      </Group>

      {/* ------------------------------------------------------- notifications */}
      <Group title="Notifications">
        <div className="border-b border-line-soft px-4 py-4">
          <Toggle
            checked={notify.email_notification_for_transactions}
            onChange={async (value) => {
              setNotify({ ...notify, email_notification_for_transactions: value });
              try {
                await updateSettings.run({ email_notification_for_transactions: value });
                await refreshMerchant();
              } catch (err) {
                toastError("Could not update", err instanceof Error ? err.message : "");
              }
            }}
            label="Email me about transactions"
            description="Settlement confirmations are always sent, regardless of this setting."
          />
        </div>
        <div className="px-4 py-4">
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
        <Row icon={<Bell size={15} />} label="Notification centre" hint="Payments, refunds and settlement events">
          <Link
            to="/notifications"
            className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand"
          >
            Open <ChevronRight size={14} />
          </Link>
        </Row>
      </Group>

      {/* ------------------------------------------------------------ security */}
      <Group title="Security & data">
        <Row icon={<Building2 size={15} />} label="Settlement" hint="Paystack splits each payment to your bank">
          <Chip tone="money">Direct</Chip>
        </Row>
        <Row icon={<ShieldCheck size={15} />} label="Data protection">
          <Chip tone="neutral">NDPA 2023</Chip>
        </Row>
        <Row
          icon={<LogOut size={15} />}
          label="Sign out of this device"
          tone="danger"
          onClick={async () => {
            await logout();
          }}
        >
          <ChevronRight size={15} className="shrink-0 text-ink-faint" />
        </Row>
      </Group>

      <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-ink-muted">
        To change your email or password, contact{" "}
        <a
          className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
          href="mailto:myjeneviv@gmail.com"
        >
          myjeneviv@gmail.com
        </a>{" "}
        — this keeps account recovery auditable.
      </p>
    </div>
  );
}
