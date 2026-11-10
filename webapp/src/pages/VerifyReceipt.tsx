import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Check, CheckCircle2, Copy, Download, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { APIError, apiConfig, verifyAPI, type PublicReceipt } from "@/lib/api";
import { copyText, formatDateTime, formatMoney } from "@/lib/format";
import { Button, InlineNote } from "@/components/ui";

type State =
  | { kind: "loading" }
  | { kind: "valid"; receipt: PublicReceipt }
  | { kind: "missing"; message: string };

/** One label and value row. Labels are grey, values are dark, and rows are not boxed. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-[13.5px] text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right text-[13.5px] font-normal text-ink">{children}</dd>
    </div>
  );
}

/** A small orange tag, such as a verification. */
function Tag({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
      {icon}
      {children}
    </span>
  );
}

/**
 * Cream discs cut into the top or bottom edge, so the ticket reads as torn.
 * The discs are the page colour, so they blend into the background.
 */
function Scallops({ position }: { position: "top" | "bottom" }) {
  const discs = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-10 flex justify-between px-3 ${
        position === "top" ? "-top-[9px]" : "-bottom-[9px]"
      }`}
    >
      {discs.map((i) => (
        <span key={i} className="h-[18px] w-[18px] rounded-full bg-cream" />
      ))}
    </div>
  );
}

/** A dashed tear line between sections. */
function Tear() {
  return <div className="my-4 border-t border-dashed border-line" />;
}

function ReceiptTicket({ receipt }: { receipt: PublicReceipt }) {
  const issuer = receipt.group_name ?? receipt.workspace_name ?? receipt.school_name;
  const logo = receipt.group_logo_url ?? receipt.logo_url;
  const extraDetails = receipt.details.filter((d) => d.label !== "Collection");
  const jenevivMark = apiConfig.withBase("/assets/images/jeneviv.png");

  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white px-6 pb-10 pt-8 shadow-[0_1px_0_rgba(16,16,16,0.04),0_12px_32px_-18px_rgba(16,16,16,0.18)] sm:px-8">
      {/* watermark: single Jeneviv logo centered in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
      >
        <img src={jenevivMark} alt="" className="h-48 w-48" />
      </div>

      <Scallops position="top" />
      <Scallops position="bottom" />

      <div className="relative">
        {/* header: issuer on the left, document label on the right */}
        <header className="flex flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {logo ? (
                <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-[12px] border border-line object-contain" />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-line bg-white">
                  <img src={jenevivMark} alt="" className="h-7 w-7 rounded-[7px]" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold tracking-tight text-ink">{issuer}</p>
                <p className="truncate text-[11.5px] text-ink-muted">Issued through Jeneviv</p>
              </div>
            </div>
            <div className="text-right">
              <p className="shrink-0 text-[14px] font-medium text-ink">Transaction Receipt</p>
              <p className="text-[10.5px] text-ink-muted">Ref: {receipt.reference.slice(0, 8)}...</p>
            </div>
          </div>
          
          {/* Receipt header line */}
          <div className="w-full border-t border-dashed border-line pt-4 text-center">
            <h2 className="text-[20px] font-semibold uppercase tracking-wider text-ink">OFFICIAL RECEIPT</h2>
            <p className="mt-1 text-[11px] text-ink-muted">This document serves as proof of payment</p>
          </div>
        </header>

        {/* hero: amount, status and date */}
        <div className="mt-9 text-center">
          <p className="tabular text-[36px] font-bold leading-none tracking-[-0.03em] text-brand sm:text-[42px]">
            {formatMoney(receipt.amount, receipt.currency)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-green-100 text-green-700">
              <Check size={12} />
            </span>
            <p className="text-[19px] font-medium text-ink">Payment Successful</p>
          </div>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">{formatDateTime(receipt.paid_at)}</p>
          {receipt.nin_verified || receipt.bank_verified ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {receipt.nin_verified ? <Tag icon={<BadgeCheck size={11} />}>NIN verified</Tag> : null}
              {receipt.bank_verified ? <Tag icon={<ShieldCheck size={11} />}>Bank verified</Tag> : null}
            </div>
          ) : null}
        </div>

        <Tear />

        {/* who paid, for what */}
        <dl>
          <Row label="Paid by">
            <span className="font-bold uppercase">{receipt.payer_name}</span>
          </Row>
          {receipt.student_name && receipt.student_name !== receipt.payer_name ? (
            <Row label="For">{receipt.student_name}</Row>
          ) : null}
          <Row label="Collection">{receipt.collection_name}</Row>
          {extraDetails.map((detail) => (
            <Row key={detail.label} label={detail.label}>
              {detail.value}
            </Row>
          ))}
          <Row label="Transaction reference">
            <span className="break-all font-mono text-[12px]">{receipt.reference}</span>
          </Row>
        </dl>

        {receipt.breakdown ? (
          <>
            <Tear />
            <div className="rounded-lg border border-line-soft bg-gray-50 p-4">
              <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Payment Breakdown</p>
              <dl className="space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-ink-muted">Collection Amount</dt>
                  <dd className="tabular text-[13.5px] font-medium text-ink">
                    {formatMoney(receipt.breakdown.collection, receipt.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-ink-muted">Payment Processing</dt>
                  <dd className="tabular text-[13.5px] font-medium text-ink">
                    {formatMoney(receipt.breakdown.paystack_fee, receipt.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-ink-muted">Platform Fee</dt>
                  <dd className="tabular text-[13.5px] font-medium text-ink">
                    {formatMoney(receipt.breakdown.jeneviv_fee, receipt.currency)}
                  </dd>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <dt className="text-[14px] font-bold text-ink">Total Amount Paid</dt>
                  <dd className="tabular text-[15px] font-bold text-brand">
                    {formatMoney(receipt.breakdown.total, receipt.currency)}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        ) : null}

        <Tear />

        {/* footer and verification */}
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-line-soft bg-white p-4">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted">Verification</p>
                <p className="mt-1 text-[11.5px] text-ink-muted">
                  Scan the QR code or visit the link below to verify this receipt
                </p>
                <a
                  href={receipt.verify_url}
                  className="mt-2 block break-all text-[11.5px] font-semibold text-brand underline decoration-brand/40 underline-offset-2"
                >
                  {receipt.verify_url}
                </a>
              </div>
              <div className="shrink-0 rounded-[10px] border border-line-soft bg-white p-2">
                <QRCodeSVG value={receipt.verify_url} size={76} level="M" fgColor="#101010" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] leading-relaxed text-ink-muted">
              This receipt is issued by <span className="font-semibold text-ink">{issuer}</span>. Payments settle directly to
              their verified bank account and are never held by Jeneviv.
            </p>
            <p className="mt-2 text-[10px] text-ink-muted">
              Receipt ID: {receipt.reference} • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </article>
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
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
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
