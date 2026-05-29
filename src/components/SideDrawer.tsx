"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  FolderOpen,
  ArrowLeftRight,
  RotateCcw,
  Link2,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  university: string;
  initials: string;
  onLogout?: () => void | Promise<void>;
}

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Refunds", href: "/refunds", icon: RotateCcw },
  { label: "Payment Links", href: "/payment-links", icon: Link2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function SideDrawer({
  open,
  onClose,
  userName,
  university,
  initials,
  onLogout,
}: SideDrawerProps) {
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);

  const handleLogout = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await onLogout?.();
    setConfirming(false);
    onClose();
  };

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        aria-label="Main navigation"
        aria-hidden={!open}
        className={[
          "fixed left-0 top-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-card-hover transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Link
            href="/"
            onClick={onClose}
            className="font-serif text-xl font-black tracking-tight text-ink-black"
          >
            Jeneviv.
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1.5 text-ink-muted hover:bg-line-soft"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-black">
              {userName}
            </div>
            <div className="truncate text-xs text-ink-muted">{university}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={[
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-brand-orange text-white"
                        : "text-ink-body hover:bg-brand-orange/10 hover:text-brand-orange",
                    ].join(" ")}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-4">
          {confirming ? (
            <div className="space-y-2 rounded-md bg-line-soft p-3 text-center">
              <p className="text-sm text-ink-body">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-body hover:bg-line-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C]"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-danger bg-white px-3 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-soft"
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
