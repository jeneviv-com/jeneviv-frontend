import { Bell, Plus, ShieldCheck } from "lucide-react";

/**
 * The laptop on the marketing site and the auth pages shows a miniature of the
 * real dashboard. Keep this in step with the live app: the sidebar groups match
 * AppShell, and the layout matches Dashboard. Figures are sample values, so the
 * page never shows real merchant data.
 */

const NAV: Array<{ group: string; items: string[] }> = [
  { group: "Overview", items: ["Dashboard"] },
  { group: "Collect", items: ["Collections", "Groups", "Payment links", "Payers", "Templates"] },
  { group: "Money", items: ["Transactions", "Refunds", "Bank & settlement"] },
  { group: "Workspace", items: ["Notifications", "Settings"] },
];

/* Muted palette, the same values as TONE_CARD in the app. */
const TONE = {
  ink: "bg-[#101010] text-white",
  lavender: "bg-[#dcd5f3] text-[#101010]",
  peach: "bg-[#f9d3b0] text-[#101010]",
  mint: "bg-[#d5e8c4] text-[#101010]",
  aqua: "bg-[#d3e9ee] text-[#101010]",
} as const;

const SUMMARY: Array<{ label: string; value: string; hint: string; tone: keyof typeof TONE }> = [
  { label: "Payers", value: "136", hint: "Successful payments", tone: "lavender" },
  { label: "Settled", value: "₦389,000", hint: "Paid straight to your bank", tone: "mint" },
  { label: "Payments", value: "12", hint: "2 awaiting confirmation", tone: "peach" },
  { label: "Workspace", value: "Approved", hint: "Sample workspace", tone: "aqua" },
];

const RECENT = [
  { name: "Adaeze O.", detail: "CSC 311 handout · just now", amount: "₦2,575" },
  { name: "Emeka N.", detail: "Dept levy · 4 min ago", amount: "₦7,792" },
  { name: "Fatima M.", detail: "CSC 311 handout · 12 min ago", amount: "₦2,575" },
];

