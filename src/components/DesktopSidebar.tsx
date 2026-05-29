"use client";

import {
  ArrowLeftRight,
  FolderOpen,
  Home,
  Link2,
  LogOut,
  RotateCcw,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Refunds", href: "/refunds", icon: RotateCcw },
  { label: "Payment Links", href: "/payment-links", icon: Link2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r border-line bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-6">
        <span className="font-serif text-xl font-black tracking-tight text-ink-black">
          Jeneviv.
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-orange/10 text-brand-orange"
                      : "text-ink-body hover:bg-line-soft hover:text-ink-black",
                  ].join(" ")}
                >
                  <Icon
                    size={17}
                    aria-hidden="true"
                    className={active ? "text-brand-orange" : "text-ink-muted"}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-orange" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-4">
        {confirming ? (
          <div className="space-y-2 rounded-xl bg-line-soft p-3">
            <p className="text-center text-xs text-ink-body">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg border border-line bg-white py-2 text-xs font-semibold text-ink-body hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-danger py-2 text-xs font-semibold text-white hover:bg-[#B91C1C]"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:border-danger hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
