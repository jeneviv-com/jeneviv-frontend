import { useEffect, useMemo, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import {
  Banknote,
  Bell,
  ChevronRight,
  CircleDollarSign,
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
import { Pill, StatusPill } from "@/components/ui";
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
      { to: "/payouts", label: "Payouts", icon: Banknote },
      { to: "/refunds", label: "Refunds", icon: Undo2 },
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

const TITLES: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Everything happening across your collections today.",
  },
  "/collections": {
    title: "Collections",
    description: "Create a collection, share its link, track every payer.",
  },
  "/payment-links": {
    title: "Payment links",
    description: "Copy, share or print the link for any active collection.",
  },
  "/payers": {
    title: "Payers",
    description: "Everyone who has paid across your collections.",
  },
  "/templates": {
    title: "Templates",
    description: "Reusable payer forms for the collections you run often.",
  },
  "/transactions": {
    title: "Transactions",
    description: "Every payment, its payer, and whether it has been reconciled.",
  },
  "/payouts": {
    title: "Payouts",
    description: "Balance available, settlement schedule and payout history.",
  },
  "/refunds": {
    title: "Refunds",
    description: "Reverse a payment and keep the record against the original transaction.",
  },
  "/notifications": {
    title: "Notifications",
    description: "Payment, settlement and account activity.",
  },
  "/settings": {
    title: "Settings",
    description: "Workspace profile, payout preferences and bank accounts.",
  },
  "/admin": {
    title: "Admin",
    description: "Merchant approvals, platform volume and audit trail.",
  },
};

export default function AppShell() {
  const { user, merchant, connection, logout, isAdmin, loading } = useAuth();
  const { toasts, dismiss, unreadCount, push } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

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

  const meta = TITLES[location.pathname] ?? {
    title: "Jeneviv",
    description: "",
  };

  const needsOnboarding =
    !loading &&
    (!merchant ||
      merchant.status === "pending" ||
      merchant.status === "rejected");

  return (
    <div className="min-h-screen bg-cream">
      {/* ------------------------------------------------------------ sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-maroon transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/dashboard" className="flex items-baseline gap-0.5">
            <span className="text-[21px] font-extrabold tracking-[-0.05em] text-white">
              jeneviv
            </span>
            <span className="text-[24px] leading-none text-brand">.</span>
          </Link>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#cbb6ad] hover:bg-white/10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mx-3 mb-4 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
          <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[#a98f86]">
            Workspace
          </p>
          <p className="mt-1 truncate text-[13.5px] font-semibold text-white">
            {merchant?.display_name || user?.name || "Your workspace"}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusPill status={merchant?.status ?? "pending"} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
          {nav.map((section) => (
            <div key={section.group} className="mb-4">
              <p className="px-3 pb-1.5 font-mono text-3xs uppercase tracking-[0.16em] text-[#8a6b61]">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `side-link ${isActive ? "side-link-active" : ""}`
                      }
                    >
                      <item.icon size={16} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {item.to === "/notifications" && unreadCount > 0 ? (
                        <span className="rounded-pill bg-brand px-1.5 py-0.5 text-3xs font-bold text-white">
                          {unreadCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          {connection === "demo" ? (
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                push({
                  tone: "info",
                  title: "Demo data reset",
                  body: "Collections, payers and payouts were restored to the seeded set.",
                });
              }}
              className="side-link w-full justify-start"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Reset demo data
            </button>
          ) : null}
          <a
            href="mailto:myjeneviv@gmail.com"
            className="side-link w-full justify-start"
          >
            <LifeBuoy size={15} aria-hidden="true" />
            Get support
          </a>
          <a
            href={import.meta.env.VITE_PUBLIC_APP_URL || "/"}
            className="side-link w-full justify-start"
          >
            <ExternalLink size={15} aria-hidden="true" />
            View landing page
          </a>
        </div>
      </aside>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-maroon-deep/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* --------------------------------------------------------------- main */}
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-line bg-cream/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-ink-soft lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={17} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold tracking-tight text-ink">
                {meta.title}
              </h1>
              {meta.description ? (
                <p className="hidden truncate text-[12px] text-ink-muted sm:block">
                  {meta.description}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {connection === "demo" ? (
                <Pill tone="amber" className="hidden sm:inline-flex">
                  Demo data
                </Pill>
              ) : connection === "live" ? (
                <Pill tone="green" className="hidden sm:inline-flex">
                  Live API
                </Pill>
              ) : null}

              <Link
                to="/notifications"
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:text-ink"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-3xs font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-lg border border-line bg-white py-1.5 pl-1.5 pr-2.5 text-left transition-colors hover:border-ink/20"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-maroon text-3xs font-bold text-cream">
                    {(user?.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[130px] truncate text-[12.5px] font-semibold sm:block">
                    {user?.name || "Coordinator"}
                  </span>
                  <ChevronRight
                    size={13}
                    className="text-ink-muted"
                    aria-hidden="true"
                  />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-60 animate-fade-up rounded-xl border border-line bg-white p-2 shadow-pop">
                    <div className="border-b border-line-soft px-3 pb-2.5 pt-1.5">
                      <p className="truncate text-[13px] font-semibold">
                        {user?.name}
                      </p>
                      <p className="truncate text-[11.5px] text-ink-muted">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft hover:bg-cream"
                    >
                      <SettingsIcon size={15} /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-danger hover:bg-[#fdecea]"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {connection === "demo" ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-[#f2dfb6] bg-[#fffaef] px-4 py-2 text-[12px] text-[#8a5d00] sm:px-6">
              <CircleDollarSign size={14} aria-hidden="true" />
              <span>
                The Jeneviv backend host is not responding, so the dashboard is
                running on seeded demo data. Point{" "}
                <code className="font-mono text-[11.5px]">VITE_API_URL</code> at
                a running API and set{" "}
                <code className="font-mono text-[11.5px]">VITE_DEMO_MODE=false</code>{" "}
                to switch to live data.
              </span>
            </div>
          ) : null}
        </header>

        <main className="px-4 pb-16 pt-6 sm:px-6">
          {needsOnboarding ? (
            <Onboarding />
          ) : (
            <div className="mx-auto max-w-[1180px] animate-fade-up">
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
            className="pointer-events-auto animate-fade-up rounded-xl border border-line bg-white p-3.5 shadow-pop"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  toast.tone === "success"
                    ? "bg-success"
                    : toast.tone === "error"
                      ? "bg-danger"
                      : toast.tone === "warning"
                        ? "bg-warning"
                        : "bg-brand"
                }`}
              />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink">
                  {toast.title}
                </p>
                {toast.body ? (
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                    {toast.body}
                  </p>
                ) : null}
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
