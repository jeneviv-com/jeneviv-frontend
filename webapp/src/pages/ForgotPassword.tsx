import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/hooks/useApi";
import { authAPI } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import AuthLayout from "@/components/AuthLayout";
import { Button, Field, InlineNote, Input } from "@/components/ui";

/**
 * Step one of the reset flow: take an email address and ask the API to send a
 * link. The confirmation is deliberately identical whether or not the address
 * has an account, so this page can never be used to discover who is registered.
 */
export default function ForgotPassword() {
  const { connection } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const demo = isDemoMode() || connection === "demo";

  const requestLink = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      await authAPI.requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await requestLink();
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="If that address belongs to a Jeneviv workspace, a reset link is on its way."
        footer={
          <>
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
            >
              Sign in
            </Link>
          </>
        }
      >
        <div className="rounded-[16px] border border-ink/15 bg-white px-5 py-6">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d5e8c4]">
            <CheckCircle2 size={19} className="text-ink" />
          </span>
          <p className="mt-4 text-[16px] font-bold tracking-tight text-ink">
            We sent a link to
          </p>
          <p className="mt-1 break-all text-[14px] font-semibold text-ink">{sentTo}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            It works once and expires in an hour. Nothing there after a minute or two?
            Check spam, then send it again.
          </p>
          <div className="mt-5 grid gap-2">
            <Button
              variant="secondary"
              size="lg"
              className="h-[46px] rounded-[12px]"
              loading={submitting}
              onClick={requestLink}
            >
              Send it again
            </Button>
            <Link
              to="/login"
              className="inline-flex h-[46px] items-center justify-center gap-1.5 rounded-[12px] text-[13.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>

        {demo ? (
          <div className="mt-5">
            <InlineNote tone="info" title="Demo workspace">
              No email is sent here. Open <code className="font-mono">/reset-password?token=demo</code>{" "}
              to try the second half of the flow.
            </InlineNote>
          </div>
        ) : null}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Tell us the email on your workspace and we will send a link to choose a new password."
      footer={
        <>
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email address" htmlFor="reset-email" hint="The address you sign in with.">
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              className="h-[50px] rounded-[12px] pl-10"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </Field>

        {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

        <Button
          type="submit"
          size="lg"
          className="h-[50px] w-full rounded-[12px] text-[15px]"
          loading={submitting}
          disabled={!email.includes("@")}
        >
          Email me a reset link
        </Button>
      </form>

      <p className="hint mt-6">
        No access to that inbox any more? Email{" "}
        <a
          className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
          href="mailto:myjeneviv@gmail.com"
        >
          myjeneviv@gmail.com
        </a>{" "}
        and we will sort it out with you.
      </p>
    </AuthLayout>
  );
}
