import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Check, Clock, Copy, Download, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { APIError, paymentsAPI, verifyAPI, type Collection, type InitPaymentResult } from "@/lib/api";
import { useCollectionByCode, errorMessage } from "@/hooks/useApi";
import { copyText, currencySymbol, formatMoney, formatTime } from "@/lib/format";
import { Button, Field, InlineNote, Input, Select, Textarea } from "@/components/ui";
import { useGateway } from "@/lib/gateway";
import { JENEVIV_LOGO } from "@/lib/brand";

type Step = "details" | "pay" | "done";

/** Page shell for payers: the jeneviv logo, a secure badge, then the content. */
function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-cream px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className={`mx-auto ${wide ? "max-w-[1040px]" : "max-w-[560px]"}`}>
        <div className="mb-6 flex items-center justify-between sm:mb-10">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="jeneviv">
            <img
              src={JENEVIV_LOGO}
              alt=""
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-[10px] bg-white object-cover shadow-[0_1px_2px_rgba(18,16,14,0.12)]"
            />
            <span className="text-[20px] font-extrabold tracking-[-0.05em] text-ink">
              jeneviv<span className="text-brand">.</span>
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

/** White surface used for the summary and the form. */
const card =
  "rounded-[24px] bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04),0_18px_40px_-24px_rgba(17,17,17,0.25)]";

/** A label on the left, a value on the right, separated by a hairline. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-line py-3.5 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold">{children}</span>
    </div>
  );
}

/* Keep the open payment in this tab so a refresh resumes it instead of resetting. */
const storageKey = (code?: string) => `jeneviv.pay.${code ?? ""}`;

function restoreResult(code?: string): InitPaymentResult | null {
  try {
    const raw = sessionStorage.getItem(storageKey(code));
    return raw ? (JSON.parse(raw) as InitPaymentResult) : null;
  } catch {
    return null;
  }
}

function storeResult(code: string | undefined, value: InitPaymentResult | null) {
  try {
    if (value) sessionStorage.setItem(storageKey(code), JSON.stringify(value));
    else sessionStorage.removeItem(storageKey(code));
  } catch {
    /* storage unavailable: the payment still works, it just won't survive a refresh */
  }
}

