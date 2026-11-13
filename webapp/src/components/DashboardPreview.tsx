import {
  Banknote,
  Bell,
  ChevronDown,
  ShieldCheck,
  HandCoins,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Undo2,
  Users,
} from "lucide-react";
import { apiConfig } from "@/lib/api";

/**
 * A pixel-for-pixel miniature of the signed-in dashboard, drawn at the real
 * app's own sizes (1280x800) and scaled down by the laptop around it.
 *
 * Everything here is a fixed size on purpose: the component is laid out inside
 * a 1280px canvas at any window width, so it must not change shape with the
 * viewport's breakpoints. Only the scaler around it gets smaller. Keep the
 * layout in step with `pages/Dashboard.tsx` and `components/AppShell.tsx`.
 * Figures are sample values, so the page never shows real merchant data.
 */

const NAV: Array<{ group: string; items: Array<{ label: string; icon: typeof LayoutDashboard }> }> = [
  { group: "Overview", items: [{ label: "Dashboard", icon: LayoutDashboard }] },
  {
    group: "Collect",
    items: [
      { label: "Collections", icon: HandCoins },
      { label: "Groups", icon: Layers },
      { label: "Payment links", icon: Link2 },
      { label: "Payers", icon: Users },
      { label: "Templates", icon: LayoutTemplate },
    ],
  },
  {
    group: "Money",
    items: [
      { label: "Transactions", icon: ReceiptText },
      { label: "Refunds", icon: Undo2 },
      { label: "Bank & settlement", icon: Banknote },
    ],
  },
  {
    group: "Workspace",
    items: [
      { label: "Notifications", icon: Bell },
      { label: "Settings", icon: SettingsIcon },
    ],
  },
];

const SUMMARY: Array<{
  title: string;
  subtitle: string;
  value: string;
  tone: string;
  icon: typeof Users;
}> = [
  { title: "Payers", subtitle: "68% of your target", value: "128 / 188", tone: "bg-[#dcd5f3]", icon: Users },
  { title: "Paid", subtitle: "Paid straight to your bank", value: "₦375,000", tone: "bg-[#d5e8c4]", icon: Banknote },
  { title: "Payments", subtitle: "2 awaiting confirmation", value: "10", tone: "bg-[#f9d3b0]", icon: ReceiptText },
  { title: "Workspace", subtitle: "Sample workspace", value: "Approved", tone: "bg-[#d3e9ee]", icon: ShieldCheck },
];

const RECENT = [
  { name: "Adaeze O.", collection: "CSC 311 handout", when: "just now", amount: "₦2,575", pending: false },
  { name: "Emeka N.", collection: "Dept levy", when: "4 min ago", amount: "₦7,792", pending: false },
  { name: "Fatima M.", collection: "CSC 311 handout", when: "12 min ago", amount: "₦2,575", pending: false },
  { name: "Ibrahim K.", collection: "Dept levy", when: "26 min ago", amount: "₦7,792", pending: true },
];

const COLLECTIONS = [
  { name: "CSC 311 handout", collected: "₦7,725", progress: 75, payers: "3 / 4 payers" },
  { name: "Dept levy", collected: "₦23,376", progress: 83, payers: "5 / 6 payers" },
];

const PAYERS = ["Adaeze O.", "Emeka N.", "Fatima M.", "Ibrahim K.", "Tunde A."];

