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
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Refunds", href: "/refunds", icon: RotateCcw },
  { label: "Payment Links", href: "/payment-links", icon: Link2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navContent = (
    <>
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
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-4">
        {confirming ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Sign out?</p>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
        </div>
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md"
          aria-label="Menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
          </div>
          {navContent}
        </aside>
      </div>
    </>
  );
}
