"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "../../../components/AuthShell";

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
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) window.location.href = "/registrationConfirm/012146";
        }}
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
          className={`auth-submit${isValid ? " ready" : ""}`}
          disabled={!isValid}
        >
          Create account
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
