"use client";

import Link from "next/link";
import { useState } from "react";

const STEPS = [
  {
    n: 1,
    title: "Personal Information",
    sub: "Enter your personal information to get started",
  },
  {
    n: 2,
    title: "Business information",
    sub: "Provide basic details about your business",
  },
  {
    n: 3,
    title: "Business contact details",
    sub: "Add your business' primary contact information",
  },
  {
    n: 4,
    title: "Business director details",
    sub: "Provide details for the business directors/trustees",
  },
  {
    n: 5,
    title: "Business settlement account",
    sub: "Set up the account for business settlements",
  },
  {
    n: 6,
    title: "Business documents",
    sub: "Upload required business documents",
  },
  {
    n: 7,
    title: "Compliance",
    sub: "Verify your business compliance",
  },
  {
    n: 8,
    title: "Review",
    sub: "Review and submit your application",
  },
];

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Registered Business Name",
  "Limited Liability Company",
  "Public Limited Company",
  "Non-Governmental Organisation",
];

const SECTORS = [
  "Retail",
  "E-commerce",
  "Education",
  "Hospitality",
  "Financial services",
  "Health care",
  "Technology",
  "Logistics",
  "Religious organisation",
  "Cooperative",
];

export default function OnboardingNigeriaPage() {
  const [active, setActive] = useState(2);
  const [form, setForm] = useState({
    legalName: "jeneviv",
    type: "",
    sector: "",
    country: "Nigeria",
  });

  return (
    <div className="onboard-shell">
      <header className="onboard-header">
        <Link href="/" className="onboard-logo">
          <span className="onboard-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 80 80">
              <polygon points="28,8 72,18 56,72 12,62" fill="#FFAD86" />
              <polygon points="32,14 66,22 50,66 16,58" fill="#FE4900" />
              <circle cx="41" cy="40" r="5" fill="#ffffff" />
            </svg>
          </span>
          <span>jeneviv</span>
        </Link>
        <Link href="/dashboard" className="onboard-skip">
          Go to dashboard
        </Link>
      </header>

      <div className="onboard-greet">
        <h1>
          <span className="onboard-greet-orange">Hello jeneviv,</span> Welcome
          to Jeneviv!
        </h1>
        <p>Let&apos;s help you setup your account.</p>
      </div>

      <div className="onboard-grid">
        <ol className="onboard-steps">
          {STEPS.map((s) => {
            const done = s.n < active;
            const cur = s.n === active;
            return (
              <li
                key={s.n}
                className={`onboard-step${done ? " done" : ""}${cur ? " current" : ""}`}
              >
                <div className="onboard-step-bullet">
                  {done ? "✓" : s.n}
                </div>
                <div className="onboard-step-text">
                  <div className="onboard-step-title">{s.title}</div>
                  <div className="onboard-step-sub">{s.sub}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="onboard-panel">
          <div className="onboard-panel-head">
            <h2>Business Information</h2>
            <p>Provide basic details about your business</p>
          </div>

          <form
            className="onboard-form"
            onSubmit={(e) => {
              e.preventDefault();
              setActive((a) => Math.min(STEPS.length, a + 1));
            }}
          >
            <div className="auth-field">
              <input
                type="text"
                value={form.legalName}
                placeholder=" "
                onChange={(e) =>
                  setForm((f) => ({ ...f, legalName: e.target.value }))
                }
              />
              <label>Legal Business Name</label>
            </div>

            <div className="auth-field auth-field-select">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="" disabled>
                  Type of business
                </option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field auth-field-select">
              <select
                value={form.sector}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sector: e.target.value }))
                }
              >
                <option value="" disabled>
                  Business sector
                </option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field auth-field-select">
              <label className="auth-select-label">Select a country</label>
              <select
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>

            <div className="onboard-actions">
              <button
                type="button"
                className="onboard-back"
                onClick={() => setActive((a) => Math.max(1, a - 1))}
              >
                Back
              </button>
              <button type="submit" className="onboard-next">
                Save and continue
              </button>
            </div>
          </form>
        </div>

        <div className="onboard-progress">
          {STEPS.length - active + 1} steps left to complete
        </div>
      </div>
    </div>
  );
}
