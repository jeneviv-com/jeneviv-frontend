import { Bell, ChevronRight, Plus } from "lucide-react";

/**
 * The laptop on the marketing site shows a miniature of the real dashboard.
 * This is that miniature, kept in one place so the auth pages and the landing
 * page can't drift from the product. Its sections mirror the live dashboard:
 * sidebar groups, the collection prompt, the three headline numbers, the
 * weekly chart and the recent payers.
 */

const NAV: Array<{ group: string; items: string[] }> = [
  { group: "Overview", items: ["Dashboard"] },
  { group: "Collect", items: ["Collections", "Payment links", "Payers", "Templates"] },
  { group: "Money", items: ["Transactions", "Refunds", "Bank & settlement"] },
  { group: "Workspace", items: ["Notifications", "Settings"] },
];

const PEOPLE = ["AO", "EN", "FM", "IK", "TJ"];

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
        {/* sidebar */}
        <aside className="flex min-h-0 flex-col gap-0.5 overflow-hidden border-r border-line-soft bg-[#fbfaf8] px-2 py-2.5">
          {NAV.map((section) => (
            <div key={section.group} className="mb-0.5">
              <p className="px-1.5 pb-0.5 pt-1 text-[5.5px] uppercase tracking-[0.14em] text-ink-faint">
                {section.group}
              </p>
              {section.items.map((item, index) => {
                const active = section.group === "Overview";
                return (
                  <span
                    key={item}
                    className={`flex items-center gap-1.5 rounded-[4px] px-1.5 py-[4px] text-[7.5px] ${
                      active
                        ? "bg-brand-soft font-semibold text-brand-dark"
                        : "text-[#787878]"
                    }`}
                  >
                    <i
                      className={`h-[4px] w-[4px] shrink-0 rounded-[1px] ${
                        active ? "bg-brand" : "bg-current opacity-50"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item}</span>
                    {index === 0 && active ? (
                      <span className="ml-auto h-[3px] w-[3px] rounded-full bg-brand" />
                    ) : null}
                  </span>
                );
              })}
            </div>
          ))}
        </aside>

        {/* main */}
        <div className="flex min-h-0 min-w-0 flex-col gap-1.5 p-2.5">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[5.5px] uppercase tracking-[0.14em] text-ink-faint">
                Workspace · Monday
              </p>
              <p className="truncate text-[9.5px] font-bold leading-tight">
                Good to see you, Ifeanyi
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="grid h-[13px] w-[13px] place-items-center rounded-[3px] border border-line text-ink-muted">
                <Bell size={6} />
              </span>
              <span className="flex items-center gap-0.5 rounded-[3px] bg-ink px-1.5 py-[3px] text-[6px] font-semibold text-white">
                <Plus size={5} /> New
              </span>
            </div>
          </div>

          {/* collection prompt — same dark banner as the live dashboard */}
          <div className="flex shrink-0 items-center justify-between gap-2 rounded-[6px] bg-[#101010] px-2.5 py-2 text-white">
            <div className="min-w-0">
              <p className="text-[8.5px] font-bold leading-tight">
                Start a collection today
              </p>
              <p className="mt-0.5 text-[6px] text-white/70">
                One link. Verified payments. No chasing receipts.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 rounded-[3px] bg-white px-1.5 py-[3px] text-[5.8px] font-bold text-ink">
              New collection
              <ChevronRight size={5} />
            </span>
          </div>

          {/* three headline numbers */}
          <div className="grid shrink-0 grid-cols-3 gap-1.5">
            {[
              { label: "Collected", value: "₦412,500", hint: "+18% this week", up: true },
              { label: "Payers", value: "136 / 200", hint: "68% complete", up: false },
              { label: "Settled", value: "₦389,000", hint: "2 payouts today", up: true },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[5px] border border-[#efeeec] bg-white px-1.5 py-1.5"
              >
                <p className="text-[5.5px] text-ink-faint">{kpi.label}</p>
                <p className="mt-0.5 text-[10px] font-extrabold leading-none tracking-[-0.04em] tabular">
                  {kpi.value}
                </p>
                <p
                  className={`mt-1 text-[5.2px] ${
                    kpi.up ? "text-success" : "text-ink-muted"
                  }`}
                >
                  {kpi.hint}
                </p>
              </div>
            ))}
          </div>

          {/* weekly chart */}
          <div className="flex min-h-0 flex-1 flex-col rounded-[6px] border border-[#efeeec] px-2 pb-1 pt-1.5">
            <div className="flex shrink-0 items-center justify-between">
              <p className="text-[6.5px] font-semibold">Collections this week</p>
              <p className="text-[5.5px] text-ink-faint">Last 7 days</p>
            </div>
            <svg
              viewBox="0 0 320 92"
              preserveAspectRatio="none"
              className="min-h-0 w-full flex-1"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#101010" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#101010" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 72 C26 70 38 48 62 53 C90 58 104 30 132 38 C164 47 178 18 208 25 C238 32 264 14 320 10 L320 92 L0 92 Z"
                fill="url(#previewFill)"
              />
              <path
                d="M0 72 C26 70 38 48 62 53 C90 58 104 30 132 38 C164 47 178 18 208 25 C238 32 264 14 320 10"
                fill="none"
                stroke="#101010"
                strokeWidth="2"
              />
              <path
                d="M0 80 C30 78 48 68 74 72 C104 76 126 58 154 62 C184 66 210 48 238 52 C264 55 286 44 320 42"
                fill="none"
                stroke="#e8d9cd"
                strokeWidth="1.4"
                strokeDasharray="4 4"
              />
            </svg>
            <div className="flex shrink-0 justify-between pt-0.5 text-[5.2px] text-ink-faint">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>

          {/* recent payers */}
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            {PEOPLE.map((person, index) => (
              <span
                key={person}
                className={`grid h-[12px] w-[12px] place-items-center rounded-full border-[1.5px] border-white text-[4.5px] font-bold ${
                  index % 2 === 0
                    ? "bg-brand-peach text-[#79300f]"
                    : "bg-[#f2d9c5] text-[#7d4a2b]"
                }`}
              >
                {person}
              </span>
            ))}
            <span className="grid h-[12px] min-w-[12px] place-items-center rounded-full border-[1.5px] border-white bg-[#12100e] px-1 text-[4.5px] font-bold text-white">
              +131
            </span>
            <span className="ml-1 text-[5.2px] text-ink-faint">
              paid this week
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
