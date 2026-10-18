import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

const PROOF = [
  "Every naira tied to a name and a reference",
  "Twice-daily settlement to your bank",
  "No screenshots needed — payments are verified",
];

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
  const landing =
    import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel */}
      <aside className="relative hidden overflow-hidden bg-maroon px-12 py-11 text-cream lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(#ffb596 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between">
          <Link to="/" className="text-[22px] font-extrabold tracking-[-0.05em] text-white">
            jeneviv<span className="text-brand">.</span>
          </Link>
          <a
            href={landing}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#c9b3aa] transition-colors hover:text-white"
          >
            <ArrowLeft size={13} /> Back to site
          </a>
        </div>

        <div className="relative mt-auto max-w-[440px]">
          <p className="font-mono text-3xs uppercase tracking-[0.16em] text-[#a98f86]">
            Collections, handled
          </p>
          <h2 className="mt-4 text-[34px] font-extrabold leading-[1.06] tracking-[-0.045em] text-white">
            One link. Every payer. Nothing left to chase.
          </h2>
          <ul className="mt-7 space-y-3">
            {PROOF.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-[#e2d2cb]">
                <Check size={15} className="mt-0.5 shrink-0 text-brand-peach" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-4">
            <blockquote className="text-[13px] leading-relaxed text-[#d9c7c0]">
              &ldquo;We collected from 214 families in one weekend. Last year it
              took three weeks and I still had to call people one by one.&rdquo;
            </blockquote>
            <p className="mt-3 text-[12px] font-semibold text-white">
              Mrs. A. Okafor
              <span className="ml-2 font-normal text-[#a98f86]">
                PTA secretary, Lagos
              </span>
            </p>
          </div>
        </div>

        <p className="relative mt-9 flex items-center gap-2 text-[11.5px] text-[#a98f86]">
          <ShieldCheck size={13} /> Payments powered by Flutterwave · NDPA aligned
        </p>
      </aside>

      {/* form panel */}
      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="text-[21px] font-extrabold tracking-[-0.05em]">
            jeneviv<span className="text-brand">.</span>
          </Link>
          <a
            href={landing}
            className="flex items-center gap-1.5 text-[12.5px] text-ink-muted"
          >
            <ArrowLeft size={13} /> Site
          </a>
        </div>

        <div className="mx-auto my-auto w-full max-w-[420px] py-10">
          <h1 className="text-[27px] font-extrabold leading-tight tracking-[-0.04em]">
            {title}
          </h1>
          <p className="muted mt-2">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-[13px] text-ink-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
