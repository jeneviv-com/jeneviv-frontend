import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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

export default function Signup() {
  const { signup } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const score = useMemo(() => strength(password), [password]);
  const canSubmit =
    name.trim().length > 1 &&
    email.includes("@") &&
    password.length >= 8 &&
    accepted;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!accepted) {
      setFormError("Please accept the terms to continue.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      success(
        "Account created",
        "Tell us what you collect so we can approve your workspace.",
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      toastError("We could not create your account", errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const bars = [0, 1, 2, 3].map((index) => index < score);

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Free to start. You only pay a fee when money actually moves."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            autoComplete="name"
            required
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
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {password ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {bars.map((filled, index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 rounded-pill ${
                      filled
                        ? score <= 2
                          ? "bg-warning"
                          : score === 3
                            ? "bg-brand"
                            : "bg-success"
                        : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-3xs text-ink-muted">
                {["weak", "weak", "fair", "good", "strong"][score]}
              </span>
            </div>
          ) : null}
        </Field>

        <label className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-soft">
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
              className="font-semibold text-brand underline underline-offset-2"
            >
              terms of service
            </a>{" "}
            and{" "}
            <a
              href={`${import.meta.env.VITE_PUBLIC_APP_URL || ""}/privacy`}
              className="font-semibold text-brand underline underline-offset-2"
            >
              privacy policy
            </a>
            .
          </span>
        </label>

        {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

        <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
          Create account
        </Button>
      </form>

      <ul className="mt-6 space-y-2">
        {[
          "No card required to start",
          "Create collections before approval",
          "Settle to your own bank account",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-[12.5px] text-ink-muted">
            <Check size={14} className="text-success" /> {item}
          </li>
        ))}
      </ul>
    </AuthLayout>
  );
}
