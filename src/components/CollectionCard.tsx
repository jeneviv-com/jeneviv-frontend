"use client";

import Link from "next/link";
import type { Collection, CollectionStatus } from "@/types/dashboard";

interface CollectionCardProps {
  collection: Collection;
}

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const STATUS_CONFIG: Record<CollectionStatus, { label: string; cls: string; dot: string }> = {
  active:  { label: "Live",   cls: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-500" },
  closed:  { label: "Closed", cls: "bg-line text-ink-muted",          dot: "bg-ink-muted" },
  expired: { label: "Expired",cls: "bg-danger-soft text-danger",      dot: "bg-danger" },
};

export default function CollectionCard({ collection }: CollectionCardProps) {
  const pct = Math.min(
    100,
    collection.amountTarget > 0
      ? Math.round((collection.amountCollected / collection.amountTarget) * 100)
      : 0,
  );

  const cfg = STATUS_CONFIG[collection.status];

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-line"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink-black group-hover:text-brand-orange transition-colors lg:text-base">
            {collection.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {collection.department} · {collection.level}
          </p>
        </div>
        <span className={["flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", cfg.cls].join(" ")}>
          <span className={["h-1.5 w-1.5 rounded-full", cfg.dot, collection.status === "active" ? "animate-pulse" : ""].join(" ")} />
          {cfg.label}
        </span>
      </div>

      {/* Amount */}
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-[#333333]" style={{fontFamily:"Calibri,Arial,Helvetica,sans-serif"}}>
          {naira.format(collection.amountCollected)}
        </span>
        <span className="text-sm text-ink-muted">
          / {naira.format(collection.amountTarget)}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={[
            "h-full rounded-full transition-all",
            collection.status === "active" ? "bg-brand-orange" : "bg-ink-muted/40",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {collection.payerCount} paid
          </span>
          {collection.pendingCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {collection.pendingCount} pending
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-ink-muted">{pct}%</span>
      </div>
    </Link>
  );
}
