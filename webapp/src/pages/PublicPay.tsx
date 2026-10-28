import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Check, Clock, Copy, Download, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { APIError, paymentsAPI, verifyAPI, type Collection, type InitPaymentResult } from "@/lib/api";
import { useCollectionByCode, errorMessage } from "@/hooks/useApi";
import { copyText, currencySymbol, formatMoney, formatTime } from "@/lib/format";
import { Button, Field, InlineNote, Input, Select, Textarea } from "@/components/ui";

type Step = "details" | "pay" | "done";
const STEPS: Step[] = ["details", "pay", "done"];
const STEP_LABEL: Record<Step, string> = { details: "Your details", pay: "Pay", done: "Done" };

/** Plain page shell for payers: brand, a quiet label, then the content column. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-[21px] font-extrabold tracking-[-0.05em] text-ink">
            jeneviv<span className="text-brand">.</span>
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">secure payment</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** A label on the left, a value on the right, separated by a hairline. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
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

  /* Poll for confirmation after the payer says they have sent the money. */
  useEffect(() => {
    if (step !== "pay" || !result || !confirming) return;
    let attempts = 0;
    let failures = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const response = await paymentsAPI.status(result.transaction.reference);
        failures = 0;
        if (response.status === "success") {
          setResult({ ...result, transaction: { ...result.transaction, status: response.status } });
          setStep("done");
          storeResult(code, null);
          clearInterval(timer);
        } else if (response.status === "failed") {
          setStatusNote("The gateway could not confirm this payment. Please check with your coordinator before sending again.");
          clearInterval(timer);
        }
      } catch (error) {
        failures += 1;
        if (error instanceof APIError && error.isAuthError) {
          setStatusNote("We will email your receipt as soon as the transfer is confirmed.");
          clearInterval(timer);
          return;
        }
        if (failures >= 3 || attempts >= 40) {
          setStatusNote("Still waiting for confirmation. You can safely close this page — your receipt will be emailed.");
          clearInterval(timer);
        }
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [step, result, confirming]);

  const data: Collection | null = collection.data;
  const fields = useMemo(() => data?.fields ?? [], [data]);

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
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError(null);
    if (!validate() || !data) return;
    setSubmitting(true);
    try {
      const response = await paymentsAPI.init(data.short_code, values);
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
            <ArrowLeft size={13} /> Go to Jeneviv
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

  const currentIndex = STEPS.indexOf(step);

  return (
    <Shell>
      {/* heading */}
      <header>
        {/* The entity this collection belongs to, so payers recognise who is asking. */}
        {data.group ? (
          <div className="mb-6 flex items-center gap-3 border-b border-line pb-5">
            {data.group.logo_url ? (
              <img
                src={data.group.logo_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-[12px] border border-line bg-white object-contain"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight">{data.group.name}</p>
              {data.group.description ? (
                <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                  {data.group.description}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Payment request</p>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[40px]">{data.name}</h1>
        {data.description ? <p className="muted mt-3">{data.description}</p> : null}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-y border-line py-5">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Per payer</p>
            <p className="tabular mt-1.5 text-[32px] font-bold leading-none tracking-[-0.03em]">
              {formatMoney(data.amount, data.currency)}
            </p>
          </div>
          <span className="font-mono text-[11px] text-ink-muted">ref · {data.short_code}</span>
        </div>
      </header>

      {/* steps: a quiet line, not a card */}
      <ol className="mt-7 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((item, index) => {
          const complete = index < currentIndex || step === "done";
          const active = item === step;
          return (
            <li key={item} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                  complete ? "bg-ink text-cream" : active ? "border-2 border-ink bg-white" : "bg-line text-ink-muted"
                }`}
              >
                {complete ? <Check size={13} /> : index + 1}
              </span>
              <span className={`text-[12.5px] font-semibold ${active ? "text-ink" : "text-ink-muted"}`}>
                {STEP_LABEL[item]}
              </span>
              {index < STEPS.length - 1 ? <span className="mx-1 h-px flex-1 bg-line" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-9">
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

            {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

            <p className="text-[13px] leading-relaxed text-ink-muted">
              You will see the exact amount to transfer on the next step, with any transaction fees included.
            </p>

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

            <div className="rounded-[20px] bg-ink px-6 py-6 text-cream">
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

            <div>
              <Line label="Amount">
                <span className="tabular text-[16px] font-bold">{formatMoney(payAmount, data.currency)}</span>
              </Line>
              <Line label="Reference">
                <span className="font-mono text-[12.5px]">{result.transaction.reference}</span>
              </Line>
              <Line label="Bank">{result.payment_account.bank_name}</Line>
            </div>

            <button
              type="button"
              onClick={async () => {
                await copyText(
                  `${data.name}\n${formatMoney(payAmount, data.currency)} to ${result.payment_account.bank_name} ${result.payment_account.account_number} (${result.payment_account.account_name})\nReference: ${result.transaction.reference}`,
                );
              }}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted underline decoration-line underline-offset-2 hover:text-ink"
            >
              <Copy size={12} /> Copy all transfer details
            </button>

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
              onClick={() => setConfirming(true)}
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
          <div className="py-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#d5e8c4] text-ink">
              <BadgeCheck size={24} />
            </span>
            <h2 className="mt-6 text-[32px] font-bold leading-[1.05] tracking-[-0.04em]">Payment confirmed</h2>
            <p className="muted mt-3 max-w-md">
              {formatMoney(result.transaction.amount, result.transaction.currency)} for {data.name} has been received.
              A copy of your receipt has been emailed to you.
            </p>

            <div className="mt-8 border-t border-line">
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

            <p className="mt-8 flex items-center gap-2 text-[12px] text-ink-muted">
              <ShieldCheck size={14} /> Verified by the payment gateway. No screenshot needed.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-12 border-t border-line pt-5 text-center text-[11.5px] text-ink-muted">
        Secured by Jeneviv · Payments processed by Paystack · amounts in {currencySymbol(data.currency)} {data.currency}
      </p>
    </Shell>
  );
}