/** The chart's area path, drawn in the same 720x220 space as `AreaChart`. */
const AREA =
  "M 10 188 C 60 180 96 128 146 140 C 196 152 232 84 282 96 C 336 108 366 46 420 58 C 474 70 512 34 566 44 C 616 53 668 22 710 16";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export default function DashboardPreview() {
  return (
    <div className="pointer-events-none flex h-[800px] w-[1280px] select-none overflow-hidden bg-cream text-ink">
      {/* ------------------------------------------------------------ sidebar */}
      <aside className="flex w-[256px] shrink-0 flex-col border-r border-line bg-white">
        <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
          <img
            src={apiConfig.withBase("/assets/images/jeneviv.png")}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-[9px] object-cover shadow-[0_1px_2px_rgba(18,16,14,0.12)]"
          />
          <span className="flex items-baseline gap-0.5">
            <span className="text-[19px] font-extrabold tracking-[-0.05em] text-ink">jeneviv</span>
            <span className="text-[21px] leading-none text-brand">.</span>
          </span>
        </div>

        <div className="mx-3 mb-5 rounded-[16px] bg-cream p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">
              SW
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">Sample workspace</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#d5e8c4] px-2 py-0.5 text-[10.5px] font-semibold text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                Approved
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-hidden px-3 pb-2">
          {NAV.map((section) => (
            <div key={section.group} className="mb-5">
              <p className="px-2.5 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.label === "Dashboard";
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <span
                        className={`flex items-center gap-3 rounded-[12px] px-2.5 py-2 text-[13.5px] font-medium ${
                          active ? "bg-ink text-cream" : "text-ink-soft"
                        }`}
                      >
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] ${
                            active ? "bg-white/12 text-cream" : "bg-cream text-ink-muted"
                          }`}
                        >
                          <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* --------------------------------------------------------------- app */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex h-[68px] shrink-0 items-center gap-3 bg-cream/85 px-8">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">Workspace</p>
            <p className="mt-0.5 truncate text-[16px] font-bold tracking-tight text-ink">Dashboard</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d5e8c4] px-3 py-1.5 text-[11.5px] font-semibold text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
              Live
            </span>

            <span className="relative grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-white text-ink-soft">
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                2
              </span>
            </span>

            <span className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-white py-1 pl-1 pr-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-ink text-[11px] font-bold text-cream">
                IO
              </span>
              <span className="max-w-[120px] truncate text-[12.5px] font-semibold">Ifeanyi O.</span>
              <ChevronDown size={14} className="text-ink-muted" aria-hidden="true" />
            </span>
          </div>
        </header>

        {/* page */}
        <main className="flex min-h-0 flex-1 flex-col px-8 pt-6">
          <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col">
            {/* greeting - matches the dashboard header exactly */}
            <header className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  Sample workspace · Wednesday, 12 November
                </p>
                <h1 className="mt-1 text-[28px] font-bold tracking-tight">Good to see you, Ifeanyi</h1>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink bg-white">
                <Plus size={17} aria-hidden="true" />
              </span>
            </header>

            {/* Main content grid - matching the dashboard's two-column layout */}
            <div className="mt-5 grid min-h-0 flex-1 grid-cols-[1fr_420px] gap-5">
              {/* Left column - headline, metrics and chart */}
              <div className="flex min-h-0 flex-col gap-5">
                <section className="shrink-0 rounded-[20px] bg-[#101010] px-6 py-6 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[18px] font-semibold tracking-tight">Collected</p>
                      <p className="mt-0.5 text-[13px] text-white/65">12 successful payments in this range</p>
                    </div>
                    <p className="tabular text-right text-[32px] font-bold">₦412,500</p>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  {SUMMARY.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className={`flex min-h-[140px] flex-col justify-between overflow-hidden rounded-[22px] border border-ink/10 p-5 text-ink shadow-[0_1px_2px_rgba(16,16,16,0.04)] ${item.tone}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-60">
                            {item.title}
                          </p>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/60">
                            <Icon size={15} aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="tabular text-[30px] font-extrabold leading-none tracking-[-0.03em]">
                            {item.value}
                          </p>
                          <p className="mt-2 truncate text-[12px] opacity-65">{item.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex min-h-0 flex-1 flex-col rounded-card border border-line bg-white p-5 shadow-card">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[15px] font-medium tracking-tight text-ink">Collections over time</h2>
                      <p className="mt-0.5 text-[13px] text-ink-muted">Successful payments per period</p>
                    </div>
                    <span className="inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-[12px] font-semibold text-ink-soft">
                      <SlidersHorizontal size={13} aria-hidden="true" />
                      Last 30 days
                    </span>
                  </div>

                  <div className="flex min-h-0 flex-1 items-end">
                    <svg
                      viewBox="0 0 720 220"
                      preserveAspectRatio="none"
                      className="h-full max-h-[220px] w-full"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#101010" stopOpacity="0.14" />
                          <stop offset="100%" stopColor="#101010" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                        <line
                          key={ratio}
                          x1={0}
                          x2={720}
                          y1={220 * ratio}
                          y2={220 * ratio}
                          stroke="#efefef"
                          strokeWidth={1}
                        />
                      ))}
                      <path d={`${AREA} L 710 220 L 10 220 Z`} fill="url(#previewFill)" />
                      <path d={AREA} fill="none" stroke="#101010" strokeWidth={2.4} strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="mt-4 flex items-center gap-2.5 border-t border-line-soft pt-4">
                    <div className="flex -space-x-1.5">
                      {PAYERS.map((name) => (
                        <span
                          key={name}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand-peach text-3xs font-bold text-[#79300f]"
                        >
                          {initials(name)}
                        </span>
                      ))}
                    </div>
                    <p className="text-[12px] text-ink-muted">{PAYERS.length} payers</p>
                  </div>
                </div>
              </div>

              {/* Right column - quick action, recent payments, collections */}
              <div className="flex min-h-0 flex-col gap-5">
                <span className="flex shrink-0 items-center justify-center gap-2 rounded-[18px] border border-transparent bg-ink py-3.5 text-[13px] font-semibold text-cream">
                  <Plus size={15} aria-hidden="true" /> New collection
                </span>

                <section>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-[15px] font-medium tracking-tight text-ink">Recent payments</h2>
                    <span className="text-[12.5px] font-semibold text-brand">View all</span>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                    <ul className="divide-y divide-line-soft">
                      {RECENT.map((row) => (
                        <li key={row.name} className="flex items-center justify-between gap-3 px-5 py-3.5">
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-semibold">{row.name}</p>
                            <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                              {row.collection} · {row.when}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="tabular text-[13.5px] font-bold">{row.amount}</p>
                            <div className="mt-1 flex justify-end">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-ink ${
                                  row.pending ? "bg-[#fff3dd]" : "bg-[#d5e8c4]"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                {row.pending ? "Pending" : "Successful"}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-[15px] font-medium tracking-tight text-ink">Collections</h2>
                    <span className="text-[12.5px] font-semibold text-brand">All</span>
                  </div>

                  <div className="mt-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
                    <ul className="space-y-4">
                      {COLLECTIONS.map((collection) => (
                        <li key={collection.name}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-[13.5px] font-semibold">{collection.name}</span>
                            <span className="tabular text-[12.5px] font-semibold">{collection.collected}</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${collection.progress}%` }}
                            />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <p className="font-mono text-3xs text-ink-muted">{collection.payers}</p>
                            <span className="inline-flex items-center rounded-full bg-[#d5e8c4] px-2 py-0.5 text-[10.5px] font-semibold text-ink">
                              Accepting
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
