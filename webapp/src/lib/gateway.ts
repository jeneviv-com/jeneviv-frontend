import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * The payment gateway the API is configured with (`DEFAULT_GATEWAY` on the
 * backend). Pages read their settlement wording from `useGateway()` instead of
 * naming a gateway, so switching gateways on the server changes the text on
 * every page without a frontend release.
 */
export interface GatewayInfo {
  name: string;
  label: string;
  /** Paystack-style split straight to the merchant's bank, vs. wallet + payout. */
  settles_direct: boolean;
}

const KNOWN: Record<string, GatewayInfo> = {
  paystack: { name: "paystack", label: "Paystack", settles_direct: true },
  flutterwave: { name: "flutterwave", label: "Flutterwave", settles_direct: false },
  paga: { name: "paga", label: "Paga", settles_direct: false },
  monnify: { name: "monnify", label: "Monnify", settles_direct: false },
};

const CACHE_KEY = "jeneviv.gateway.v1";

/** What to show before /api/config answers: last known, then the build's hint. */
function initialGateway(): GatewayInfo {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GatewayInfo;
      if (parsed?.label) return parsed;
    }
  } catch {
    /* storage unavailable */
  }
  const hint = String(import.meta.env.VITE_PAYMENT_GATEWAY ?? "paystack").toLowerCase();
  return KNOWN[hint] ?? KNOWN.paystack;
}

let current: GatewayInfo = initialGateway();
let request: Promise<GatewayInfo> | null = null;
const listeners = new Set<(info: GatewayInfo) => void>();

function loadGateway(): Promise<GatewayInfo> {
  if (!request) {
    request = apiFetch<{ gateway?: Partial<GatewayInfo> }>("/api/config", { anonymous: true })
      .then((response) => {
        const name = String(response.gateway?.name ?? "").toLowerCase();
        const info: GatewayInfo = {
          name,
          label: response.gateway?.label || KNOWN[name]?.label || current.label,
          settles_direct:
            typeof response.gateway?.settles_direct === "boolean"
              ? response.gateway.settles_direct
              : (KNOWN[name]?.settles_direct ?? current.settles_direct),
        };
        current = info;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(info));
        } catch {
          /* storage unavailable */
        }
        listeners.forEach((listener) => listener(info));
        return info;
      })
      .catch(() => {
        // Older API without /api/config: keep the fallback, retry next mount.
        request = null;
        return current;
      });
  }
  return request;
}

/** Ready-made sentences, so every page words settlement the same way. */
export interface GatewayCopy extends GatewayInfo {
  processedBy: string;
  confirmedBy: string;
  feeLabel: string;
  /** One line for a settings row or a footer. */
  settlementShort: string;
  settlementChip: string;
  settlementTitle: string;
  settlementSubtitle: string;
  settlementBody: string;
}

export function gatewayCopy(info: GatewayInfo): GatewayCopy {
  const L = info.label;
  const direct = info.settles_direct;
  return {
    ...info,
    processedBy: `Payments processed by ${L}`,
    confirmedBy: `Confirmed by ${L}`,
    feeLabel: `${L} processing fee`,
    settlementShort: direct
      ? `${L} splits each payment to your bank`
      : `${L} collects into your wallet, then pays out to your bank`,
    settlementChip: direct ? "Direct" : "Wallet + payout",
    settlementTitle: direct ? "Direct settlement" : "Wallet settlement",
    settlementSubtitle: direct
      ? "Your money never sits with jeneviv"
      : "Held in your wallet until it is paid out",
    settlementBody: direct
      ? `Each successful payment is split by ${L} when it is captured. The collection amount, less ${L}'s processing fee, goes to your verified bank account. jeneviv's platform fee is taken in the same split.`
      : `Each successful payment is confirmed by ${L} and credited to your jeneviv wallet. The collection amount is paid out to your verified bank account on your payout schedule; ${L}'s processing fee and jeneviv's platform fee are charged to the payer.`,
  };
}

/** The active gateway's wording. Re-renders once when the API answers. */
export function useGateway(): GatewayCopy {
  const [info, setInfo] = useState<GatewayInfo>(current);
  useEffect(() => {
    listeners.add(setInfo);
    loadGateway().then(setInfo);
    return () => {
      listeners.delete(setInfo);
    };
  }, []);
  return gatewayCopy(info);
}
