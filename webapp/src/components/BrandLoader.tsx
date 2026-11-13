import { apiConfig } from "@/lib/api";

/**
 * The brand loader: the logo arrives in two halves, one from above and one from
 * below, meets in the middle, then the whole mark turns. Used while the app is
 * opening a session, in place of a bare spinner.
 */
const CSS = `
@keyframes brand-half-top {
  0%   { transform: translateY(-150%); opacity: 0; }
  55%  { transform: translateY(0);     opacity: 1; }
  100% { transform: translateY(0);     opacity: 1; }
}
@keyframes brand-half-bottom {
  0%   { transform: translateY(150%); opacity: 0; }
  55%  { transform: translateY(0);    opacity: 1; }
  100% { transform: translateY(0);    opacity: 1; }
}
@keyframes brand-turn {
  0%, 60% { transform: rotate(0deg); }
  100%    { transform: rotate(360deg); }
}
@keyframes brand-glow {
  0%, 100% { opacity: 0.35; transform: scale(0.9); }
  50%      { opacity: 0.6;  transform: scale(1.08); }
}
.brand-half-top {
  clip-path: inset(0 0 50% 0);
  animation: brand-half-top 760ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.brand-half-bottom {
  clip-path: inset(50% 0 0 0);
  animation: brand-half-bottom 760ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.brand-turn {
  animation: brand-turn 1.7s cubic-bezier(0.65, 0, 0.35, 1) 700ms infinite;
}
.brand-glow {
  animation: brand-glow 2.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .brand-half-top,
  .brand-half-bottom,
  .brand-turn,
  .brand-glow { animation: none; }
}
`;

export default function BrandLoader({ label = "Opening your workspace…" }: { label?: string }) {
  const logo = apiConfig.withBase("/assets/images/jeneviv.png");

  return (
    <div className="grid min-h-screen place-items-center bg-cream">
      <style>{CSS}</style>

      <div className="text-center">
        <div className="relative mx-auto h-[72px] w-[72px]">
          <span
            aria-hidden="true"
            className="brand-glow absolute inset-[-10px] rounded-[24px] bg-brand/25 blur-xl"
          />
          <div className="brand-turn relative h-full w-full">
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="brand-half-top absolute inset-0 h-full w-full rounded-[18px] object-cover shadow-[0_10px_30px_-14px_rgba(16,16,16,0.45)]"
            />
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="brand-half-bottom absolute inset-0 h-full w-full rounded-[18px] object-cover shadow-[0_10px_30px_-14px_rgba(16,16,16,0.45)]"
            />
          </div>
        </div>

        <p className="mt-6 text-[13px] font-semibold tracking-tight text-ink">{label}</p>
        <p className="mt-1 font-mono text-3xs uppercase tracking-[0.16em] text-ink-faint">Jeneviv</p>
      </div>
    </div>
  );
}
