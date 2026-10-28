import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  // Share the repo-root public/ folder (owned by the Next.js site) so static
  // assets like the logo are served at the same URLs in dev and production:
  // /assets/images/jeneviv.png, /favicon.ico, etc.
  publicDir: path.resolve(__dirname, "../public"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["lucide-react"],
          "state-vendor": ["zustand", "swr"],
          // Split your own components into logical chunks
          "components": [
            "@/components/ui",
            "@/components/FieldEditor",
            "@/components/LogoPicker",
            "@/components/BankSelect",
            "@/components/charts",
            "@/components/AppShell",
            "@/components/AuthLayout",
            "@/components/DashboardPreview",
            "@/components/KycCard",
            "@/components/LaptopMockup",
            "@/components/RequireAuth",
          ],
          "pages-auth": [
            "@/pages/Login",
            "@/pages/Signup",
            "@/pages/Onboarding",
          ],
          "pages-collect": [
            "@/pages/Collections",
            "@/pages/CollectionDetail",
            "@/pages/Groups",
            "@/pages/Templates",
            "@/pages/PaymentLinks",
            "@/pages/Payers",
          ],
          "pages-money": [
            "@/pages/Dashboard",
            "@/pages/Transactions",
            "@/pages/Payouts",
            "@/pages/Refunds",
            "@/pages/PublicPay",
          ],
          "pages-admin": [
            "@/pages/Admin",
            "@/pages/ApproveWithdrawal",
            "@/pages/Notifications",
            "@/pages/Settings",
          ],
          "context-hooks": [
            "@/context/AuthContext",
            "@/context/ToastContext",
            "@/hooks/useApi",
          ],
          "lib-utils": [
            "@/lib/api",
            "@/lib/format",
            "@/lib/platformFee",
            "@/lib/demo",
          ],
        },
      },
    },
  },
});
