import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { workspacesAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";

type State =
  | { kind: "working" }
  | { kind: "done"; workspace: string }
  | { kind: "error"; message: string };

/**
 * Landing page for an invite link. The token is single-use and bound to the
 * invited email, so accepting twice or from another account is rejected by the
 * API rather than hidden here.
 */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { refreshMerchant } = useAuth();
  const started = useRef(false);
  const [state, setState] = useState<State>({ kind: "working" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setState({ kind: "error", message: "This link is missing its invite token." });
      return;
    }

    void workspacesAPI
      .acceptInvite(token)
      .then(async (result) => {
        await refreshMerchant();
        setState({
          kind: "done",
          workspace: result.workspace.name ?? "the workspace",
        });
      })
      .catch((err: unknown) => {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "This invite could not be accepted.",
        });
      });
  }, [token, refreshMerchant]);

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-5">
      <div className="w-full max-w-[420px] rounded-[22px] border border-line bg-white p-7 text-center shadow-pop">
        {state.kind === "working" ? (
          <>
            <Loader2 size={26} className="mx-auto animate-spin text-brand" />
            <h1 className="mt-4 text-[17px] font-bold tracking-tight">Joining…</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              Checking your invite and opening the workspace.
            </p>
          </>
        ) : null}

        {state.kind === "done" ? (
          <>
            <CheckCircle2 size={26} className="mx-auto text-money" />
            <h1 className="mt-4 text-[17px] font-bold tracking-tight">You're in</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              You now have access to {state.workspace}.
            </p>
            <Link to="/dashboard" className="mt-5 inline-block">
              <Button icon={<ArrowRight size={14} />}>Go to dashboard</Button>
            </Link>
          </>
        ) : null}

        {state.kind === "error" ? (
          <>
            <XCircle size={26} className="mx-auto text-danger" />
            <h1 className="mt-4 text-[17px] font-bold tracking-tight">Invite not accepted</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {state.message}
            </p>
            <Link
              to="/dashboard"
              className="mt-5 inline-block text-[13px] font-semibold text-brand underline underline-offset-2"
            >
              Back to dashboard
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
