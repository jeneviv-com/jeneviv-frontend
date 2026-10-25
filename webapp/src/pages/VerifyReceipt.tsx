import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { APIError, verifyAPI, type PublicReceipt } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Button, Card, InlineNote, Pill } from "@/components/ui";

type State =
  | { kind: "loading" }
  | { kind: "valid"; receipt: PublicReceipt }
  | { kind: "missing"; message: string };

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
        const message =
          error instanceof APIError
            ? error.message
            : "We could not check this receipt.";
        setState({ kind: "missing", message });
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="min-h-screen bg-cream px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="text-[20px] font-extrabold tracking-[-0.05em] text-ink"
          >
            jeneviv<span className="text-brand">.</span>
          </Link>
          <span className="font-mono text-3xs uppercase tracking-[0.14em] text-ink-muted">
            receipt verification
          </span>
        </div>

        {state.kind === "loading" ? (
          <Card className="text-center">
            <Loader2 size={22} className="mx-auto animate-spin text-brand" />
            <p className="muted mt-3">Checking this receipt…</p>
          </Card>
        ) : state.kind === "missing" ? (
          <Card>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fdecea] text-danger">
              <TriangleAlert size={20} />
            </span>
            <h1 className="mt-4 text-[19px] font-extrabold">
              This receipt could not be verified
            </h1>
            <p className="muted mt-2">{state.message}</p>
            <p className="hint mt-3">
              Only receipts issued for a confirmed payment appear here. If a
              school shared this link, ask them to confirm the reference.
            </p>
          </Card>
        ) : (
          <>
            <Card padded={false} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-[#f1fbf6] px-5 py-4">
                <div className="flex items-center gap-2.5 text-[#0c6742]">
                  <CheckCircle2 size={20} />
                  <div>
                    <p className="text-[14px] font-bold">This receipt is valid</p>
                    <p className="text-[12px] opacity-80">
                      Confirmed on {formatDateTime(state.receipt.paid_at)}
                    </p>
                  </div>
                </div>
                <Pill tone="green">Verified</Pill>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  {state.receipt.logo_url ? (
                    <img
                      src={state.receipt.logo_url}
                      alt=""
                      className="h-12 w-12 rounded-lg border border-line object-contain"
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-soft text-brand">
                      <Building2 size={20} />
                    </span>
                  )}
                  <div>
                    <p className="eyebrow">Issued by</p>
                    <h1 className="text-[20px] font-extrabold leading-tight">
                      {state.receipt.school_name}
                    </h1>
                    <p className="muted mt-0.5">{state.receipt.collection_name}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-line bg-cream px-4 py-4">
                  <p className="eyebrow">Amount paid</p>
                  <p className="tabular mt-1 text-[28px] font-extrabold leading-none">
                    {formatMoney(
                      state.receipt.amount / 100,
                      state.receipt.currency,
                    )}
                  </p>
                </div>

                <dl className="mt-4 space-y-3">
                  {[
                    ["Student", state.receipt.student_name],
                    ["Paid by", state.receipt.payer_name],
                    ["Reference", state.receipt.reference],
                    ...state.receipt.details
                      .filter((detail) => detail.label !== "Collection")
                      .map(
                        (detail) =>
                          [detail.label, detail.value] as [string, string],
                      ),
                  ].map(([label, value]) => (
                    <div
                      key={`${label}-${value}`}
                      className="flex items-start justify-between gap-6 border-b border-line-soft pb-2.5 last:border-b-0"
                    >
                      <dt className="text-[12.5px] text-ink-muted">{label}</dt>
                      <dd className="text-right text-[13px] font-semibold">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {state.receipt.nin_verified ? (
                    <Pill tone="green">
                      <BadgeCheck size={11} /> NIN verified
                    </Pill>
                  ) : null}
                  {state.receipt.bank_verified ? (
                    <Pill tone="green">
                      <ShieldCheck size={11} /> Bank verified
                    </Pill>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    icon={<Download size={14} />}
                    onClick={() =>
                      window.open(
                        verifyAPI.receiptUrl(state.receipt.reference),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    Download PDF receipt
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  >
                    Copy verify link
                  </Button>
                </div>
              </div>
            </Card>

            <InlineNote tone="info">
              Anyone with this reference can confirm that the payment was
              recorded. Personal details are limited to what is shown above.
            </InlineNote>
          </>
        )}
      </div>
    </div>
  );
}
