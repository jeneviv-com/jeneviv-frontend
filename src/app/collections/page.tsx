"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus, TrendingUp, Users, Wallet, BarChart2 } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import SideDrawer from "@/components/SideDrawer";
import CollectionCard from "@/components/CollectionCard";
import EmptyState from "@/components/EmptyState";
import type { Collection, CollectionStatus } from "@/types/dashboard";

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const numFont: React.CSSProperties = { fontFamily: "Calibri,Arial,Helvetica,sans-serif" };

const MOCK: Collection[] = [
  { id: "col_1", name: "CSC311 Handout",          department: "Computer Science", level: "300L", amountTarget: 500_000, amountCollected: 340_000, payerCount: 136, pendingCount: 64, status: "active",  createdAt: "2026-05-12T09:00:00Z" },
  { id: "col_2", name: "Departmental Levy 2025/26",department: "Computer Science", level: "300L", amountTarget: 800_000, amountCollected: 612_000, payerCount: 204, pendingCount: 56, status: "active",  createdAt: "2026-04-28T09:00:00Z" },
  { id: "col_3", name: "Project Materials",        department: "Computer Science", level: "400L", amountTarget: 250_000, amountCollected: 250_000, payerCount: 100, pendingCount: 0,  status: "closed",  createdAt: "2026-03-15T09:00:00Z" },
];

const TABS: { label: string; value: CollectionStatus | "all" }[] = [
  { label: "All",     value: "all" },
  { label: "Active",  value: "active" },
  { label: "Closed",  value: "closed" },
  { label: "Expired", value: "expired" },
];

const STATS = (cols: Collection[]) => {
  const total     = cols.length;
  const collected = cols.reduce((s, c) => s + c.amountCollected, 0);
  const active    = cols.filter((c) => c.status === "active").length;
  const payers    = cols.reduce((s, c) => s + c.payerCount, 0);
  const avg       = payers > 0 ? Math.round(collected / payers) : 0;
  return [
    { label: "Total",       value: String(total),             sub: "Collections",  icon: BarChart2  },
    { label: "Collected",   value: naira.format(collected),   sub: "All time",     icon: Wallet     },
    { label: "Active",      value: String(active),            sub: "Running now",  icon: TrendingUp },
    { label: "Avg / payer", value: naira.format(avg),         sub: "Per payer",    icon: Users      },
  ];
};

export default function CollectionsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<CollectionStatus | "all">("all");

  const filtered = tab === "all" ? MOCK : MOCK.filter((c) => c.status === tab);
  const stats    = STATS(MOCK);
  const totalCollected = MOCK.reduce((s, c) => s + c.amountCollected, 0);

  return (
    <div className="min-h-screen bg-[#F6F5F3] font-sans text-ink">
      <DesktopSidebar />
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} userName="Annbel Okon" university="University of Uyo" initials="AO" />

      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-ink-body hover:bg-line-soft">
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold text-ink-black">Collections</span>
          <Link href="/collections/new" className="flex items-center gap-1 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange-hover">
            <Plus size={13} aria-hidden="true" /> New
          </Link>
        </header>

        {/* Desktop header */}
        <header className="hidden h-16 items-center justify-between border-b border-line bg-white px-8 lg:flex">
          <div>
            <h1 className="text-base font-semibold text-ink-black">Collections</h1>
            <p className="text-xs text-ink-muted">
              {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link href="/collections/new" className="flex items-center gap-1.5 rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-orange-hover">
            <Plus size={15} aria-hidden="true" /> New Collection
          </Link>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">

          {/* Intro line */}
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink-black">{MOCK.length} collections</span>
            {" · "}
            <span style={numFont}>{naira.format(totalCollected)}</span> collected
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col gap-1 rounded-2xl border-l-2 border-brand-orange bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] lg:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{s.label}</span>
                    <span className="rounded-lg bg-brand-orange/10 p-1.5 text-brand-orange">
                      <Icon size={13} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-bold text-[#333333] lg:text-2xl" style={numFont}>{s.value}</div>
                  <div className="text-xs text-ink-muted">{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Filter tabs */}
          <div className="inline-flex gap-1 rounded-2xl bg-white p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            {TABS.map((t) => {
              const count = t.value === "all" ? MOCK.length : MOCK.filter((c) => c.status === t.value).length;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={[
                    "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition",
                    tab === t.value
                      ? "bg-brand-orange text-white shadow-sm"
                      : "text-ink-muted hover:bg-line-soft hover:text-ink-body",
                  ].join(" ")}
                >
                  {t.label}
                  <span className={["rounded-full px-1.5 py-0.5 text-[10px] font-bold", tab === t.value ? "bg-white/20 text-white" : "bg-line text-ink-muted"].join(" ")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState bankApproved={true} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => <CollectionCard key={c.id} collection={c} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
