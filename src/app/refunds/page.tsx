"use client";

import { useState } from "react";
import { Menu, RotateCcw, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import SideDrawer from "@/components/SideDrawer";

const cardShadow = "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]";

const STEPS = [
  { icon: AlertCircle,   title: "Submit a request",         desc: "Provide the transaction reference and reason for the refund." },
  { icon: Clock,         title: "Verification within 24 hrs", desc: "Our team verifies the payment and approves the refund." },
  { icon: CheckCircle2,  title: "Funds returned in 3–5 days", desc: "Money is returned to the payer's original payment method." },
];

export default function RefundsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <span className="text-sm font-semibold text-ink-black">Refunds</span>
          <button type="button" className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-body hover:bg-line-soft">
            + Request
          </button>
        </header>

        {/* Desktop header */}
        <header className="hidden h-16 items-center justify-between border-b border-line bg-white px-8 lg:flex">
          <div>
            <h1 className="text-base font-semibold text-ink-black">Refunds</h1>
            <p className="text-xs text-ink-muted">Request and track refunds for verified payments.</p>
          </div>
          <button type="button" className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink-body transition hover:border-brand-orange hover:text-brand-orange">
            <RotateCcw size={15} aria-hidden="true" /> Request Refund
          </button>
        </header>

        <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">

          {/* Empty state */}
          <div className={["flex flex-col items-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-16 text-center", cardShadow].join(" ")}>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-line-soft text-ink-muted ring-4 ring-brand-orange/10">
              <RotateCcw size={24} aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-lg font-semibold text-ink-black">No refunds yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
              When you request a refund for a verified payment, it will appear here. Refunds are processed within 3 to 5 business days.
            </p>
            <button type="button" className="mt-7 flex items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-body transition hover:border-brand-orange hover:text-brand-orange">
              <RotateCcw size={14} aria-hidden="true" /> Request a Refund
            </button>
          </div>

          {/* Recent refund requests header */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-black">Recent Refund Requests</h2>
            <div className={["overflow-hidden rounded-2xl bg-white", cardShadow].join(" ")}>
              <div className="border-b border-line bg-[#F6F5F3] px-5 py-3.5">
                <div className="grid grid-cols-4 gap-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <span>Date</span><span>Payer</span><span>Amount</span><span>Status</span>
                </div>
              </div>
              <div className="px-5 py-14 text-center text-sm text-ink-muted">
                No refund requests to display.
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className={["rounded-2xl bg-white p-6 lg:p-8", cardShadow].join(" ")}>
            <h3 className="mb-6 text-sm font-semibold text-ink-black">How refunds work</h3>
            <div className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
              {/* Connector line on desktop */}
              <div className="absolute left-0 right-0 top-4 hidden h-px bg-line sm:block" aria-hidden="true" />
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="relative flex flex-col gap-3">
                    <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-brand-orange/20 text-brand-orange">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Step {i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-black">{s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policy note */}
          <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 px-5 py-5">
            <p className="text-sm font-semibold text-amber-800">Refund policy</p>
            <p className="mt-1.5 text-xs leading-relaxed text-amber-700">
              Refunds are only available for payments verified through Jeneviv. Requests must be submitted within 30 days of the original payment date. Platform fees are non-refundable.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