export default function DashboardPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-white text-ink">
      {/* browser chrome */}
      <div className="flex h-[26px] shrink-0 items-center gap-1.5 border-b border-line-soft bg-[#fcfcfc] px-3">
        <span className="text-[9px] font-extrabold tracking-[-0.05em]">
          jeneviv<span className="text-brand">.</span>
        </span>
        <span className="ml-2 h-[5px] w-[5px] rounded-full bg-[#dedede]" />
        <span className="h-[5px] w-[5px] rounded-full bg-[#dedede]" />
        <span className="h-[5px] w-[5px] rounded-full bg-[#ffcfbf]" />
        <span className="ml-auto h-[9px] w-[38px] rounded-[3px] bg-cream-deep" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[98px_1fr]">
        {/* sidebar: the same workspace card, sections and active pill as the app */}
        <aside className="flex min-h-0 flex-col gap-0.5 overflow-hidden border-r border-line-soft bg-white px-2 py-2.5">
          <div className="mb-2 rounded-[7px] bg-cream p-1.5">
            <p className="truncate text-[6.5px] font-semibold">Sample workspace</p>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#d5e8c4] px-1.5 py-[1px] text-[5px] font-semibold">
              <span className="h-[3px] w-[3px] rounded-full bg-ink" />
              Approved
            </span>
          </div>

          {NAV.map((section) => (
            <div key={section.group} className="mb-0.5">
              <p className="px-1.5 pb-0.5 pt-1 font-mono text-[5px] uppercase tracking-[0.14em] text-ink-faint">
                {section.group}
              </p>
              {section.items.map((item) => {
                const active = item === "Dashboard";
                return (
                  <span
                    key={item}
                    className={`flex items-center gap-1.5 rounded-[5px] px-1.5 py-[4px] text-[7px] ${
                      active ? "bg-ink font-semibold text-cream" : "text-[#787878]"
                    }`}
                  >
                    <i
                      className={`h-[4px] w-[4px] shrink-0 rounded-[1px] ${active ? "bg-cream" : "bg-current opacity-50"}`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item}</span>
                  </span>
                );
              })}
            </div>
          ))}
        </aside>

        {/* main */}
        <div className="flex min-h-0 min-w-0 flex-col gap-1.5 p-2.5">
          {/* top bar: title, bell and account, like the app */}
          <div className="flex shrink-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[5px] uppercase tracking-[0.14em] text-ink-faint">Workspace</p>
              <p className="truncate text-[9px] font-bold leading-tight">Good to see you, Ifeanyi</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="grid h-[13px] w-[13px] place-items-center rounded-[4px] border border-line text-ink-muted">
                <Bell size={6} />
              </span>
              <span className="grid h-[13px] w-[13px] place-items-center rounded-[4px] bg-ink text-[6px] font-bold text-cream">
                I
              </span>
            </div>
          </div>

          {/* dark headline */}
          <div className="shrink-0 rounded-[7px] bg-ink px-2.5 py-2 text-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[8px] font-semibold">Collected</p>
                <p className="mt-0.5 text-[5.5px] text-white/65">12 successful payments this range</p>
              </div>
              <p className="text-[12px] font-bold tabular">₦412,500</p>
            </div>
          </div>

          {/* stacked summary cards, muted palette */}
          <div className="shrink-0">
            {SUMMARY.map((item, index) => (
              <div
                key={item.label}
                className={`relative flex items-center justify-between gap-2 rounded-[8px] border border-ink/20 px-2 py-1.5 ${TONE[item.tone]} ${
                  index === 0 ? "" : "-mt-1.5"
                }`}
                style={{ zIndex: index + 1 }}
              >
                <div className="min-w-0">
                  <p className="text-[7px] font-semibold">{item.label}</p>
                  <p className="truncate text-[5px] opacity-70">{item.hint}</p>
                </div>
                <p className="shrink-0 text-[9px] font-bold tabular">{item.value}</p>
              </div>
            ))}
          </div>

          {/* new collection, full width */}
          <div className="flex shrink-0 items-center justify-center gap-1 rounded-[6px] bg-ink py-1.5 text-[6.5px] font-semibold text-cream">
            <Plus size={6} /> New collection
          </div>

          {/* chart */}
          <div className="flex min-h-0 flex-1 flex-col rounded-[7px] border border-line px-2 pb-1 pt-1.5">
            <div className="flex shrink-0 items-center justify-between">
              <p className="text-[6.5px] font-semibold">Collections over time</p>
              <p className="text-[5.5px] text-ink-faint">Last 30 days</p>
            </div>
            <svg viewBox="0 0 320 80" preserveAspectRatio="none" className="min-h-0 w-full flex-1" aria-hidden="true">
              <defs>
                <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#101010" stopOpacity="0.14" />
                  <stop offset="1" stopColor="#101010" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 64 C26 60 40 40 64 46 C92 52 106 24 134 32 C166 40 180 14 210 20 C240 26 266 10 320 6 L320 80 L0 80 Z"
                fill="url(#previewFill)"
              />
              <path
                d="M0 64 C26 60 40 40 64 46 C92 52 106 24 134 32 C166 40 180 14 210 20 C240 26 266 10 320 6"
                fill="none"
                stroke="#101010"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* recent payments */}
          <div className="shrink-0 rounded-[7px] border border-line px-2 py-1.5">
            <p className="mb-1 text-[6.5px] font-semibold">Recent payments</p>
            {RECENT.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-2 border-t border-line-soft py-1 first:border-t-0">
                <div className="min-w-0">
                  <p className="truncate text-[6px] font-semibold">{row.name}</p>
                  <p className="truncate text-[5px] text-ink-muted">{row.detail}</p>
                </div>
                <p className="shrink-0 text-[6px] font-bold tabular">{row.amount}</p>
              </div>
            ))}
          </div>

          {/* settlement note, like the app */}
          <p className="flex shrink-0 items-center gap-1 text-[5px] text-ink-faint">
            <ShieldCheck size={6} /> Settled straight to your bank. Never held by Jeneviv.
          </p>
        </div>
      </div>
    </div>
  );
}