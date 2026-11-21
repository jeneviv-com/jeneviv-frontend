import SiteNav from "@/components/marketing/SiteNav";
import SiteFooter from "@/components/marketing/SiteFooter";
import Reveal from "@/components/marketing/Reveal";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

/* ------------------------------------------------------------------ icons */

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
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="m3 8.5 3.2 3L13 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Cross = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="m3 3 6 6M9 3 3 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
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

const Plus = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M6 1v10M1 6h10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/* ------------------------------------------------------------------- data */

const AUDIENCES = [
  "Course reps",
  "Departments",
  "PTAs & schools",
  "Cooperatives",
  "Thrift groups",
  "Associations",
];

const STEPS = [
  {
    n: "01",
    title: "Create",
    body: "Name the collection, set the amount and choose what each payer must tell you: name, matric number, phone, class.",
  },
  {
    n: "02",
    title: "Collect",
    body: "Share one link in the group chat. Payers transfer from any bank to the account shown. No app, no sign up.",
  },
  {
    n: "03",
    title: "Settle",
    body: "Every transfer is verified and matched to a payer, then settled to the bank account you verified.",
  },
];

const PILLARS = [
  {
    id: "reconciliation",
    title: "Verified, not claimed",
    body: "A payment is marked paid only when the gateway confirms it with a signed webhook. Late webhooks are caught by a re-check every 15 minutes.",
  },
  {
    title: "Matched to a person",
    body: "Each transfer is tied to the payer's name and identifier, so you never cross-check narrations against a list again.",
  },
  {
    title: "Your money, your bank",
    body: "Collections settle to the bank account you verified. Payout history and status sit right in the dashboard.",
  },
  {
    title: "Ready to hand over",
    body: "Export a verified list as CSV or PDF with names, identifiers, amounts, dates and references. Done before the meeting starts.",
  },
];

const FEATURES = [
  ["Custom payer fields", "Ask for exactly what your group uses to identify people."],
  ["One account per collection", "Every collection gets its own account to transfer to."],
  ["Email receipts", "Payers get a receipt the moment the transfer is confirmed."],
  ["Receipt verification", "Anyone can check a receipt is genuine from its code."],
  ["Duplicate detection", "Spot the payer who paid twice before they ask."],
  ["Team roles", "Owner, admin, collector or viewer. Helpers never see bank details."],
  ["Refunds", "Send money back to a payer from the dashboard."],
  ["Pause any time", "Close a collection without losing a single record."],
  ["CSV & PDF export", "The full ledger, filtered the way you need it."],
];

const USE_CASES = [
  {
    tag: "Universities",
    title: "Course reps & departments",
    body: "Handouts, manuals, lab fees, departmental levies. Every payment matched to a matric number.",
  },
  {
    tag: "PTAs & schools",
    title: "Termly levies",
    body: "No envelopes, no tellers, no “I paid Aunty Ngozi”. Parents pay by transfer and the school gets one clean report.",
  },
  {
    tag: "Cooperatives",
    title: "Monthly thrift",
    body: "Members pay from any bank. Contributions are matched to the member record, month after month.",
  },
  {
    tag: "Associations",
    title: "Dues & building funds",
    body: "Annual dues, event levies and project contributions, with an auditable list for any committee.",
  },
];

const SECURITY = [
  ["Regulated payment rails", "Collections run through licensed payment gateways, not a wallet we invented."],
  ["Webhook-verified payments", "Paid means the gateway confirmed it cryptographically. Not a screenshot, not a narration."],
  ["NDPA-aligned data handling", "We collect the minimum needed to identify a payer, encrypt it at rest and never sell it."],
  ["Protected coordinator access", "Email verification guards coordinator accounts, so one leaked password can't expose a group's money."],
  ["Continuous reconciliation", "A background job re-checks the gateway every 15 minutes for transfers that arrived late."],
  ["Role-scoped team access", "Everyone you invite gets a role, so a helper can add payers without seeing settlement details."],
];

