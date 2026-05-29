"use client";

import Link from "next/link";
import { Plus, Zap, BarChart2, FileText } from "lucide-react";

interface EmptyStateProps {
  bankApproved: boolean;
}

export default function EmptyState({ bankApproved }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange/8">
        <svg viewBox="0 0 80 80" className="h-10 w-10" aria-hidden="true">
          <polygon points="28,8 72,18 56,72 12,62" fill="#FFAD86" />
          <polygon points="32,14 66,22 50,66 16,58" fill="#FE4900" />
          <circle cx="41" cy="40" r="5" fill="#ffffff" />
        </svg>
      </div>

      <h2 className="mt-5 font-serif text-2xl font-bold text-ink-black lg:text-3xl">
        Create your first collection
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-body lg:text-base">
        Share a payment link, track who&apos;s paid in real time, and export a
        verified payer report — all in one place.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4 text-left sm:gap-6">
        {[
          { icon: Zap, label: "Real-time tracking", desc: "See payments as they happen" },
          { icon: BarChart2, label: "Progress dashboard", desc: "Collected vs. target at a glance" },
          { icon: FileText, label: "Verified report", desc: "One-click PDF for any stakeholder" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
              <f.icon size={16} aria-hidden="true" />
            </span>
            <p className="text-xs font-semibold text-ink-black">{f.label}</p>
            <p className="text-[11px] leading-snug text-ink-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {bankApproved ? (
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-7 py-3 text-sm font-semibold text-white shadow-fab transition hover:bg-brand-orange-hover"
          >
            <Plus size={16} aria-hidden="true" />
            Create Collection
          </Link>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              title="Verify your bank account first"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-line px-7 py-3 text-sm font-semibold text-ink-muted"
            >
              <Plus size={16} aria-hidden="true" />
              Create Collection
            </button>
            <p className="text-xs text-ink-muted">
              Verify your bank account first to unlock collections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
