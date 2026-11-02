import DashboardPreview from "@/components/DashboardPreview";

/**
 * Standalone dashboard preview for embedding in marketing site.
 * Uses the miniature dashboard component, not the full Dashboard page.
 */
export default function DashboardPreviewPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <DashboardPreview />
    </div>
  );
}
