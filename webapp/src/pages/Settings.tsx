import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  LogOut,
  Mail,
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
  InlineNote,
  Input,
  Toggle,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

type Period = NonNullable<MerchantSettings["email_notification_period"]>;

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "workspace", label: "Workspace" },
  { id: "verification", label: "Verification" },
  { id: "notifications", label: "Notifications" },
  { id: "payments", label: "Payments" },
  { id: "security", label: "Security" },
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

/** A titled card. The id is the anchor the section nav scrolls to. */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: SectionId;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-3 px-1">
        <h2 id={`${id}-title`} className="text-[15px] font-bold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">{description}</p>
      </div>
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">{children}</div>
    </section>
  );
}

/** One row: icon well, label and hint, then whatever belongs on the right. */
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
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-[12px] ${
          tone === "danger" ? "bg-[#fbeceb] text-danger" : "bg-cream text-ink"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13.5px] font-semibold ${tone === "danger" ? "text-danger" : "text-ink"}`}>
          {label}
        </span>
        {hint ? <span className="mt-0.5 block truncate text-[12px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </>
  );
  const className =
    "flex w-full items-center gap-3 border-b border-line-soft px-4 py-3.5 text-left transition-colors last:border-b-0 sm:px-5";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} hover:bg-cream/50`}>
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function ManageLink({ to, children = "Manage" }: { to: string; children?: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-cream"
    >
      {children} <ChevronRight size={14} aria-hidden="true" />
    </Link>
  );
}

/** Highlights the section currently in view, for the side nav. */
function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>("profile");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (window.scrollY < 80) setActive("profile");
        else if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/* --------------------------------------------------------------------- page */

