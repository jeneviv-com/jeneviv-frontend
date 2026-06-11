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
          Continue with Google
        </button>
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
