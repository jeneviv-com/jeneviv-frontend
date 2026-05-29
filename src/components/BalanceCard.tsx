"use client";

import { useState } from "react";
import { Info, ArrowUpRight } from "lucide-react";

interface BalanceCardProps {
  payoutBalance: number;
  walletBalance: number;
  onWithdraw?: () => void;
}

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export default function BalanceCard({
  payoutBalance,
  walletBalance,
  onWithdraw,
}: BalanceCardProps) {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div className="relative h-full min-h-[180px] overflow-hidden rounded-2xl bg-[#2E0D08] p-6 text-white shadow-card-hover lg:p-8">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-orange/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-brand-peach/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-brand-orange/10 blur-2xl"
      />

      <div className="relative flex h-full flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Payout Balance
          </p>
          <button
            type="button"
            onClick={onWithdraw}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowUpRight size={13} aria-hidden="true" />
            Withdraw
          </button>
        </div>

        {/* Payout amount */}
        <div className="mt-3">
          <div className="text-4xl font-black tracking-tight text-white lg:text-5xl" style={{fontFamily:"Calibri,Arial,Helvetica,sans-serif"}}>
            {naira.format(payoutBalance)}
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 h-px w-full bg-white/10" />

        {/* Wallet balance row */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Wallet Balance
              </p>
              <div className="relative">
                <button
                  type="button"
                  aria-label="About wallet balance"
                  onClick={() => setTipOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setTipOpen(false), 150)}
                  className="inline-flex h-4 w-4 items-center justify-center text-white/40 hover:text-white/80 transition"
                >
                  <Info size={13} aria-hidden="true" />
                </button>
                {tipOpen && (
                  <div
                    role="tooltip"
                    className="absolute bottom-6 left-1/2 z-20 w-60 -translate-x-1/2 rounded-xl bg-ink-black px-4 py-3 text-[11px] leading-relaxed text-white/80 shadow-card-hover"
                  >
                    This is your collected amount pending the next Flutterwave
                    settlement window. Flutterwave settles twice daily including
                    weekends.
                    <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-ink-black" />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight lg:text-3xl" style={{fontFamily:"Calibri,Arial,Helvetica,sans-serif"}}>
              {naira.format(walletBalance)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
              Settles
            </p>
            <p className="text-xs font-semibold text-white/60">Twice daily</p>
          </div>
        </div>
      </div>
    </div>
  );
}
