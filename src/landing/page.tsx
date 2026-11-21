import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  Building2,
  Clock,
  CopyCheck,
  FileDown,
  GraduationCap,
  HandCoins,
  Landmark,
  ListChecks,
  Lock,
  Mail,
  PauseCircle,
  ReceiptText,
  RotateCcw,
  School,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import LandingNav, { Wordmark } from "./LandingNav";
import ProductTabs from "./ProductTabs";
import UseCaseTabs from "./UseCaseTabs";
import Reveal from "@/components/marketing/Reveal";
import { appUrl } from "@/lib/urls";


/* ------------------------------------------------------------------ icons */

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
    <path d="m3 8.5 3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------- data */

const AUDIENCES = [
  { icon: GraduationCap, label: "Course reps" },
  { icon: Building2, label: "Departments" },
  { icon: School, label: "PTAs" },
  { icon: Landmark, label: "Cooperatives" },
  { icon: Wallet, label: "Thrift groups" },
  { icon: Users, label: "Associations" },
];

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Verified",
    body: "A payment is marked paid only when the gateway confirms it. Not a screenshot, not a narration.",
  },
  {
    icon: UserCheck,
    title: "Matched",
    body: "Every transfer is tied to a name and an ID, so you never cross check a bank alert against a list.",
  },
  {
    icon: Banknote,
    title: "Settled",
    body: "Money goes straight to the bank account you verified. Every payout is listed with its status.",
  },
  {
    icon: FileDown,
    title: "Ready",
    body: "Export the verified list as CSV or PDF, with names, IDs, amounts and references.",
  },
];

const FEATURES = [
  { icon: ListChecks, title: "Custom payer fields", body: "Ask for exactly what your group uses to identify people: matric number, class, member ID." },
  { icon: Landmark, title: "One account per collection", body: "Every collection gets its own account to transfer to, so payments never mix." },
  { icon: Mail, title: "Email receipts", body: "Payers get a receipt the moment the transfer is confirmed." },
  { icon: ReceiptText, title: "Receipt verification", body: "Anyone can check that a receipt is genuine from its reference." },
  { icon: CopyCheck, title: "Duplicate detection", body: "Spot the payer who paid twice before they ask for their money back." },
  { icon: Users, title: "Team roles", body: "Owner, admin, collector or viewer. Helpers never see bank details." },
  { icon: RotateCcw, title: "Refunds", body: "Send money back to a payer from the dashboard, linked to the original payment." },
  { icon: PauseCircle, title: "Pause any time", body: "Close a collection after the deadline without losing a single record." },
  { icon: FileDown, title: "CSV and PDF export", body: "The full ledger, filtered the way the department or committee wants it." },
];

const SECURITY = [
  { icon: ShieldCheck, title: "Licensed payment rails", body: "Collections run through licensed payment gateways, not a wallet we invented." },
  { icon: BadgeCheck, title: "Signed confirmations", body: "Paid means the gateway confirmed it with a signed webhook." },
  { icon: Lock, title: "NDPA aligned", body: "We collect the minimum needed to identify a payer, encrypt it and never sell it." },
  { icon: Mail, title: "Protected sign in", body: "A code by email at sign in, so one leaked password can't expose the money." },
  { icon: Clock, title: "Rechecked every 15 minutes", body: "A background check catches transfers that arrived late." },
  { icon: Users, title: "Roles for your team", body: "A helper can add payers without seeing settlement details." },
];

const FAQ = [
  {
    q: "How does jeneviv know a payer has actually paid?",
    a: "Every collection gets its own payment account. When money lands, the gateway sends jeneviv a signed confirmation. We verify it, match the transfer to the payer and mark it paid. If a confirmation is delayed, we check again every 15 minutes.",
  },
  {
    q: "Do payers need to download an app?",
    a: "No. Payers open the link in any browser, fill in what your collection asks for and transfer the exact amount shown. Their receipt arrives by email and your dashboard updates straight away.",
  },
  {
    q: "What does it cost?",
    a: "There is no monthly fee and no setup fee. You pay a small fee on each successful payment. The pricing section above has the exact rate.",
  },
  {
    q: "When does the money reach my bank account?",
    a: "Settlements run T+1. Weekend payments settle on the next working day. Money goes straight to the bank account you verified, so there is no payout to start yourself.",
  },
  {
    q: "Can more than one person manage a collection?",
    a: "Yes. Invite your treasurer, chairperson or lecturer with the role that fits, and everyone works from the same verified list.",
  },
  {
    q: "What if a payer sends the wrong amount?",
    a: "The payment still shows in your ledger with its reference. You can reconcile it, refund it or record it as a part payment. Nothing disappears because it didn't match.",
  },
];

/* -------------------------------------------------------------- mockups */

