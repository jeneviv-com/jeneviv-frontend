import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import {
  APIError,
  approvalsAPI,
  type ApprovalSummary,
  type Withdrawal,
} from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  Button,
  Card,
  Field,
  InlineNote,
  Input,
  Pill,
} from "@/components/ui";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; approval: ApprovalSummary }
  | { kind: "error"; message: string };

export default function ApproveWithdrawal() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<Withdrawal | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({ kind: "error", message: "This approval link is incomplete." });
      return;
    }
    approvalsAPI
      .get(token)
      .then((response) => {
        if (!cancelled) setState({ kind: "ready", approval: response.approval });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message:
            error instanceof APIError
              ? error.message
              : "This approval link could not be opened.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const approve = async () => {
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      const response = await approvalsAPI.approve(token, otp);
      setResult(response.withdrawal);
    } catch (error) {
      setActionError(
        error instanceof APIError ? error.message : "Could not approve this sweep.",
      );
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      const response = await approvalsAPI.reject(token, "Rejected by treasurer");
      setResult(response.withdrawal);
    } catch (error) {
      setActionError(
        error instanceof APIError ? error.message : "Could not reject this sweep.",
      );
    } finally {
      setBusy(false);
    }
  };

  const approval = state.kind === "ready" ? state.approval : null;
  const alreadyHandled =
    result !== null ||
    (approval !== null && approval.status !== "pending_treasurer");

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
            treasurer approval
          </span>
        </div>

        {state.kind === "loading" ? (
          <Card className="text-center">
            <Loader2 size={22} className="mx-auto animate-spin text-brand" />
            <p className="muted mt-3">Opening the approval request…</p>
          </Card>
        ) : state.kind === "error" ? (
          <Card>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fdecea] text-danger">
              <TriangleAlert size={20} />
            </span>
            <h1 className="mt-4 text-[19px] font-extrabold">
              This link cannot be used
            </h1>
            <p className="muted mt-2">{state.message}</p>
            <p className="hint mt-3">
              Approval links are single-use and expire after 30 minutes. Ask the
              rep to start a new sweep.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="eyebrow">Sweep approval</p>
                <h1 className="text-[20px] font-extrabold leading-tight">
                  {approval?.school_name}
                </h1>
                <p className="muted mt-1">
                  {approval?.requested_by} requested this transfer. Approve only
                  if the amount and destination were agreed.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-line bg-cream px-4 py-4">
              <p className="eyebrow">Amount to release</p>
              <p className="tabular mt-1 text-[28px] font-extrabold leading-none">
                {formatMoney(
                  (approval?.amount ?? 0) / 100,
                  approval?.currency ?? "NGN",
                )}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-muted">
                <Clock3 size={12} /> Requested{" "}
                {formatDateTime(approval?.requested_at)}
              </p>
            </div>

            <dl className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-2 text-[12.5px]">
                <dt className="text-ink-muted">Treasurer</dt>
                <dd className="font-semibold">{approval?.treasurer_name}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-2 text-[12.5px]">
                <dt className="text-ink-muted">Requested by</dt>
                <dd className="font-semibold">{approval?.requested_by}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-2 text-[12.5px]">
                <dt className="text-ink-muted">Link expires</dt>
                <dd className="font-semibold">{formatDateTime(approval?.expires_at)}</dd>
              </div>
            </dl>

            {result ? (
              <div className="mt-5">
                <InlineNote
                  tone={
                    result.status === "failed"
                      ? "error"
                      : result.status === "rejected"
                        ? "warning"
                        : "success"
                  }
                  title={
                    result.status === "failed"
                      ? "The transfer could not be completed"
                      : result.status === "rejected"
                        ? "Sweep rejected"
                        : "Approved — transfer submitted"
                  }
                >
                  {result.failure_reason ??
                    "Both approvals are recorded. The school can see the timestamp on their dashboard."}
                  {result.gateway_ref ? (
                    <p className="mt-1 font-mono text-[11px]">
                      {result.gateway_ref}
                    </p>
                  ) : null}
                </InlineNote>
                <div className="mt-3 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  <span className="text-[12.5px]">
                    Treasurer approved {formatDateTime(result.treasurer_approved_at)}
                  </span>
                </div>
              </div>
            ) : alreadyHandled ? (
              <div className="mt-5">
                <InlineNote
                  tone={
                    approval?.status === "rejected" || approval?.status === "expired"
                      ? "warning"
                      : "info"
                  }
                  title={`This sweep is ${approval?.status?.replace(/_/g, " ") ?? "already handled"}`}
                >
                  It cannot be approved again. Ask the rep to start a new sweep
                  if money still needs to move.
                </InlineNote>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <Field
                  label="Six-digit code"
                  htmlFor="treasurer-otp"
                  hint="Sent by SMS to the number on file."
                >
                  <Input
                    id="treasurer-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="font-mono text-center text-[20px] tracking-[0.4em]"
                  />
                </Field>
                {actionError ? (
                  <InlineNote tone="error">{actionError}</InlineNote>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    icon={<BadgeCheck size={14} />}
                    loading={busy}
                    disabled={otp.length !== 6}
                    onClick={approve}
                  >
                    Approve and send
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<XCircle size={14} />}
                    disabled={busy}
                    onClick={reject}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
              <Pill tone="green">
                <Building2 size={11} /> Two-man rule
              </Pill>
              <span className="text-[11.5px] text-ink-muted">
                The rep cannot move money alone.
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
