import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import {
  Banknote,
  Bell,
  ChevronRight,
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

  // The account menu used to stay open until you clicked it again, which made
  // it feel stuck. Close it on outside click and on Escape.
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

  const needsOnboarding =
    !loading &&
    (!merchant ||
      merchant.status === "pending" ||
      merchant.status === "rejected");

  return (
    <div className="min-h-screen bg-cream">
      {/* ------------------------------------------------------------ sidebar */}
      <aside
        className="app-sidebar fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col border-r border-line bg-white"
        data-open={sidebarOpen}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <a
            href={landingUrl}
            className="flex items-center gap-2.5"
            aria-label="Jeneviv — back to the website"
          >
            <img
              src="/assets/images/jeneviv.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-[8px] object-cover"
            />
            <span className="flex items-baseline gap-0.5">
              <span className="text-[19px] font-extrabold tracking-[-0.05em] text-ink">
                jeneviv
              </span>
              <span className="text-[21px] leading-none text-brand">.</span>
            </span>
          </a>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-cream hover:text-ink lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mx-3 mb-4 border-b border-line-soft px-1 pb-4">
          <p className="font-mono text-3xs uppercase tracking-[0.16em] text-ink-muted">
            Workspace
          </p>
          <p className="mt-1.5 truncate text-[13px] font-semibold text-ink">
            {merchant?.display_name || user?.name || "Your workspace"}
          </p>
          <div className="mt-2">
            <StatusPill status={merchant?.status ?? "pending"} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
          {nav.map((section) => (
            <div key={section.group} className="mb-4">
              <p className="px-2.5 pb-1.5 font-mono text-3xs uppercase tracking-[0.16em] text-ink-faint">
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
                      <item.icon size={15} strokeWidth={1.8} aria-hidden="true" />
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

        <div className="border-t border-line-soft px-3 py-3">
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
              <RefreshCw size={14} aria-hidden="true" />
              Reset demo data
            </button>
          ) : null}
          <a
            href="mailto:myjeneviv@gmail.com"
            className="side-link w-full justify-start"
          >
            <LifeBuoy size={14} aria-hidden="true" />
            Get support
          </a>
          <a
            href={landingUrl}
            className="side-link w-full justify-start"
          >
            <ExternalLink size={14} aria-hidden="true" />
            View landing page
          </a>
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
      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-20 border-b border-line bg-white">
          <div className="flex h-[60px] items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-ink-soft lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={17} />
            </button>

            <img
              src="/assets/images/jeneviv.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 rounded-[6px] object-cover lg:hidden"
            />

            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1.5 text-[12.5px]"
            >
              <span className="hidden text-ink-muted sm:inline">Workspace</span>
              <ChevronRight
                size={12}
                className="hidden text-ink-faint sm:inline"
                aria-hidden="true"
              />
              <span className="truncate font-semibold text-ink">{current}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
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
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:border-ink/20 hover:text-ink"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-3xs font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-lg border border-line bg-white py-1 pl-1 pr-2 text-left transition-colors hover:border-ink/20"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-3xs font-bold text-white">
                    {(user?.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[130px] truncate text-[12.5px] font-semibold sm:block">
                    {user?.name || "Coordinator"}
                  </span>
                  <ChevronRight
                    size={13}
                    className="rotate-90 text-ink-muted"
                    aria-hidden="true"
                  />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-60 animate-pop-in rounded-xl border border-line bg-white p-2 shadow-pop"
                  >
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
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-danger hover:bg-[#fbeceb]"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {connection === "demo" ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-cream/60 px-4 py-2 text-[12px] text-ink-muted sm:px-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              <span>
                The Jeneviv backend host is not responding, so the dashboard is
                running on seeded demo data. Point{" "}
                <code className="font-mono text-[11.5px] text-ink">
                  VITE_API_URL
                </code>{" "}
                at a running API and set{" "}
                <code className="font-mono text-[11.5px] text-ink">
                  VITE_DEMO_MODE=false
                </code>{" "}
                to switch to live data.
              </span>
            </div>
          ) : null}
        </header>

        <main className="px-4 pb-16 pt-7 sm:px-6 lg:px-8">
          {needsOnboarding ? (
            <Onboarding />
          ) : (
            <div
              key={location.pathname}
              className="mx-auto max-w-[1180px] animate-page-in"
            >
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
            className="pointer-events-auto animate-toast-in rounded-xl border border-line bg-white p-3.5 shadow-pop"
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
                        : "bg-ink"
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
