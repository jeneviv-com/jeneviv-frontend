import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Copy,
  Loader2,
  Lock,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  APIError,
  paymentsAPI,
  transactionsAPI,
  type Collection,
  type InitPaymentResult,
} from "@/lib/api";
import { useCollectionByCode } from "@/hooks/useApi";
import { errorMessage } from "@/hooks/useApi";
import {
  copyText,
  currencySymbol,
  formatMoney,
  formatTime,
} from "@/lib/format";
import {
  Button,
  Card,
  Field,
  InlineNote,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

type Step = "details" | "pay" | "done";

export default function PublicPay() {
  const { code } = useParams<{ code: string }>();
  const collection = useCollectionByCode(code);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>("details");
  const [result, setResult] = useState<InitPaymentResult | null>(null);
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
        const response = await transactionsAPI.get(result.transaction.id);
        failures = 0;
        if (response.transaction.status === "success") {
          setResult({ ...result, transaction: response.transaction });
          setStep("done");
          clearInterval(timer);
        } else if (response.transaction.status === "failed") {
          setStatusNote(
            "The gateway could not confirm this payment. Please check with your coordinator before sending again.",
          );
          clearInterval(timer);
        }
      } catch (error) {
        failures += 1;
        if (error instanceof APIError && error.isAuthError) {
          setStatusNote(
            "We will email your receipt as soon as the transfer is confirmed.",
          );
          clearInterval(timer);
          return;
        }
        if (failures >= 3 || attempts >= 40) {
          setStatusNote(
            "Still waiting for confirmation. You can safely close this page — your receipt will be emailed.",
          );
          clearInterval(timer);
        }
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [step, result, confirming]);

  const data: Collection | null = collection.data;
  const fields = useMemo(() => data?.fields ?? [], [data]);

  const amountDue = useMemo(() => {
    if (!data) return 0;
    const gatewayFee = Math.round(data.amount * 0.014);
    const platformFee =
      Math.min(Math.max(Math.round(data.amount * 0.015), 0), 1900) + 100;
    return data.amount + gatewayFee + platformFee;
  }, [data]);

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
      setStep("pay");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (collection.loading) {
    return (
      <Shell>
        <Card className="text-center">
          <Loader2 size={22} className="mx-auto animate-spin text-brand" />
          <p className="muted mt-3">Loading this collection…</p>
        </Card>
      </Shell>
    );
  }

  if (collection.error || !data) {
    return (
      <Shell>
        <Card className="text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#fdecea] text-danger">
            <TriangleAlert size={20} />
          </span>
          <h1 className="mt-4 text-[18px] font-extrabold">
            We could not open this collection
          </h1>
          <p className="muted mx-auto mt-2 max-w-sm">
            {collection.error ||
              "The link may be mistyped or the collection may have been removed. Ask your coordinator for a fresh link."}
          </p>
          <Link to="/" className="btn btn-secondary btn-sm mt-5">
            Go to Jeneviv
          </Link>
        </Card>
      </Shell>
    );
  }

  if (!data.is_active && step === "details") {
    return (
      <Shell>
        <Card>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff3dd] text-warning">
            <Clock size={20} />
          </span>
          <h1 className="mt-4 text-[18px] font-extrabold">
            {data.name} is closed
          </h1>
          <p className="muted mt-2">
            This collection is no longer accepting payments. Contact your
            coordinator if you believe this is a mistake.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card padded={false}>
        <header className="border-b border-line-soft px-5 py-5 sm:px-6">
          <p className="eyebrow">Payment request</p>
          <h1 className="mt-1.5 text-[21px] font-extrabold leading-tight tracking-tight sm:text-[24px]">
            {data.name}
          </h1>
          {data.description ? (
            <p className="muted mt-2">{data.description}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-[13px] font-bold text-brand">
              {formatMoney(data.amount, data.currency)} per payer
            </span>
            <span className="font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
              ref · {data.short_code}
            </span>
          </div>
        </header>

        <div className="flex items-center gap-2 border-b border-line-soft px-5 py-3 sm:px-6">
          {(["details", "pay", "done"] as Step[]).map((item, index) => {
            const active = item === step;
            const complete =
              (item === "details" && step !== "details") ||
              (item === "pay" && step === "done");
            return (
              <div key={item} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-3xs font-bold ${
                    complete
                      ? "bg-success text-white"
                      : active
                        ? "bg-brand text-white"
                        : "bg-cream-deep text-ink-muted"
                  }`}
                >
                  {complete ? <Check size={12} /> : index + 1}
                </span>
                <span
                  className={`text-[12px] font-semibold capitalize ${
                    active ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {item === "details" ? "Your details" : item === "pay" ? "Pay" : "Done"}
                </span>
                {index < 2 ? (
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-5 sm:px-6">
          {step === "details" ? (
            <div className="space-y-4">
              {fields.length === 0 ? (
                <InlineNote tone="info">
                  This collection does not ask for any details — continue to the
                  payment step and transfer the amount shown.
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
                      value={values[field.field_id] ?? ""}
                      onChange={(event) =>
                        setValue(field.field_id, event.target.value)
                      }
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
                      value={values[field.field_id] ?? ""}
                      onChange={(event) =>
                        setValue(field.field_id, event.target.value)
                      }
                    />
                  ) : field.type === "date" ? (
                    <Input
                      id={`field-${field.field_id}`}
                      type="date"
                      value={values[field.field_id] ?? ""}
                      onChange={(event) =>
                        setValue(field.field_id, event.target.value)
                      }
                    />
                  ) : (
                    <Input
                      id={`field-${field.field_id}`}
                      type={
                        field.type === "email"
                          ? "email"
                          : field.type === "number"
                            ? "number"
                            : field.type === "phone"
                              ? "tel"
                              : "text"
                      }
                      inputMode={
                        field.type === "phone"
                          ? "tel"
                          : field.type === "number"
                            ? "numeric"
                            : undefined
                      }
                      value={values[field.field_id] ?? ""}
                      onChange={(event) =>
                        setValue(field.field_id, event.target.value)
                      }
                      placeholder={
                        field.type === "email"
                          ? "you@example.com"
                          : field.type === "phone"
                            ? "08012345678"
                            : ""
                      }
                    />
                  )}
                </Field>
              ))}

              {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

              <div className="rounded-xl border border-line bg-cream px-4 py-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Collection amount</span>
                  <span className="tabular font-semibold">
                    {formatMoney(data.amount, data.currency)}
                  </span>
                </div>
                <p className="hint mt-1">
                  You will transfer exactly{" "}
                  <strong>{formatMoney(amountDue, data.currency)}</strong> —
                  the collection amount plus transaction fees.
                </p>
              </div>

              <Button size="lg" loading={submitting} onClick={submit}>
                Continue to payment
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink-muted">
                <Lock size={12} /> Your details are only shared with the
                coordinator of this collection.
              </p>
            </div>
          ) : null}

          {step === "pay" && result ? (
            <div className="space-y-4">
              <InlineNote tone="info" title="Transfer to this account">
                Open your bank app and transfer{" "}
                <strong>{formatMoney(amountDue, data.currency)}</strong> to the
                account below. Keep this page open — confirmation usually takes
                seconds.
              </InlineNote>

              <div className="rounded-xl border border-line bg-white p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-3">
                    <span className="text-[12.5px] text-ink-muted">Bank</span>
                    <span className="text-[13.5px] font-semibold">
                      {result.payment_account.bank_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-3">
                    <span className="text-[12.5px] text-ink-muted">
                      Account name
                    </span>
                    <span className="text-right text-[13px] font-semibold">
                      {result.payment_account.account_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-3">
                    <span className="text-[12.5px] text-ink-muted">
                      Account number
                    </span>
                    <span className="tabular text-[18px] font-extrabold tracking-tight">
                      {result.payment_account.account_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-3">
                    <span className="text-[12.5px] text-ink-muted">Amount</span>
                    <span className="tabular text-[15px] font-bold">
                      {formatMoney(amountDue, data.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-ink-muted">
                      Reference
                    </span>
                    <span className="font-mono text-[12px]">
                      {result.transaction.reference}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={copied ? <Check size={13} /> : <Copy size={13} />}
                    onClick={async () => {
                      const ok = await copyText(
                        result.payment_account.account_number,
                      );
                      if (ok) setCopied(true);
                    }}
                  >
                    {copied ? "Copied" : "Copy account number"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Copy size={13} />}
                    onClick={() =>
                      copyText(
                        `${data.name}\n${formatMoney(amountDue, data.currency)} to ${result.payment_account.bank_name} ${result.payment_account.account_number} (${result.payment_account.account_name})\nReference: ${result.transaction.reference}`,
                      )
                    }
                  >
                    Copy transfer details
                  </Button>
                </div>
              </div>

              {result.payment_account.expiry_at ? (
                <p className="hint text-center">
                  This account is reserved until{" "}
                  {formatTime(result.payment_account.expiry_at)}. Sending after
                  that still works — confirmation just takes a few minutes
                  longer.
                </p>
              ) : null}

              <Button
                size="lg"
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
                  setConfirming(false);
                }}
                className="mx-auto flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
              >
                <ArrowLeft size={13} /> Edit my details
              </button>
            </div>
          ) : null}

          {step === "done" && result ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e7f5ee] text-success">
                <BadgeCheck size={22} />
              </span>
              <div>
                <h2 className="text-[19px] font-extrabold">
                  Payment confirmed
                </h2>
                <p className="muted mx-auto mt-2 max-w-sm">
                  {formatMoney(result.transaction.amount, result.transaction.currency)}{" "}
                  for {data.name} has been received
                  {result.transaction.payer_email
                    ? ` and a receipt is on its way to ${result.transaction.payer_email}`
                    : " and a receipt will be emailed to you"}
                  .
                </p>
              </div>

              <div className="mx-auto max-w-sm rounded-xl border border-line bg-cream p-4 text-left">
                <div className="space-y-2 text-[12.5px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted">Reference</span>
                    <span className="font-mono">
                      {result.transaction.reference}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted">Paid</span>
                    <span className="font-semibold">
                      {formatMoney(
                        result.transaction.total_charged ?? amountDue,
                        result.transaction.currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted">Coordinator</span>
                    <span className="font-semibold">{data.name}</span>
                  </div>
                </div>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink-muted">
                <ShieldCheck size={13} /> Verified by the payment gateway — no
                screenshot needed.
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      <p className="mt-4 text-center text-[11.5px] text-ink-muted">
        Secured by Jeneviv · Payments processed by Flutterwave · amounts in{" "}
        {currencySymbol(data.currency)} {data.currency}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="text-[20px] font-extrabold tracking-[-0.05em] text-ink"
          >
            jeneviv<span className="text-brand">.</span>
          </Link>
          <span className="font-mono text-3xs uppercase tracking-[0.14em] text-ink-muted">
            secure payment
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
