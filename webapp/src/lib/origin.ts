/**
 * Cleans up a configured origin (for example VITE_PUBLIC_APP_URL) so a typo
 * such as "https/:host" can't turn a link into a path on the current site.
 * Returns the origin with no trailing slash, or null if it can't be repaired.
 */
export function cleanOrigin(raw: string | undefined | null): string | null {
  let value = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!value || value === "/") return null;
  value = value.replace(/^(https?)\s*[:/\\]+\s*/i, (_, scheme: string) => `${scheme.toLowerCase()}://`);
  if (!/^https?:\/\//i.test(value)) {
    if (value.startsWith("/")) return null;
    value = `${/^(localhost|127\.0\.0\.1)(:|$)/.test(value) ? "http" : "https"}://${value}`;
  }
  try {
    const url = new URL(value);
    if (!url.hostname || (!url.hostname.includes(".") && url.hostname !== "localhost")) return null;
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
