import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import { authAPI, tokenStore } from "@/lib/api";
import { errorMessage } from "@/hooks/useApi";
import AuthLayout from "@/components/AuthLayout";
import { Button, Field, InlineNote, Input } from "@/components/ui";

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABEL = ["weak", "weak", "fair", "good", "strong"];

/**
 * Step two of the reset flow: the token from the emailed link plus a new
 * password. The old sessions are revoked by the API, so the local bearer token
 * is cleared too and the reader signs in again with the new password.
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = (params.get("token") ?? "").trim();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const score = useMemo(() => strength(password), [password]);
  const bars = [0, 1, 2, 3].map((index) => index < score);
  const barTone = score <= 2 ? "bg-warning" : score === 3 ? "bg-brand" : "bg-success";
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 8 && confirm === password;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirm) {
      setFormError("Both passwords must match.");
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.resetPassword(password, token);
      tokenStore.set(null);
      setDone(true);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* A link opened without its token, or one already used, has nothing to do. */
  if (!token) {
    return (
      <AuthLayout
        title="This link is incomplete"
        subtitle="Reset links are single use and expire after an hour, so an old one stops working."
        footer={
          <>
            Need a hand? Email{" "}
            <a
              className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
              href="mailto:myjeneviv@gmail.com"
            >
              myjeneviv@gmail.com
            </a>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-[14px] border border-ink/15 bg-[#fff3dd] px-4 py-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f6e2b8] text-warning">
            <TriangleAlert size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold tracking-tight text-ink">
              No token in this address
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
              Open the link from your email exactly as it arrived, or request a fresh one
              below.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-5 h-[50px] w-full rounded-[12px] text-[15px]"
          icon={<ArrowRight size={15} />}
          onClick={() => navigate("/forgot-password", { replace: true })}
        >
          Send a new link
        </Button>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="You can sign in with the new password from any device."
        footer={
          <>
            Trouble signing in? Email{" "}
            <a
              className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
              href="mailto:myjeneviv@gmail.com"
            >
              myjeneviv@gmail.com
            </a>
          </>
        }
      >
        <div className="rounded-[16px] border border-ink/15 bg-white px-5 py-6">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d5e8c4]">
            <CheckCircle2 size={19} className="text-ink" />
          </span>
          <p className="mt-4 text-[16px] font-bold tracking-tight text-ink">
            Your password was changed
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Every other signed-in session was ended to keep the account safe. Sign in again
            to pick up where your collections left off.
          </p>
          <Button
            size="lg"
            className="mt-5 h-[48px] w-full rounded-[12px] text-[15px]"
            icon={<ArrowRight size={15} />}
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something you have not used here before. Your other sessions will sign out."
      footer={
        <>
          Changed your mind?{" "}
          <Link
            to="/login"
            className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="New password"
          htmlFor="new-password"
          hint="At least 8 characters. A number or symbol makes it stronger."
        >
          <div className="relative">
            <Lock
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="h-[50px] rounded-[12px] pl-10 pr-11"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {bars.map((filled, index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${filled ? barTone : "bg-line"}`}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                {STRENGTH_LABEL[score]}
              </span>
            </div>
          ) : null}
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="confirm-password"
          error={mismatch ? "These two do not match yet." : null}
        >
          <div className="relative">
            <Check
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="h-[50px] rounded-[12px] pl-10"
              placeholder="Repeat the new password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
        </Field>

        {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

        <Button
          type="submit"
          size="lg"
          className="h-[50px] w-full rounded-[12px] text-[15px]"
          loading={submitting}
          disabled={!canSubmit}
        >
          Save new password
        </Button>
      </form>

      <p className="hint mt-6">
        Reset links expire after an hour. If this one has stopped working,{" "}
        <Link
          to="/forgot-password"
          className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
        >
          request a new one
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
