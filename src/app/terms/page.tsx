import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms that govern the use of Jeneviv by coordinators and payers, including refunds and settlement.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="m-page">
      <div className="m-wrap">
        <div className="m-legal-nav">
          <Link href="/" className="m-logo">
            jeneviv<em>.</em>
          </Link>
          <Link href="/" className="m-link">
            Back to home
          </Link>
        </div>
        <header className="m-legal-head">
          <h1>Terms of service</h1>
          <p>Last updated · 1 October 2026</p>
        </header>
        <main className="m-legal">
          <div className="m-legal-body">
            <p>
              These terms govern your use of Jeneviv, operated by Acadeva
              Limited. By creating an account, creating a collection, or paying
              through a collection link, you agree to them. If you do not agree,
              do not use the service.
            </p>

            <h2>1. What Jeneviv does</h2>
            <p>
              Jeneviv is a collection management platform. It lets a coordinator
              create a collection, share a payment link, and track payments. It
              is not a bank and does not hold your money as a deposit. Payments
              are processed by Flutterwave, a licensed payment service provider,
              and settled to the bank account a merchant has verified.
            </p>

            <h2>2. Accounts</h2>
            <p>
              You must be at least 18 years old to create a coordinator account
              and must provide accurate information. You are responsible for
              keeping your login credentials secure and for all activity under
              your account. Coordinator accounts may require email verification
              and merchant approval before collections can receive funds.
            </p>

            <h2>3. Collections and payers</h2>
            <p>
              As a coordinator, you are responsible for the purpose and legality
              of what you collect, the accuracy of the amount and description,
              and for handling payer information lawfully. You must not use
              Jeneviv for fraud, money laundering, prohibited goods or services,
              or any purpose that violates Nigerian law. Payers are responsible
              for entering accurate details and transferring the correct amount;
              a payment is only confirmed when the gateway confirms it.
            </p>

            <h2>4. Fees</h2>
            <p>
              Jeneviv charges 1.5% + ₦100 per successful payment, capped at
              ₦2,000, unless a separate written agreement applies. Fees are
              deducted from the collection and are not charged to payers.
              Failed or reversed payments do not attract a Jeneviv fee. Gateway
              fees are included in the fee shown to you.
            </p>

            <h2>5. Settlement</h2>
            <p>
              Settlements are attempted twice daily on business days and
              weekends, subject to the payment gateway and banking partners. A
              payout can only be made to a verified bank account matching the
              merchant. Settlement may be delayed where a payment is under
              review, a bank is unavailable, or we are required to hold funds by
              law.
            </p>

            <h2>6. Refunds</h2>
            <p id="refunds">
              A coordinator may request a refund of a successful transaction
              from the dashboard. Refunds are made to the original payment
              method through the gateway and are subject to gateway rules and
              the availability of settled funds. Jeneviv fees on refunded
              transactions are not automatically returned. We aim to process
              approved refunds within 5–10 business days, though the receiving
              bank controls when the funds become visible.
            </p>

            <h2>7. Availability and changes</h2>
            <p>
              We work to keep Jeneviv available but do not guarantee
              uninterrupted service. Features may change, and we may suspend an
              account that breaches these terms or creates a security or
              regulatory risk. Where practical, we will give notice and allow
              records to be exported.
            </p>

            <h2>8. Liability</h2>
            <p>
              To the maximum extent permitted by law, Acadeva Limited is not
              liable for indirect or consequential loss, or for loss arising
              from inaccurate information supplied by a coordinator or payer. Our
              aggregate liability for a claim relating to the service is limited
              to the fees Jeneviv earned on the transactions giving rise to the
              claim in the three months before the claim.
            </p>

            <h2>9. Governing law</h2>
            <p>
              These terms are governed by the laws of the Federal Republic of
              Nigeria. Disputes will be subject to the jurisdiction of the courts
              of Lagos State, without prejudice to any mandatory consumer
              protection rights.
            </p>

            <h2>10. Contact</h2>
            <p>
              For questions about these terms, email{" "}
              <a href="mailto:myjeneviv@gmail.com">myjeneviv@gmail.com</a>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
