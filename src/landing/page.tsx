"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

const USE_CASES = [
  {
    eyebrow: "Universities",
    title: "Course rep collections",
    amount: "₦1.4M",
    progress: 78,
    sub: "Handouts, manuals, departmental levies",
  },
  {
    eyebrow: "PTA",
    title: "Project levy",
    amount: "₦820k",
    progress: 64,
    sub: "Termly fees and school projects",
  },
  {
    eyebrow: "Cooperative",
    title: "Monthly thrift",
    amount: "₦2.3M",
    progress: 88,
    sub: "Member contributions and dues",
  },
  {
    eyebrow: "Association",
    title: "Annual dues",
    amount: "₦615k",
    progress: 52,
    sub: "Professional & alumni groups",
  },
];

const CHECKLIST = [
  "Dedicated virtual account per payer — no narration matching, no ambiguity",
  "Webhook-verified payments — cryptographically confirmed, fraud structurally impossible",
  "Same-day settlement twice daily including weekends",
  "One-click PDF payer report — name, ID number, amount, date, transaction reference",
  "Automated reminders to non-payers with a single tap",
  "Duplicate payment detection — same ID cannot pay the same collection twice",
  "No app download required for payers — works on any phone, any browser",
];

const TRUST = [
  {
    title: "Regulated infrastructure",
    body: "Payments processed by Flutterwave — a CBN-licensed payment service provider operating under full regulatory compliance in Nigeria.",
  },
  {
    title: "We never see your card",
    body: "Jeneviv does not store, process, or transmit card numbers. All card handling is delegated to Flutterwave, which is PCI-DSS Level 1 certified.",
  },
  {
    title: "Your data, protected",
    body: "We collect only what we need — name, ID number, and email. Data is encrypted at rest and never sold. We are compliant with Nigeria's Data Protection Act 2023.",
  },
  {
    title: "Two-factor authentication",
    body: "Coordinator accounts are protected with email OTP verification. No password alone is sufficient to access a Jeneviv coordinator account.",
  },
  {
    title: "Fraud-proof by design",
    body: "Every payment is confirmed via Flutterwave webhook — not by reading a screenshot, checking a narration, or trusting a user's word. A payment either happened or it didn't.",
  },
  {
    title: "Reconciliation runs continuously",
    body: "A background job queries Flutterwave every 15 minutes to catch any payment where money left a payer's bank but the webhook was delayed. Nothing falls through.",
  },
];

const STATS = [
  { n: "274", l: "Accredited Nigerian universities" },
  { n: "35,000+", l: "Secondary schools with active PTAs" },
  { n: "20,000+", l: "Registered cooperative societies" },
  { n: "₦25B+", l: "Estimated annual informal collection value" },
  { n: "8 hrs", l: "Average time wasted per collection manually" },
  { n: "0", l: "Platforms built for this problem — until now" },
];

const LAUNCH_UNIS = ["FOCOSA", "NACOS", "UNIUYO"];

