import { ReactNode } from "react";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import LaptopMockup from "@/components/LaptopMockup";

const PROOF = [
  "Every naira tied to a name and a reference",
  "Payments settle straight to your own bank",
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
  const landing = import.meta.env.VITE_PUBLIC_APP_URL || "/";

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[1.08fr_1fr]">
      {/* brand panel — the same laptop and dashboard shown on the landing page */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-[#fbfaf7] px-10 py-8 lg:flex lg:flex-col xl:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(to_right,rgba(16,16,16,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,16,16,0.045)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]"
        />

        <div className="relative flex items-center justify-between">
          <a
            href={landing}
            className="flex items-center gap-2.5"
            aria-label="Jeneviv — back to the website"
          >
            <img
              src="/assets/images/jeneviv.png"
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-[30px] rounded-[9px] object-cover shadow-[0_1px_2px_rgba(18,16,14,0.14)]"
            />
            <span className="flex items-baseline gap-0.5">
              <span className="text-[21px] font-extrabold leading-none tracking-[-0.055em] text-ink">
                jeneviv
              </span>
              <span className="text-[24px] leading-none text-brand">.</span>
            </span>
          </a>
          <a
            href={landing}
            className="group flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft
              size={13}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Back to site
          </a>
        </div>

        <div className="relative my-auto w-full max-w-[620px] self-center py-9">
          <LaptopMockup className="animate-rise-in" />

          <div className="mt-8 animate-rise-in [animation-delay:120ms]">
            <p className="eyebrow">One link. Every payer.</p>
            <h2 className="mt-2 text-[24px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink xl:text-[27px]">
              The dashboard you sign in to looks exactly like this.
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {PROOF.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-[12.5px] text-ink-muted"
                >
                  <Check size={13} className="shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-[11.5px] text-ink-faint">
          <ShieldCheck size={13} /> Payments settled by Paystack · NDPA aligned
        </p>
      </aside>

      {/* form panel */}
      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between lg:hidden">
          <a
            href={landing}
            className="flex items-center gap-2 text-[21px] font-extrabold tracking-[-0.05em]"
            aria-label="Jeneviv — back to the website"
          >
            <img
              src="/assets/images/jeneviv.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-[9px] object-cover"
            />
            jeneviv<span className="text-brand">.</span>
          </a>
          <a
            href={landing}
            className="flex items-center gap-1.5 text-[12.5px] text-ink-muted"
          >
            <ArrowLeft size={13} /> Site
          </a>
        </div>

        <div className="mx-auto my-auto w-full max-w-[420px] py-10">
          <div className="animate-rise-in">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              {title}
            </h1>
            <p className="muted mt-2">{subtitle}</p>
          </div>
          <div className="mt-7 animate-rise-in [animation-delay:80ms]">
            {children}
          </div>
          <div className="mt-6 text-[13px] text-ink-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
