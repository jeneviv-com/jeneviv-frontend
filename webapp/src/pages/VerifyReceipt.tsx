import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { APIError, apiConfig, verifyAPI, type PublicReceipt } from "@/lib/api";
import { copyText, formatDateTime, formatMoney } from "@/lib/format";
import { Button, InlineNote } from "@/components/ui";

type State =
  | { kind: "loading" }
  | { kind: "valid"; receipt: PublicReceipt }
  | { kind: "missing"; message: string };

/** A label on the left, a value on the right, separated by a hairline. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line-soft py-2.5 last:border-0">
      <span className="shrink-0 text-[11.5px] uppercase tracking-[0.08em] text-ink-muted">{label}</span>
      <span className="min-w-0 text-right text-[13px] font-semibold">{children}</span>
    </div>
  );
}

/** A small chip with a round icon well, matching the rest of the app. */
function Verified({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d5e8c4] py-[3px] pl-[3px] pr-2.5 text-[11px] font-semibold text-ink">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-white/85">{icon}</span>
      {children}
    </span>
  );
}

/** The receipt itself: brand header, amount, fields and a verify strip. */
function ReceiptTicket({ receipt }: { receipt: PublicReceipt }) {
  const details = receipt.details.filter((detail) => detail.label !== "Collection");

  return (
    <div className="relative rounded-[18px] border border-line bg-white shadow-sm">
      {/* watermark, like a bank slip */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] whitespace-nowrap text-[58px] font-extrabold leading-none tracking-[-0.06em] text-ink/[0.045]">
          jeneviv
        </p>
      </div>

      {/* header: logo left, official label right */}
      <div className="relative flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <span className="flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.05em] text-ink">
          <img
            src={apiConfig.withBase("/assets/images/jeneviv.png")}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-[7px] object-cover"
          />
          <span>
            jeneviv<span className="text-brand">.</span>
          </span>
        </span>
        <span className="max-w-[120px] text-right font-mono text-[9px] uppercase leading-[1.6] tracking-[0.16em] text-ink-muted">
          Official payment receipt
        </span>
      </div>

      {/* amount */}
      <div className="relative px-5 pb-5 pt-6 text-center sm:px-6">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted">Amount paid</p>
        <p className="tabular mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] sm:text-[38px]">
          {formatMoney(receipt.amount, receipt.currency)}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#d5e8c4] px-2.5 py-1 text-[11px] font-semibold text-ink">
          <Check size={11} /> Successful
        </span>
        <p className="mt-2 text-[11.5px] text-ink-muted">{formatDateTime(receipt.paid_at)}</p>
      </div>

      {/* perforation */}
      <div className="relative px-5 sm:px-6">
        <div className="border-t border-dashed border-line" />
        <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full border-r border-line bg-cream" />
        <span className="absolute -right-[9px] -top-2 h-4 w-4 rounded-full border-l border-line bg-cream" />
      </div>

      {/* fields */}
      <div className="relative px-5 pb-5 pt-3 sm:px-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">Fields</p>
        <div className="mt-1">
          <Line label="Collection">{receipt.collection_name}</Line>
          {receipt.group_name ? (
            <Line label="Group">
              <span className="flex items-center justify-end gap-2">
                {receipt.group_logo_url ? (
                  <img
                    src={receipt.group_logo_url}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-[4px] border border-line bg-white object-contain"
                  />
                ) : (
                  <Building2 size={14} className="shrink-0 text-ink-muted" />
                )}
                <span className="truncate">{receipt.group_name}</span>
              </span>
            </Line>
          ) : null}
          <Line label="Workspace">
            <span className="flex items-center justify-end gap-2">
              {receipt.logo_url ? (
                <img
                  src={receipt.logo_url}
                  alt=""
                  className="h-5 w-5 shrink-0 rounded-[4px] border border-line bg-white object-contain"
                />
              ) : (
                <Building2 size={14} className="shrink-0 text-ink-muted" />
              )}
              <span className="truncate">{receipt.workspace_name ?? receipt.school_name}</span>
            </span>
          </Line>
          <Line label="Paid by">{receipt.payer_name}</Line>
          {receipt.student_name ? <Line label="Student">{receipt.student_name}</Line> : null}
          <Line label="Reference">
            <span className="font-mono text-[12px]">{receipt.reference}</span>
          </Line>
          {details.map((detail) => (
            <Line key={`${detail.label}-${detail.value}`} label={detail.label}>
              {detail.value}
            </Line>
          ))}
        </div>

        {receipt.nin_verified || receipt.bank_verified ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {receipt.nin_verified ? (
              <Verified icon={<BadgeCheck size={10} />}>NIN verified</Verified>
            ) : null}
            {receipt.bank_verified ? (
              <Verified icon={<ShieldCheck size={10} />}>Bank verified</Verified>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* verify strip */}
      <div className="relative border-t border-line-soft bg-cream/70 px-5 py-4 sm:px-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">Verify this receipt</p>
        <a
          href={receipt.verify_url}
          className="mt-1 block break-all text-[11.5px] font-semibold text-brand underline decoration-brand/40 underline-offset-2"
        >
          {receipt.verify_url}
        </a>
        <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-muted">
          <ShieldCheck size={11} className="mt-[2px] shrink-0" />
          <span>
            This receipt is issued by{" "}
            <span className="font-semibold text-ink">
              {receipt.group_name ?? receipt.workspace_name ?? receipt.school_name}
            </span>
            . Payments settle straight to their bank and are never held by Jeneviv.
          </span>
        </p>
        <div className="mt-3 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[10.5px] font-semibold text-ink-muted">
          <img
            src={apiConfig.withBase("/assets/images/jeneviv.png")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 rounded-[4px] object-cover"
          />
          Powered by <span className="text-ink">Jeneviv</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyReceipt() {
  const { reference } = useParams<{ reference: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [copied, setCopied] = useState(false);

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
      <div className="mx-auto max-w-[520px]">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-[-0.05em] text-ink">
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
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            receipt verification
          </span>
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
            {/* verdict, kept quiet so the receipt leads */}
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d5e8c4] text-ink">
                <CheckCircle2 size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight tracking-[-0.02em]">This receipt is valid</p>
                <p className="text-[12px] text-ink-muted">Confirmed on {formatDateTime(state.receipt.paid_at)}</p>
              </div>
            </div>

            <ReceiptTicket receipt={state.receipt} />

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                icon={<Download size={14} />}
                onClick={() =>
                  window.open(verifyAPI.receiptUrl(state.receipt.reference), "_blank", "noopener,noreferrer")
                }
              >
                Download PDF receipt
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                onClick={async () => {
                  const ok = await copyText(window.location.href);
                  if (ok) setCopied(true);
                }}
              >
                {copied ? "Link copied" : "Copy verify link"}
              </Button>
            </div>

            <div className="mt-6">
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
