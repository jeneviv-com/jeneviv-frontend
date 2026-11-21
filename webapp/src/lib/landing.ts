import { cleanOrigin } from "./origin";

/** The public marketing site, used when VITE_PUBLIC_APP_URL is unset. */
export const DEFAULT_LANDING_URL = "https://jeneviv.up.railway.app";

/**
 * Where "View landing page", the sidebar logo and the auth screens' "Back to
 * site" links go. Reads VITE_PUBLIC_APP_URL (Vite only exposes VITE_ vars),
 * and falls back to the hosted site when the variable is unset, malformed, or
 * points at this dashboard, since any of those would just reopen the dashboard.
 */
export function landingUrl(): string {
  const configured = cleanOrigin(import.meta.env.VITE_PUBLIC_APP_URL);
  if (!configured) return DEFAULT_LANDING_URL;
  if (typeof window !== "undefined" && new URL(configured).origin === window.location.origin) {
    return DEFAULT_LANDING_URL;
  }
  return configured;
}

/** Origin for links to this site's /terms and /privacy pages. */
export function landingOrigin(): string {
  return cleanOrigin(import.meta.env.VITE_PUBLIC_APP_URL) ?? DEFAULT_LANDING_URL;
}