const FAQ = [
  {
    q: "How does Jeneviv know a payer has actually paid?",
    a: "Every collection gets its own payment account. When money lands, the gateway sends a signed webhook to Jeneviv. We verify it, match the transfer to the payer record and mark it paid. If a webhook is delayed, a reconciliation job checks again every 15 minutes.",
  },
  {
    q: "Do the people paying need to download an app?",
    a: "No. Payers open a link in any browser, enter the details your collection asks for and transfer the exact amount to the account shown. Their receipt arrives by email, and your dashboard updates in real time.",
  },
  {
    q: "What does it cost?",
    a: "There is no monthly fee and no setup fee. You only pay a small fee on each successful payment. See the pricing section above for the exact rate.",
  },
  {
    q: "When does the money reach my bank account?",
    a: "Settlements run T+1. Weekend payments settle on the next working day. Money goes straight to the verified bank account you added, so there is no manual payout to start. Payout history and status are visible in the app.",
  },
  {
    q: "Can more than one person manage a collection?",
    a: "Yes. Invite your treasurer, chairperson or lecturer with a role that fits, and everyone works from the same verified report.",
  },
  {
    q: "What happens if a payer transfers the wrong amount?",
    a: "The payment still appears in your ledger with its reference. You can reconcile it, refund it from the dashboard or record it as a partial payment. Nothing disappears because it didn't match exactly.",
  },
];

/* -------------------------------------------------------------- mockups */

function ReceiptMock() {
  return (
    <div className="l-receipt">
      <div className="l-receipt-head">
        <span className="l-receipt-brand">
          jeneviv<em>.</em>
        </span>
        <span className="l-mono">Receipt</span>
      </div>
      <div className="l-receipt-meta">
        <div>
          <small>Collection</small>
          <b>CSC 311 Handout</b>
        </div>
        <div>
          <small>Reference</small>
          <b className="l-mono-val">JNV-4471</b>
        </div>
      </div>
      <div className="l-receipt-payer">
        <span className="l-avatar">AO</span>
        <div>
          <b>Adaeze Okonkwo</b>
          <small>20/ENG/001</small>
        </div>
      </div>
      <dl className="l-receipt-lines">
        <div>
          <dt>Handout, 2nd semester</dt>
          <dd>₦2,500.00</dd>
        </div>
        <div>
          <dt>Paid by</dt>
          <dd>Bank transfer</dd>
        </div>
        <div>
          <dt>Confirmed</dt>
          <dd>12:04:09</dd>
        </div>
      </dl>
      <div className="l-receipt-total">
        <span>Total paid</span>
        <b>₦2,500.00</b>
      </div>
      <div className="l-receipt-foot">
        <span className="l-mono">Verify at jeneviv.com/r/4471</span>
      </div>
      <span className="l-stamp" aria-hidden="true">
        Paid
      </span>
    </div>
  );
}

