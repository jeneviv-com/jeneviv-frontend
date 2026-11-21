import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, CheckCircle2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/hooks/useApi";
import AuthLayout from "@/components/AuthLayout";
import { Button, Field, Input } from "@/components/ui";
import { landingOrigin } from "@/lib/landing";

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
type Role = "individual" | "organization" | "payer";

/** How long the success card stays up before the dashboard loads. */
const REDIRECT_DELAY_MS = 1500;

const ROLES: { id: Role; title: string; body: string }[] = [
  {
    id: "individual",
    title: "As an individual",
    body: "You are collecting from or on behalf of a group.",
  },
  {
    id: "organization",
    title: "On behalf of an organization",
    body: "You will be prompted to provide an associated tax ID later.",
  },
  {
    id: "payer",
    title: "As a payer or participant",
    body: "No sign-up required. Ask your group's organizer for a link.",
  },
];

/** One of the three ways to use jeneviv. Selected options get the ink outline. */
function RoleOption({
  title,
  body,
  selected,
  onSelect,
  payer = false,
}: {
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
  payer?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-[14px] border px-5 py-4 text-left transition-colors ${
        selected ? "border-ink bg-white" : "border-line bg-cream hover:border-ink/30"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
          selected ? "border-ink bg-ink" : "border-ink/30 bg-white"
        }`}
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold tracking-tight text-ink">{title}</span>
        <span className="mt-1 flex items-start gap-2 text-[13.5px] leading-relaxed text-ink-soft">
          {payer ? <AlertCircle size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" /> : null}
          <span>{body}</span>
        </span>
      </span>
    </button>
  );
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const score = useMemo(() => strength(password), [password]);
  const isOrganization = role === "organization";
  const emailsMatch = email.trim() !== "" && email.trim().toLowerCase() === confirmEmail.trim().toLowerCase();
  const canSubmit =
    (role === "individual" || role === "organization") &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    (!isOrganization || organization.trim().length > 0) &&
    email.includes("@") &&
    emailsMatch &&
    password.length >= 8 &&
    accepted;
  const created = outcome?.kind === "success";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setOutcome(null);

    if (!emailsMatch) {
      setOutcome({ kind: "error", title: "Check your email", message: "The two email addresses do not match." });
      return;
    }
    if (!accepted) {
      setOutcome({
        kind: "error",
        title: "One thing is missing",
        message: "Please accept the terms of service to continue.",
      });
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    setSubmitting(true);
    try {
      await signup(fullName, email.trim(), password, {
        accountType: role === "organization" ? "organization" : "individual",
        organizationName: organization.trim() || undefined,
      });
      setOutcome({
        kind: "success",
        title: "Your workspace is ready",
        message: `${fullName}, you are signed in as ${email.trim()}. Tell us what you collect and we will approve your workspace.`,
      });
      window.setTimeout(() => navigate("/dashboard", { replace: true }), REDIRECT_DELAY_MS);
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
  const chosen = ROLES.find((item) => item.id === role);

  return (
    <AuthLayout
      title="How will you use jeneviv?"
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
      <div className="space-y-6">
        {outcome ? (
          <FeedbackCard
            kind={outcome.kind}
            title={outcome.title}
            action={
              outcome.kind === "success" ? (
                <Button size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate("/dashboard", { replace: true })}>
                  Open my dashboard
                </Button>
              ) : null
            }
          >
            {outcome.message}
          </FeedbackCard>
        ) : null}

        {role && role !== "payer" && chosen ? (
          <div className="flex items-start justify-between gap-4 rounded-[14px] border border-ink bg-white px-5 py-4">
            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-tight text-ink">{chosen.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{chosen.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setRole(null)}
              className="shrink-0 text-[13px] font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ROLES.map((item) => (
              <RoleOption
                key={item.id}
                title={item.title}
                body={item.body}
                payer={item.id === "payer"}
                selected={role === item.id}
                onSelect={() => setRole(item.id)}
              />
            ))}
          </div>
        )}

        {role === "payer" ? (
          <p className="rounded-[14px] border border-line bg-cream px-5 py-4 text-[13.5px] leading-relaxed text-ink-soft">
            You do not need an account to pay. Open the payment link your group's organizer sent you.
          </p>
        ) : null}

        {role === "individual" || role === "organization" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Legal first name" htmlFor="first-name">
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  required
                  className="h-[50px] rounded-[12px]"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </Field>
              <Field label="Legal last name" htmlFor="last-name">
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  required
                  className="h-[50px] rounded-[12px]"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </Field>
            </div>

            <Field
              label={isOrganization ? "Legal name of organization" : "Group or organization name (optional)"}
              htmlFor="organization"
            >
              <Input
                id="organization"
                required={isOrganization}
                className="h-[50px] rounded-[12px]"
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
              />
            </Field>

            <Field label="Email address" htmlFor="signup-email">
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                className="h-[50px] rounded-[12px]"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field label="Confirm email address" htmlFor="confirm-email">
              <Input
                id="confirm-email"
                type="email"
                autoComplete="email"
                required
                className="h-[50px] rounded-[12px]"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
              />
            </Field>

            <Field label="Password" htmlFor="signup-password" hint="At least 8 characters. A number or symbol makes it stronger.">
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                className="h-[50px] rounded-[12px]"
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

            <p className="text-[13px] leading-relaxed text-ink-soft">
              By continuing, I agree to the{" "}
              <a
                href={`${landingOrigin()}/terms`}
                className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
              >
                terms of use
              </a>{" "}
              and{" "}
              <a
                href={`${landingOrigin()}/privacy`}
                className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
              >
                privacy policy
              </a>
              .
            </p>
            <label className="flex items-start gap-3 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-brand/30"
              />
              <span>I accept the terms above.</span>
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
        ) : null}
      </div>
    </AuthLayout>
  );
}
