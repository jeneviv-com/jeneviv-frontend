import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Building2, CheckCircle2, Download, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { APIError, apiConfig, verifyAPI, type PublicReceipt } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Button, InlineNote } from "@/components/ui";

type State =
  | { kind: "loading" }
  | { kind: "valid"; receipt: PublicReceipt }
  | { kind: "missing"; message: string };

/** A label on the left, a value on the right, separated by a hairline. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line py-3.5 last:border-0">
      <span className="shrink-0 text-[13px] text-ink-muted">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold">{children}</span>
    </div>
  );
}

/** A small chip with a round icon well, matching the rest of the app. */
function Verified({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#c8f58e] py-1 pl-1 pr-3 text-[12px] font-semibold text-ink">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/85">{icon}</span>
      {children}
    </span>
  );
}

export default function VerifyReceipt() {
  const { reference } = useParams<{ reference: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!reference) {
      setState({ kind: "missing", message: "No receipt reference was provided." });
      return;
    }
    verifyAPI
      .get(reference)
      .then((response) => {
        if (!cancelled) setState({ kind: "valid", receipt: response.receipt });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof APIError ? error.message : "We could not check this receipt.";
        setState({ kind: "missing", message });
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="min-h-screen bg-cream px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-[580px]">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-[21px] font-extrabold tracking-[-0.05em] text-ink">
            <span className="flex items-center gap-2.5">
              <img
                src={apiConfig.withBase("/assets/images/jeneviv.png")}
                alt="Jeneviv"
                width={28}
                height={28}
                className="h-7 w-7 rounded-[9px] object-cover"
              />
              <span>
                jeneviv<span className="text-brand">.</span>
              </span>
            </span>
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">receipt verification</span>
        </div>

        {state.kind === "loading" ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Loader2 size={22} className="animate-spin text-brand" />
            <p className="muted mt-3">Checking this receipt…</p>
          </div>
        ) : state.kind === "missing" ? (
          <div className="py-10">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ffd6cf] text-ink">
              <TriangleAlert size={20} />
            </span>
            <h1 className="mt-6 text-[30px] font-bold leading-[1.05] tracking-[-0.04em]">
              This receipt could not be verified
            </h1>
            <p className="muted mt-3">{state.message}</p>
            <p className="hint mt-3">
              Only receipts issued for a confirmed payment appear here. If a school shared this link, ask them to
              confirm the reference.
            </p>
          </div>
        ) : (
          <>
            {/* verdict */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#c8f58e] text-ink">
                  <CheckCircle2 size={22} />
                </span>
                <h1 className="mt-6 text-[32px] font-bold leading-[1.05] tracking-[-0.04em]">This receipt is valid</h1>
                <p className="muted mt-2">Confirmed on {formatDateTime(state.receipt.paid_at)}</p>
              </div>
            </div>

            {/* issuer */}
            <div className="mt-9 flex items-center gap-4 border-t border-line pt-7">
              {state.receipt.logo_url ? (
                <img
                  src={state.receipt.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-[12px] border border-line object-contain"
                />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-[12px] bg-cream text-ink-soft">
                  <Building2 size={22} />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Issued by</p>
                <p className="mt-1 truncate text-[20px] font-bold tracking-tight">{state.receipt.school_name}</p>
                <p className="muted truncate">{state.receipt.collection_name}</p>
              </div>
            </div>

            {/* amount */}
            <div className="mt-8 rounded-[20px] bg-ink px-6 py-6 text-cream">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/60">Amount paid</p>
              <p className="tabular mt-2 text-[40px] font-bold leading-none tracking-[-0.03em]">
                {formatMoney(state.receipt.amount, state.receipt.currency)}
              </p>
            </div>

            {/* details */}
            <div className="mt-8">
              <Line label="Student">{state.receipt.student_name}</Line>
              <Line label="Paid by">{state.receipt.payer_name}</Line>
              <Line label="Reference">
                <span className="font-mono text-[12.5px]">{state.receipt.reference}</span>
              </Line>
              {state.receipt.details
                .filter((detail) => detail.label !== "Collection")
                .map((detail) => (
                  <Line key={`${detail.label}-${detail.value}`} label={detail.label}>
                    {detail.value}
                  </Line>
                ))}
            </div>

            {state.receipt.nin_verified || state.receipt.bank_verified ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {state.receipt.nin_verified ? (
                  <Verified icon={<BadgeCheck size={12} />}>NIN verified</Verified>
                ) : null}
                {state.receipt.bank_verified ? (
                  <Verified icon={<ShieldCheck size={12} />}>Bank verified</Verified>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                icon={<Download size={14} />}
                onClick={() =>
                  window.open(verifyAPI.receiptUrl(state.receipt.reference), "_blank", "noopener,noreferrer")
                }
              >
                Download PDF receipt
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                Copy verify link
              </Button>
            </div>

            <div className="mt-10">
              <InlineNote tone="info">
                Anyone with this reference can confirm that the payment was recorded. Personal details are limited to
                what is shown above.
              </InlineNote>
            </div>
          </>
        )}
        <footer className="mt-12 flex items-center justify-center gap-2 border-t border-line pt-6 text-[12px] text-ink-muted">
          <img
            src={apiConfig.withBase("/assets/images/jeneviv.png")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 rounded-[4px] object-cover"
          />
          Powered by <span className="font-semibold text-ink">Jeneviv</span>
        </footer>
      </div>
    </div>
  );
}
