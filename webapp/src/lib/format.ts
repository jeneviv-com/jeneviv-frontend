/**
 * Formatting and small shared helpers for the Jeneviv dashboard.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  GHS: "GH₵",
};

export function currencySymbol(currency = "NGN") {
  return CURRENCY_SYMBOLS[(currency || "NGN").toUpperCase()] ?? "";
}

/**
 * Amounts arrive from the API in major units — ₦2,500 is sent as `2500`.
 */
export function formatMoney(amount: number | null | undefined, currency = "NGN") {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const hasFraction = Math.abs(safe % 1) > 0.0001;
  return `${currencySymbol(currency)}${safe.toLocaleString("en-NG", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompact(amount: number | null | undefined, currency = "NGN") {
  const value = Number(amount ?? 0);
  const symbol = currencySymbol(currency);
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${symbol}${(value / 1_000_000_000).toFixed(1)}b`;
  if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}m`;
  if (abs >= 10_000) return `${symbol}${Math.round(value / 1000)}k`;
  return formatMoney(value, currency);
}

export function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-NG");
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "—";
  const diff = Date.now() - date;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugifyFieldId(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/** Reads a property that may arrive in snake_case or camelCase. */
export function pick<T>(
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): T | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null)
      return source[key] as T;
  }
  return undefined;
}

export function transactionPayer(t: {
  payer_name?: string;
  field_values?: Record<string, unknown>;
  reference?: string;
}) {
  if (t.payer_name) return t.payer_name;
  const values = t.field_values || {};
  for (const key of Object.keys(values)) {
    if (/name/i.test(key) && typeof values[key] === "string")
      return values[key] as string;
  }
  const firstValue = Object.values(values).find(
    (value) => typeof value === "string",
  );
  return (firstValue as string) || t.reference || "Unknown payer";
}

export function transactionIdentifier(t: {
  field_values?: Record<string, unknown>;
  reference?: string;
}) {
  const values = t.field_values || {};
  for (const key of Object.keys(values)) {
    if (/id|matric|reg|number/i.test(key) && typeof values[key] === "string")
      return values[key] as string;
  }
  return t.reference || "—";
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  pending_treasurer: "Awaiting treasurer",
  success: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
  sent: "Sent",
  draft: "Draft",
};

export type Tone = "green" | "amber" | "red" | "neutral" | "brand" | "blue";

export function statusTone(status?: string | null): Tone {
  switch ((status || "").toLowerCase()) {
    case "success":
    case "approved":
    case "active":
    case "paid":
      return "green";
    case "pending":
    case "processing":
    case "pending_treasurer":
    case "paused":
    case "draft":
      return "amber";
    case "failed":
    case "rejected":
    case "suspended":
    case "cancelled":
    case "expired":
      return "red";
    default:
      return "neutral";
  }
}

export function statusLabel(status?: string | null) {
  if (!status) return "—";
  return (
    STATUS_LABELS[status.toLowerCase()] ||
    status.charAt(0).toUpperCase() + status.slice(1)
  );
}

/**
 * Public payer link. Lives on the dashboard origin by default; set
 * VITE_PAY_BASE_URL to serve payer pages from a dedicated host or subdomain.
 */
export function paymentLink(shortCode: string) {
  const base =
    import.meta.env.VITE_PAY_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}/pay/${shortCode}`;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadCSV(
  filename: string,
  rows: Array<Record<string, string | number>>,
) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

export function monthKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString("en-NG", {
    month: "short",
  });
}
