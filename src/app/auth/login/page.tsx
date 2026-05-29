"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AuthShell from "../../../components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const valid = email.trim() && password.length >= 6;
  const codeFilled = code.every((c) => c !== "");

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) setShowOtp(true);
  };

  const handleCode = (i: number, v: string) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeFilled) window.location.href = "/dashboard";
  };

  return (
    <>
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
            className={`auth-submit${valid ? " ready" : ""}`}
            disabled={!valid}
          >
            Log in
          </button>
          <p className="auth-foot">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="auth-link">
              Create account
            </Link>
          </p>
        </form>
      </AuthShell>

      {showOtp && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true">
          <div className="auth-modal">
            <button
              className="auth-modal-close"
              aria-label="Close"
              onClick={() => setShowOtp(false)}
              type="button"
            >
              ×
            </button>
            <h2 className="auth-modal-title">Verification code</h2>
            <p className="auth-modal-sub">
              To log in, enter the verification code sent to your email address
            </p>
            <form className="auth-otp-form" onSubmit={submitOtp}>
              <div className="auth-otp-row">
                {code.map((v, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleCode(i, e.target.value)}
                    onKeyDown={(e) => handleKey(i, e)}
                    className={`auth-otp-cell${i === 0 && !code[0] ? " focus" : ""}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button
                type="submit"
                className={`auth-modal-btn${codeFilled ? " ready" : ""}`}
                disabled={!codeFilled}
              >
                Continue
              </button>
              <p className="auth-modal-foot">
                No code received?{" "}
                <button type="button" className="auth-link auth-link-btn">
                  Resend code
                </button>
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
