import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellRing,
  Building2,
  ChevronRight,
  CreditCard,
  KeyRound,
  Landmark,
  LifeBuoy,
  LogOut,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User as UserIcon,
  Users,
} from "lucide-react";
import { MAX_AVATAR_BYTES, merchantsAPI, profileAPI, type MerchantSettings } from "@/lib/api";
import KycCard from "@/components/KycCard";
import { useAction, useBankAccounts } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import { useGateway } from "@/lib/gateway";
import {
  Button,
  Field,
  Input,
  Toggle,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

type Period = NonNullable<MerchantSettings["email_notification_period"]>;

const SECTIONS = [
  { id: "profile", label: "My profile" },
  { id: "workspace", label: "Workspace" },
  { id: "verification", label: "Verification" },
  { id: "notifications", label: "Notifications" },
  { id: "payments", label: "Payments" },
  { id: "security", label: "Access & security" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const PERIODS: Array<{ value: Period; label: string; hint: string }> = [
  { value: "immediate", label: "Every payment", hint: "One email as each payment is confirmed" },
  { value: "hourly", label: "Hourly", hint: "A summary at most once an hour" },
  { value: "6hourly", label: "Every 6 hours", hint: "Four summaries a day, at most" },
  { value: "12hourly", label: "Twice a day", hint: "A summary every 12 hours" },
  { value: "daily", label: "Daily digest", hint: "One summary a day" },
];

/* ----------------------------------------------------------- building blocks */

function Chip({ tone, icon, children }: { tone: ToneKind; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11.5px] font-semibold ${TONE_MEANING[tone]}`}
    >
      {icon ? (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/85 text-ink">{icon}</span>
      ) : null}
      {children}
    </span>
  );
}

/** Outlined circle that holds a row's icon. */
function IconWell({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
        danger ? "border-danger/30 text-danger" : "border-ink/15 text-ink"
      }`}
    >
      {children}
    </span>
  );
}

/** One settings entry on the main list: its own white card, icon, label, chevron. */
function MenuRow({
  icon,
  label,
  onClick,
  to,
  href,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <>
      <IconWell danger={danger}>{icon}</IconWell>
      <span className={`min-w-0 flex-1 truncate text-[14px] font-medium ${danger ? "text-danger" : "text-ink"}`}>
        {label}
      </span>
      <ChevronRight size={17} className="shrink-0 text-ink/45" aria-hidden="true" />
    </>
  );
  const className =
    "flex w-full items-center gap-3 rounded-[16px] bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(17,17,17,0.04),0_6px_18px_-10px_rgba(17,17,17,0.12)] transition-transform duration-150 active:scale-[0.99] hover:-translate-y-px";
  if (to)
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 px-1 text-[13.5px] font-semibold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

/** White card that holds a section's controls once it is opened. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04),0_6px_18px_-10px_rgba(17,17,17,0.12)]">
      {children}
    </div>
  );
}

/** One line inside an opened section: icon, label and value, then any control. */
function Row({
  icon,
  label,
  hint,
  children,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-line-soft px-4 py-3.5 last:border-b-0">
      <IconWell>{icon}</IconWell>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block truncate text-[12px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function Settings() {
  const { user, merchant, refreshMerchant, refreshSession, logout, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const accounts = useBankAccounts();
  const gateway = useGateway();
  const [params, setParams] = useSearchParams();
  const open = (params.get("section") as SectionId | null) ?? null;
  const current = SECTIONS.find((section) => section.id === open) ?? null;
  const go = (id: SectionId | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("section", id);
    else next.delete("section");
    setParams(next);
    window.scrollTo({ top: 0 });
  };
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [avatar, setAvatar] = useState<string | null>(user?.image ?? null);
  const [uploading, setUploading] = useState(false);
  const [workspace, setWorkspace] = useState({
    display_name: merchant?.display_name ?? "",
    application_note: merchant?.application_note ?? "",
  });
  const [notify, setNotify] = useState({
    email_notification_for_transactions: merchant?.settings?.email_notification_for_transactions ?? true,
    email_notification_period: (merchant?.settings?.email_notification_period ?? "immediate") as Period,
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
      email_notification_for_transactions: merchant.settings?.email_notification_for_transactions ?? true,
      email_notification_period: (merchant.settings?.email_notification_period ?? "immediate") as Period,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id, merchant?.updatedAt]);

  const updateSettings = useAction((data: Parameters<typeof merchantsAPI.updateSettings>[0]) =>
    merchantsAPI.updateSettings(data),
  );
  const apply = useAction((name: string, note: string) => merchantsAPI.apply(name, note));

  const defaultAccount = (accounts.data ?? []).find((account) => account.is_default);
  const workspaceDirty =
    workspace.display_name.trim() !== (merchant?.display_name ?? "") ||
    workspace.application_note.trim() !== (merchant?.application_note ?? "");

  const statusCopy =
    merchant?.status === "approved"
      ? "Approved"
      : merchant?.status === "pending"
        ? "In review"
        : merchant?.status === "rejected"
          ? "Action needed"
          : "Not set up";

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
      // Keep the session copy in step so the picture survives navigation.
      await refreshSession();
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
      await refreshSession();
      success("Picture removed", "Your initials are used again.");
    } catch (err) {
      toastError("Could not remove", err instanceof Error ? err.message : "");
    } finally {
      setUploading(false);
    }
  };

  /** Saves one preference, rolling the switch back if the server refuses. */
  const saveNotify = async (patch: Partial<typeof notify>, message?: string) => {
    const previous = notify;
    setNotify({ ...notify, ...patch });
    try {
      await updateSettings.run(patch);
      await refreshMerchant();
      if (message) success(message);
    } catch (err) {
      setNotify(previous);
      toastError("Could not update", err instanceof Error ? err.message : "");
    }
  };

  const emailsOn = notify.email_notification_for_transactions;

  return (
    <div className="mx-auto w-full max-w-[640px] pb-10">
      <div className="rounded-[28px] bg-gradient-to-b from-[#ffe2d3] via-[#fff3ec] to-[#faf8f5] px-3.5 pb-6 pt-4 sm:px-5 sm:pt-5">
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/avif"
          className="hidden"
          onChange={(event) => pickAvatar(event.target.files?.[0])}
        />

        {current ? (
          /* ------------------------------------------------------ one section */
          <div>
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(null)}
                aria-label="Back to settings"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 bg-white/70 text-ink transition-colors hover:bg-white"
              >
                <ArrowLeft size={17} />
              </button>
              <h1 className="text-[19px] font-bold tracking-tight text-ink">{current.label}</h1>
            </div>

            {current.id === "profile" ? (
              <Panel>
                <Row icon={<UserIcon size={16} />} label="Profile picture" hint="PNG, JPEG, WebP or HEIC · up to 5 MB">
                  <div className="flex shrink-0 items-center gap-1.5">
                    {avatar ? (
                      <button
                        type="button"
                        onClick={clearAvatar}
                        disabled={uploading}
                        aria-label="Remove profile picture and use my initials"
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
                  </div>
                </Row>
                <Row icon={<UserIcon size={16} />} label="Name" hint={user?.name ?? "—"} />
                <Row icon={<Mail size={16} />} label="Email" hint={user?.email ?? undefined}>
                  {user?.emailVerified ? (
                    <Chip tone="money" icon={<BadgeCheck size={12} />}>
                      Verified
                    </Chip>
                  ) : (
                    <Chip tone="attention">Not yet</Chip>
                  )}
                </Row>
                <Row icon={<BadgeCheck size={16} />} label="Member since" hint={formatDate(user?.createdAt)} />
              </Panel>
            ) : null}

            {current.id === "workspace" ? (
              <Panel>
                <div className="px-4 py-4">
                  <div className="grid gap-3">
                    <Field label="Workspace name" htmlFor="settings-name">
                      <Input
                        id="settings-name"
                        value={workspace.display_name}
                        onChange={(event) => setWorkspace({ ...workspace, display_name: event.target.value })}
                      />
                    </Field>
                    <Field label="What you collect" htmlFor="settings-note">
                      <Input
                        id="settings-note"
                        value={workspace.application_note}
                        placeholder="e.g. Departmental dues"
                        onChange={(event) => setWorkspace({ ...workspace, application_note: event.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      icon={<Save size={13} />}
                      loading={apply.loading}
                      disabled={!workspaceDirty || workspace.display_name.trim().length < 2}
                      onClick={async () => {
                        try {
                          await apply.run(workspace.display_name.trim(), workspace.application_note.trim());
                          await refreshMerchant();
                          success("Workspace updated");
                        } catch (err) {
                          toastError("Could not save", err instanceof Error ? err.message : "");
                        }
                      }}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              </Panel>
            ) : null}

            {current.id === "verification" ? (
              <Panel>
                <div className="p-4">
                  <KycCard />
                </div>
              </Panel>
            ) : null}

            {current.id === "notifications" ? (
              <div className="space-y-3">
                <Panel>
                  <div className="px-4 py-4">
                    <Toggle
                      checked={emailsOn}
                      onChange={(value) =>
                        saveNotify(
                          { email_notification_for_transactions: value },
                          value ? "Payment emails on" : "Payment emails off",
                        )
                      }
                      label="Email me about payments"
                    />
                  </div>
                </Panel>
                <Panel>
                  <fieldset
                    disabled={!emailsOn || updateSettings.loading}
                    className={`px-4 py-4 transition-opacity ${emailsOn ? "" : "opacity-50"}`}
                  >
                    <legend className="sr-only">How often</legend>
                    <p className="text-[13.5px] font-semibold text-ink" aria-hidden="true">
                      How often
                    </p>
                    <div role="radiogroup" aria-label="How often" className="mt-3 grid gap-2 sm:grid-cols-2">
                      {PERIODS.map((option) => {
                        const selected = notify.email_notification_period === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() =>
                              !selected &&
                              saveNotify({ email_notification_period: option.value }, "Notification preference saved")
                            }
                            className={`rounded-[14px] border px-3.5 py-3 text-left transition-[border-color,background-color] disabled:cursor-not-allowed ${
                              selected ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/25"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-semibold">{option.label}</span>
                              <span
                                className={`h-2 w-2 rounded-full ${selected ? "bg-brand" : "bg-line"}`}
                                aria-hidden="true"
                              />
                            </span>
                            <span className={`mt-1 block text-[11.5px] ${selected ? "text-white/65" : "text-ink-muted"}`}>
                              {option.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </Panel>
              </div>
            ) : null}

            {current.id === "payments" ? (
              <Panel>
                <Row icon={<CreditCard size={16} />} label="Payment gateway" hint={gateway.processedBy}>
                  <Chip tone="neutral">{gateway.label}</Chip>
                </Row>
                <Row icon={<Building2 size={16} />} label="Settlement" hint={gateway.settlementShort}>
                  <Chip tone="money">{gateway.settlementChip}</Chip>
                </Row>
                <Row
                  icon={<ShieldCheck size={16} />}
                  label="Fees"
                  hint={`Added to what the payer pays`}
                />
              </Panel>
            ) : null}

            {current.id === "security" ? (
              <Panel>
                <Row icon={<ShieldCheck size={16} />} label="Two-factor authentication" hint="Code by email at sign-in">
                  <Chip tone="money" icon={<ShieldCheck size={12} />}>
                    On
                  </Chip>
                </Row>
                <Row icon={<ShieldCheck size={16} />} label="Data protection" hint="NDPA 2023" />
              </Panel>
            ) : null}
          </div>
        ) : (
          /* ---------------------------------------------------------- the list */
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => go("profile")}
              className="flex w-full items-center gap-3 rounded-[18px] bg-white/80 p-3.5 text-left shadow-[0_1px_2px_rgba(17,17,17,0.04),0_8px_22px_-12px_rgba(17,17,17,0.18)] backdrop-blur transition-colors hover:bg-white"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[15px] font-bold text-white">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-bold text-ink">{user?.name || "Your profile"}</span>
                  {merchant?.status === "approved" ? (
                    <BadgeCheck size={15} className="shrink-0 text-brand" aria-label={statusCopy} />
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">{user?.email}</span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink" aria-hidden="true">
                <Pencil size={15} />
              </span>
            </button>

            <Group title="Account">
              <MenuRow icon={<UserIcon size={16} />} label="My profile" onClick={() => go("profile")} />
              <MenuRow icon={<Building2 size={16} />} label="Workspace" onClick={() => go("workspace")} />
              <MenuRow icon={<BadgeCheck size={16} />} label="Verification" onClick={() => go("verification")} />
              <MenuRow icon={<Landmark size={16} />} label="Bank accounts" to="/payouts" />
              <MenuRow icon={<Users size={16} />} label="People" to="/settings/people" />
            </Group>

            <Group title="Preferences">
              <MenuRow icon={<Bell size={16} />} label="Notifications" onClick={() => go("notifications")} />
              <MenuRow icon={<CreditCard size={16} />} label="Payments" onClick={() => go("payments")} />
              <MenuRow icon={<BellRing size={16} />} label="Notification centre" to="/notifications" />
            </Group>

            <Group title="Security">
              <MenuRow icon={<KeyRound size={16} />} label="Access & security" onClick={() => go("security")} />
              <MenuRow icon={<LogOut size={16} />} label="Sign out" onClick={() => logout()} danger />
            </Group>

            <Group title="Support">
              <MenuRow icon={<LifeBuoy size={16} />} label="Help centre" href="mailto:myjeneviv@gmail.com" />
              <MenuRow
                icon={<Mail size={16} />}
                label="Change email or password"
                href="mailto:myjeneviv@gmail.com?subject=Change%20my%20sign%20in%20details"
              />
            </Group>

            {isAdmin ? (
              <p className="px-1 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                Platform admin
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
