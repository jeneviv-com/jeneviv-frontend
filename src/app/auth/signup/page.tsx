"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "../../../components/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";

const ROLES = [
  "Course Representative",
  "PTA Chair / Secretary",
  "Cooperative Secretary",
  "Association Treasurer",
  "Faith Group Coordinator",
  "Alumni Treasurer",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    groupName: "",
    role: "",
    email: "",
    phone: "",
    password: "",
  });

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.role &&
    form.email.trim() &&
    form.phone.trim() &&
    form.password.length >= 6;

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      const fullName = `${form.firstName} ${form.lastName}`;
      await signup(fullName, form.email, form.password);
      router.push("/dashboard");
    } catch {
      // Error is already set in context and will display
    }
  };

  return (
    <AuthShell>
      <div className="auth-login-head">
        <h1>Create your account</h1>
        <p>
          Start collecting payments for your group — no business registration
          needed.
        </p>
      </div>
      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <div className="auth-row">
          <div className="auth-field">
            <input
              type="text"
              placeholder=" "
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
            <label>First name</label>
          </div>
          <div className="auth-field">
            <input
              type="text"
              placeholder=" "
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
            />
            <label>Last name</label>
          </div>
        </div>

        <div className="auth-field auth-field-with-info">
          <input
            type="text"
            placeholder=" "
            value={form.groupName}
            onChange={(e) => update("groupName", e.target.value)}
          />
          <label>Group or organization name (optional)</label>
          <span
            className="auth-info"
            title="e.g. 300L CSC, Ikeja Grammar PTA, St. Paul's Building Fund"
          >
            i
          </span>
        </div>

        <div className="auth-field auth-field-select">
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            required
          >
            <option value="" disabled>
              Your role in the group
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <input
            type="email"
            placeholder=" "
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
          <label>E-mail address</label>
        </div>

        <div className="auth-field auth-field-phone">
          <div className="auth-phone-prefix">
            <span className="auth-flag-ng" aria-hidden="true"></span>
            <span>+234</span>
          </div>
          <input
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />
        </div>

        <div className="auth-field auth-field-password">
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={6}
          />
          <label>Password</label>
          <button
            type="button"
            className="auth-eye"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        <button
          type="submit"
          className={`auth-submit${isValid && !loading ? " ready" : ""}`}
          disabled={!isValid || loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={() => authAPI.googleSignIn()}
          className="auth-google"
        >
          <svg className="auth-google-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <p className="auth-foot">
          Already have an account?{" "}
          <Link href="/auth/login" className="auth-link">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
