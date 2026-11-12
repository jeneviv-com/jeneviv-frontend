import DashboardPreview from "@/components/DashboardPreview";
import ScaledFrame from "@/components/ScaledFrame";

/**
 * Standalone dashboard preview for embedding in the marketing site. It draws
 * the dashboard at the app's real size and scales it to whatever the iframe
 * is given, so the laptop matches what a coordinator actually sees.
 */
export default function DashboardPreviewPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <ScaledFrame width={1280} height={800}>
        <DashboardPreview />
      </ScaledFrame>
    </div>
  );
}