export default function PublicPay() {
  const gateway = useGateway();
  const { code } = useParams<{ code: string }>();
  const collection = useCollectionByCode(code);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>(() => (restoreResult(code) ? "pay" : "details"));
  const [result, setResult] = useState<InitPaymentResult | null>(() => restoreResult(code));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  /* Guest payments are recorded under an email and receipts are mailed to it,
     so the payer always leaves one — even when the collection skips the field. */
  const [receiptEmail, setReceiptEmail] = useState("");

  /* Poll for confirmation after the payer says they have sent the money. Bank transfers can
     take a few minutes, so the checks slow down over time and run for up to 20 minutes. */
  useEffect(() => {
    if (step !== "pay" || !result || !confirming) return;

    const startedAt = Date.now();
    const LIMIT_MS = 20 * 60_000;
    let failures = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const delayFor = (elapsed: number) =>
      elapsed < 60_000 ? 4_000 : elapsed < 5 * 60_000 ? 15_000 : 30_000;

    const check = async () => {
      if (stopped) return;
      const elapsed = Date.now() - startedAt;

      if (elapsed > LIMIT_MS) {
        setStatusNote(
          "We have not seen this transfer yet. Keep the reference above. Your receipt will be emailed once it is confirmed.",
        );
        return;
      }

      try {
        const response = await paymentsAPI.status(result.transaction.reference);
        failures = 0;

        if (response.status === "success") {
          setResult({ ...result, transaction: { ...result.transaction, status: response.status } });
          setStep("done");
          storeResult(code, null);
          stopped = true;
          return;
        }
        if (response.status === "failed") {
          setStatusNote(
            "The gateway could not confirm this payment. Please check with your coordinator before sending again.",
          );
          stopped = true;
          return;
        }
        if (response.shortfall && response.shortfall > 0) {
          const currency = result.transaction.currency;
          setStatusNote(
            `We have received ${formatMoney(response.amount_received, currency)}. ` +
              `Please transfer the remaining ${formatMoney(response.shortfall, currency)} to the same account. ` +
              "We will confirm it automatically.",
          );
        } else if (elapsed > 60_000) {
          setStatusNote(
            "Your transfer can take a few minutes to confirm. You can close this page, and your receipt will be emailed.",
          );
        }
      } catch (error) {
        failures += 1;
        if (error instanceof APIError && error.isAuthError) {
          setStatusNote("We will email your receipt as soon as the transfer is confirmed.");
          stopped = true;
          return;
        }
        if (failures >= 5) {
          setStatusNote(
            "We are having trouble reaching the server. You can close this page, and your receipt will be emailed.",
          );
        }
      }

      timer = setTimeout(check, delayFor(Date.now() - startedAt));
    };

    check();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [step, result, confirming]);

  const data: Collection | null = collection.data;
  const fields = useMemo(() => data?.fields ?? [], [data]);

  const emailField = useMemo(
    () =>
      fields.find(
        (field) => field.type === "email" || field.field_id === "email",
      ),
    [fields],
  );

  /* The key the receipt-email error is stored under: the collection's own
     email field when it has one, otherwise the extra input below. */
  const emailKey = emailField ? emailField.field_id : "__receipt_email";
  const payerEmail = (
    (emailField ? values[emailField.field_id] : receiptEmail) ?? ""
  ).trim();

  // The amount to transfer comes from the server's breakdown, once the payment
  // has been created. Fees are never estimated in the browser.
  const payAmount = result?.breakdown?.total_charged ?? result?.transaction.total_charged ?? data?.amount ?? 0;

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      if (!field.required) return;
      const value = values[field.field_id];
      if (!value || !value.trim()) {
        next[field.field_id] = `${field.display_name} is required.`;
        return;
      }
      if (field.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
        next[field.field_id] = "Enter a valid email address.";
      if (field.type === "phone" && value.replace(/\D/g, "").length < 10)
        next[field.field_id] = "Enter a valid phone number.";
    });
    // The API rejects a guest payment without an email, so it is required
    // here whether the collection asked for it or not.
    if (!payerEmail) {
      next[emailKey] = "Enter your email so we can send your receipt.";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payerEmail)) {
      next[emailKey] = "Enter a valid email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError(null);
    if (!validate() || !data) return;
    setSubmitting(true);
    try {
      /* A name field gives receipts and the dashboard a payer to show. */
      const nameField = fields.find(
        (field) =>
          field.type !== "email" &&
          /payer|full.?name|^name$|student.?name/i.test(field.field_id),
      );

      const response = await paymentsAPI.init(
        data.short_code,
        values,
        payerEmail || undefined,
        nameField ? values[nameField.field_id]?.trim() : undefined,
      );
      setResult(response);
      storeResult(code, response);
      setStep("pay");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------ states */

  if (collection.loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center py-16 text-center">
          <Loader2 size={22} className="animate-spin text-brand" />
          <p className="muted mt-3">Loading this collection…</p>
        </div>
      </Shell>
    );
  }

  if (collection.error || !data) {
    return (
      <Shell>
        <div className="py-10">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ffd6cf] text-ink">
            <TriangleAlert size={20} />
          </span>
          <h1 className="mt-6 text-[30px] font-bold leading-[1.05] tracking-[-0.04em]">
            We could not open this collection
          </h1>
          <p className="muted mt-3 max-w-sm">
            {collection.error ||
              "The link may be mistyped or the collection may have been removed. Ask your coordinator for a fresh link."}
          </p>
          <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink underline underline-offset-2">
            <ArrowLeft size={13} /> Go to jeneviv
          </Link>
        </div>
      </Shell>
    );
  }

  if (!data.is_active && step === "details") {
    return (
      <Shell>
        <div className="py-10">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ffc49a] text-ink">
            <Clock size={20} />
          </span>
          <h1 className="mt-6 text-[30px] font-bold leading-[1.05] tracking-[-0.04em]">{data.name} is closed</h1>
          <p className="muted mt-3 max-w-sm">
            This collection is no longer accepting payments. Contact your coordinator if you believe this is a mistake.
          </p>
        </div>
      </Shell>
    );
  }

  const group = data.group;

  return (
    <Shell wide>
      <div className="grid items-start gap-5 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-8">
        {/* what is being paid for: a receipt-like card */}
        <aside className={`${card} p-5 sm:p-6 lg:sticky lg:top-8`}>
          {group ? (
            <div className="mb-5 flex items-center gap-3">
              {group.logo_url ? (
                <img
                  src={group.logo_url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-[14px] border border-line bg-white object-contain"
                />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-ink text-[14px] font-bold text-white">
                  {group.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold tracking-tight">{group.name}</p>
                {group.description ? (
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">{group.description}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand">Payment request</p>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[32px]">{data.name}</h1>
          {data.description ? <p className="muted mt-2">{data.description}</p> : null}

          <div className="my-5 border-t border-dashed border-line" />

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[12.5px] text-ink-muted">Per payer</p>
              <p className="tabular mt-1 text-[36px] font-extrabold leading-none tracking-[-0.04em]">
                {formatMoney(data.amount, data.currency)}
              </p>
            </div>
            <span className="rounded-full bg-cream px-2.5 py-1 font-mono text-[11px] text-ink-muted">{data.short_code}</span>
          </div>

          {data.payee ? (
            <div className="mt-5 flex gap-3 rounded-[18px] bg-[#ffeee3] p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand">
                <ShieldCheck size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] text-ink-muted">Money goes to</p>
                <p className="truncate text-[15px] font-bold tracking-tight">
                  {data.payee.bank_account_name ?? data.payee.display_name ?? "This workspace"}
                </p>
                {data.payee.legal_name ? (
                  <p className="mt-0.5 truncate text-[12px] text-ink-soft">Verified: {data.payee.legal_name}</p>
                ) : null}
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">
                  Check this name before you pay. If it isn't the group you expect, don't pay.
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        {/* the steps */}
        <section className={`${card} p-5 sm:p-7`}>

          {/* details */}
          {step === "details" ? (
          <div className="space-y-5">
            {fields.length === 0 ? (
              <InlineNote tone="info">
                This collection does not ask for any details — continue to the payment step and transfer the amount shown.
              </InlineNote>
            ) : null}

            {fields.map((field) => (
              <Field
                key={field.field_id}
                label={`${field.display_name}${field.required ? "" : " (optional)"}`}
                htmlFor={`field-${field.field_id}`}
                error={errors[field.field_id]}
              >
                {field.type === "select" ? (
                  <Select
                    id={`field-${field.field_id}`}
                    className="h-[50px] rounded-[12px]"
                    value={values[field.field_id] ?? ""}
                    onChange={(event) => setValue(field.field_id, event.target.value)}
                  >
                    <option value="">Select…</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : field.type === "long_text" ? (
                  <Textarea
                    id={`field-${field.field_id}`}
                    className="rounded-[12px]"
                    value={values[field.field_id] ?? ""}
                    onChange={(event) => setValue(field.field_id, event.target.value)}
                  />
                ) : field.type === "date" ? (
                  <Input
                    id={`field-${field.field_id}`}
                    type="date"
                    className="h-[50px] rounded-[12px]"
                    value={values[field.field_id] ?? ""}
                    onChange={(event) => setValue(field.field_id, event.target.value)}
                  />
                ) : (
                  <Input
                    id={`field-${field.field_id}`}
                    className="h-[50px] rounded-[12px]"
                    type={
                      field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "phone" ? "tel" : "text"
                    }
                    inputMode={field.type === "phone" ? "tel" : field.type === "number" ? "numeric" : undefined}
                    value={values[field.field_id] ?? ""}
                    onChange={(event) => setValue(field.field_id, event.target.value)}
                    placeholder={
                      field.type === "email" ? "you@example.com" : field.type === "phone" ? "08012345678" : ""
                    }
                  />
                )}
              </Field>
            ))}

            {/* No email field in this collection: ask for one so the payment
                can be recorded and the receipt delivered. */}
            {emailField ? null : (
              <Field
                label="Email for receipt"
                htmlFor="receipt-email"
                error={errors.__receipt_email}
              >
                <Input
                  id="receipt-email"
                  type="email"
                  className="h-[50px] rounded-[12px]"
                  placeholder="you@example.com"
                  value={receiptEmail}
                  onChange={(event) => {
                    setReceiptEmail(event.target.value);
                    setErrors((current) => ({ ...current, __receipt_email: "" }));
                  }}
                />
              </Field>
            )}

            {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

            {data.pricing ? (
              <div className="rounded-[18px] bg-[#ffeee3] px-4 py-4">
                <p className="text-[13px] font-semibold text-ink">What you will pay</p>
                <dl className="mt-3 space-y-2 text-[13.5px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Collection (to the school)</dt>
                    <dd className="tabular font-semibold">{formatMoney(data.pricing.amount, data.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">jeneviv platform fee</dt>
                    <dd className="tabular">{formatMoney(data.pricing.platform_fee, data.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">{gateway.feeLabel}</dt>
                    <dd className="tabular">{formatMoney(data.pricing.gateway_fee, data.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-dashed border-ink/15 pt-2.5">
                    <dt className="font-semibold">Total to transfer</dt>
                    <dd className="tabular font-bold text-brand">{formatMoney(data.pricing.total, data.currency)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <Button size="lg" className="h-[52px] w-full rounded-[12px] text-[15px]" loading={submitting} onClick={submit}>
              Continue to payment
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink-muted">
              <Lock size={12} /> Your details are only shared with the coordinator of this collection.
            </p>
          </div>
        ) : null}

        {/* pay */}
        {step === "pay" && result ? (
          <div className="space-y-6">
            <div>
              <p className="text-[15px] font-semibold">Transfer to this account</p>
              <p className="muted mt-1.5">
                Open your bank app and send <strong className="text-ink">{formatMoney(payAmount, data.currency)}</strong>.
                Keep this page open — confirmation usually takes seconds.
              </p>
            </div>

            <div className="relative isolate overflow-hidden rounded-[22px] bg-ink px-6 py-6 text-cream">
              <img
                src={JENEVIV_LOGO}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 -z-10 h-36 w-36 rotate-6 opacity-[0.14]"
              />
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/60">Account number</p>
              <p className="tabular mt-2 text-[34px] font-bold leading-none tracking-[-0.02em]">
                {result.payment_account.account_number}
              </p>
              <p className="mt-3 text-[14px] text-cream/80">
                {result.payment_account.account_name} · {result.payment_account.bank_name}
              </p>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(result.payment_account.account_number);
                  if (ok) setCopied(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition-transform duration-150 active:scale-[0.97]"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy account number"}
              </button>
            </div>

            <div className="rounded-[18px] border border-line px-4">
              <Line label="Amount to send">
                <span className="tabular text-[16px] font-bold text-brand">
                  {formatMoney(payAmount, data.currency)}
                </span>
              </Line>
              <Line label="Reference">
                <span className="font-mono text-[12.5px]">{result.transaction.reference}</span>
              </Line>
            </div>

            {result.payment_account.expiry_at ? (
              <p className="hint">
                This account is reserved until {formatTime(result.payment_account.expiry_at)}. Sending after that still
                works — confirmation just takes a few minutes longer.
              </p>
            ) : null}

            <Button
              size="lg"
              className="h-[52px] w-full rounded-[12px] text-[15px]"
              loading={confirming}
              onClick={async () => {
                setConfirming(true);
                try {
                  const checked = await paymentsAPI.confirm(result.transaction.reference);
                  if (checked.status === "success") {
                    setResult({ ...result, transaction: { ...result.transaction, status: "success" } });
                    setStep("done");
                    storeResult(code, null);
                  }
                } catch {
                  // The status checks below keep going, so a failed call isn't a dead end.
                }
              }}
              disabled={confirming}
            >
              {confirming ? "Waiting for confirmation…" : "I have sent the money"}
            </Button>

            {statusNote ? <InlineNote tone="warning">{statusNote}</InlineNote> : null}

            <button
              type="button"
              onClick={() => {
                setStep("details");
                setResult(null);
                storeResult(code, null);
                setConfirming(false);
              }}
              className="mx-auto flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
            >
              <ArrowLeft size={13} /> Edit my details
            </button>
          </div>
        ) : null}

        {/* done */}
        {step === "done" && result ? (
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d5e8c4] text-ink">
              <BadgeCheck size={28} />
            </span>
            <h2 className="mt-5 text-[30px] font-bold leading-[1.05] tracking-[-0.04em]">Payment confirmed</h2>
            <p className="muted mx-auto mt-3 max-w-md">
              {formatMoney(result.transaction.amount, result.transaction.currency)} for {data.name} has been received.
              A copy of your receipt has been emailed to you.
            </p>

            <div className="mt-7 rounded-[18px] border border-line px-4 text-left">
              <Line label="Reference">
                <span className="font-mono text-[12.5px]">{result.transaction.reference}</span>
              </Line>
              <Line label="Paid">
                <span className="tabular">
                  {formatMoney(result.transaction.total_charged ?? payAmount, result.transaction.currency)}
                </span>
              </Line>
              <Line label="Collection">{data.name}</Line>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                to={`/verify/${encodeURIComponent(result.transaction.reference)}`}
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[12px] bg-ink text-[15px] font-semibold text-cream transition-transform duration-150 active:scale-[0.98]"
              >
                <BadgeCheck size={15} /> View receipt
              </Link>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    verifyAPI.receiptUrl(result.transaction.reference),
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[12px] border border-ink/20 bg-white text-[15px] font-semibold text-ink transition-colors hover:border-ink/40"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-[12px] text-ink-muted">
              <ShieldCheck size={14} /> Verified by the payment gateway. No screenshot needed.
            </p>
          </div>
        ) : null}
        </section>
      </div>

      <p className="mt-8 text-center text-[11.5px] leading-relaxed text-ink-muted">
        <img src={JENEVIV_LOGO} alt="" aria-hidden="true" className="mr-1.5 inline-block h-4 w-4 rounded-[4px] align-[-3px]" />
        Secured by jeneviv · {gateway.processedBy} · amounts in {currencySymbol(data.currency)} {data.currency}
      </p>
    </Shell>
  );
}