function LedgerMock() {
  const rows: [string, string, string, "paid" | "pending"][] = [
    ["AO", "Adaeze Okonkwo", "20/ENG/001", "paid"],
    ["EN", "Emeka Nwosu", "20/ENG/004", "paid"],
    ["FM", "Fatima Musa", "20/ENG/007", "pending"],
    ["IK", "Ibrahim Kalu", "20/ENG/012", "paid"],
  ];
  return (
    <div className="l-panel">
      <div className="l-panel-head">
        <b>CSC 311 Handout</b>
        <span className="l-live">
          <i /> Live
        </span>
      </div>
      <div className="l-ledger-total">
        <span className="l-big">₦340,000</span>
        <small>from 136 of 200 payers</small>
        <div className="l-track">
          <i style={{ width: "68%" }} />
        </div>
      </div>
      <ul className="l-rows">
        {rows.map(([ini, name, id, state]) => (
          <li key={id}>
            <span className="l-avatar sm">{ini}</span>
            <div>
              <b>{name}</b>
              <small>{id}</small>
            </div>
            <span className="l-amt">₦2,500</span>
            <span className={`l-pill ${state}`}>
              {state === "paid" ? "Paid" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayerFormMock() {
  return (
    <div className="l-panel l-form">
      <span className="l-mono">CSC 311 Handout</span>
      <h4>Pay your levy</h4>
      <label>
        <small>Full name</small>
        <span>Adaeze Okonkwo</span>
      </label>
      <label>
        <small>Matric number</small>
        <span>20/ENG/001</span>
      </label>
      <div className="l-account">
        <small>Transfer exactly ₦2,500.00 to</small>
        <b>0123 456 789</b>
        <span>Jeneviv / CSC 311 Handout</span>
      </div>
      <div className="l-toast">
        <span className="l-toast-check">
          <Check />
        </span>
        <div>
          <b>Payment confirmed</b>
          <small>Receipt sent to your email</small>
        </div>
      </div>
    </div>
  );
}

function SettlementMock() {
  return (
    <div className="l-panel">
      <div className="l-panel-head">
        <b>Settlements</b>
        <span className="l-mono">Wema ••2104</span>
      </div>
      <ul className="l-rows">
        {[
          ["Thu 19 Nov", "CSC 311 Handout", "₦184,500", "Settled"],
          ["Wed 18 Nov", "CSC 311 Handout", "₦96,300", "Settled"],
          ["Tue 17 Nov", "Lab manual", "₦42,000", "Settled"],
        ].map(([date, what, amt, state]) => (
          <li key={date}>
            <span className="l-avatar sm ghost">₦</span>
            <div>
              <b>{what}</b>
              <small>{date}</small>
            </div>
            <span className="l-amt">{amt}</span>
            <span className="l-pill paid">{state}</span>
          </li>
        ))}
      </ul>
      <div className="l-panel-foot">
        <span>Next settlement</span>
        <b>Tomorrow, to Wema ••2104</b>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function LandingPage() {
  return (
    <div className="m-page l-page">
      <SiteNav />
      <Reveal />

      {/* ---------------------------------------------------------- hero */}
      <section className="l-hero" id="top">
        <div className="m-wrap l-hero-grid">
          <div className="l-hero-copy">
            <span className="l-badge">
              <i /> For course reps, PTAs, cooperatives and associations
            </span>
            <h1 className="l-h1">
              Group money, <span>finally accounted for.</span>
            </h1>
            <p className="l-lede">
              One payment link that turns into a live ledger. See who has
              paid, who hasn&apos;t, and what actually hit your bank.
            </p>
            <div className="l-cta-row">
              <a href={`${appUrl}/signup`} className="m-btn l-btn-brand">
                Create a free collection <Arrow />
              </a>
              <a href="#how-it-works" className="m-btn m-btn-outline">
                See how it works
              </a>
            </div>
            <p className="l-note">
              <Check /> Free to start <span>•</span> No card required{" "}
              <span>•</span> Live in 3 minutes
            </p>
          </div>

          <div className="l-hero-visual" aria-hidden="true">
            <div className="l-hero-stage">
              <ReceiptMock />
              <div className="l-float l-float-a">
                <span className="l-toast-check">
                  <Check />
                </span>
                <div>
                  <b>Payer matched</b>
                  <small>20/ENG/001 • 3s after transfer</small>
                </div>
              </div>
              <div className="l-float l-float-b">
                <small>CSC 311 Handout</small>
                <b>136 of 200 paid</b>
                <div className="l-track">
                  <i style={{ width: "68%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="m-wrap">
          <div className="l-audience reveal">
            <span className="l-mono">Built for the groups that collect every term</span>
            <ul>
              {AUDIENCES.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- steps */}
      <section className="l-section" id="how-it-works">
        <div className="m-wrap">
          <div className="l-head center reveal">
            <span className="l-eyebrow">How it works</span>
            <h2 className="l-h2">Create. Collect. Settle.</h2>
            <p className="l-sub">
              Three steps between a group chat full of screenshots and a ledger
              you can defend.
            </p>
          </div>
          <ol className="l-steps">
            {STEPS.map((s) => (
              <li key={s.n} className="reveal">
                <span className="l-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------------- gap */}
      <section className="l-section l-cream">
        <div className="m-wrap l-gap">
          <div className="l-gap-copy reveal">
            <span className="l-eyebrow">The gap</span>
            <h2 className="l-h2">
              Collecting money is easy. <span>Knowing who paid</span> is the
              hard part.
            </h2>
            <p className="l-sub">
              Bank alerts don&apos;t carry matric numbers. Narrations get cut
              off. Screenshots get edited. So the course rep is still awake at
              midnight, matching names to a spreadsheet nobody else trusts.
            </p>
            <p className="l-sub">
              <b>Jeneviv closes that gap.</b> The transfer is verified with the
              gateway, matched to a person and written into a ledger the whole
              committee can see.
            </p>
          </div>
          <div className="l-compare reveal">
            <div className="l-compare-col before">
              <span className="l-mono">The group chat</span>
              <ul>
                <li><Cross /> &ldquo;I&apos;ve sent it, check&rdquo;</li>
                <li><Cross /> Screenshots you can&apos;t verify</li>
                <li><Cross /> Narrations cut off at 20 characters</li>
                <li><Cross /> A spreadsheet that&apos;s always behind</li>
                <li><Cross /> Calling people one by one</li>
              </ul>
            </div>
            <div className="l-compare-col after">
              <span className="l-mono">With Jeneviv</span>
              <ul>
                <li><Check /> Confirmed by the gateway</li>
                <li><Check /> Matched to name and ID</li>
                <li><Check /> Receipt in the payer&apos;s inbox</li>
                <li><Check /> Ledger updates on its own</li>
                <li><Check /> One list of who hasn&apos;t paid</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ pillars */}
      <section className="l-section">
        <div className="m-wrap">
          <div className="l-head reveal">
            <span className="l-eyebrow">Why Jeneviv works</span>
            <h2 className="l-h2">Built to be boring about money.</h2>
          </div>
          <div className="l-pillars">
            {PILLARS.map((p, i) => (
              <article key={p.title} id={p.id} className="l-card reveal">
                <span className="l-card-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- pairs */}
      <section className="l-section tight" id="collections">
        <div className="m-wrap l-pairs">
          <div className="l-pair reveal">
            <div className="l-pair-copy">
              <span className="l-eyebrow">For coordinators</span>
              <h3>Know exactly who has paid, live.</h3>
              <p>
                Every confirmed transfer lands on your dashboard with the
                payer, the reference and the amount. Nothing is typed in by
                hand, and the list of who hasn&apos;t paid writes itself.
              </p>
              <a href={`${appUrl}/signup`} className="l-link">
                Create your first collection <Arrow />
              </a>
            </div>
            <div className="l-pair-visual">
              <LedgerMock />
            </div>
          </div>

          <div className="l-pair reverse reveal">
            <div className="l-pair-copy">
              <span className="l-eyebrow">For payers</span>
              <h3>Pay in under a minute. Receipt in the inbox.</h3>
              <p>
                Open the link, enter your details and transfer the exact amount
                to the account shown. Jeneviv confirms it automatically and
                emails a receipt that anyone can verify.
              </p>
              <a href={`${appUrl}/signup`} className="l-link">
                See the payer page <Arrow />
              </a>
            </div>
            <div className="l-pair-visual">
              <PayerFormMock />
            </div>
          </div>

          <div className="l-pair reveal" id="settlement">
            <div className="l-pair-copy">
              <span className="l-eyebrow">For the treasurer</span>
              <h3>Money goes straight to your bank.</h3>
              <p>
                Collections settle to the bank account you verified, with no
                manual payout to start. Every settlement is listed with its
                date, amount and status, so the books always add up.
              </p>
              <a href="#pricing" className="l-link">
                See pricing <Arrow />
              </a>
            </div>
            <div className="l-pair-visual">
              <SettlementMock />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section className="l-section l-cream" id="use-cases">
        <div className="m-wrap">
          <div className="l-head reveal">
            <span className="l-eyebrow">Who it&apos;s for</span>
            <h2 className="l-h2">One platform. Every kind of group.</h2>
          </div>
          <div className="l-uses">
            {USE_CASES.map((u) => (
              <article key={u.title} className="l-use reveal">
                <span className="l-mono">{u.tag}</span>
                <h3>{u.title}</h3>
                <p>{u.body}</p>
              </article>
            ))}
          </div>

          <div className="l-head reveal" style={{ marginTop: 96 }}>
            <span className="l-eyebrow">Everything included</span>
            <h2 className="l-h2">The small things that save the evening.</h2>
          </div>
          <ul className="l-features reveal">
            {FEATURES.map(([t, d]) => (
              <li key={t}>
                <span className="l-feature-dot" />
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------ security */}
      <section className="l-section" id="security">
        <div className="m-wrap l-security">
          <div className="l-head reveal">
            <span className="l-eyebrow">Security</span>
            <h2 className="l-h2">Money infrastructure, not a side project.</h2>
            <p className="l-sub">
              The checks a finance team would ask for, on every collection,
              from the first naira.
            </p>
          </div>
          <ul className="l-sec-list">
            {SECURITY.map(([t, d]) => (
              <li key={t} className="reveal">
                <span className="l-sec-icon">
                  <Shield />
                </span>
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------- pricing */}
      <section className="l-section l-cream" id="pricing">
        <div className="m-wrap">
          <div className="l-head center reveal">
            <span className="l-eyebrow">Pricing</span>
            <h2 className="l-h2">Pay only when money moves.</h2>
            <p className="l-sub">
              No monthly subscription. No setup fee. If a collection
              doesn&apos;t collect, you don&apos;t pay.
            </p>
          </div>
          <div className="l-prices">
            <div className="l-price reveal">
              <span className="l-mono">For coordinators</span>
              <div className="l-price-amt">
                1.5% + ₦100 <span>/ successful payment</span>
              </div>
              <p>
                Capped at ₦2,000 per payment. A ₦2,500 handout levy costs
                ₦137.50 in total.
              </p>
              <ul>
                <li><Check /> Unlimited collections and payers</li>
                <li><Check /> Custom payer fields and duplicate detection</li>
                <li><Check /> Verified payer export (CSV / PDF)</li>
                <li><Check /> Automatic bank settlement</li>
                <li><Check /> Email receipts for every payer</li>
              </ul>
              <a href={`${appUrl}/signup`} className="m-btn l-btn-brand">
                Create an account <Arrow />
              </a>
            </div>
            <div className="l-price dark reveal">
              <span className="l-mono">For institutions</span>
              <div className="l-price-amt">
                Let&apos;s talk <span>/ custom</span>
              </div>
              <p>
                Running collections across departments, campuses or chapters?
                We&apos;ll set up consolidated settlement, bulk onboarding and
                reporting that fits your finance team.
              </p>
              <ul>
                <li><Check /> Consolidated multi-department reporting</li>
                <li><Check /> Dedicated onboarding and support</li>
                <li><Check /> Negotiated transaction fees</li>
                <li><Check /> API access and webhooks</li>
                <li><Check /> Custom settlement schedule</li>
              </ul>
              <a
                href="mailto:myjeneviv@gmail.com?subject=Jeneviv%20for%20our%20institution"
                className="m-btn m-btn-light"
              >
                Talk to the team <Arrow />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- faq */}
      <section className="l-section">
        <div className="m-wrap l-faq-grid">
          <div className="l-head reveal">
            <span className="l-eyebrow">FAQ</span>
            <h2 className="l-h2">The things people ask first.</h2>
            <p className="l-sub">
              Something else? Email{" "}
              <a href="mailto:myjeneviv@gmail.com">myjeneviv@gmail.com</a>.
            </p>
          </div>
          <div className="l-faq reveal">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span aria-hidden="true">
                    <Plus />
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="l-section tight">
        <div className="m-wrap">
          <div className="l-cta reveal">
            <h2>Ready to close the WhatsApp group?</h2>
            <p>
              Create your first collection before the next group meeting. It
              takes about three minutes, and the first payer can pay right
              away.
            </p>
            <div className="l-cta-row center">
              <a href={`${appUrl}/signup`} className="m-btn l-btn-brand">
                Start collecting <Arrow />
              </a>
              <a href={`${appUrl}/login`} className="m-btn l-btn-ghost">
                I already have an account
              </a>
            </div>
            <span className="l-cta-note">Free to start • No card required</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
