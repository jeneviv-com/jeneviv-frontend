import DashboardPreview from "@/components/marketing/DashboardPreview";

/**
 * CSS-based laptop mockup for the landing page.
 * Uses the DashboardPreview component instead of an iframe.
 */
export default function LaptopMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`m-laptop ${className}`}>
      <div className="m-laptop-lid">
        <div className="m-laptop-screen">
          <DashboardPreview />
        </div>
      </div>
      <div className="m-laptop-base" />
    </div>
  );
}