function Receipt() {
  return (
    <div className="b-printer" aria-hidden="true">
      <div className="b-printer-slot" />
      <div className="b-paper-clip">
        <div className="b-paper">
          <div className="b-paper-head">
            <span className="b-paper-brand">
              <i /> jeneviv
            </span>
            <span>21 Nov · 12:04</span>
          </div>
          <div className="b-paper-ref">Ref JNV4471</div>
          <div className="b-rule" />
          <div className="b-line">
            <span>CSC 311 handout</span>
            <b>₦2,500.00</b>
          </div>
          <div className="b-line">
            <span>Lab manual</span>
            <b>₦1,500.00</b>
          </div>
          <div className="b-line faint">
            <span>Late fee · waived</span>
            <b>₦0.00</b>
          </div>
          <div className="b-rule" />
          <div className="b-total">
            <span>TOTAL</span>
            <b>₦4,000.00</b>
          </div>
          <div className="b-paper-foot">
            <span>Adaeze O. · 20/ENG/001</span>
            <span className="b-ok">✓ confirmed · 3s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayCard() {
  return (
    <div className="b-card b-paycard">
      <div className="b-paycard-head">
        <b>CSC 311 handout</b>
        <span>₦2,500.00 per student</span>
      </div>
      <div className="b-paycard-body">
        <div className="b-field">
          <span>Name</span>
          <b>Adaeze Okonkwo</b>
        </div>
        <div className="b-field">
          <span>Matric</span>
          <b>20/ENG/001</b>
        </div>
        <div className="b-field">
          <span>Pay to</span>
          <b>Wema · 0123456789</b>
        </div>
        <div className="b-paycard-note">
          <span>
            <Check /> Receipt by email
          </span>
          <span>Confirmed in seconds</span>
        </div>
        <div className="b-paycard-btn">
          I have sent ₦2,500.00 <Lock size={14} />
        </div>
        <p className="b-paycard-fine">Secured by jeneviv · Matched automatically</p>
      </div>
    </div>
  );
}

function OverviewCard() {
  const rows = [
    { name: "CSC 311 handout", meta: "125 paid · 6 pending", amt: "₦2,500", unit: "/student", trend: "↑ 63%", selected: true },
    { name: "Lab manual", meta: "88 paid", amt: "₦1,500", unit: "/student" },
    { name: "Departmental dinner", meta: "18 paid · paused", amt: "₦7,500", unit: "/ticket" },
  ];
  return (
    <div className="b-card b-overview">
      <p className="b-card-title">Collection overview</p>
      {rows.map((r) => (
        <div key={r.name} className={`b-ov-row${r.selected ? " selected" : ""}`}>
          <div>
            <b>{r.name}</b>
            <span>{r.meta}</span>
          </div>
          <div className="b-ov-amt">
            <b>
              {r.amt}
              <small>{r.unit}</small>
            </b>
            {r.trend ? <span>{r.trend} of target</span> : null}
          </div>
        </div>
      ))}
      <div className="b-ov-total">
        <span>Collected this term</span>
        <b>
          ₦1,040,000 <small>↑ 8.3%</small>
        </b>
      </div>
    </div>
  );
}

function FieldsCard() {
  const fields = [
    ["full_name", true],
    ["matric_number", true],
    ["level", true],
    ["phone_number", true],
    ["email", true],
    ["department", false],
  ] as const;
  return (
    <div className="b-card b-fields">
      <p className="b-card-title muted">Payer fields</p>
      <div className="b-fields-who">
        <span className="b-fields-av">cr</span>
        <div>
          <b>csc311_handout</b>
          <span>Live</span>
        </div>
        <em>LIVE</em>
      </div>
      <p className="b-fields-label">Asked on the pay page</p>
      <ul>
        {fields.map(([name, on]) => (
          <li key={name} className={on ? "" : "off"}>
            <i />
            <code>{name}</code>
            <span className={`b-switch${on ? " on" : ""}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function LandingPage() {
  return (
    <div className="b-page">
      <LandingNav />
      <Reveal />

      {/* ---------------------------------------------------------- hero */}
      <section className="b-sec b-hero" id="top">
        <div className="b-frame b-hero-grid">
          <div className="b-hero-copy">
            <h1>
              Group money,
              <br />
              <span className="b-pixel">
                finally{" "}
                <span className="b-roll" aria-label="accounted for.">
                  <span className="b-roll-track" aria-hidden="true">
                    {["accounted for", "settled", "verified", "reconciled", "accounted for"].map((word, index) => (
                      <span key={`${word}-${index}`}>
                        {word}
                        <em>.</em>
                      </span>
                    ))}
                  </span>
                </span>
              </span>
            </h1>
            <p className="b-lede">
              Collect from your class, PTA or cooperative with one link.
              <br className="b-br" /> We match every transfer to a payer, so you can focus on the group.
            </p>
            <div className="b-btn-row">
              <a href={`${appUrl}/signup`} className="b-btn b-btn-dark">
                Get started <Chevron />
              </a>
              <a href="#how-it-works" className="b-btn b-btn-outline">
                See how it works
              </a>
            </div>
          </div>
          <div className="b-hero-visual">
            <Receipt />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- audiences */}
      <section className="b-sec b-logos">
        <div className="b-frame">
          <p className="b-logos-label">
            <i /> Built for the groups that collect every term
          </p>
          <ul>
            {AUDIENCES.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={26} strokeWidth={2} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------ product */}
      <section className="b-sec b-tint" id="how-it-works">
        <div className="b-frame b-center b-pad">
          <h2 className="b-h2-strong reveal">Collect from every payer in minutes.</h2>
          <div className="reveal">
            <ProductTabs />
          </div>
        </div>
      </section>

      <section className="b-sec b-strip">
        <div className="b-frame b-strip-inner">
          <span className="b-strip-icon">
            <HandCoins size={18} aria-hidden="true" />
          </span>
          <p>
            <b>Collecting for a whole school?</b> <span>Talk to us about consolidated reporting across departments.</span>
          </p>
          <a href="mailto:myjeneviv@gmail.com?subject=jeneviv%20for%20our%20institution">
            jeneviv for institutions <Chevron />
          </a>
        </div>
      </section>

      {/* ---------------------------------------------------------- gap */}
      <section className="b-sec">
        <div className="b-frame b-center b-pad b-gap reveal">
          <p className="b-eyebrow">The gap</p>
          <h2 className="b-h2-light">
            You collect from everyone.
            <br />
            Your bank alert tells you nothing.
          </h2>
          <p>
            Bank alerts don&apos;t carry matric numbers. Narrations get cut off and screenshots get edited. So the course
            rep stays up at midnight, matching names against a spreadsheet nobody else trusts.
          </p>
          <p>
            You end up checking three apps, chasing twenty people and defending a list you can&apos;t prove.{" "}
            <b>jeneviv closes that gap.</b>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ pillars */}
      <section className="b-sec b-tint-warm">
        <div className="b-frame b-pillars-wrap">
          <p className="b-eyebrow left">Why jeneviv works</p>
          <h2 className="b-h2-mid">
            Built for the person holding
            <br />
            everyone&apos;s money.
          </h2>
          <div className="b-pillars">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="b-pillar reveal">
                <h3>
                  <span className="b-pillar-icon">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  {title}
                </h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- feature rows */}
      <section className="b-sec" id="collections">
        <div className="b-frame b-row">
          <div className="b-row-copy reveal">
            <h2>One link for every payer</h2>
            <p>
              Share one link in the group chat. Payers fill in what you asked for and transfer from any bank. No app, no
              sign up, no screenshots.
            </p>
            <blockquote>
              <b>Every collection gets its own account.</b> Payments never mix, and you never match a narration again.
            </blockquote>
            <a href={`${appUrl}/signup`} className="b-link">
              Create a collection <Arrow />
            </a>
          </div>
          <div className="b-row-visual reveal">
            <PayCard />
          </div>
        </div>
      </section>

      <section className="b-sec" id="settlement">
        <div className="b-frame b-row reverse">
          <div className="b-row-copy reveal">
            <h2>Every collection, one ledger</h2>
            <p>
              See what each collection has brought in, who has paid and who hasn&apos;t. The treasurer, the chairperson
              and the course rep all work from the same numbers.
            </p>
            <blockquote>
              Money settles to <b>your verified bank account</b>. There is no wallet to empty and no payout to request.
            </blockquote>
            <a href="#pricing" className="b-link">
              See pricing <Arrow />
            </a>
          </div>
          <div className="b-row-visual reveal">
            <OverviewCard />
          </div>
        </div>
      </section>

      <section className="b-sec" id="reconciliation">
        <div className="b-frame b-row">
          <div className="b-row-copy reveal">
            <h2 className="b-h2-bold">
              Ask for what you need.
              <br />
              Match every naira.
            </h2>
            <p>
              Choose the fields each payer must fill in. jeneviv attaches every answer to the payment, so the list
              writes itself as transfers arrive.
            </p>
            <blockquote>No more spreadsheets. Your list knows who has paid, in real time.</blockquote>
          </div>
          <div className="b-row-visual reveal">
            <FieldsCard />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- features */}
      <section className="b-sec b-tint-warm">
        <div className="b-frame b-pad b-features-wrap">
          <p className="b-eyebrow small">Everything included</p>
          <h2 className="b-h2-xl">Stop chasing transfer screenshots.</h2>
          <p className="b-sub">
            Payment links, payer fields, receipts, refunds and settlement to your bank account.
            <br className="b-br" /> Everything a group collection needs.
          </p>
          <div className="b-features reveal">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="b-feature">
                <span className="b-feature-icon">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- use cases */}
      <section className="b-sec b-tint" id="use-cases">
        <div className="b-frame b-pad">
          <div className="b-center">
            <p className="b-eyebrow">Built for your group</p>
            <h2 className="b-h2-light b-h2-sm">One link, every kind of group</h2>
            <p className="b-sub">
              Course reps, schools, cooperatives and associations collect the same way:
              <br className="b-br" /> one link, one ledger and a receipt for everyone.
            </p>
          </div>
          <UseCaseTabs />
        </div>
      </section>

      {/* ----------------------------------------------------- security */}
      <section className="b-sec" id="security">
        <div className="b-frame b-pillars-wrap">
          <p className="b-eyebrow left">Security</p>
          <h2 className="b-h2-mid">
            Money infrastructure,
            <br />
            not a side project.
          </h2>
          <div className="b-pillars three">
            {SECURITY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="b-pillar reveal">
                <h3 className="sm">
                  <span className="b-pillar-icon">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  {title}
                </h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ pricing */}
      <section className="b-sec b-tint-warm" id="pricing">
        <div className="b-frame b-pad">
          <div className="b-center">
            <p className="b-eyebrow">Pricing</p>
            <h2 className="b-h2-light b-h2-sm">Pay only when money moves.</h2>
            <p className="b-sub">No monthly subscription. No setup fee. If a collection doesn&apos;t collect, you don&apos;t pay.</p>
          </div>
          <div className="b-prices">
            <div className="b-price reveal">
              <p className="b-eyebrow left">For coordinators</p>
              <p className="b-price-amt">
                1.5% + ₦100 <span>per successful payment</span>
              </p>
              <p className="b-price-note">Capped at ₦2,000 per payment. A ₦2,500 handout costs ₦137.50 in total.</p>
              <ul>
                <li><Check /> Unlimited collections and payers</li>
                <li><Check /> Custom payer fields and duplicate detection</li>
                <li><Check /> Verified export as CSV or PDF</li>
                <li><Check /> Automatic bank settlement</li>
                <li><Check /> Email receipts for every payer</li>
              </ul>
              <a href={`${appUrl}/signup`} className="b-btn b-btn-dark">
                Get started <Chevron />
              </a>
            </div>
            <div className="b-price dark reveal">
              <p className="b-eyebrow left">For institutions</p>
              <p className="b-price-amt">
                Let&apos;s talk <span>custom</span>
              </p>
              <p className="b-price-note">
                Collections across departments, campuses or chapters, with settlement and reporting that fit your
                finance team.
              </p>
              <ul>
                <li><Check /> Reporting across departments</li>
                <li><Check /> Dedicated onboarding and support</li>
                <li><Check /> Negotiated transaction fees</li>
                <li><Check /> API access and webhooks</li>
                <li><Check /> Custom settlement schedule</li>
              </ul>
              <a href="mailto:myjeneviv@gmail.com?subject=jeneviv%20for%20our%20institution" className="b-btn b-btn-light">
                Talk to the team <Chevron />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- faq */}
      <section className="b-sec b-tint-warm b-faq-sec" id="faq">
        <div className="b-frame b-faq">
          <h2>FAQs</h2>
          <div className="b-faq-list">
            {FAQ.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>
                  {item.q}
                  <span aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- cta + footer */}
      <section className="b-dark">
        <div className="b-frame b-cta">
          <h2>
            Ready to close
            <br />
            the WhatsApp group?
          </h2>
          <p>
            Create your first collection before the next group meeting.
            <br className="b-br" /> The first payer can pay in about three minutes.
          </p>
          <a href={`${appUrl}/signup`} className="b-btn b-btn-light">
            Start collecting <Chevron />
          </a>
          <span className="b-cta-note">No card required. Set up in minutes.</span>
        </div>

        <footer className="b-frame b-footer">
          <div className="b-footer-brand">
            <Wordmark light />
            <p>© 2026 Acadeva Limited</p>
          </div>
          <div className="b-footer-cols">
            <div>
              <h5>Product</h5>
              <a href="#how-it-works">How it works</a>
              <a href="#collections">Payment links</a>
              <a href="#settlement">Settlement</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <h5>Solutions</h5>
              <a href="#use-cases">Course reps</a>
              <a href="#use-cases">PTAs and schools</a>
              <a href="#use-cases">Cooperatives</a>
              <a href="#use-cases">Associations</a>
            </div>
            <div>
              <h5>Company</h5>
              <a href="#security">Security</a>
              <a href="mailto:myjeneviv@gmail.com">Contact</a>
              <a href={`${appUrl}/login`}>Log in</a>
            </div>
            <div>
              <h5>Legal</h5>
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms of service</Link>
              <Link href="/terms#refunds">Refund policy</Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
