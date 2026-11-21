import Link from "next/link";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

export default function SiteFooter() {
  return (
    <footer className="m-footer">
      <div className="m-wrap">
        <div className="m-footer-top">
          <div className="m-footer-brand">
            <Link href="/" className="m-logo">
              <img
                src="/assets/images/jeneviv.png"
                alt=""
                width={28}
                height={28}
                className="m-logo-mark"
              />
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
            <span className="m-footer-badge">Paystack powered</span>
            <span className="m-footer-badge">NDPA aligned</span>
            <span className="m-footer-badge">CAC registered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
