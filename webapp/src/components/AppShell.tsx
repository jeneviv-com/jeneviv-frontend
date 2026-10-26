import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import {
  Banknote,
  Bell,
  ChevronDown,
  ExternalLink,
  HandCoins,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  RefreshCw,
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { resetDemoData } from "@/lib/demo";
import { initials } from "@/lib/format";
import { TONE_MEANING, type ToneKind } from "@/components/ui";
import Onboarding from "@/pages/Onboarding";

const NAV = [
  {
    group: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Collect",
    items: [
      { to: "/collections", label: "Collections", icon: HandCoins },
      { to: "/payment-links", label: "Payment links", icon: Link2 },
      { to: "/payers", label: "Payers", icon: Users },
      { to: "/templates", label: "Templates", icon: LayoutTemplate },
    ],
  },
  {
    group: "Money",
    items: [
      { to: "/transactions", label: "Transactions", icon: ReceiptText },
      { to: "/refunds", label: "Refunds", icon: Undo2 },
      // Payments settle straight to this account, so this page is about the
      // destination bank account rather than a platform wallet.
      { to: "/payouts", label: "Bank & settlement", icon: Banknote },
    ],
  },
  {
    group: "Workspace",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/collections": "Collections",
  "/payment-links": "Payment links",
  "/payers": "Payers",
  "/templates": "Templates",
  "/transactions": "Transactions",
  "/payouts": "Bank & settlement",
  "/refunds": "Refunds",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/admin": "Admin",
};

/** Maps merchant status to the shared colour meanings. */
function statusKind(status: string | undefined): { kind: ToneKind; label: string } {
  switch (status) {
    case "approved":
      return { kind: "money", label: "Approved" };
    case "pending":
      return { kind: "attention", label: "In review" };
    case "rejected":
      return { kind: "attention", label: "Action needed" };
    case "suspended":
      return { kind: "attention", label: "Suspended" };
    default:
      return { kind: "neutral", label: "Not set up" };
  }
}

/** One sidebar link: a rounded row, an icon well, and a pill when active. */
function SideLink({
  to,
  label,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-[12px] px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-150 ${
          isActive ? "bg-ink text-cream" : "text-ink-soft hover:bg-cream hover:text-ink"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] transition-colors duration-150 ${
              isActive ? "bg-white/12 text-cream" : "bg-cream text-ink-muted group-hover:text-ink"
            }`}
          >
            <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <span className="flex-1 truncate">{label}</span>
          {badge ? (
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] font-bold ${
                isActive ? "bg-brand text-white" : "bg-brand text-white"
              }`}
            >
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

/** A small footer action, same rhythm as the links above. */
function FootLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href?: string;
  icon: typeof LifeBuoy;
  children: ReactNode;
  onClick?: () => void;
}) {
  const classes =
    "flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left text-[13px] font-medium text-ink-muted transition-colors duration-150 hover:bg-cream hover:text-ink";
  const inner = (
    <>
      <Icon size={14} aria-hidden="true" />
      {children}
    </>
  );
  if (href) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}

export default function AppShell() {
  const landingUrl = import.meta.env.VITE_PUBLIC_APP_URL || "/";
  const { user, merchant, connection, logout, isAdmin, loading } = useAuth();
  const { toasts, dismiss, unreadCount, push } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // The mobile navigation is a full-height overlay: lock the page behind it and
  // let Escape close it, like the dialogs.
  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  // Close the account menu on outside click and on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const nav = useMemo(() => {
    if (!isAdmin) return NAV;
    return [
      ...NAV,
      {
        group: "Platform",
        items: [{ to: "/admin", label: "Admin", icon: ShieldCheck }],
      },
    ];
  }, [isAdmin]);

  const current = TITLES[location.pathname] ?? "Jeneviv";
  const status = statusKind(merchant?.status);
  const displayName = merchant?.display_name || user?.name || "Your workspace";

  const needsOnboarding =
    !loading &&
    (!merchant || merchant.status === "pending" || merchant.status === "rejected");

  return (
    <div className="min-h-screen bg-cream">
      {/* ------------------------------------------------------------ sidebar */}
      <aside
        className="app-sidebar fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col border-r border-line bg-white"
        data-open={sidebarOpen}
      >
        {/* brand */}
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <a href={landingUrl} className="flex items-center gap-2.5" aria-label="Jeneviv — back to the website">
            <img
              src="/assets/images/jeneviv.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-[9px] object-cover shadow-[0_1px_2px_rgba(18,16,14,0.12)]"
            />
            <span className="flex items-baseline gap-0.5">
              <span className="text-[19px] font-extrabold tracking-[-0.05em] text-ink">jeneviv</span>
              <span className="text-[21px] leading-none text-brand">.</span>
            </span>
          </a>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-cream hover:text-ink lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* workspace card */}
        <div className="mx-3 mb-5 rounded-[16px] bg-cream p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">
              {initials(displayName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{displayName}</p>
              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${TONE_MEANING[status.kind]}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* navigation */}
        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          {nav.map((section) => (
            <div key={section.group} className="mb-5">
              <p className="px-2.5 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <SideLink
                      to={item.to}
                      label={item.label}
                      icon={item.icon}
                      badge={item.to === "/notifications" ? unreadCount : undefined}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* footer */}
        <div className="mx-3 border-t border-line-soft py-3">
          {connection === "demo" ? (
            <FootLink
              icon={RefreshCw}
              onClick={() => {
                resetDemoData();
                push({
                  tone: "info",
                  title: "Demo data reset",
                  body: "Collections, payers and payouts were restored to the seeded set.",
                });
              }}
            >
              Reset demo data
            </FootLink>
          ) : null}
          <FootLink href="mailto:myjeneviv@gmail.com" icon={LifeBuoy}>
            Get support
          </FootLink>
          <FootLink href={landingUrl} icon={ExternalLink}>
            View landing page
          </FootLink>
        </div>
      </aside>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-ink/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* --------------------------------------------------------------- main */}
      <div className="lg:pl-[256px]">
        <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur-md">
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-white text-ink-soft transition-colors hover:border-ink/20 hover:text-ink lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={17} />
            </button>

            {/* page title: the breadcrumb is now a calm heading */}
            <div className="min-w-0">
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted sm:block">
                Workspace
              </p>
              <p className="truncate text-[16px] font-bold tracking-tight text-ink sm:mt-0.5">{current}</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {connection === "demo" ? (
                <span className="hidden items-center gap-1.5 rounded-full bg-[#fff3dd] px-3 py-1.5 text-[11.5px] font-semibold text-ink sm:inline-flex">
                  Demo data
                </span>
              ) : connection === "live" ? (
                <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex ${TONE_MEANING.money}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                  Live
                </span>
              ) : null}

              <Link
                to="/notifications"
                className="relative grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-white text-ink-soft transition-colors hover:border-ink/20 hover:text-ink"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>

              {/* account */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-white py-1 pl-1 pr-2.5 text-left transition-colors hover:border-ink/20"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-ink text-[11px] font-bold text-cream">
                    {initials(user?.name || "?")}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-[12.5px] font-semibold sm:block">
                    {user?.name || "Coordinator"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-ink-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-64 animate-pop-in overflow-hidden rounded-[18px] border border-line bg-white shadow-pop"
                  >
                    <div className="flex items-center gap-3 bg-cream px-4 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">
                        {initials(user?.name || "?")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold">{user?.name}</p>
                        <p className="truncate text-[11.5px] text-ink-muted">{user?.email}</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/settings"
                        role="menuitem"
                        className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-cream hover:text-ink"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-cream">
                          <SettingsIcon size={14} />
                        </span>
                        Settings
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          await logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium text-danger transition-colors hover:bg-[#fbeceb]"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#fbeceb]">
                          <LogOut size={14} />
                        </span>
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {connection === "demo" ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-white px-4 py-2.5 text-[12px] text-ink-muted sm:px-6 lg:px-8">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              <span>
                The Jeneviv backend host is not responding, so the dashboard is running on seeded demo data. Point{" "}
                <code className="font-mono text-[11.5px] text-ink">VITE_API_URL</code> at a running API and set{" "}
                <code className="font-mono text-[11.5px] text-ink">VITE_DEMO_MODE=false</code> to switch to live data.
              </span>
            </div>
          ) : null}
        </header>

        <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {needsOnboarding ? (
            <Onboarding />
          ) : (
            <div key={location.pathname} className="mx-auto max-w-[1180px] animate-page-in">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------- toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-toast-in rounded-[16px] border border-line bg-white p-3.5 shadow-pop"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  toast.tone === "success"
                    ? "bg-success"
                    : toast.tone === "error"
                      ? "bg-danger"
                      : toast.tone === "warning"
                        ? "bg-warning"
                        : "bg-ink"
                }`}
              />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink">{toast.title}</p>
                {toast.body ? <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{toast.body}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-ink-faint transition-colors hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
