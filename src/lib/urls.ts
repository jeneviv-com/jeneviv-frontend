/**
 * Absolute origins for the dashboard and this site, read from the env and
 * cleaned up so a small typo there can't turn every link into a path on this
 * site.
 *
 * Without this, NEXT_PUBLIC_APP_URL=https/:app-jeneviv.up.railway.app made
 * "Get started" open https://jeneviv.vercel.app/https/:app-jeneviv.up.railway.app/signup,
 * because a value without a valid "scheme://" is treated as a relative path.
 */

/** The hosted dashboard, used when the env value is missing or unusable. */
export const DEFAULT_APP_URL = "https://app-jeneviv.up.railway.app";
const DEV_APP_URL = "http://localhost:5173";

/** The hosted marketing site, used when NEXT_PUBLIC_SITE_URL is missing or unusable. */
export const DEFAULT_SITE_URL = "https://jeneviv.up.railway.app";

/**
 * Turns a configured origin into a clean absolute one, or null if it can't.
 * Repairs the common slips: "https/:host", "https:/host", "https//host",
 * a bare "host", stray spaces, quotes and trailing slashes.
 */
export function normalizeOrigin(raw: string | undefined | null): string | null {
  let value = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!value || value === "/") return null;

  // Broken scheme separators: https/:  https:/  https//  https:\\
  value = value.replace(/^(https?)\s*[:/\\]+\s*/i, (_, scheme: string) => `${scheme.toLowerCase()}://`);

  // A bare host such as app-jeneviv.up.railway.app.
  if (!/^https?:\/\//i.test(value)) {
    if (value.startsWith("/")) return null; // a path, not a host
    value = `${/^(localhost|127\.0\.0\.1)(:|$)/.test(value) ? "http" : "https"}://${value}`;
  }

  try {
    const url = new URL(value);
    if (!url.hostname || !url.hostname.includes(".") && url.hostname !== "localhost") return null;
    // Keep any sub-path (e.g. /app) but never a trailing slash.
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** The dashboard origin every "Log in", "Get started" and "Create a collection" link uses. */
export const appUrl: string =
  normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
  (process.env.NODE_ENV === "production" ? DEFAULT_APP_URL : DEV_APP_URL);

/** This site's public origin, for canonical URLs, robots.txt and the sitemap. */
export const siteUrl: string = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SITE_URL;
