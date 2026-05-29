"use client";

import { useState } from "react";
import { Menu, Copy, QrCode, CheckCircle2, Link2, ExternalLink, TrendingUp } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import SideDrawer from "@/components/SideDrawer";

type LinkStatus = "active" | "closed" | "expired";

interface PaymentLink {
  id: string;
  collectionName: string;
  department: string;
  level: string;
  url: string;
  status: LinkStatus;
  payerCount: number;
  amountCollected: number;
}

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const numFont: React.CSSProperties = { fontFamily: "Calibri,Arial,Helvetica,sans-serif" };
const cardShadow = "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]";

const STATUS_CFG: Record<LinkStatus, { label: string; cls: string; dot: string; pulse: boolean }> = {
  active:  { label: "Active",  cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", pulse: true  },
  closed:  { label: "Closed",  cls: "bg-line-soft text-ink-muted",    dot: "bg-ink-muted",   pulse: false },
  expired: { label: "Expired", cls: "bg-red-50 text-red-600",         dot: "bg-red-500",     pulse: false },
};

const MOCK: PaymentLink[] = [
  { id: "col_1", collectionName: "CSC311 Handout",          department: "Computer Science", level: "300L", url: "https://pay.jeneviv.com/c/csc311-handout-2026",    status: "active",  payerCount: 136, amountCollected: 340_000 },
  { id: "col_2", collectionName: "Departmental Levy 25/26", department: "Computer Science", level: "300L", url: "https://pay.jeneviv.com/c/dept-levy-2526",         status: "active",  payerCount: 204, amountCollected: 612_000 },
  { id: "col_3", collectionName: "Project Materials",       department: "Computer Science", level: "400L", url: "https://pay.jeneviv.com/c/project-materials-400l", status: "closed",  payerCount: 100, amountCollected: 250_000 },
];

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handle}
      className={[
        "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-line bg-white text-ink-body hover:border-brand-orange hover:text-brand-orange",
      ].join(" ")}
    >
      {copied
        ? <><CheckCircle2 size={13} aria-hidden="true" />Copied!</>
        : <><Copy size={13} aria-hidden="true" />Copy link</>}
    </button>
  );
}

export default function PaymentLinksPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = MOCK.filter((l) => l.status === "active").length;
  const totalCollected = MOCK.reduce((s, l) => s + l.amountCollected, 0);

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
          <span className="text-sm font-semibold text-ink-black">Payment Links</span>
          <div className="w-8" />
        </header>

        {/* Desktop header */}
        <header className="hidden h-16 items-center justify-between border-b border-line bg-white px-8 lg:flex">
          <div>
            <h1 className="text-base font-semibold text-ink-black">Payment Links</h1>
            <p className="text-xs text-ink-muted">Share these links with your payers to collect payments.</p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">

          {/* Summary banner */}
          <div className={["flex items-center gap-4 rounded-2xl bg-white p-5 lg:p-6", cardShadow].join(" ")}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
              <TrendingUp size={18} aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-black">
                {MOCK.length} payment links
                <span className="mx-2 text-ink-muted">·</span>
                <span className="text-emerald-600">{activeCount} active</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Total collected: <span className="font-semibold text-[#333333]" style={numFont}>{naira.format(totalCollected)}</span>
              </p>
            </div>
          </div>

          {/* Links */}
          {MOCK.length === 0 ? (
            <div className={["flex flex-col items-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-16 text-center", cardShadow].join(" ")}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-line-soft text-ink-muted">
                <Link2 size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-ink-black">No payment links yet</h2>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">Create a collection to generate a payment link.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {MOCK.map((link) => {
                const cfg = STATUS_CFG[link.status];
                return (
                  <div key={link.id} className={["overflow-hidden rounded-2xl bg-white", cardShadow].join(" ")}>
                    {/* Gradient accent strip */}
                    <div className="h-1 w-full bg-gradient-to-r from-brand-orange to-[#FFAD86]" aria-hidden="true" />

                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="truncate font-semibold text-ink-black">{link.collectionName}</h3>
                            <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", cfg.cls].join(" ")}>
                              <span className={["h-1.5 w-1.5 rounded-full", cfg.dot, cfg.pulse ? "animate-pulse" : ""].join(" ")} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">{link.department} · {link.level}</p>
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                          <p className="text-xs text-ink-muted">Collected</p>
                          <p className="font-semibold text-[#333333]" style={numFont}>{naira.format(link.amountCollected)}</p>
                        </div>
                      </div>

                      {/* Stats line */}
                      <p className="mt-3 text-xs text-ink-muted">
                        <span className="font-medium text-ink-body">{link.payerCount} payers</span>
                        <span className="mx-1.5">·</span>
                        <span style={numFont}>{naira.format(link.amountCollected)}</span> collected
                      </p>

                      {/* URL row */}
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-[#F4F4F4] px-3 py-2.5">
                        <Link2 size={13} className="shrink-0 text-ink-muted" aria-hidden="true" />
                        <span className="flex-1 truncate font-mono text-xs text-ink-muted">{link.url}</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Open link" className="shrink-0 text-ink-muted transition hover:text-brand-orange">
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-2">
                        <CopyButton url={link.url} />
                        <button type="button" aria-label="Show QR code" className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-body transition hover:border-brand-orange hover:text-brand-orange">
                          <QrCode size={13} aria-hidden="true" /> QR code
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info card */}
          <div className={["rounded-2xl bg-white p-6", cardShadow].join(" ")}>
            <h3 className="mb-2 text-sm font-semibold text-ink-black">About payment links</h3>
            <p className="text-sm leading-relaxed text-ink-body">
              Each collection has a unique payment link. Share it via WhatsApp, email, or any messaging platform. Payers do not need to download an app — the link works on any phone or browser. Payments are verified automatically and your dashboard updates in real time.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
