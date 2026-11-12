import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Check, CheckCircle2, Copy, Download, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { APIError, apiConfig, verifyAPI, type PublicReceipt } from "@/lib/api";
import { copyText, formatMoney } from "@/lib/format";
import { Button, InlineNote } from "@/components/ui";

type State =
  | { kind: "loading" }
  | { kind: "valid"; receipt: PublicReceipt }
  | { kind: "missing"; message: string };

/* Receipts are shown in Nigerian time, whatever the viewer's clock says. */
const WAT = { timeZone: "Africa/Lagos" } as const;
const shortWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    ...WAT,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const fullWhen = (iso: string) =>
  `${new Date(iso).toLocaleString("en-NG", { ...WAT, dateStyle: "medium", timeStyle: "short" })} WAT`;

/** A card with the same corners and border on every section. */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative rounded-[20px] border border-line bg-white px-6 py-6 sm:px-7 ${className}`}>
      {children}
    </section>
  );
}

/** One label and value row in Transaction Details. */
function Row({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd
        className={`min-w-0 text-right text-[13.5px] font-medium text-ink ${
          mono ? "break-all font-mono text-[12px]" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

/** One step on the timeline. */
function Step({ done, title, sub, time }: { done: boolean; title: string; sub: string; time: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ${
          done ? "bg-brand text-white" : "border-[1.5px] border-line bg-white text-ink-faint"
        }`}
      >
        {done ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <p className="mt-2 text-[12px] leading-tight text-ink-muted">
        {title}
        <br />
        {sub}
      </p>
      <p className={`mt-1.5 text-[11.5px] font-semibold ${done ? "text-ink" : "text-ink-muted"}`}>{time}</p>
    </div>
  );
}

function ReceiptBody({ receipt }: { receipt: PublicReceipt }) {
  const issuer = receipt.group_name ?? receipt.workspace_name ?? receipt.school_name;
  const logo = receipt.group_logo_url ?? receipt.logo_url;
  const jenevivMark = apiConfig.withBase("/assets/images/jeneviv.png");
  const extraDetails = receipt.details.filter((d) => d.label !== "Collection");
  const verifications = [
    ...(receipt.nin_verified ? [{ label: "NIN verified", icon: <BadgeCheck size={11} /> }] : []),
    ...(receipt.bank_verified ? [{ label: "Bank verified", icon: <ShieldCheck size={11} /> }] : []),
  ];

  return (
    <div className="relative">
      {/* one watermark, centred, very faint */}
      <img
        src={jenevivMark}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[40%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
      />

      <div className="relative flex flex-col gap-3">
        {/* hero */}
        <Card className="text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-line bg-white">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <img src={jenevivMark} alt="" className="h-7 w-7 rounded-[7px]" />
            )}
          </span>
          <p className="mt-3 text-[13px] font-semibold text-ink-muted">Payment to {issuer}</p>
          <p className="tabular mt-1 text-[34px] font-bold leading-none tracking-[-0.03em] text-ink sm:text-[38px]">
            {formatMoney(receipt.amount, receipt.currency)}
          </p>
          <p className="mt-2 text-[15px] font-bold text-brand">Successful</p>

          {verifications.length ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {verifications.map((v) => (
                <span
                  key={v.label}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-brand"
                >
                  {v.icon}
                  {v.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex items-start gap-2">
            <Step done title="Payment" sub="started" time={shortWhen(receipt.started_at)} />
            <Step done title="Confirmed" sub="by Paystack" time={shortWhen(receipt.paid_at)} />
            <Step done={false} title="Settles to" sub="their bank" time="Next working day" />
          </div>

          <div className="mt-6 rounded-[12px] bg-cream px-4 py-3 text-left text-[12px] leading-relaxed text-ink-muted">
            Payments settle straight to <span className="font-semibold text-ink">{issuer}</span>&rsquo;s bank account,
            usually the next working day. Jeneviv never holds the money.
          </div>
        </Card>

        {/* transaction details */}
        <Card>
          <h2 className="text-[15px] font-bold tracking-tight text-ink">Transaction Details</h2>
          <dl className="mt-2 divide-y divide-line-soft">
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
            <Row label="Payment method">Bank transfer</Row>
            <Row label="Transaction date">{fullWhen(receipt.paid_at)}</Row>
            <Row label="Transaction no." mono>
              {receipt.reference}
            </Row>
          </dl>
        </Card>

        {/* money split beside verification; stacked on phones */}
        <div className={`grid gap-3 ${receipt.breakdown ? "sm:grid-cols-[1fr_1.1fr]" : ""}`}>
          {receipt.breakdown ? (
            <Card>
              <h2 className="text-[14px] font-bold tracking-tight text-ink">How the money was split</h2>
              <dl className="mt-3 space-y-2.5 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Collection (set by the school)</dt>
                  <dd className="tabular text-ink">{formatMoney(receipt.breakdown.collection, receipt.currency)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Paystack processing fee</dt>
                  <dd className="tabular text-ink">{formatMoney(receipt.breakdown.paystack_fee, receipt.currency)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Jeneviv platform fee</dt>
                  <dd className="tabular text-ink">{formatMoney(receipt.breakdown.jeneviv_fee, receipt.currency)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-line-soft pt-3">
                <p className="text-[13px] font-bold text-ink">Total paid</p>
                <p className="tabular text-[14px] font-bold text-brand">
                  {formatMoney(receipt.breakdown.total, receipt.currency)}
                </p>
              </div>
            </Card>
          ) : null}

          <Card className="flex flex-col items-center text-center">
            <h2 className="w-full text-left text-[14px] font-bold tracking-tight text-ink">Verify this receipt</h2>
            <div className="mt-3 rounded-[10px] border border-line-soft bg-white p-2">
              <QRCodeSVG value={receipt.verify_url} size={92} level="M" fgColor="#101010" />
            </div>
            <a
              href={receipt.verify_url}
              className="mt-3 block w-full break-all text-[11px] font-semibold text-brand underline decoration-brand/40 underline-offset-2"
            >
              {receipt.verify_url}
            </a>
          </Card>
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
      <div className="mx-auto max-w-[540px]">
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
            <p className="muted mt-3">Checking this receipt&hellip;</p>
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
                <p className="text-[12px] text-ink-muted">Confirmed by Paystack</p>
              </div>
            </div>

            <ReceiptBody receipt={state.receipt} />

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