"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("uni");
  const [collectingWord, setCollectingWord] = useState("collecting.");
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const synonyms = ["collecting.", "gathering.", "compiling.", "banking."];
    let idx = 0;
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        idx = (idx + 1) % synonyms.length;
        setCollectingWord(synonyms[idx]);
        setWordVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting)
            setTimeout(() => e.target.classList.add("vis"), i * 80);
        });
      },
      { threshold: 0.08 },
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
      <div className="hero-wrap">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="hero-inner">
          <div className="hero-left">
            <h1>
              Stop verifying
              <br />
              <span className="line-italic">WhatsApp receipts.</span>
              Start{" "}
              <span
                className={`highlight collecting-word${wordVisible ? " vis" : " out"}`}
              >
                {collectingWord}
              </span>
            </h1>
            <p className="hero-sub">
              Jeneviv gives any group coordinator a payment link, real-time
              dashboard, and verified payer report — without a single screenshot
              or spreadsheet.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => scrollTo("waitlist")}
              >
                See how it works
              </button>
              <button className="btn-demo" onClick={() => scrollTo("how")}>
                ▶ Watch a demo
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="char-blob char-blob-1"></div>
            <div className="char-blob char-blob-2"></div>
            <div className="notif notif-1">
              <div className="notif-icon">✅</div>
              <div>
                <div className="notif-title">Payment confirmed</div>
                <div className="notif-sub">Receipt sent · just now</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-top">
                <div>
                  <div className="dash-collection-sub">Active Collection</div>
                  <div className="dash-collection-name">
                    300L CSC311 Handout
                  </div>
                </div>
                <div className="live-chip">LIVE</div>
              </div>
              <div className="dash-body">
                <div className="amount-display">
                  <div>
                    <div className="amount-label">Total collected</div>
                    <div className="amount-main">₦340,000</div>
                  </div>
                  <div className="amount-target">
                    <div className="amount-label">Target</div>
                    <div className="t-num">₦500,000</div>
                  </div>
                </div>
                <div className="prog-wrap">
                  <div className="prog-labels">
                    <span>136 of 200 paid</span>
                    <span className="prog-pct">68%</span>
                  </div>
                  <div className="prog-track">
                    <div className="prog-bar"></div>
                  </div>
                </div>
                <div className="payers">
                  <div className="payer">
                    <div className="payer-av" style={{ background: "#3D1F8F" }}>
                      A
                    </div>
                    <div className="payer-info">
                      <div className="payer-name">Adaeze Okonkwo</div>
                      <div className="payer-reg">20/ENG/001</div>
                    </div>
                    <span className="status-pill s-paid">Paid</span>
                  </div>
                  <div className="payer">
                    <div className="payer-av" style={{ background: "#fe4900" }}>
                      E
                    </div>
                    <div className="payer-info">
                      <div className="payer-name">Emeka Nwosu</div>
                      <div className="payer-reg">20/ENG/004</div>
                    </div>
                    <span className="status-pill s-paid">Paid</span>
                  </div>
                  <div className="payer">
                    <div className="payer-av" style={{ background: "#2ABFAA" }}>
                      F
                    </div>
                    <div className="payer-info">
                      <div className="payer-name">Fatima Musa</div>
                      <div className="payer-reg">20/ENG/007</div>
                    </div>
                    <span className="status-pill s-pend">Pending</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="notif notif-2">
              <div className="notif-icon">📄</div>
              <div>
                <div className="notif-title">Report ready</div>
                <div className="notif-sub">136 payers · PDF export</div>
              </div>
            </div>
          </div>
        </div>
        {/* MARQUEE */}
        <div className="marquee-section">
          <div className="marquee-track">
            {[
              { color: "#8B6BF5", text: "No more WhatsApp receipts" },
              { color: "#fe4900", text: "Instant verification" },
              { color: "#2ABFAA", text: "One-click PDF reports" },
              { color: "#fe4900", text: "Free for coordinators" },
              { color: "#8B6BF5", text: "Flutterwave powered" },
              { color: "#fe4900", text: "Zero fraud risk" },
              { color: "#2ABFAA", text: "Built for Nigeria" },
              { color: "#8B6BF5", text: "No more WhatsApp receipts" },
              { color: "#fe4900", text: "Instant verification" },
              { color: "#2ABFAA", text: "One-click PDF reports" },
              { color: "#fe4900", text: "Free for coordinators" },
              { color: "#8B6BF5", text: "Flutterwave powered" },
              { color: "#fe4900", text: "Zero fraud risk" },
              { color: "#2ABFAA", text: "Built for Nigeria" },
            ].map((item, i) => (
              <span key={i} className="m-item">
                <span
                  className="m-gem"
                  style={{ background: item.color }}
                ></span>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="logos-band">
        <span className="logos-label">Launching at</span>
        {[
          "UNILAG",
          "UNIBEN",
          "OAU",
          "LAUTECH",
          "FUTA",
          "UNIZIK",
          "ABU",
          "UNIUYO",
        ].map((u) => (
          <span key={u} className="uni-pill">
            {u}
          </span>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div
        style={{
          background: "var(--card)",
          borderTop: "1px solid var(--rule)",
        }}
      >
        <div className="sec reveal" id="how">
          <div className="stag-label">// How it works</div>
          <h2>
            From link to <em>documentation</em>
            <br />
            in under 60 seconds
          </h2>
          <p className="sec-sub">
            Create a collection, share a link, let Flutterwave confirm every
            payment. Your payer list builds itself.
          </p>
          <div className="hiw-grid stagger">
            <div className="hiw-card">
              <div className="hiw-num">01</div>
              <h3>Create a collection</h3>
              <p>
                Set name, amount, deadline, and member fields. Done in 2 minutes
                — no IT department, no approval needed.
              </p>
            </div>
            <div className="hiw-card">
              <div className="hiw-num">02</div>
              <h3>Share the link</h3>
              <p>
                Unique payment URL and QR code generated instantly. Drop it in
                your WhatsApp group — no app download needed.
              </p>
            </div>
            <div className="hiw-card">
              <div className="hiw-num">03</div>
              <h3>Members pay instantly</h3>
              <p>
                Bank transfer via Flutterwave. Webhook confirms in seconds.
                Receipt email sent. Dashboard updates live.
              </p>
            </div>
            <div className="hiw-card">
              <div className="hiw-num">04</div>
              <h3>Export your report</h3>
              <p>
                One-click PDF — name, ID, amount, date. Ready for your HOD,
                vendor, auditor, or board.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOR WHO */}
      <div
        style={{
          background: "var(--cream)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="sec reveal" id="who">
          <div className="stag-label">// Who uses Jeneviv</div>
          <h2>
            One platform.
            <br />
            <em>Every</em> group collection.
          </h2>
          <p className="sec-sub">
            Course reps, PTA chairs, cooperative secretaries, alumni treasurers,
            church coordinators — anyone who collects from a group and needs
            documentation.
          </p>
          <div className="aud-tabs">
            {[
              { id: "uni", label: "🎓 Universities" },
              { id: "pta", label: "🏫 Schools & PTAs" },
              { id: "coop", label: "🤝 Cooperatives" },
              { id: "assoc", label: "⚖️ Associations" },
              { id: "faith", label: "⛪ Faith Groups" },
            ].map((t) => (
              <button
                key={t.id}
                className={`aud-tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* UNI */}
          <div
            className={`who-grid aud-panel${activeTab === "uni" ? " active" : ""}`}
          >
            <div className="who-card who-rep">
              <div className="who-deco"></div>
              <div className="who-chip">Course Representatives</div>
              <h3 className="who-rep-h3">You collect. We document.</h3>
              <p className="who-rep-p">
                Create collections, monitor payments in real time, send
                reminders, close with a verified report. No WhatsApp chaos.
              </p>
              <ul className="who-feats">
                {[
                  "Real-time payment dashboard",
                  "Shareable link + QR code",
                  "One-click reminders to non-payers",
                  "PDF payer report with reg numbers",
                  "Zero receipt verification",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="who-card who-payer">
              <div className="who-deco"></div>
              <div className="who-chip who-payer-chip">Students</div>
              <h3>Pay in 60 seconds. Done.</h3>
              <p className="who-payer-p">
                Open the link, enter your reg number, pay via bank transfer.
                Instant receipt in your inbox.
              </p>
              <ul className="who-feats who-feats-payer">
                {[
                  "No account needed to pay",
                  "Bank transfer via Flutterwave",
                  "Instant PDF receipt by email",
                  "Payment history dashboard",
                  "Re-download receipts anytime",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check feat-check-teal">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PTA */}
          <div
            className={`who-grid aud-panel${activeTab === "pta" ? " active" : ""}`}
          >
            <div
              className="who-card"
              style={{ background: "linear-gradient(135deg,#1A5C3A,#2E8B57)" }}
            >
              <div className="who-deco"></div>
              <div className="who-chip">PTA Chairs & Admins</div>
              <h3 className="who-rep-h3">
                Collect every levy. Document every parent.
              </h3>
              <p className="who-rep-p">
                Textbook fees, excursion levies, uniform contributions — one
                link per term, PDF report for the principal.
              </p>
              <ul className="who-feats">
                {[
                  "Per-term collection scheduling",
                  "Parent + ward name capture",
                  "Verified payer list for school records",
                  "Deadline-based auto-closure",
                  "Export for school management",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="who-card who-payer">
              <div className="who-deco"></div>
              <div className="who-chip who-payer-chip">Parents</div>
              <h3>Pay from anywhere. No queues. No cash.</h3>
              <p className="who-payer-p">
                Click the link, pay in 60 seconds, get a receipt that proves
                your child{"'"}s levy is sorted.
              </p>
              <ul className="who-feats who-feats-payer">
                {[
                  "No app download required",
                  "Pay for multiple children easily",
                  "Instant receipt for school records",
                  "Full payment history per child",
                  "Re-download anytime",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check feat-check-teal">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* COOP */}
          <div
            className={`who-grid aud-panel${activeTab === "coop" ? " active" : ""}`}
          >
            <div
              className="who-card"
              style={{ background: "linear-gradient(135deg,#7A3B00,#C4620A)" }}
            >
              <div className="who-deco"></div>
              <div className="who-chip">Cooperative Secretaries</div>
              <h3 className="who-rep-h3">Monthly thrift. Zero paperwork.</h3>
              <p className="who-rep-p">
                Run monthly contributions on Jeneviv. Every member pays to their
                dedicated account. AGM report in one click.
              </p>
              <ul className="who-feats">
                {[
                  "Monthly recurring collections",
                  "Member registry + payment history",
                  "Instant default detection",
                  "Annual summary export",
                  "No cash handling",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="who-card who-payer">
              <div className="who-deco"></div>
              <div className="who-chip who-payer-chip">Cooperative Members</div>
              <h3>Pay your thrift. Proof always on hand.</h3>
              <p className="who-payer-p">
                Transfer monthly contribution. Receipt arrives instantly. Full
                history always accessible.
              </p>
              <ul className="who-feats who-feats-payer">
                {[
                  "Dedicated account per member",
                  "Instant receipt every month",
                  "Full contribution history",
                  "Dispute-proof documentation",
                  "No app needed",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check feat-check-teal">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ASSOC */}
          <div
            className={`who-grid aud-panel${activeTab === "assoc" ? " active" : ""}`}
          >
            <div
              className="who-card"
              style={{ background: "linear-gradient(135deg,#1A2E6B,#2D4DB8)" }}
            >
              <div className="who-deco"></div>
              <div className="who-chip">Association Treasurers</div>
              <h3 className="who-rep-h3">
                Dues collected. Members documented.
              </h3>
              <p className="who-rep-p">
                Alumni dues, professional levies, chapter contributions — one
                link reaches thousands.
              </p>
              <ul className="who-feats">
                {[
                  "Scales to thousands of members",
                  "Annual dues + special levies",
                  "Member verification layer",
                  "Compliance-ready reports",
                  "Committee-level reporting",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="who-card who-payer">
              <div className="who-deco"></div>
              <div className="who-chip who-payer-chip">Association Members</div>
              <h3>Pay your dues. Stay in good standing.</h3>
              <p className="who-payer-p">
                Pay annual dues in 60 seconds. Proof of payment is instant,
                downloadable, always available.
              </p>
              <ul className="who-feats who-feats-payer">
                {[
                  "One-time or recurring dues",
                  "Instant membership receipt",
                  "Downloadable proof of payment",
                  "History across years",
                  "No bank visit needed",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check feat-check-teal">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAITH */}
          <div
            className={`who-grid aud-panel${activeTab === "faith" ? " active" : ""}`}
          >
            <div
              className="who-card"
              style={{ background: "linear-gradient(135deg,#4A1A6B,#7B3AAD)" }}
            >
              <div className="who-deco"></div>
              <div className="who-chip">Church & Mosque Coordinators</div>
              <h3 className="who-rep-h3">
                Building fund. Welfare drive. All documented.
              </h3>
              <p className="who-rep-p">
                Run building fund drives and welfare collections with full
                transparency. Every naira accounted for.
              </p>
              <ul className="who-feats">
                {[
                  "Named project collections",
                  "Open-ended or deadline collections",
                  "Real-time total for announcements",
                  "Full contributor documentation",
                  "Transparent fund tracking",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="who-card who-payer">
              <div className="who-deco"></div>
              <div className="who-chip who-payer-chip">
                Congregation Members
              </div>
              <h3>Give from anywhere. Anytime.</h3>
              <p className="who-payer-p">
                Contribute via a simple payment link — from home, from work.
                Your giving is recorded and receipted immediately.
              </p>
              <ul className="who-feats who-feats-payer">
                {[
                  "Give without attending physically",
                  "Named contribution receipt",
                  "Contribute to multiple funds",
                  "Full giving history",
                  "No account needed",
                ].map((f) => (
                  <li key={f}>
                    <span className="feat-check feat-check-teal">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT INFRASTRUCTURE */}
      <div className="pay-band" id="payments">
        <div className="pay-inner reveal">
          <div className="pay-copy">
            <div className="stag-label gold">// Payment infrastructure</div>
            <h2 className="white">
              Powered by
              <br />
              <em className="gold-em">Flutterwave.</em>
            </h2>
            <p className="white-muted">
              Every payer gets a dedicated virtual bank account — just a
              standard bank transfer, no card needed. Flutterwave confirms in
              seconds via webhook.
            </p>
            <div className="pay-metrics">
              <div className="pay-metric">
                <div className="pay-metric-n">&lt;5s</div>
                <div className="pay-metric-l">Payment confirmation</div>
              </div>
              <div className="pay-metric">
                <div className="pay-metric-n">₦100 + 1.5%</div>
                <div className="pay-metric-l">Platform fee per payer</div>
              </div>
              <div className="pay-metric">
                <div className="pay-metric-n">100%</div>
                <div className="pay-metric-l">Webhook-verified payments</div>
              </div>
              <div className="pay-metric">
                <div className="pay-metric-n">0</div>
                <div className="pay-metric-l">Manual receipt checks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ background: "var(--card)" }}>
        <div className="sec reveal">
          <div className="stag-label">// What they say</div>
          <h2>
            From universities to
            <br />
            <em>everywhere else.</em>
          </h2>
          <p className="sec-sub">
            Real feedback from coordinators across every group Jeneviv serves.
          </p>
          <div className="testi-grid stagger">
            {[
              {
                q: "I used to spend the entire weekend sorting screenshots. Jeneviv closed a 200-student collection in one afternoon with a clean report for my HOD.",
                name: "Chidi Eze",
                role: "Course Rep, Engineering · UNILAG",
                av: "C",
                bg: "#0D6B5E",
              },
              {
                q: "Our PTA used to chase parents for weeks. With Jeneviv I shared one link and had 80% payment rate in 3 days.",
                name: "Blessing Adeyemi",
                role: "PTA Chair · Ikeja Grammar School, Lagos",
                av: "B",
                bg: "#1A5C3A",
              },
              {
                q: "I run a 60-member cooperative. Before Jeneviv I argued every month about who paid. Now the system does it.",
                name: "Onyeka Mbah",
                role: "Secretary · Enugu Staff Cooperative",
                av: "O",
                bg: "#7A3B00",
              },
            ].map((t) => (
              <div key={t.name} className="tc">
                <div className="tc-stars">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <p className="tc-text">&ldquo;{t.q}&rdquo;</p>
                <div className="tc-author">
                  <div className="tc-av" style={{ background: t.bg }}>
                    {t.av}
                  </div>
                  <div>
                    <div className="tc-name">{t.name}</div>
                    <div className="tc-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section" id="waitlist">
        <div className="cta-circle-1"></div>
        <div className="cta-circle-2"></div>
        <h2>
          Ready to end
          <br />
          the <em>receipt chaos?</em>
        </h2>
        <p>
          Join coordinators across Nigeria — universities, PTAs, cooperatives,
          associations — collecting smarter with Jeneviv.
        </p>
        <a href="mailto:myjeneviv@gmail.com" className="cta-btn">
          Contact us
        </a>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <a href="#" className="ft-logo">
              Jeneviv<span className="ft-logo-dot"></span>
            </a>
            <p className="ft-desc">
              Collections, handled. Built for every Nigerian group that needs
              better payment documentation.
            </p>
          </div>
          <div className="ft-col">
            <h4>Product</h4>
            <ul>
              <li>
                <button onClick={() => scrollTo("how")}>How it works</button>
              </li>
              <li>
                <button onClick={() => scrollTo("who")}>For who</button>
              </li>
              <li>
                <button onClick={() => scrollTo("payments")}>
                  Payment infrastructure
                </button>
              </li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="mailto:myjeneviv@gmail.com">Contact</a>
              </li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Legal</h4>
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
        </div>
        <div className="footer-bottom">
          <p className="ft-copy">
            © 2026 Jeneviv Limited. Built in Nigeria, for Nigeria.
          </p>
          <div className="ft-tags">
            <span className="ft-tag">Flutterwave Powered</span>
            <span className="ft-tag">NDPA Compliant</span>
            <span className="ft-tag">CAC Registered</span>
          </div>
        </div>
      </footer>
    </>
  );
}