export default function Settings() {
  const { user, merchant, refreshMerchant, refreshSession, logout, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const accounts = useBankAccounts();
  const gateway = useGateway();
  const active = useActiveSection();
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
    <div className="mx-auto w-full max-w-[1040px] pb-10">
      {/* identity */}
      <div className="relative mb-6 overflow-hidden rounded-card bg-ink p-5 text-cream sm:p-6">
        <span
          className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-brand/25 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="relative">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand text-[18px] font-bold text-white ring-2 ring-brand/45 ring-offset-2 ring-offset-ink sm:h-[72px] sm:w-[72px]">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
            </span>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label={avatar ? "Change profile picture" : "Upload a profile picture"}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white text-ink transition-transform hover:scale-105 disabled:opacity-60"
            >
              <Upload size={12} aria-hidden="true" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[18px] font-bold leading-snug tracking-tight text-cream sm:text-[21px]">
              {merchant?.display_name || user?.name || "Your workspace"}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] text-cream/60">
              {user?.name ? `${user.name} · ` : ""}
              {user?.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-cream">
              {merchant?.status === "approved" ? (
                <BadgeCheck size={12} className="text-brand-peach" aria-hidden="true" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              )}
              {statusCopy}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-cream">
              <ShieldCheck size={12} aria-hidden="true" /> {isAdmin ? "Platform admin" : "Owner"}
            </span>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
        {/* section nav: chips on phones, a sticky list on laptops */}
        <nav aria-label="Settings sections" className="sticky top-[calc(env(safe-area-inset-top,0px)+8px)] z-10 -mx-1 mb-5 lg:mx-0 lg:mb-0 lg:self-start">
          <ul className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-white/90 p-1 backdrop-blur [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-visible lg:rounded-[18px] lg:p-1.5">
            {SECTIONS.map((section) => {
              const isActive = active === section.id;
              return (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors lg:rounded-[12px] lg:px-3 lg:py-2 ${
                      isActive ? "bg-ink text-white" : "text-ink-muted hover:bg-cream hover:text-ink"
                    }`}
                  >
                    <span
                      className={`hidden h-1.5 w-1.5 rounded-full lg:block ${isActive ? "bg-brand" : "bg-transparent"}`}
                      aria-hidden="true"
                    />
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-8">
          {/* ---------------------------------------------------------- profile */}
          <Section id="profile" title="Profile" description="Who you are on Jeneviv.">
            <Row icon={<UserIcon size={16} />} label="Profile picture" hint="PNG, JPEG, WebP or HEIC · up to 5 MB">
              <div className="flex shrink-0 items-center gap-1.5">
                {avatar ? (
                  <button
                    type="button"
                    onClick={clearAvatar}
                    disabled={uploading}
                    aria-label="Remove profile picture and use my initials"
                    title="Remove and use your initials"
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
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/avif"
                  className="hidden"
                  onChange={(event) => pickAvatar(event.target.files?.[0])}
                />
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
          </Section>

          {/* -------------------------------------------------------- workspace */}
          <Section id="workspace" title="Workspace" description="What payers see, and who helps you run it.">
            <div className="border-b border-line-soft px-4 py-4 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-ink-muted">Shown on the page payers see.</p>
                <Button
                  size="sm"
                  icon={<Save size={13} />}
                  loading={apply.loading}
                  disabled={!workspaceDirty || workspace.display_name.trim().length < 2}
                  onClick={async () => {
                    try {
                      await apply.run(workspace.display_name.trim(), workspace.application_note.trim());
                      await refreshMerchant();
                      success("Workspace updated", "Your changes are saved.");
                    } catch (err) {
                      toastError("Could not save", err instanceof Error ? err.message : "");
                    }
                  }}
                >
                  Save changes
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
            <Row
              icon={<Building2 size={16} />}
              label="Bank accounts"
              hint={
                defaultAccount
                  ? `${defaultAccount.bank_name} ••${defaultAccount.account_number.slice(-4)}`
                  : "No default account yet"
              }
            >
              <ManageLink to="/payouts" />
            </Row>
            <Row icon={<Users size={16} />} label="People" hint="Invite teammates and choose what they can do">
              <ManageLink to="/settings/people" />
            </Row>
          </Section>

          {/* ----------------------------------------------------- verification */}
          <Section
            id="verification"
            title="Verification"
            description="Collect from day one. Withdrawals unlock once your identity and bank match."
          >
            <div className="p-4 sm:p-5">
              <KycCard />
            </div>
          </Section>

          {/* ---------------------------------------------------- notifications */}
          <Section
            id="notifications"
            title="Notifications"
            description="Payment emails go to the workspace owner's address."
          >
            <div className="border-b border-line-soft px-4 py-4 sm:px-5">
              <Toggle
                checked={emailsOn}
                onChange={(value) =>
                  saveNotify(
                    { email_notification_for_transactions: value },
                    value ? "Payment emails on" : "Payment emails off",
                  )
                }
                label="Email me about payments"
                description={emailsOn ? `Sent to ${user?.email ?? "your email"}.` : "You will still see every payment in the dashboard."}
              />
            </div>
            <fieldset
              disabled={!emailsOn || updateSettings.loading}
              className={`px-4 py-4 transition-opacity sm:px-5 ${emailsOn ? "" : "opacity-50"}`}
            >
              <legend className="sr-only">How often</legend>
              <p className="text-[13.5px] font-semibold text-ink" aria-hidden="true">
                How often
              </p>
              <div role="radiogroup" aria-label="How often" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
            <Row icon={<Bell size={16} />} label="Notification centre" hint="Payments, refunds and account decisions">
              <ManageLink to="/notifications">Open</ManageLink>
            </Row>
          </Section>

          {/* --------------------------------------------------------- payments */}
          <Section id="payments" title="Payments" description="How money moves from your payers to you.">
            <Row icon={<CreditCard size={16} />} label="Payment gateway" hint={gateway.processedBy}>
              <Chip tone="neutral">{gateway.label}</Chip>
            </Row>
            <Row icon={<Building2 size={16} />} label="Settlement" hint={gateway.settlementShort}>
              <Chip tone="money">{gateway.settlementChip}</Chip>
            </Row>
            <Row icon={<ShieldCheck size={16} />} label="Fees" hint={`Jeneviv's fee and the ${gateway.label} fee are added to what the payer pays`} />
          </Section>

          {/* --------------------------------------------------------- security */}
          <Section id="security" title="Security & data" description="Sign-in protection and how your data is handled.">
            <Row icon={<ShieldCheck size={16} />} label="Two-factor authentication" hint="A one-time code is emailed at sign-in">
              <Chip tone="money" icon={<ShieldCheck size={12} />}>
                Email OTP
              </Chip>
            </Row>
            <Row icon={<ShieldCheck size={16} />} label="Data protection" hint="Nigeria Data Protection Act">
              <Chip tone="neutral">NDPA 2023</Chip>
            </Row>
            <Row icon={<LogOut size={16} />} label="Sign out of this device" tone="danger" onClick={() => logout()}>
              <ChevronRight size={15} className="shrink-0 text-ink-faint" />
            </Row>
          </Section>

          <p className="px-1 text-[12px] leading-relaxed text-ink-muted">
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
      </div>
    </div>
  );
}