const ACTIVE_UNIS = ["FOCOSA", "NACOS", "UNIUYO"];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting)
            setTimeout(() => e.target.classList.add("vis"), i * 70);
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".reveal, .stagger")
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <>
      <Navbar
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        scrollTo={scrollTo}
      />

      {/* HERO */}
      <section className="k-hero">
        <div className="k-hero-inner reveal">
          <div className="k-hero-copy">
            <h1 className="k-h1">
              One place to <span className="k-h1-accent">collect it all</span>
            </h1>
            <p className="k-lede">
              Jeneviv gives course reps, PTA chairs, cooperative secretaries,
              and group coordinators a payment link, real-time dashboard, and
              verified payer report — without a single screenshot, spreadsheet,
              or WhatsApp message.
            </p>
            <div className="k-hero-cta">
              <Link href="/auth/signup" className="k-btn-primary">
                Get started
              </Link>
              <button
                className="k-btn-ghost"
                onClick={() => scrollTo("how")}
                type="button"
              >
                See how it works ↓
              </button>
            </div>
          </div>
          <div className="k-hero-laptop" aria-hidden="true">
            <div className="k-laptop">
              <div className="k-laptop-bezel">
                <div className="k-laptop-camera"></div>
                <div className="k-laptop-screen">
                  <div className="k-lap-top">
                    <span className="k-lap-brand">jeneviv</span>
                    <div className="k-lap-top-actions">
                      <span className="k-lap-dot k-lap-dot-1"></span>
                      <span className="k-lap-dot k-lap-dot-2"></span>
                      <span className="k-lap-dot k-lap-dot-3"></span>
                    </div>
                  </div>
                  <div className="k-lap-body">
                    <aside className="k-lap-side">
                      <div className="k-lap-side-item active">
                        <span className="k-lap-ic">▦</span> Dashboard
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">▤</span> Collections
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">▣</span> Payers
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">◈</span> Wallet
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">⇄</span> Transactions
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">↺</span> Refunds
                      </div>
                      <div className="k-lap-side-label">Accept payments</div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">▪</span> Jeneviv Pay
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">⊞</span> Payment Link
                      </div>
                      <div className="k-lap-side-item">
                        <span className="k-lap-ic">⊟</span> Settlements
                      </div>
                      <div className="k-lap-contact">Contact us</div>
                    </aside>
                    <div className="k-lap-main">
                      <div className="k-lap-feature">
                        <div className="k-lap-feature-text">
                          <h4>Start a collection today</h4>
                          <p>
                            Effortless, secure, and instant collections for
                            Nigerian groups with Jeneviv&apos;s payment links.
                          </p>
                          <button className="k-lap-feature-btn">
                            Create collection
                          </button>
                        </div>
                      </div>
                      <div className="k-lap-section-title">
                        Collections overview
                      </div>
                      <div className="k-lap-stats">
                        <div className="k-lap-stat">
                          <div className="k-lap-stat-l">Today</div>
                          <div className="k-lap-stat-n">₦1,652.50</div>
                        </div>
                        <div className="k-lap-stat">
                          <div className="k-lap-stat-l">This week</div>
                          <div className="k-lap-stat-n">₦184,500</div>
                        </div>
                        <div className="k-lap-stat">
                          <div className="k-lap-stat-l">This month</div>
                          <div className="k-lap-stat-n">₦612,300</div>
                        </div>
                      </div>
                      <div className="k-lap-chart">
                        <div className="k-lap-chart-head">
                          <span>Collections</span>
                          <span className="k-lap-chart-peak">₦4,000</span>
                        </div>
                        <svg
                          className="k-lap-chart-svg"
                          viewBox="0 0 300 90"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient
                              id="kFill"
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >
                              <stop
                                offset="0"
                                stopColor="#FE4900"
                                stopOpacity="0.25"
                              />
                              <stop
                                offset="1"
                                stopColor="#FE4900"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,70 C30,55 50,40 75,55 C105,72 130,30 160,40 C195,52 215,15 250,28 L300,18 L300,90 L0,90 Z"
                            fill="url(#kFill)"
                          />
                          <path
                            d="M0,70 C30,55 50,40 75,55 C105,72 130,30 160,40 C195,52 215,15 250,28 L300,18"
                            stroke="#FE4900"
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="k-laptop-base">
                <div className="k-laptop-notch"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LAUNCHING AT */}
      <section className="k-launch">
        <span className="k-launch-label">Organization who use Jeneviv</span>
        <div className="k-launch-pills">
          {LAUNCH_UNIS.map((u) => (
            <span key={u} className="k-launch-pill">
              {u}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURE 1 — for coordinators */}
      <section className="k-feat" id="how">
        <div className="k-feat-inner reveal">
          <div className="k-feat-copy">
            <span className="k-feat-eyebrow">For Coordinators</span>
            <h2 className="k-h2">
              Create a collection. Share a link. We handle everything else.
            </h2>
            <p className="k-body">
              Set up a payment collection in under two minutes — name it, set
              the amount, configure what info you need from each payer, and
              share a unique link. Jeneviv automatically verifies every payment
              via Flutterwave, captures payer identity, and updates your
              dashboard in real time. No receipt chasing. No manual
              spreadsheets. No follow-up calls.
            </p>
            <Link href="/auth/signup" className="k-link-arrow">
              Create your first collection <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="k-feat-visual k-feat-visual-1" aria-hidden="true">
            <div className="k-mock-card">
              <div className="k-mock-card-head">
                <span className="k-mock-live">● LIVE</span>
                <span className="k-mock-tag">CSC311 Handout</span>
              </div>
              <div className="k-mock-amt">₦340,000</div>
              <div className="k-mock-sub">collected from 136 of 200 payers</div>
              <div className="k-mock-track">
                <div className="k-mock-bar" style={{ width: "68%" }} />
              </div>
              <div className="k-mock-rows">
                {[
                  ["Adaeze Okonkwo", "20/ENG/001", "on"],
                  ["Emeka Nwosu", "20/ENG/004", "on"],
                  ["Fatima Musa", "20/ENG/007", ""],
                ].map(([n, id, m]) => (
                  <div className="k-mock-row" key={n}>
                    <div className="k-mock-name">{n}</div>
                    <div className="k-mock-id">{id}</div>
                    <div className={`k-mock-mark${m === "on" ? " on" : ""}`}>
                      {m === "on" ? "+" : "·"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2 — for payers */}
      <section className="k-feat k-feat-alt">
        <div className="k-feat-inner reveal reverse">
          <div className="k-feat-copy">
            <span className="k-feat-eyebrow">For Payers</span>
            <h2 className="k-h2">Pay in 60 seconds. Receipt in your inbox.</h2>
            <p className="k-body">
              Open the link your coordinator shared, enter your name and ID
              number, and transfer the exact amount to your dedicated account.
              Jeneviv confirms your payment automatically — no login, no app
              download, no sending screenshots to prove you paid. Your receipt
              arrives by email within 60 seconds and stays downloadable forever.
            </p>
            <Link href="/auth/signup" className="k-link-arrow">
              See how paying works <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="k-feat-visual k-feat-visual-2" aria-hidden="true">
            <div className="k-phone">
              <div className="k-phone-notch" />
              <div className="k-phone-screen">
                <div className="k-phone-bar">9:41</div>
                <div className="k-phone-h">Pay your levy</div>
                <div className="k-phone-card">
                  <div className="k-phone-row">
                    <span>Amount</span>
                    <strong>₦2,500</strong>
                  </div>
                  <div className="k-phone-row">
                    <span>Bank</span>
                    <strong>Wema</strong>
                  </div>
                  <div className="k-phone-row">
                    <span>Account</span>
                    <strong>3911 4928 19</strong>
                  </div>
                </div>
                <div className="k-phone-toast">
                  <div className="k-phone-toast-ico">+</div>
                  <div>
                    <div className="k-phone-toast-t">Payment confirmed</div>
                    <div className="k-phone-toast-s">Receipt sent · now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 3 — for everyone (STAT CARDS) */}
      <section className="k-feat k-feat-cream" id="who">
        <div className="k-feat-inner reveal">
          <div className="k-feat-copy">
            <span className="k-feat-eyebrow">Built for Nigeria</span>
            <h2 className="k-h2">
              From universities to cooperatives — one platform for every group
              collection
            </h2>
            <p className="k-body">
              Jeneviv starts where the pain is most acute — Nigerian university
              course reps collecting for handouts, manuals, and departmental
              levies. But the same infrastructure works for PTAs collecting
              school fees, cooperative societies running monthly thrift,
              professional associations collecting annual dues, and faith
              communities running building fund drives. Any coordinator. Any
              group. Any collection.
            </p>
            <Link href="/auth/signup" className="k-link-arrow">
              See all use cases <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="k-usecase-grid stagger">
            {USE_CASES.map((u) => (
              <div className="k-usecase" key={u.title}>
                <span className="k-usecase-eyebrow">{u.eyebrow}</span>
                <h3 className="k-usecase-title">{u.title}</h3>
                <div className="k-usecase-amt">{u.amount}</div>
                <div className="k-usecase-track">
                  <div
                    className="k-usecase-bar"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE 4 — settlement */}
      <section className="k-feat" id="payments">
        <div className="k-feat-inner reveal reverse">
          <div className="k-feat-copy">
            <span className="k-feat-eyebrow">Settlement</span>
            <h2 className="k-h2">
              Funds in your account the same day. Not tomorrow.
            </h2>
            <p className="k-body">
              Every payment made on Jeneviv settles to your bank account twice
              daily — including weekends and public holidays — powered by
              Flutterwave&apos;s infrastructure. No waiting until the next
              business day. No holding funds on a platform wallet. When your
              students pay on Saturday morning, you have the money by Saturday
              evening. Exactly when you need it.
            </p>
            <Link href="/auth/signup" className="k-link-arrow">
              Learn about settlement <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="k-feat-visual k-feat-visual-3" aria-hidden="true">
            <div className="k-settle">
              <div className="k-settle-row">
                <div className="k-settle-time">10:00</div>
                <div className="k-settle-line">
                  <span className="k-settle-dot on" />
                  <div className="k-settle-body">
                    <strong>Morning settlement</strong>
                    <span>₦184,500 sent to Wema ••2104</span>
                  </div>
                </div>
              </div>
              <div className="k-settle-row">
                <div className="k-settle-time">22:00</div>
                <div className="k-settle-line">
                  <span className="k-settle-dot on" />
                  <div className="k-settle-body">
                    <strong>Evening settlement</strong>
                    <span>₦96,300 sent to Wema ••2104</span>
                  </div>
                </div>
              </div>
              <div className="k-settle-row">
                <div className="k-settle-time">Sat</div>
                <div className="k-settle-line">
                  <span className="k-settle-dot" />
                  <div className="k-settle-body">
                    <strong>Weekend payouts included</strong>
                    <span>Same schedule. Every day. No exceptions.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="k-check">
        <div className="k-check-inner reveal">
          <h2 className="k-h2 k-h2-center">
            Built for the way Nigerian groups actually collect money
          </h2>
          <ul className="k-check-list stagger">
            {CHECKLIST.map((c) => (
              <li key={c}>
                <span className="k-check-ic" aria-hidden="true">+</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TRUST */}
      <section className="k-trust">
        <div className="k-trust-inner reveal">
          <div className="k-trust-head">
            <h2 className="k-h2">Your collections are safe with us</h2>
            <p className="k-body">
              Every naira collected through Jeneviv is handled by regulated,
              licenced payment infrastructure. We never touch card data, never
              hold funds on a platform wallet, and never process a payment that
              hasn&apos;t been cryptographically verified.
            </p>
          </div>
          <div className="k-trust-grid stagger">
            {TRUST.map((t) => (
              <div className="k-trust-card" key={t.title}>
                <h4 className="k-trust-title">{t.title}</h4>
                <p className="k-trust-body">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="k-stats">
        <div className="k-stats-inner reveal">
          <h2 className="k-h2">The problem in numbers</h2>
          <div className="k-stats-grid stagger">
            {STATS.map((s) => (
              <div className="k-stat" key={s.l}>
                <div className="k-stat-n">{s.n}</div>
                <div className="k-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHERE WE'RE ACTIVE */}
      <section className="k-active">
        <div className="k-active-inner reveal">
          <h2 className="k-h2">Where we&apos;re launching</h2>
          <p className="k-body k-body-max">
            Jeneviv launches across Nigerian universities in 2026, starting with
            federal, state, and private institutions in Lagos, Rivers, Akwa
            Ibom, Imo, Enugu, Oyo, Kwara, and Adamawa — then expanding to
            secondary schools, cooperatives, and associations nationwide.
          </p>
          <div className="k-active-pills">
            {ACTIVE_UNIS.map((u) => (
              <span key={u} className="k-active-pill">
                {u}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="k-cta" id="waitlist">
        <div className="k-cta-inner reveal">
          <h2 className="k-cta-h">Ready to end the receipt chaos?</h2>
          <p className="k-cta-body">
            Join coordinators across Nigeria — universities, PTAs, cooperatives,
            associations, and faith groups — who are collecting smarter with
            Jeneviv. Free to start. Takes two minutes.
          </p>
          <Link href="/auth/signup" className="k-cta-btn">
            Get started <span aria-hidden>→</span>
          </Link>
          <p className="k-cta-sub">
            No payment required. No app download. Cancel anytime.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="k-foot">
        <div className="k-foot-inner">
          <div className="k-foot-brand">
            <Link href="/" className="k-foot-logo">
              <span>Jeneviv.</span>
            </Link>
            <p className="k-foot-tag">Collections, handled.</p>
            <p className="k-foot-desc">
              Built for every Nigerian group that collects money from its
              members and needs documentation to prove it.
            </p>
          </div>
          <div className="k-foot-cols">
            <div>
              <h5>Product</h5>
              <ul>
                <li>
                  <a href="#">How it works</a>
                </li>
                <li>
                  <a href="#">For universities</a>
                </li>
                <li>
                  <a href="#">For PTAs</a>
                </li>
                <li>
                  <a href="#">For cooperatives</a>
                </li>
                <li>
                  <a href="#">For associations</a>
                </li>
                <li>
                  <a href="#">Pricing</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Company</h5>
              <ul>
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="mailto:myjeneviv@gmail.com">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Legal</h5>
              <ul>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Refund Policy</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Developers</h5>
              <ul>
                <li>
                  <a href="#">API docs</a>
                </li>
                <li>
                  <a href="#">Webhook reference</a>
                </li>
                <li>
                  <a href="#">Sandbox</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="k-foot-bottom">
          <div className="k-foot-tags">
            <span className="k-foot-tag">Flutterwave Powered</span>
            <span className="k-foot-tag">NDPA Compliant</span>
            <span className="k-foot-tag">CAC Registered</span>
          </div>
          <p className="k-foot-copy">
            © 2026 Acadeva Limited. Built in Nigeria, for Nigeria.
          </p>
        </div>
      </footer>
    </>
  );
}
