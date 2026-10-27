import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, CheckCircle2, Clock3, Loader2, ShieldCheck, TriangleAlert, XCircle } from "lucide-react";
import { APIError, approvalsAPI, type ApprovalSummary, type Withdrawal } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Button, Field, InlineNote, Input, TONE_MEANING } from "@/components/ui";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; approval: ApprovalSummary }
  | { kind: "error"; message: string };

/** A label on the left, a value on the right, separated by a hairline. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold">{children}</span>
    </div>
  );
}

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
          message: error instanceof APIError ? error.message : "This approval link could not be opened.",
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
      setActionError(error instanceof APIError ? error.message : "Could not approve this sweep.");
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
      setActionError(error instanceof APIError ? error.message : "Could not reject this sweep.");
    } finally {
      setBusy(false);
    }
  };

  const approval = state.kind === "ready" ? state.approval : null;
  const alreadyHandled = result !== null || (approval !== null && approval.status !== "pending_treasurer");

  return (
    <div className="min-h-screen bg-cream px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-[580px]">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-[21px] font-extrabold tracking-[-0.05em] text-ink">
            jeneviv<span className="text-brand">.</span>
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">treasurer approval</span>
        </div>

        {state.kind === "loading" ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Loader2 size={22} className="animate-spin text-brand" />
            <p className="muted mt-3">Opening the approval request…</p>
          </div>
        ) : state.kind === "error" ? (
          <div className="py-10">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ffd6cf] text-ink">
              <TriangleAlert size={20} />
            </span>
            <h1 className="mt-6 text-[30px] font-bold leading-[1.05] tracking-[-0.04em]">This link cannot be used</h1>
            <p className="muted mt-3">{state.message}</p>
            <p className="hint mt-3">
              Approval links are single-use and expire after 30 minutes. Ask the rep to start a new sweep.
            </p>
          </div>
        ) : (
          <>
            {/* the request */}
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Sweep approval</p>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.02] tracking-[-0.045em]">{approval?.school_name}</h1>
            <p className="muted mt-3">
              {approval?.requested_by} requested this transfer. Approve only if the amount and destination were agreed.
            </p>

            {/* amount */}
            <div className="mt-8 rounded-[20px] bg-ink px-6 py-6 text-cream">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/60">Amount to release</p>
              <p className="tabular mt-2 text-[40px] font-bold leading-none tracking-[-0.03em]">
                {formatMoney(approval?.amount ?? 0, approval?.currency ?? "NGN")}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-cream/70">
                <Clock3 size={12} /> Requested {formatDateTime(approval?.requested_at)}
              </p>
            </div>

            <div className="mt-6">
              <Line label="Treasurer">{approval?.treasurer_name}</Line>
              <Line label="Requested by">{approval?.requested_by}</Line>
              <Line label="Link expires">{formatDateTime(approval?.expires_at)}</Line>
            </div>

            <div className="mt-8">
              {result ? (
                <div className="space-y-4">
                  <InlineNote
                    tone={result.status === "failed" ? "error" : result.status === "rejected" ? "warning" : "success"}
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
                    {result.gateway_ref ? <p className="mt-1 font-mono text-[11px]">{result.gateway_ref}</p> : null}
                  </InlineNote>
                  <div className="flex items-center gap-2 text-[13px]">
                    <CheckCircle2 size={15} className="text-ink" />
                    Treasurer approved {formatDateTime(result.treasurer_approved_at)}
                  </div>
                </div>
              ) : alreadyHandled ? (
                <InlineNote
                  tone={approval?.status === "rejected" || approval?.status === "expired" ? "warning" : "info"}
                  title={`This sweep is ${approval?.status?.replace(/_/g, " ") ?? "already handled"}`}
                >
                  It cannot be approved again. Ask the rep to start a new sweep if money still needs to move.
                </InlineNote>
              ) : (
                <div className="space-y-5">
                  <Field label="Six-digit code" htmlFor="treasurer-otp" hint="Sent by SMS to the number on file.">
                    <Input
                      id="treasurer-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="h-[56px] rounded-[12px] text-center font-mono text-[22px] tracking-[0.4em]"
                    />
                  </Field>
                  {actionError ? <InlineNote tone="error">{actionError}</InlineNote> : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      className="h-[52px] rounded-[12px]"
                      icon={<BadgeCheck size={14} />}
                      loading={busy}
                      disabled={otp.length !== 6}
                      onClick={approve}
                    >
                      Approve and send
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="h-[52px] rounded-[12px]"
                      icon={<XCircle size={14} />}
                      disabled={busy}
                      onClick={reject}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center gap-3 border-t border-line pt-6">
              <span className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12px] font-semibold ${TONE_MEANING.money}`}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/85">
                  <ShieldCheck size={12} />
                </span>
                Two-man rule
              </span>
              <span className="text-[12.5px] text-ink-muted">The rep cannot move money alone.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
