/** The public marketing site, used when VITE_PUBLIC_APP_URL is unset. */
export const DEFAULT_LANDING_URL = "https://jeneviv.up.railway.app";

/**
 * Where "View landing page", the sidebar logo and the auth screens' "Back to
 * site" links go. Reads VITE_PUBLIC_APP_URL (Vite only exposes VITE_ vars),
 * and falls back to the hosted site when the variable is unset, "/" or points
 * at this dashboard, since any of those would just reopen the dashboard.
 */
export function landingUrl(): string {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
  if (!configured || configured === "/") return DEFAULT_LANDING_URL;
  try {
    const url = new URL(configured);
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      return DEFAULT_LANDING_URL;
    }
    return configured;
  } catch {
    // A bare host or relative path is not a usable cross-site link.
    return DEFAULT_LANDING_URL;
  }
}
