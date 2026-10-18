import Link from "next/link";
import SiteNav from "@/components/marketing/SiteNav";
import Reveal from "@/components/marketing/Reveal";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Check = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="m3 8.5 3.2 3L13 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Shield = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path
      d="M10 2.5 16 5v4.4c0 3.6-2.4 6.7-6 8.1-3.6-1.4-6-4.5-6-8.1V5l6-2.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="m7.4 9.8 1.8 1.8 3.6-3.7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const USE_CASES = [
  {
    tag: "Universities",
    title: "Course reps & departments",
    body: "Handouts, manuals, lab fees, departmental levies. Every student on a list, every payment matched to a matric number.",
    stat: "₦340,000",
    detail: "collected · 136 of 200",
    progress: 68,
  },
  {
    tag: "PTAs & schools",
    title: "Termly levies",
    body: "No more envelopes, no more tellers, no more “I paid Aunty Ngozi”. Parents pay by transfer and the school gets one clean report.",
    stat: "₦1.28M",
    detail: "collected · 214 of 240",
    progress: 89,
  },
  {
    tag: "Cooperatives",
    title: "Monthly thrift",
    body: "Members pay from any bank. Contributions are matched to the member record automatically, month after month.",
    stat: "₦2.3M",
    detail: "collected · 88% of target",
    progress: 88,
  },
  {
    tag: "Associations",
    title: "Dues & building funds",
    body: "Annual dues, event levies, project contributions — with an auditable list you can hand to any committee.",
    stat: "₦615,000",
    detail: "collected · 52% of target",
    progress: 52,
  },
];

const SECURITY = [
  {
    title: "Regulated payment rails",
    body: "Collections are processed through Flutterwave, a CBN-licensed payment service provider — not a wallet we invented.",
  },
  {
    title: "We never see card data",
    body: "Jeneviv does not store or transmit card numbers. Card handling stays with PCI-DSS Level 1 certified infrastructure.",
  },
  {
    title: "Webhook-verified payments",
    body: "A payment is only marked paid when the gateway confirms it cryptographically. Not from a screenshot. Not from a narration.",
  },
  {
    title: "NDPA-aligned data handling",
    body: "We collect the minimum needed to identify a payer, encrypt it at rest, and never sell it. Nigeria Data Protection Act, 2023.",
  },
  {
    title: "Two-factor coordinator access",
    body: "Email verification protects coordinator accounts, so one leaked password cannot expose a group's money or payer list.",
  },
  {
    title: "Continuous reconciliation",
    body: "A background job re-checks the gateway every 15 minutes, catching transfers that left a payer's bank but arrived late.",
  },
];

const QUOTES = [
  {
    quote:
      "I stopped keeping a list in my notes app. The report is just there when the department asks for it — names, matric numbers, dates, references.",
    name: "Blessing E.",
    role: "Course rep, UNIUYO",
    initials: "BE",
  },
  {
    quote:
      "We collected PTA levies for 214 families in one weekend. Last year it took three weeks and I still had to call people one by one.",
    name: "Mrs. A. Okafor",
    role: "PTA secretary, Lagos",
    initials: "AO",
  },
  {
    quote:
      "Our members transfer from different banks. Jeneviv matches every single one without me touching a spreadsheet.",
    name: "Tunde A.",
    role: "Cooperative secretary, Ibadan",
    initials: "TA",
  },
];

const FAQ = [
  {
    q: "How does Jeneviv know a payer has actually paid?",
    a: "Every collection gets its own payment account. When money lands, the gateway sends a signed webhook to Jeneviv. We verify the signature, match the transfer to the payer record, and mark it paid. If a webhook is delayed, a reconciliation job checks again every 15 minutes.",
  },
  {
    q: "Do the people paying need to download an app?",
    a: "No. Payers open a link in any browser, enter the details your collection asks for, and transfer the exact amount to the account shown. Their receipt arrives by email, and the coordinator's dashboard updates in real time.",
  },
  {
    q: "What does it cost?",
    a: "There is no monthly fee and no setup fee. Jeneviv charges 1.5% + ₦100 per successful payment, capped at ₦2,000. The fee is deducted from the collection — payers are never charged extra.",
  },
  {
    q: "When does the money reach my bank account?",
    a: "Settlements run twice daily, including weekends. You can also initiate a manual payout to any verified bank account you have added. Payout history and status are visible in the app.",
  },
  {
    q: "Can more than one person manage a collection?",
    a: "Yes. The coordinator who creates a collection owns it, and every payer, transaction, field and settlement is visible on one dashboard — so a treasurer, chairperson or lecturer can all work from the same verified report.",
  },
  {
    q: "What happens if a payer transfers the wrong amount?",
    a: "The payment still appears in your ledger with its reference. You can reconcile the transaction, refund it from the dashboard, or record it as a partial payment. Nothing disappears because it did not match exactly.",
  },
];

