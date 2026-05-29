import Link from "next/link";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-left">
        <Link href="/" className="auth-logo">
          <span className="auth-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <polygon points="28,8 72,18 56,72 12,62" fill="#FFAD86" />
              <polygon points="32,14 66,22 50,66 16,58" fill="#FE4900" />
              <circle cx="41" cy="40" r="5" fill="#ffffff" />
            </svg>
          </span>
          <span>jeneviv</span>
        </Link>
        <div className="auth-left-inner">{children}</div>
      </div>
      <aside className="auth-right" aria-hidden="true">
        <h2 className="auth-right-headline">
          Accept and document
          <br />
          payments
          <br />
          seamlessly
        </h2>
        <div className="auth-right-mock">
          <div className="auth-mock-coin auth-mock-coin-naira">₦</div>
          <div className="auth-mock-coin auth-mock-coin-k">J</div>
          <div className="auth-mock-dash">
            <div className="auth-mock-dash-top">
              <span className="auth-mock-brand">jeneviv</span>
              <span className="auth-mock-date">Today, 30 August, 2026</span>
            </div>
            <div className="auth-mock-dash-body">
              <div className="auth-mock-sidebar">
                <div className="auth-mock-side-label">Main pages</div>
                <div className="auth-mock-side-item active">Dashboard</div>
                <div className="auth-mock-side-item">Balances</div>
                <div className="auth-mock-side-item">Transactions</div>
                <div className="auth-mock-side-item">Analytics</div>
                <div className="auth-mock-side-label">Accept payments</div>
                <div className="auth-mock-side-item">Jeneviv Checkout</div>
                <div className="auth-mock-side-item">Payment Links</div>
                <div className="auth-mock-side-label">Send collections</div>
                <div className="auth-mock-side-item">Jeneviv Wire</div>
              </div>
              <div className="auth-mock-main">
                <div className="auth-mock-sales-head">
                  <span>Collections overview</span>
                </div>
                <div className="auth-mock-sales-card">
                  <div className="auth-mock-sales-sub">
                    Today&apos;s collections
                  </div>
                  <div className="auth-mock-sales-amt">₦50,000.50</div>
                </div>
                <div className="auth-mock-graph">
                  <div className="auth-mock-graph-head">
                    <span>Sales</span>
                    <span className="auth-mock-chip on">7 days</span>
                    <span className="auth-mock-chip">30 days</span>
                    <span className="auth-mock-currency">NGN</span>
                  </div>
                  <div className="auth-mock-graph-area">
                    <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                      <path
                        d="M0,40 C30,20 60,55 90,30 C120,8 150,45 180,20 L200,15"
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
        </div>
      </aside>
    </div>
  );
}
