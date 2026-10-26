import DashboardPreview from "@/components/DashboardPreview";

/**
 * The landing page builds its laptop from CSS so it stays crisp at any size.
 * The auth screens reuse the same shape around the real dashboard preview.
 */
export default function LaptopMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative rounded-[18px] border border-[#3a3530] bg-gradient-to-br from-[#2a2622] to-[#14110f] p-[11px] pb-[14px] shadow-[0_40px_80px_-32px_rgba(35,18,10,0.5)]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[5px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#4a443d]"
        />
        <div
          className="overflow-hidden rounded-[6px] bg-white"
          style={{ aspectRatio: "16 / 10.2" }}
        >
          <DashboardPreview />
        </div>
      </div>
      <div className="relative -mx-[3.5%] h-[14px] rounded-b-[12px] bg-gradient-to-b from-[#34302b] via-[#1b1815] to-[#0d0b0a] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.6)]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-[4px] w-[86px] -translate-x-1/2 rounded-b-[6px] bg-[#0a0908]"
        />
      </div>
    </div>
  );
}
