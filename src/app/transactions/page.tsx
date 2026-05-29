"use client";

import { useState } from "react";
import { Menu, Search, Download, Calendar, ArrowUpDown } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import SideDrawer from "@/components/SideDrawer";

type TxStatus = "successful" | "pending" | "failed";

interface Transaction {
  id: string;
  date: string;
  payerName: string;
  collection: string;
  amount: number;
  status: TxStatus;
  reference: string;
}

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const numFont: React.CSSProperties = { fontFamily: "Calibri,Arial,Helvetica,sans-serif" };

const MOCK: Transaction[] = [
  { id: "tx_1", date: "2026-05-27", payerName: "Adaeze Okonkwo",  collection: "CSC311 Handout",          amount: 2500, status: "successful", reference: "JNV-TX-001" },
  { id: "tx_2", date: "2026-05-27", payerName: "Emeka Nwosu",     collection: "CSC311 Handout",          amount: 2500, status: "successful", reference: "JNV-TX-002" },
  { id: "tx_3", date: "2026-05-26", payerName: "Fatima Musa",     collection: "Departmental Levy 25/26", amount: 3000, status: "pending",    reference: "JNV-TX-003" },
  { id: "tx_4", date: "2026-05-26", payerName: "Chukwuemeka Eze", collection: "Departmental Levy 25/26", amount: 3000, status: "successful", reference: "JNV-TX-004" },
  { id: "tx_5", date: "2026-05-25", payerName: "Ngozi Obi",       collection: "CSC311 Handout",          amount: 2500, status: "failed",     reference: "JNV-TX-005" },
  { id: "tx_6", date: "2026-05-25", payerName: "Yusuf Abdullahi", collection: "Project Materials",       amount: 2500, status: "successful", reference: "JNV-TX-006" },
  { id: "tx_7", date: "2026-05-24", payerName: "Amaka Igwe",      collection: "Project Materials",       amount: 2500, status: "successful", reference: "JNV-TX-007" },
  { id: "tx_8", date: "2026-05-24", payerName: "Tunde Bakare",    collection: "Departmental Levy 25/26", amount: 3000, status: "pending",    reference: "JNV-TX-008" },
];

const STATUS_CFG: Record<TxStatus, { label: string; badge: string; dot: string; border: string }> = {
  successful: { label: "Successful", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", border: "border-l-4 border-emerald-400" },
  pending:    { label: "Pending",    badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400",   border: "border-l-4 border-amber-400"   },
  failed:     { label: "Failed",     badge: "bg-red-50 text-red-600",         dot: "bg-red-500",     border: "border-l-4 border-red-400"     },
};

function Badge({ status }: { status: TxStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", c.badge].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", c.dot].join(" ")} />
      {c.label}
    </span>
  );
}

function downloadCsv(rows: Transaction[]) {
  const headers = ["Date", "Payer Name", "Collection", "Amount", "Status", "Reference"];
  const csv = [headers, ...rows.map((t) => [t.date, t.payerName, t.collection, String(t.amount), t.status, t.reference])]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jeneviv-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = MOCK.filter(
    (t) =>
      t.payerName.toLowerCase().includes(search.toLowerCase()) ||
      t.collection.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase()),
  );

  const totalVol     = filtered.filter((t) => t.status === "successful").reduce((s, t) => s + t.amount, 0);
  const successCount = filtered.filter((t) => t.status === "successful").length;
  const pendingCount = filtered.filter((t) => t.status === "pending").length;

  const cardShadow = "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]";

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
          <span className="text-sm font-semibold text-ink-black">Transactions</span>
          <button type="button" onClick={() => downloadCsv(filtered)} aria-label="Export" className="rounded-lg border border-line bg-white p-2 text-ink-body hover:bg-line-soft">
            <Download size={16} aria-hidden="true" />
          </button>
        </header>

        {/* Desktop header */}
        <header className="hidden h-16 items-center justify-between border-b border-line bg-white px-8 lg:flex">
          <div>
            <h1 className="text-base font-semibold text-ink-black">Transactions</h1>
            <p className="text-xs text-ink-muted">
              {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button type="button" onClick={() => downloadCsv(filtered)} className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink-body transition hover:bg-line-soft">
            <Download size={15} aria-hidden="true" /> Export CSV
          </button>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Volume",    value: naira.format(totalVol),  sub: "Successful" },
              { label: "Confirmed", value: String(successCount),    sub: "Transactions" },
              { label: "Pending",   value: String(pendingCount),    sub: "Awaiting" },
            ].map((s) => (
              <div key={s.label} className={["rounded-2xl border-l-2 border-brand-orange bg-white p-5 lg:p-6", cardShadow].join(" ")}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{s.label}</p>
                <p className="mt-2 text-xl font-bold text-[#333333] lg:text-2xl" style={numFont}>{s.value}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search payer, collection, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white py-3 pl-10 pr-4 text-sm text-ink-black shadow-sm placeholder:text-ink-muted focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition"
              />
            </div>
            <button type="button" className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-body hover:bg-line-soft">
              <Calendar size={14} aria-hidden="true" /> Date range
            </button>
          </div>

          <p className="text-xs text-ink-muted">
            Showing <span className="font-semibold text-ink-black">{filtered.length}</span> of {MOCK.length} transactions
          </p>

          {/* Desktop table */}
          <div className={["hidden overflow-hidden rounded-2xl bg-white lg:block", cardShadow].join(" ")}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-line bg-[#F6F5F3] text-left">
                  {["Date", "Payer Name", "Collection", "Amount", "Status", "Reference"].map((h) => (
                    <th key={h} className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      <span className="flex items-center gap-1">{h} <ArrowUpDown size={10} className="opacity-30" /></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-brand-orange/[0.02]">
                    <td className="px-5 py-4 text-xs text-ink-muted">{t.date}</td>
                    <td className="px-5 py-4 font-medium text-ink-black">{t.payerName}</td>
                    <td className="px-5 py-4 text-ink-body">{t.collection}</td>
                    <td className="px-5 py-4 font-semibold text-[#333333]" style={numFont}>{naira.format(t.amount)}</td>
                    <td className="px-5 py-4"><Badge status={t.status} /></td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-muted">{t.reference}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-ink-muted">No transactions match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtered.length === 0 ? (
              <div className={["rounded-2xl bg-white px-5 py-14 text-center text-sm text-ink-muted", cardShadow].join(" ")}>
                No transactions match your search.
              </div>
            ) : filtered.map((t) => (
              <div key={t.id} className={["rounded-2xl bg-white p-4 pl-5", STATUS_CFG[t.status].border, cardShadow].join(" ")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-black">{t.payerName}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{t.collection}</p>
                  </div>
                  <Badge status={t.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="font-bold text-[#333333]" style={numFont}>{naira.format(t.amount)}</span>
                  <span className="font-mono text-xs text-ink-muted">{t.reference}</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{t.date}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
