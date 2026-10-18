import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
});