export default function LandingPage() {
  return (
    <div className="m-page">
      <SiteNav />
      <Reveal />

      {/* ---------------------------------------------------------------- hero */}
      <section className="m-hero" id="top">
        <div className="m-wrap">
          <div className="m-hero-grid">
            <div className="m-hero-copy">
              <span className="m-pill">
                <span className="m-pill-dot" />
                Built for Nigerian groups
              </span>
              <h1 className="m-h1">
                Group money,
                <br />
                <span className="accent">finally accounted for.</span>
              </h1>
              <p className="m-lede">
                Jeneviv turns one payment link into a live ledger — who has
                paid, who hasn&apos;t, and what actually hit your bank. For
                course reps, PTAs, cooperatives and associations.
              </p>
              <div className="m-hero-cta">
                <a href={`${appUrl}/signup`} className="m-btn m-btn-primary">
                  Create a free collection <Arrow />
                </a>
                <a href="#how-it-works" className="m-btn m-btn-outline">
                  See how it works
                </a>
              </div>
              <p className="m-hero-note">
                <Check />
                Free to start · No card required · Set up in under 3 minutes
              </p>
            </div>

            <div className="m-hero-visual" aria-hidden="true">
              <div className="m-laptop">
                <div className="m-laptop-lid">
                  <div className="m-laptop-screen">
                    <div className="m-lap-bar">
                      <b>jeneviv.</b>
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="m-lap-body">
                      <aside className="m-lap-side">
                        <small>Workspace</small>
                        <span className="on">
                          <i /> Dashboard
                        </span>
                        <span>
                          <i /> Collections
                        </span>
                        <span>
                          <i /> Payers
                        </span>
                        <span>
                          <i /> Transactions
                        </span>
                        <small>Money</small>
                        <span>
                          <i /> Payouts
                        </span>
                        <span>
                          <i /> Refunds
                        </span>
                        <span>
                          <i /> Templates
                        </span>
                        <small>Manage</small>
                        <span>
                          <i /> Settings
                        </span>
                      </aside>
                      <div className="m-lap-main">
                        <div className="m-lap-promo">
                          <div>
                            <h5>Start a collection today</h5>
                            <p>
                              One link. Verified payments. No chasing receipts.
                            </p>
                          </div>
                          <span>New collection</span>
                        </div>
                        <div className="m-lap-kpis">
                          <div className="m-lap-kpi">
                            <small>Collected</small>
                            <b>₦412,500</b>
                            <em>+18% this week</em>
                          </div>
                          <div className="m-lap-kpi">
                            <small>Payers</small>
                            <b>136 / 200</b>
                            <em>68% complete</em>
                          </div>
                          <div className="m-lap-kpi">
                            <small>Settled</small>
                            <b>₦389,000</b>
                            <em>2 payouts today</em>
                          </div>
                        </div>
                        <div className="m-lap-chart">
                          <div className="m-lap-chart-top">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                          </div>
                          <svg viewBox="0 0 320 110" preserveAspectRatio="none">
                            <defs>
                              <linearGradient
                                id="heroFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0"
                                  stopColor="#ff4a00"
                                  stopOpacity="0.22"
                                />
                                <stop
                                  offset="1"
                                  stopColor="#ff4a00"
                                  stopOpacity="0"
                                />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0 88 C28 84 40 60 66 64 C96 69 112 38 142 46 C176 55 190 22 222 30 C252 38 276 18 320 14 L320 110 L0 110 Z"
                              fill="url(#heroFill)"
                            />
                            <path
                              d="M0 88 C28 84 40 60 66 64 C96 69 112 38 142 46 C176 55 190 22 222 30 C252 38 276 18 320 14"
                              fill="none"
                              stroke="#ff4a00"
                              strokeWidth="2"
                            />
                            <path
                              d="M0 96 C34 94 54 82 84 86 C118 90 142 70 172 74 C204 78 232 58 262 62 C288 65 304 54 320 52"
                              fill="none"
                              stroke="#e8d9cd"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                            />
                          </svg>
                        </div>
                        <div className="m-lap-people">
                          <span>AO</span>
                          <span>EN</span>
                          <span>FM</span>
                          <span>IK</span>
                          <span>TJ</span>
                          <span>+131</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="m-laptop-base" />
              </div>

              <div className="m-float m-float-1">
                <span className="m-float-check">
                  <Check />
                </span>
                <div>
                  <small>Payment confirmed</small>
                  <b>₦2,500 · Ada O.</b>
                </div>
              </div>
              <div className="m-float m-float-2">
                <span className="m-float-ring">
                  <span>68%</span>
                </span>
                <div>
                  <small>CSC 311 handout</small>
                  <b>136 of 200 paid</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="m-wrap">
          <div className="m-logos">
            <p className="m-logos-label">Trusted by coordinators at</p>
            <div className="m-logo-row">
              <span className="m-logo-mark">
                <i /> FOCOSA
              </span>
              <span className="m-logo-mark serif">NACOS</span>
              <span className="m-logo-mark wide">University of Uyo</span>
              <span className="m-logo-mark">
                <i /> PTA Lagos
              </span>
              <span className="m-logo-mark serif">Greenfield Coop</span>
              <span className="m-logo-mark wide">Yaba Tech</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- maroon band */}
      <section className="m-maroon">
        <div className="m-maroon-inner">
          <svg
            className="m-maroon-art"
            viewBox="0 0 1200 420"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g fill="none" stroke="#ff4a00" strokeWidth="1" opacity="0.45">
              <path d="M-40 60 120 20l60 120-150 70z" />
              <path d="M980 40l140 60-60 120-120-40z" />
              <path d="M-30 300l160-40 40 120-180 40z" />
              <path d="M1010 260l130 40-40 100-120-30z" />
              <path d="M560 0v60M600 0v40M520 0v30" />
            </g>
          </svg>
          <h2>Every naira. Every payer. Accounted for.</h2>
          <p>
            No screenshots. No “I&apos;ve sent it”. No spreadsheet that nobody
            updates. Jeneviv verifies the transfer, matches it to the payer and
            writes it into a ledger you can defend.
          </p>
          <div className="m-btn-row">
            <a href={`${appUrl}/signup`} className="m-btn m-btn-light">
              Start collecting <Arrow />
            </a>
            <a href="#how-it-works" className="m-btn m-btn-outline" style={{ borderColor: "#7a4232", color: "#fff" }}>
              Take the product tour
            </a>
          </div>
          <p className="m-note">
            Works on every phone · No payer app · Funds settle to your bank
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- bento */}
      <section className="m-section" id="how-it-works">
        <div className="m-wrap">
          <div className="m-section-head reveal">
            <span className="m-eyebrow">The product</span>
            <h2 className="m-h2">The boring parts, handled.</h2>
            <p className="m-sub">
              Checking transfers, matching names, chasing receipts, updating
              spreads — the work that eats a coordinator&apos;s evening. It all
              happens on its own.
            </p>
          </div>

          <div className="m-bento">
            <article className="m-bento-card reveal">
              <span className="m-eyebrow">Share</span>
              <h3>A payment link that does the bookkeeping.</h3>
              <p>
                Name the collection, set the amount, choose what you need to
                know about each payer. Share one link in the group chat.
              </p>
              <div className="m-bento-art">
                <div className="m-mini-ui">
                  <div className="m-mini-label">
                    <span>Collection link</span>
                    <span>LIVE</span>
                  </div>
                  <div className="m-mini-link">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        d="M6.5 9.5 9.5 6.5M7 3.8l1-1a2.6 2.6 0 0 1 3.7 3.7l-1 1M9 12.2l-1 1a2.6 2.6 0 0 1-3.7-3.7l1-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>jeneviv.com/pay/CSC311</span>
                    <span className="m-mini-copy">Copy</span>
                  </div>
                  <div className="m-mini-amount">
                    <b>₦2,500</b>
                    <small>per payer</small>
                  </div>
                  <div className="m-mini-track">
                    <i style={{ width: "68%" }} />
                  </div>
                </div>
              </div>
            </article>

            <article className="m-bento-card reveal">
              <span className="m-eyebrow">Track</span>
              <h3>Know exactly who has paid.</h3>
              <p>
                Every payment is tied to a name, a student ID, a phone number —
                whatever your group uses. No more cross-checking narrations.
              </p>
              <div className="m-bento-art">
                <div className="m-mini-ui">
                  <div className="m-mini-label">
                    <span>Payers</span>
                    <span>136 of 200</span>
                  </div>
                  <div className="m-mini-rows">
                    <div className="m-mini-row">
                      <span className="m-mini-avatar">AO</span>
                      <div>
                        <b>Adaeze Okonkwo</b>
                        <small>20/ENG/001</small>
                      </div>
                      <span className="m-mini-tag">Paid</span>
                    </div>
                    <div className="m-mini-row">
                      <span className="m-mini-avatar">EN</span>
                      <div>
                        <b>Emeka Nwosu</b>
                        <small>20/ENG/004</small>
                      </div>
                      <span className="m-mini-tag">Paid</span>
                    </div>
                    <div className="m-mini-row">
                      <span className="m-mini-avatar">FM</span>
                      <div>
                        <b>Fatima Musa</b>
                        <small>20/ENG/007</small>
                      </div>
                      <span className="m-mini-tag pending">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="m-bento-card reveal" id="reconciliation">
              <span className="m-eyebrow">Reconcile</span>
              <h3>Matches that never fall through.</h3>
              <p>
                A transfer lands, the gateway confirms it, the payer is matched,
                the receipt goes out. If a webhook is late, reconciliation
                catches it within 15 minutes.
              </p>
              <div className="m-bento-art">
                <div className="m-mini-ui">
                  <div className="m-timeline">
                    <div className="m-timeline-item done">
                      <b>Transfer received</b>
                      <small>12:04:02 · ₦2,500.00</small>
                    </div>
                    <div className="m-timeline-item done">
                      <b>Payer matched</b>
                      <small>12:04:05 · 20/ENG/001</small>
                    </div>
                    <div className="m-timeline-item done">
                      <b>Receipt sent</b>
                      <small>12:04:09 · adaeze@…</small>
                    </div>
                    <div className="m-timeline-item">
                      <b>Included in 22:00 settlement</b>
                      <small>Scheduled</small>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="m-bento-card reveal" id="settlement">
              <span className="m-eyebrow">Settle</span>
              <h3>Twice a day. Weekends included.</h3>
              <p>
                No waiting for the next business day. Collections settle to the
                bank account you verified — or you can trigger a payout
                yourself.
              </p>
              <div className="m-bento-art">
                <div className="m-mini-ui">
                  <div className="m-mini-label">
                    <span>Settlement</span>
                    <span>Today</span>
                  </div>
                  <div className="m-mini-rows">
                    <div className="m-mini-row">
                      <span className="m-mini-avatar">10</span>
                      <div>
                        <b>Morning payout</b>
                        <small>Wema ••2104</small>
                      </div>
                      <div style={{ marginLeft: "auto", fontWeight: 700 }}>
                        ₦184,500
                      </div>
                    </div>
                    <div className="m-mini-row">
                      <span className="m-mini-avatar">22</span>
                      <div>
                        <b>Evening payout</b>
                        <small>Wema ••2104</small>
                      </div>
                      <div style={{ marginLeft: "auto", fontWeight: 700 }}>
                        ₦96,300
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="m-bento-card wide reveal">
              <div>
                <span className="m-eyebrow">Report</span>
                <h3>Hand over a report, not the group chat.</h3>
                <p>
                  Filter by collection, status or payer. Export the verified
                  list as CSV or PDF — names, identifiers, amounts, dates and
                  transaction references, ready for the department, the
                  treasurer or the AGM.
                </p>
                <a
                  href={`${appUrl}/signup`}
                  className="m-link"
                  style={{ marginTop: 24 }}
                >
                  Create your first collection <Arrow />
                </a>
              </div>
              <div className="m-mini-ui">
                <div className="m-mini-label">
                  <span>CSC 311 · Handout</span>
                  <span>Export</span>
                </div>
                <div className="m-mini-rows">
                  {[
                    ["Adaeze Okonkwo", "20/ENG/001", "Paid"],
                    ["Emeka Nwosu", "20/ENG/004", "Paid"],
                    ["Fatima Musa", "20/ENG/007", "Paid"],
                    ["Ibrahim Kalu", "20/ENG/012", "Paid"],
                  ].map(([name, id, status]) => (
                    <div className="m-mini-row" key={id}>
                      <span className="m-mini-avatar">
                        {name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <b>{name}</b>
                        <small>{id}</small>
                      </div>
                      <span className="m-mini-tag">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ feature rows */}
      <section className="m-section tight" style={{ paddingTop: 0 }} id="collections">
        <div className="m-wrap">
          <div className="m-row reveal">
            <div className="m-row-copy">
              <span className="m-eyebrow">For coordinators</span>
              <h3>
                Set it up in the time it takes to send a voice note.
              </h3>
              <p>
                No paperwork, no onboarding call, no bank visit. Create a
                collection, decide what each payer must provide, and share the
                link. Your dashboard starts filling up immediately.
              </p>
              <ul className="m-row-points">
                <li>
                  <Check /> Fixed amount per payer, in naira
                </li>
                <li>
                  <Check /> Custom fields — matric number, department, phone
                </li>
                <li>
                  <Check /> Duplicate payments flagged automatically
                </li>
                <li>
                  <Check /> Pause or close a collection at any time
                </li>
              </ul>
              <a href={`${appUrl}/signup`} className="m-link">
                Start a collection <Arrow />
              </a>
            </div>
            <div className="m-row-visual">
              <div className="m-collection-card">
                <div className="m-collection-top">
                  <b>CSC 311 · Handout</b>
                  <span className="m-live">Live</span>
                </div>
                <div className="m-big-amount">
                  ₦340,000
                  <small>collected from 136 of 200 payers</small>
                </div>
                <div className="m-progress">
                  <i style={{ width: "68%" }} />
                </div>
                <div className="m-payer-list">
                  {[
                    ["AO", "Adaeze Okonkwo", "20/ENG/001", true],
                    ["EN", "Emeka Nwosu", "20/ENG/004", true],
                    ["FM", "Fatima Musa", "20/ENG/007", false],
                  ].map(([initials, name, id, paid]) => (
                    <div className="m-payer" key={id as string}>
                      <span className="m-mini-avatar">{initials}</span>
                      <div>
                        {name}
                        <small>{id}</small>
                      </div>
                      <span
                        className={`m-check${paid ? "" : " empty"}`}
                        aria-hidden="true"
                      >
                        {paid ? <Check /> : "·"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="m-row reverse reveal">
            <div className="m-row-copy">
              <span className="m-eyebrow">For payers</span>
              <h3>Pay in under a minute. Receipt in the inbox.</h3>
              <p>
                Open the link, enter your details, transfer the exact amount to
                the account shown. Jeneviv confirms the payment automatically
                and emails a receipt that stays downloadable.
              </p>
              <ul className="m-row-points">
                <li>
                  <Check /> No login, no app, no account creation
                </li>
                <li>
                  <Check /> Works on any phone and any Nigerian bank
                </li>
                <li>
                  <Check /> Receipt within 60 seconds of confirmation
                </li>
                <li>
                  <Check /> Stop sharing screenshots of transfers
                </li>
              </ul>
              <a href={`${appUrl}/signup`} className="m-link">
                See the payer experience <Arrow />
              </a>
            </div>
            <div className="m-row-visual">
              <div className="m-phone">
                <div className="m-phone-screen">
                  <span className="m-phone-label">CSC 311 · Handout</span>
                  <h4>Pay your levy</h4>
                  <div className="m-phone-field">
                    <small>Full name</small>
                    Adaeze Okonkwo
                  </div>
                  <div className="m-phone-field">
                    <small>Matric number</small>
                    20/ENG/001
                  </div>
                  <div className="m-phone-field">
                    <small>Amount</small>
                    ₦2,500.00
                  </div>
                  <div className="m-phone-toast">
                    <span className="m-float-check">
                      <Check />
                    </span>
                    <div>
                      <b>Payment confirmed</b>
                      <small>Receipt sent to your email</small>
                    </div>
                  </div>
                  <div className="m-phone-btn">Continue to payment</div>
                </div>
              </div>
            </div>
          </div>

          <div className="m-row reveal">
            <div className="m-row-copy">
              <span className="m-eyebrow">For the committee</span>
              <h3>Everyone works from the same numbers.</h3>
              <p>
                The treasurer, the chairperson and the course rep see the same
                ledger. No version of the spreadsheet is &quot;the latest
                one&quot;. Export a clean statement whenever money questions
                come up.
              </p>
              <ul className="m-row-points">
                <li>
                  <Check /> Verified payer list with references
                </li>
                <li>
                  <Check /> Transaction history you can filter and export
                </li>
                <li>
                  <Check /> Refunds recorded against the original payment
                </li>
                <li>
                  <Check /> Settlement history matched to collections
                </li>
              </ul>
              <a href={`${appUrl}/signup`} className="m-link">
                Open a dashboard <Arrow />
              </a>
            </div>
            <div className="m-row-visual">
              <div className="m-settlement">
                <div className="m-settlement-head">
                  <b>Recent activity</b>
                  <span>Live</span>
                </div>
                <div className="m-settlement-row">
                  <span className="m-bank-mark">IN</span>
                  <div>
                    <b>Adaeze Okonkwo</b>
                    <small>CSC 311 handout</small>
                  </div>
                  <div className="amount">
                    +₦2,500
                    <span>Matched</span>
                  </div>
                </div>
                <div className="m-settlement-row">
                  <span className="m-bank-mark">IN</span>
                  <div>
                    <b>Emeka Nwosu</b>
                    <small>CSC 311 handout</small>
                  </div>
                  <div className="amount">
                    +₦2,500
                    <span>Matched</span>
                  </div>
                </div>
                <div className="m-settlement-row">
                  <span className="m-bank-mark">OUT</span>
                  <div>
                    <b>Settlement · Wema ••2104</b>
                    <small>Evening payout</small>
                  </div>
                  <div className="amount">
                    −₦96,300
                    <span>Sent</span>
                  </div>
                </div>
                <div className="m-settlement-row">
                  <span className="m-bank-mark">IN</span>
                  <div>
                    <b>Fatima Musa</b>
                    <small>CSC 311 handout</small>
                  </div>
                  <div className="amount">
                    +₦2,500
                    <span>Matched</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- use cases */}
      <section className="m-section" id="use-cases">
        <div className="m-wrap">
          <div className="m-section-head reveal">
            <span className="m-eyebrow">Use cases</span>
            <h2 className="m-h2">One platform. Every kind of group.</h2>
            <p className="m-sub">
              If money moves from many people to one accountable person, Jeneviv
              fits. The collection changes; the certainty doesn&apos;t.
            </p>
          </div>
          <div className="m-bento" style={{ marginTop: 48 }}>
            {USE_CASES.map((useCase) => (
              <article className="m-bento-card reveal" key={useCase.tag}>
                <span className="m-eyebrow">{useCase.tag}</span>
                <h3>{useCase.title}</h3>
                <p>{useCase.body}</p>
                <div className="m-bento-art">
                  <div className="m-mini-ui">
                    <div className="m-mini-amount" style={{ marginTop: 0 }}>
                      <b>{useCase.stat}</b>
                      <small>{useCase.detail}</small>
                    </div>
                    <div className="m-mini-track">
                      <i style={{ width: `${useCase.progress}%` }} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- security */}
      <section className="m-section m-security" id="security">
        <div className="m-wrap">
          <div className="m-section-head reveal">
            <span className="m-eyebrow">Security</span>
            <h2 className="m-h2">Money infrastructure, not a side project.</h2>
            <p className="m-sub">
              Jeneviv is the layer on top. The regulated parts — card handling,
              settlement rails, gateway compliance — stay with licensed
              infrastructure that is audited for it.
            </p>
          </div>
          <div className="m-sec-grid reveal">
            {SECURITY.map((item) => (
              <article className="m-sec-card" key={item.title}>
                <span className="m-sec-icon">
                  <Shield />
                </span>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <p className="m-sec-foot">
            <Shield />
            Payments powered by Flutterwave · PCI-DSS Level 1 · NDPA-aligned
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- stats */}
      <section className="m-section">
        <div className="m-wrap">
          <div className="m-section-head reveal">
            <span className="m-eyebrow">By the numbers</span>
            <h2 className="m-h2">Built to be boring about money.</h2>
          </div>
          <div className="m-stats-grid reveal">
            <div className="m-stat">
              <b>2×</b>
              <span>Daily settlements, weekends and public holidays included</span>
            </div>
            <div className="m-stat">
              <b>0</b>
              <span>Screenshots needed to prove a payment was made</span>
            </div>
            <div className="m-stat">
              <b>60<em>sec</em></b>
              <span>Typical wait for a receipt after confirmation</span>
            </div>
            <div className="m-stat">
              <b>15<em>min</em></b>
              <span>Reconciliation window for late or delayed webhooks</span>
            </div>
          </div>
          <div className="m-cities reveal">
            <span className="m-cities-label">Where we&apos;re active</span>
            {["Lagos", "Uyo", "Port Harcourt", "Enugu", "Abuja", "Ibadan"].map(
              (city) => (
                <span className="m-city" key={city}>
                  {city}
                </span>
              ),
            )}
            <span className="m-city">and every group with a link</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- testimonials */}
      <section className="m-section tight" style={{ paddingTop: 0 }}>
        <div className="m-wrap">
          <div className="m-section-head reveal">
            <span className="m-eyebrow">From pilot coordinators</span>
            <h2 className="m-h2">The group chat got quieter.</h2>
          </div>
          <div className="m-quotes reveal">
            {QUOTES.map((quote) => (
              <article className="m-quote" key={quote.name}>
                <span className="m-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote>{quote.quote}</blockquote>
                <footer>
                  <span className="m-quote-avatar">{quote.initials}</span>
                  <div>
                    <b>{quote.name}</b>
                    <small>{quote.role}</small>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ pricing */}
      <section className="m-section m-security" id="pricing">
        <div className="m-wrap">
          <div className="m-section-head reveal">
            <span className="m-eyebrow">Pricing</span>
            <h2 className="m-h2">Pay only when money moves.</h2>
            <p className="m-sub">
              No monthly subscription. No setup fee. No charge to the people
              paying. If a collection doesn&apos;t collect, you don&apos;t pay.
            </p>
          </div>
          <div className="m-price-shell reveal">
            <div className="m-price-card">
              <span className="m-price-badge">For coordinators</span>
              <div className="m-price-amount">
                1.5% + ₦100 <span>/ successful payment</span>
              </div>
              <p className="m-price-note">
                Capped at ₦2,000 per payment, deducted from the collection.
                A ₦2,500 handout levy costs ₦137.50 in total.
              </p>
              <ul className="m-price-list">
                <li>
                  <Check /> Unlimited collections and payers
                </li>
                <li>
                  <Check /> Custom payer fields and duplicate detection
                </li>
                <li>
                  <Check /> Verified payer export (CSV / PDF)
                </li>
                <li>
                  <Check /> Twice-daily bank settlement
                </li>
                <li>
                  <Check /> Email receipts for every payer
                </li>
              </ul>
              <a href={`${appUrl}/signup`} className="m-btn m-btn-primary">
                Create an account <Arrow />
              </a>
              <p className="m-price-fine">
                No card required to start. Fees only apply to successful
                payments.
              </p>
            </div>
            <div className="m-price-card dark">
              <span className="m-price-badge">For institutions</span>
              <div className="m-price-amount">
                Let&apos;s talk <span>/ custom</span>
              </div>
              <p className="m-price-note">
                Running collections across departments, campuses or chapters?
                We&apos;ll set up consolidated settlement, bulk onboarding and
                reporting that fits your finance team.
              </p>
              <ul className="m-price-list">
                <li>
                  <Check /> Consolidated multi-department reporting
                </li>
                <li>
                  <Check /> Dedicated onboarding and support
                </li>
                <li>
                  <Check /> Negotiated transaction fees
                </li>
                <li>
                  <Check /> API access and webhook integration
                </li>
                <li>
                  <Check /> Custom settlement schedule
                </li>
              </ul>
              <a
                href="mailto:myjeneviv@gmail.com?subject=Jeneviv%20for%20our%20institution"
                className="m-btn m-btn-light"
              >
                Talk to the team <Arrow />
              </a>
              <p className="m-price-fine">
                We reply within one business day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- faq */}
      <section className="m-section">
        <div className="m-wrap">
          <div className="m-section-head center reveal">
            <span className="m-eyebrow center">Questions</span>
            <h2 className="m-h2">The things people ask first.</h2>
          </div>
          <div className="m-faq reveal">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 12 12">
                      <path
                        d="M6 1v10M1 6h10"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- cta */}
      <section className="m-cta">
        <div className="m-cta-inner reveal">
          <div>
            <h2>Ready to close the WhatsApp group?</h2>
            <p>
              Create your first collection before the next group meeting. It
              takes about three minutes, and the first payer can pay immediately.
            </p>
          </div>
          <div className="m-cta-actions">
            <a href={`${appUrl}/signup`} className="m-btn m-btn-light">
              Create a free account <Arrow />
            </a>
            <a href={`${appUrl}/login`} className="m-btn m-btn-outline" style={{ borderColor: "rgba(255,255,255,0.6)", color: "#fff" }}>
              I already have an account
            </a>
            <p className="m-note">Free to start · No card required</p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- footer */}
      <footer className="m-footer">
        <div className="m-wrap">
          <div className="m-footer-top">
            <div className="m-footer-brand">
              <Link href="/" className="m-logo">
                jeneviv<em>.</em>
              </Link>
              <p>
                Collections, handled. Built for the way Nigerian groups actually
                collect money — with a record of every naira.
              </p>
              <span className="m-footer-status">
                <span className="m-pill-dot" />
                All systems operational
              </span>
            </div>
            <div className="m-footer-cols">
              <div>
                <h5>Product</h5>
                <ul>
                  <li>
                    <a href="#collections">Collections</a>
                  </li>
                  <li>
                    <a href="#collections">Payment links</a>
                  </li>
                  <li>
                    <a href="#settlement">Payouts</a>
                  </li>
                  <li>
                    <a href="#reconciliation">Reconciliation</a>
                  </li>
                  <li>
                    <a href="#pricing">Pricing</a>
                  </li>
                </ul>
              </div>
              <div>
                <h5>Solutions</h5>
                <ul>
                  <li>
                    <a href="#use-cases">Universities</a>
                  </li>
                  <li>
                    <a href="#use-cases">PTAs & schools</a>
                  </li>
                  <li>
                    <a href="#use-cases">Cooperatives</a>
                  </li>
                  <li>
                    <a href="#use-cases">Associations</a>
                  </li>
                </ul>
              </div>
              <div>
                <h5>Company</h5>
                <ul>
                  <li>
                    <a href="#how-it-works">How it works</a>
                  </li>
                  <li>
                    <a href="#security">Security</a>
                  </li>
                  <li>
                    <a href="mailto:myjeneviv@gmail.com">Contact</a>
                  </li>
                  <li>
                    <a href={`${appUrl}/login`}>Log in</a>
                  </li>
                </ul>
              </div>
              <div>
                <h5>Legal</h5>
                <ul>
                  <li>
                    <Link href="/privacy">Privacy policy</Link>
                  </li>
                  <li>
                    <Link href="/terms">Terms of service</Link>
                  </li>
                  <li>
                    <Link href="/terms#refunds">Refund policy</Link>
                  </li>
                  <li>
                    <a href="mailto:myjeneviv@gmail.com">Data requests</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="m-footer-bottom">
            <p>© 2026 Acadeva Limited. Built in Nigeria, for Nigeria.</p>
            <div className="m-footer-badges">
              <span className="m-footer-badge">Flutterwave powered</span>
              <span className="m-footer-badge">NDPA aligned</span>
              <span className="m-footer-badge">CAC registered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
