"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "../../../components/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const valid = email.trim() && password.length >= 6;

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      // Error is already set in context and will display
    }
  };

  return (
    <AuthShell>
      <div className="auth-login-head">
        <h1>Welcome back</h1>
        <p>Log in to your jeneviv business dashboard</p>
      </div>
      <form className="auth-form" onSubmit={submitLogin}>
        <div className="auth-field">
          <input
            type="email"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Business e-mail address</label>
        </div>
        <div className="auth-field auth-field-password">
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <Link href="#" className="auth-forgot">
          Forgot password?
        </Link>
        <button
          type="submit"
          className={`auth-submit${valid && !loading ? " ready" : ""}`}
          disabled={!valid || loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
        {error && <p className="auth-error">{error}</p>}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-foot">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="auth-link">
            Create account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
