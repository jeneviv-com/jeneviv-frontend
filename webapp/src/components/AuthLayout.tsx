import { JENEVIV_LOGO } from "@/lib/brand";
import { useGateway } from "@/lib/gateway";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";
import { landingUrl } from "@/lib/landing";

const PROOF = [
  "Every naira tied to a name and a reference",
  "Payments settle straight to your own bank",
  "Verified by the gateway, never by screenshot",
];

/** The rolling words from the landing headline. The first repeats at the end
    so the loop restarts without a jump. */
const ROLL = ["accounted for", "settled", "verified", "reconciled", "accounted for"];

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={JENEVIV_LOGO}
        alt=""
        width={30}
        height={30}
        className="h-[30px] w-[30px] rounded-[9px] bg-white object-cover shadow-[0_1px_2px_rgba(18,16,14,0.14)]"
      />
      <span className="text-[21px] font-bold leading-none tracking-[-0.05em] text-ink">
        jeneviv<span className="text-brand">.</span>
      </span>
    </span>
  );
}

/** The landing page's receipt printer, at rest. */
function Receipt() {
  return (
    <div className="auth-printer" aria-hidden="true">
      <div className="auth-printer-slot" />
      <div className="auth-paper-clip">
        <div className="auth-paper">
          <div className="auth-paper-head">
            <span className="auth-paper-brand">
              <i /> jeneviv
            </span>
            <span>21 Nov · 12:04</span>
          </div>
          <div className="auth-paper-ref">Ref JNV4471</div>
          <div className="auth-rule" />
          <div className="auth-line">
            <span>CSC 311 handout</span>
            <b>₦2,500.00</b>
          </div>
          <div className="auth-line">
            <span>Lab manual</span>
            <b>₦1,500.00</b>
          </div>
          <div className="auth-rule" />
          <div className="auth-total">
            <span>TOTAL</span>
            <b>₦4,000.00</b>
          </div>
          <div className="auth-paper-foot">
            <span>Adaeze O. · 20/ENG/001</span>
            <span className="auth-ok">✓ confirmed · 3s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const gateway = useGateway();
  // Never "" or "/": on the dashboard's own host that would reopen the dashboard.
  const landing = landingUrl();

  return (
    <div className="auth min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)]">
      {/* form side */}
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <a href={landing} aria-label="jeneviv, back to the website">
            <Wordmark />
          </a>
          <a
            href={landing}
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to site
          </a>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] py-12">
          <div className="animate-rise-in">
            <h1 className="auth-title">{title}</h1>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-muted">{subtitle}</p>
          </div>
          <div className="mt-9 animate-rise-in [animation-delay:80ms]">{children}</div>
          <div className="mt-8 border-t border-line pt-6 text-[13.5px] text-ink-muted">{footer}</div>
        </div>
      </main>

      {/* landing side: same headline, same receipt, same quiet tint */}
      <aside className="auth-side relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center">
        <div className="relative mx-auto w-full max-w-[460px] px-10 py-12">
          <h2 className="auth-headline">
            Group money,
            <br />
            <span className="auth-pixel">
              finally
              <span className="auth-roll" aria-label="accounted for.">
                <span className="auth-roll-track" aria-hidden="true">
                  {ROLL.map((word, index) => (
                    <span key={`${word}-${index}`}>
                      {word}
                      <em>.</em>
                    </span>
                  ))}
                </span>
              </span>
            </span>
          </h2>

          <div className="mt-10">
            <Receipt />
          </div>

          <ul className="mt-10 space-y-3">
            {PROOF.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Check size={11} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-10 flex items-center gap-2 text-[12px] text-ink-muted">
            <ShieldCheck size={13} /> Payments settled by {gateway.label} · NDPA aligned
          </p>
        </div>
      </aside>
    </div>
  );
}
