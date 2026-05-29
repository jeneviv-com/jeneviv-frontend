"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import type { BankStatus } from "@/types/dashboard";

interface BankStatusBannerProps {
  status: BankStatus;
  rejectionReason?: string;
}

export default function BankStatusBanner({
  status,
  rejectionReason,
}: BankStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (status === "approved" || dismissed) return null;

  const isRejected = status === "rejected";

  return (
    <div
      role="alert"
      className={[
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        isRejected
          ? "border-danger bg-danger-soft text-[#7F1D1D]"
          : "border-amber-banner-border bg-amber-banner text-amber-banner-text",
      ].join(" ")}
    >
      <AlertTriangle
        size={18}
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <div className="flex-1 leading-snug">
        {isRejected ? (
          <>
            <strong className="block font-semibold">
              Your bank details were rejected
            </strong>
            <span className="block">
              {rejectionReason ||
                "Resubmit your payout account to start collecting."}
            </span>
            <Link
              href="/settings/bank"
              className="mt-1 inline-flex items-center gap-1 font-semibold hover:opacity-80"
            >
              Resubmit bank details
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <strong className="block font-semibold">
              Update your account details to start collecting.
            </strong>
            <Link
              href="/settings/bank"
              className="mt-1 inline-flex items-center gap-1 font-semibold hover:opacity-80"
            >
              Click here to go to Settings
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 hover:bg-black/5"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
