import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/hooks/useApi";
import AuthLayout from "@/components/AuthLayout";
import { Button, Field, Input } from "@/components/ui";

/**
 * The two outcomes of this form get a card of their own: an account that was
 * created, or one that was refused. Both carry a light black outline and a
 * round mark, so the state is readable at a glance without reading the copy.
 */
function FeedbackCard({
  kind,
  title,
  children,
  action,
}: {
  kind: "error" | "success";
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const styles = {
    success: {
      wrap: "border-ink/20 bg-[#f1fbf6]",
      mark: "bg-[#c9ecdb] text-success",
      icon: <CheckCircle2 size={16} />,
    },
    error: {
      wrap: "border-ink/20 bg-[#fdf2f1]",
      mark: "bg-[#f4cecb] text-danger",
      icon: <TriangleAlert size={16} />,
    },
  } as const;
  const style = styles[kind];

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[14px] border px-4 py-4 ${style.wrap}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${style.mark}`}>
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold tracking-tight text-ink">{title}</p>
        <div className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{children}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABEL = ["weak", "weak", "fair", "good", "strong"];

type Outcome = { kind: "error" | "success"; title: string; message: string };

/** How long the success card stays up before the dashboard loads. */
const REDIRECT_DELAY_MS = 1500;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const score = useMemo(() => strength(password), [password]);
  const canSubmit = name.trim().length > 1 && email.includes("@") && password.length >= 8 && accepted;
  const created = outcome?.kind === "success";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setOutcome(null);

    if (!accepted) {
      setOutcome({
        kind: "error",
        title: "One thing is missing",
        message: "Please accept the terms of service to continue.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      setOutcome({
        kind: "success",
        title: "Your workspace is ready",
        message: `${name.trim()}, you are signed in as ${email.trim()}. Tell us what you collect and we will approve your workspace.`,
      });
      window.setTimeout(
        () => navigate("/dashboard", { replace: true }),
        REDIRECT_DELAY_MS,
      );
    } catch (err) {
      const message = errorMessage(err);
      setOutcome({
        kind: "error",
        title: "We could not create your account",
        message: /already exists|already registered/i.test(message)
          ? `${message} Sign in instead if this is your account.`
          : message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const bars = [0, 1, 2, 3].map((index) => index < score);
  const barTone = score <= 2 ? "bg-warning" : score === 3 ? "bg-brand" : "bg-success";

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Free to start. You only pay a fee when money actually moves."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {outcome ? (
          <FeedbackCard
            kind={outcome.kind}
            title={outcome.title}
            action={
              outcome.kind === "success" ? (
                <Button
                  size="sm"
                  icon={<ArrowRight size={14} />}
                  onClick={() => navigate("/dashboard", { replace: true })}
                >
                  Open my dashboard
                </Button>
              ) : null
            }
          >
            {outcome.message}
          </FeedbackCard>
        ) : null}

        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            autoComplete="name"
            required
            className="h-[50px] rounded-[12px]"
            placeholder="Ifeanyi Adebayo"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field label="Email address" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            className="h-[50px] rounded-[12px]"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="signup-password"
          hint="At least 8 characters. A number or symbol makes it stronger."
        >
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            className="h-[50px] rounded-[12px]"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {password ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {bars.map((filled, index) => (
                  <span key={index} className={`h-1.5 flex-1 rounded-full ${filled ? barTone : "bg-line"}`} />
                ))}
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                {STRENGTH_LABEL[score]}
              </span>
            </div>
          ) : null}
        </Field>

        <label className="flex items-start gap-3 rounded-[12px] border border-ink/20 bg-white px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-brand/30"
          />
          <span>
            I agree to the{" "}
            <a
              href={`${import.meta.env.VITE_PUBLIC_APP_URL || ""}/terms`}
              className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
            >
              terms of service
            </a>{" "}
            and{" "}
            <a
              href={`${import.meta.env.VITE_PUBLIC_APP_URL || ""}/privacy`}
              className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
            >
              privacy policy
            </a>
            .
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="h-[50px] w-full rounded-[12px] text-[15px]"
          loading={submitting}
          disabled={!canSubmit || created}
        >
          {created ? "Account created" : "Create account"}
        </Button>
      </form>

      <ul className="mt-7 space-y-3">
        {["No card required to start", "Create collections before approval", "Settle to your own bank account"].map(
          (item) => (
            <li key={item} className="flex items-center gap-2.5 text-[13px] text-ink-muted">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#d5e8c4]">
                <Check size={11} className="text-ink" />
              </span>
              {item}
            </li>
          ),
        )}
      </ul>
    </AuthLayout>
  );
}