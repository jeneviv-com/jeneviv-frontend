import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage } from "@/hooks/useApi";
import AuthLayout from "@/components/AuthLayout";
import { Button, Field, InlineNote, Input } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";

export default function Login() {
  const { login, loading: bootstrapping, connection } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: string } | null)?.from || "/dashboard";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      success("Welcome back", "You are signed in to your workspace.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      toastError("Sign in failed", errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const demo = isDemoMode() || connection === "demo";

  const fillDemo = () => {
    setEmail("coordinator@jeneviv.test");
    setPassword("jeneviv1234");
  };

  return (
    <AuthLayout
      title="Sign in to Jeneviv"
      subtitle="Pick up where your collections left off."
      footer={
        <>
          New to Jeneviv?{" "}
          <Link
            to="/signup"
            className="font-semibold text-brand underline underline-offset-2"
          >
            Create an account
          </Link>
        </>
      }
    >
      {demo ? (
        <InlineNote tone="warning" title="Demo workspace">
          The backend host is offline, so sign in with any credentials — or{" "}
          <button
            type="button"
            onClick={fillDemo}
            className="font-semibold underline underline-offset-2"
          >
            use the seeded coordinator
          </button>
          .
        </InlineNote>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Email address" htmlFor="email">
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="pl-9"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Lock
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pl-9 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}

        <Button
          type="submit"
          size="lg"
          loading={submitting || bootstrapping}
          disabled={!email || !password}
        >
          Sign in
        </Button>
      </form>

      <p className="hint mt-4 text-center">
        Forgot your password? Email{" "}
        <a
          className="font-semibold text-brand underline underline-offset-2"
          href="mailto:myjeneviv@gmail.com"
        >
          myjeneviv@gmail.com
        </a>{" "}
        and we will reset it for you.
      </p>
    </AuthLayout>
  );
}
