"use client";

import { useState } from "react";
import { Menu, User, Building2, Bell, Shield, Eye, EyeOff, Check } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import SideDrawer from "@/components/SideDrawer";

type Tab = "profile" | "bank" | "notifications" | "security";

const TABS: { label: string; value: Tab; icon: React.ElementType }[] = [
  { label: "Profile",       value: "profile",       icon: User      },
  { label: "Bank Account",  value: "bank",           icon: Building2 },
  { label: "Notifications", value: "notifications",  icon: Bell      },
  { label: "Security",      value: "security",       icon: Shield    },
];

const cardShadow = "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]";
const inputCls = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink-black placeholder:text-ink-muted focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition";
const readonlyCls = "w-full rounded-xl border border-line bg-[#F6F5F3] px-3.5 py-2.5 text-sm text-ink-muted cursor-not-allowed";

function FieldGroup({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-body" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={["relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/30", checked ? "bg-brand-orange" : "bg-line"].join(" ")}
    >
      <span className={["pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0"].join(" ")} />
    </button>
  );
}

function ProfileTab() {
  const [form, setForm] = useState({ firstName: "Annbel", lastName: "Okon", email: "annbel.okon@example.com", university: "University of Uyo", department: "Computer Science" });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className={["rounded-2xl bg-white", cardShadow].join(" ")}>
      {/* Profile header */}
      <div className="flex flex-col items-center border-b border-line px-6 py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-xl font-bold text-white">
          AO
        </span>
        <p className="mt-3 text-base font-semibold text-ink-black">{form.firstName} {form.lastName}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{form.university}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldGroup label="First Name" id="firstName">
            <input id="firstName" type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={inputCls} />
          </FieldGroup>
          <FieldGroup label="Last Name" id="lastName">
            <input id="lastName" type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={inputCls} />
          </FieldGroup>
        </div>
        <FieldGroup label="Email Address" id="email">
          <input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
        </FieldGroup>
        <FieldGroup label="University" id="university">
          <input id="university" type="text" value={form.university} onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))} className={inputCls} />
        </FieldGroup>
        <FieldGroup label="Department" id="department">
          <input id="department" type="text" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className={inputCls} />
        </FieldGroup>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-orange-hover">
            {saved ? <><Check size={14} aria-hidden="true" />Saved</> : "Save Changes"}
          </button>
          {saved && <span className="text-xs text-emerald-600">Changes saved successfully.</span>}
        </div>
      </form>
    </div>
  );
}

function BankTab() {
  const status = "approved" as "pending" | "approved" | "rejected";
  const STATUS_CFG = {
    pending:  { label: "Pending",  cls: "bg-amber-50 text-amber-700"   },
    approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-600"        },
  };
  const cfg = STATUS_CFG[status];

  return (
    <div className={["rounded-2xl bg-white", cardShadow].join(" ")}>
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-ink-black">Bank Account</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Your payout account details.</p>
        </div>
        <span className={["rounded-full px-3 py-1 text-xs font-semibold", cfg.cls].join(" ")}>{cfg.label}</span>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5 p-6">
        <FieldGroup label="Bank Name" id="bankName">
          <input id="bankName" type="text" defaultValue="Wema Bank" className={inputCls} />
        </FieldGroup>
        <FieldGroup label="Account Number" id="accountNumber">
          <input id="accountNumber" type="text" defaultValue="0123456789" className={inputCls} />
        </FieldGroup>
        <FieldGroup label="Account Name" id="accountName">
          <input id="accountName" type="text" defaultValue="ANNBEL OKON" readOnly className={readonlyCls} />
          <p className="mt-1 text-xs text-ink-muted">Auto-resolved from your account number.</p>
        </FieldGroup>
        <div className="pt-1">
          <button type="submit" className="rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-orange-hover">
            {status === "rejected" ? "Resubmit Details" : "Update Account"}
          </button>
        </div>
        <p className="border-t border-line pt-4 text-xs text-ink-muted">
          Payments are processed and settled by Flutterwave — a CBN-licensed payment service provider.
        </p>
      </form>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({ email: true, sms: false, payments: true });
  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "email",    label: "Email notifications", desc: "Receive payment confirmations and collection summaries by email." },
    { key: "sms",      label: "SMS reminders",       desc: "Send automated SMS reminders to payers who have not paid." },
    { key: "payments", label: "Payment alerts",      desc: "Get notified instantly when a payment is received on any collection." },
  ];

  return (
    <div className={["rounded-2xl bg-white", cardShadow].join(" ")}>
      <div className="border-b border-line px-6 py-5">
        <h2 className="text-base font-semibold text-ink-black">Notifications</h2>
        <p className="mt-0.5 text-sm text-ink-muted">Choose how and when you want to be notified.</p>
      </div>
      <ul className="divide-y divide-line px-6">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-6 py-5">
            <div>
              <p className="text-sm font-semibold text-ink-black">{item.label}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{item.desc}</p>
            </div>
            <Toggle checked={prefs[item.key]} onChange={(v) => setPrefs((p) => ({ ...p, [item.key]: v }))} label={item.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SecurityTab() {
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const fields: { key: keyof typeof show; id: string; label: string; placeholder: string }[] = [
    { key: "current", id: "currentPw",  label: "Current Password",     placeholder: "Enter current password" },
    { key: "next",    id: "newPw",      label: "New Password",         placeholder: "At least 8 characters"  },
    { key: "confirm", id: "confirmPw",  label: "Confirm New Password", placeholder: "Repeat new password"    },
  ];

  return (
    <div className="space-y-5">
      <div className={["rounded-2xl bg-white", cardShadow].join(" ")}>
        <div className="border-b border-line px-6 py-5">
          <h2 className="text-base font-semibold text-ink-black">Change Password</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Use a strong password you do not use elsewhere.</p>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5 p-6 sm:max-w-sm">
          {fields.map((f) => (
            <FieldGroup key={f.key} label={f.label} id={f.id}>
              <div className="relative">
                <input id={f.id} type={show[f.key] ? "text" : "password"} placeholder={f.placeholder} className={inputCls + " pr-10"} />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink-body"
                  aria-label={show[f.key] ? "Hide" : "Show"}
                >
                  {show[f.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FieldGroup>
          ))}
          <div className="pt-1">
            <button type="submit" className="rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-orange-hover">
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Security tip */}
      <div className="rounded-2xl border-l-4 border-brand-orange/40 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="text-sm font-semibold text-ink-black">Security tip</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          Use a password manager to generate and store unique passwords. Enable two-factor authentication on your email account for maximum security.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="min-h-screen bg-[#F6F5F3] font-sans text-ink">
      <DesktopSidebar />
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} userName="Annbel Okon" university="University of Uyo" initials="AO" />

      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-ink-body hover:bg-line-soft">
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold text-ink-black">Settings</span>
          <div className="w-8" />
        </header>

        {/* Desktop header */}
        <header className="hidden h-16 items-center border-b border-line bg-white px-8 lg:flex">
          <div>
            <h1 className="text-base font-semibold text-ink-black">Settings</h1>
            <p className="text-xs text-ink-muted">Manage your account preferences.</p>
          </div>
        </header>

        <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">
          {/* Segmented tab control */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[#F0EFED] p-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-white text-ink-black shadow-sm"
                      : "text-ink-muted hover:text-ink-body",
                  ].join(" ")}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "profile"       && <ProfileTab />}
          {activeTab === "bank"          && <BankTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security"      && <SecurityTab />}
        </main>
      </div>
    </div>
  );
}
