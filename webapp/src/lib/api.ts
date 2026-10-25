/**
 * Jeneviv API client.
 *
 * One place where every backend endpoint lives. Handles auth (session cookie +
 * bearer token), JSON parsing, timeouts, and normalises errors into APIError.
 *
 * Docs: API_INTEGRATION.md
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

const TOKEN_KEY = "jeneviv.token";
const REQUEST_TIMEOUT = 25_000;

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
    public endpoint?: string,
  ) {
    super(message);
    this.name = "APIError";
  }

  /** True when the network never reached the API (backend down, CORS, offline). */
  get isNetworkError() {
    return this.status === 0;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

/* ------------------------------------------------------------------ session */

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable — session cookies still work */
    }
  },
};

const UNAUTHORIZED_EVENT = "jeneviv:unauthorized";

export function onUnauthorized(listener: () => void) {
  window.addEventListener(UNAUTHORIZED_EVENT, listener);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, listener);
}

/* ------------------------------------------------------------------ request */

type Query = Record<string, string | number | boolean | undefined | null>;

export function qs(query?: Query) {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  });
  const str = params.toString();
  return str ? `?${str}` : "";
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Skip attaching credentials — used by the health probe. */
  anonymous?: boolean;
}

function errorMessage(status: number, data: unknown): string {
  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    const nested = payload.error as Record<string, unknown> | undefined;
    const candidate =
      (nested?.message as string) ||
      (payload.message as string) ||
      (payload.error as string);
    if (typeof candidate === "string" && candidate.length) return candidate;
  }
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have access to this resource.";
  if (status === 404) return "We could not find what you asked for.";
  if (status >= 500) return "The server had a problem. Please try again.";
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal, anonymous } = options;
  const url = `${API_BASE_URL}${endpoint}${qs(query)}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData)
    headers["Content-Type"] = "application/json";

  const token = tokenStore.get();
  if (token && !anonymous) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const aborted = (error as Error)?.name === "AbortError";
    throw new APIError(
      0,
      aborted
        ? "The request took too long. Check your connection and try again."
        : "Cannot reach the Jeneviv API. Check your connection or API URL.",
      { error },
      endpoint,
    );
  }
  clearTimeout(timeout);

  // FIX: the bearer plugin returns the SIGNED session token in this header on
  // sign-in / sign-up. This is the token the API accepts as `Authorization:
  // Bearer`. (The `token` in the JSON body is unsigned and gets rejected.)
  // Requires `Access-Control-Expose-Headers: set-auth-token` on the backend.
  const signedToken = response.headers.get("set-auth-token");
  if (signedToken && !anonymous && response.ok) tokenStore.set(signedToken);

  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      tokenStore.set(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new APIError(
      response.status,
      errorMessage(response.status, data),
      data,
      endpoint,
    );
  }

  return data as T;
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  withBase(path: string) {
    return `${API_BASE_URL}${path}`;
  },
};

/* --------------------------------------------------------------------- types */

export interface Session {
  id: string;
  token?: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role?: "user" | "coordinator" | "admin";
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token?: string;
  user: User;
  session?: Session;
  refreshToken?: string;
}

export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "multiselect"
  | "image"
  | "file"
  | "date";

export interface CollectionField {
  id?: string;
  position: number;
  display_name: string;
  field_id: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export type CollectionStatus = "active" | "paused" | "closed";

export interface Collection {
  id: string;
  merchant_id?: string;
  short_code: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  cover_image_url?: string;
  is_active: boolean;
  status?: CollectionStatus;
  fields?: CollectionField[];
  created_at: string;
  updated_at?: string;
}

export type TransactionStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "expired";

export interface Transaction {
  id: string;
  reference: string;
  customer_id?: string;
  merchant_id?: string;
  collection_id?: string;
  collection_name?: string;
  payer_name?: string;
  payer_email?: string;
  status: TransactionStatus;
  amount: number;
  platform_fee?: number;
  gateway_fee?: number;
  total_charged?: number;
  currency: string;
  gateway?: string;
  gateway_ref?: string;
  field_values?: Record<string, unknown>;
  paid_at?: string;
  settled_at?: string;
  reconciled?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PaymentAccount {
  id: string;
  transaction_id?: string;
  gateway: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
  currency: string;
  expiry_at?: string;
  created_at?: string;
}

export interface PaymentBreakdown {
  amount: number;
  platform_fee: number;
  gateway_fee: number;
  total_charged: number;
  currency: string;
}

export interface InitPaymentResult {
  transaction: Transaction;
  payment_account: PaymentAccount;
  breakdown?: PaymentBreakdown;
}

export interface BankAccount {
  id: string;
  bank_code: string;
  bank_name?: string;
  account_number: string;
  account_name?: string;
  currency: string;
  is_default: boolean;
  createdAt?: string;
}

export interface MerchantSettings {
  payout_mode?: "manual" | "auto_daily" | "auto_weekly";
  email_notification_for_transactions?: boolean;
  email_notification_period?:
    | "immediate"
    | "hourly"
    | "6hourly"
    | "12hourly"
    | "daily";
  default_bank_account_id?: string;
}

export type MerchantStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Merchant {
  id: string;
  userId?: string;
  displayName?: string;
  display_name?: string;
  status: MerchantStatus;
  application_note?: string;
  wallet_balance_ngn?: number;
  payouts_balance_ngn?: number;
  settings?: MerchantSettings;
  bank_accounts?: BankAccount[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Payout {
  id: string;
  merchant_id?: string;
  bank_account_id?: string;
  account_number: string;
  account_name?: string;
  bank_code?: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "success" | "failed";
  gateway?: string;
  gateway_ref?: string;
  failure_reason?: string;
  initiated_by?: "merchant" | "cron";
  created_at: string;
  updated_at?: string;
}

export interface Template {
  id: string;
  merchant_id?: string;
  name: string;
  description?: string;
  fields?: CollectionField[];
  is_public?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Refund {
  id: string;
  transaction_id: string;
  merchant_id?: string;
  amount: number;
  reason?: string;
  status: "pending" | "processing" | "success" | "failed";
  gateway_ref?: string;
  created_at: string;
  updated_at?: string;
}

export interface Bank {
  code: string;
  name: string;
  country: string;
}

export interface AdminStats {
  total_merchants: number;
  total_transactions: number;
  total_volume: number;
  pending_payouts: number;
  pending_merchants?: number;
}

export interface AuditLog {
  id: string;
  actor_uid?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/* ---------------------------------------------------------------------- auth */

export const authAPI = {
  getSession: () =>
    apiFetch<{ session: Session | null; user: User | null }>(
      "/api/auth/get-session",
    ),

  // The signed token is saved automatically by apiFetch (set-auth-token header).
  signIn: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/sign-in/email", {
      method: "POST",
      body: { email, password },
    }),

  signUp: (name: string, email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/sign-up/email", {
      method: "POST",
      body: { name, email, password },
    }),

  // FIX: always clear the stored token on sign-out, even if the request fails.
  signOut: async () => {
    try {
      return await apiFetch<{ success: boolean }>("/api/auth/sign-out", {
        method: "POST",
      });
    } finally {
      tokenStore.set(null);
    }
  },

  /** Returns the provider URL to redirect the browser to (better-auth social). */
  googleSignIn: (callbackURL: string) =>
    apiFetch<{ url: string }>("/api/auth/sign-in/social", {
      method: "POST",
      body: { provider: "google", callbackURL },
    }),
};

/* --------------------------------------------------------------- collections */

export interface CreateCollectionInput {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  template_id?: string;
  is_active?: boolean;
}

export const collectionsAPI = {
  list: (query?: { status?: string; search?: string }) =>
    apiFetch<{ collections: Collection[] }>("/api/collections", { query }),

  create: (data: CreateCollectionInput) =>
    apiFetch<{ collection: Collection }>("/api/collections", {
      method: "POST",
      body: data,
    }),

  get: (id: string) =>
    apiFetch<{ collection: Collection }>(`/api/collections/${id}`),

  getByCode: (shortCode: string) =>
    apiFetch<{ collection: Collection }>(
      `/api/collections/by-code/${encodeURIComponent(shortCode)}`,
    ),

  update: (id: string, data: Partial<Collection>) =>
    apiFetch<{ collection: Collection }>(`/api/collections/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${id}`, {
      method: "DELETE",
    }),

  fields: (id: string) =>
    apiFetch<{ fields: CollectionField[] }>(`/api/collections/${id}/fields`),

  setFields: (id: string, fields: CollectionField[]) =>
    apiFetch<{ collection: Collection }>(`/api/collections/${id}/fields`, {
      method: "PUT",
      body: { fields },
    }),

  addField: (id: string, field: Omit<CollectionField, "id">) =>
    apiFetch<{ field: CollectionField }>(`/api/collections/${id}/fields`, {
      method: "POST",
      body: field,
    }),

  updateField: (
    id: string,
    fieldId: string,
    field: Partial<CollectionField>,
  ) =>
    apiFetch<{ field: CollectionField }>(
      `/api/collections/${id}/fields/${fieldId}`,
      { method: "PATCH", body: field },
    ),

  deleteField: (id: string, fieldId: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${id}/fields/${fieldId}`, {
      method: "DELETE",
    }),

  transactions: (id: string, query?: { status?: string }) =>
    apiFetch<{ transactions: Transaction[] }>(
      `/api/collections/${id}/transactions`,
      { query },
    ),
};

/* -------------------------------------------------------------- transactions */

export const transactionsAPI = {
  list: (query?: {
    collection_id?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) =>
    apiFetch<{ transactions: Transaction[]; total?: number }>(
      "/api/transactions",
      { query },
    ),

  get: (id: string) =>
    apiFetch<{ transaction: Transaction }>(`/api/transactions/${id}`),

  reconcile: (ids: string[], reconciled: boolean) =>
    apiFetch<{ updated: number }>("/api/transactions/reconcile", {
      method: "PATCH",
      body: { ids, reconciled },
    }),
};

/* ------------------------------------------------------------------- payouts */

export const payoutsAPI = {
  list: (query?: { status?: string }) =>
    apiFetch<{ payouts: Payout[] }>("/api/payouts", { query }),

  get: (id: string) => apiFetch<{ payout: Payout }>(`/api/payouts/${id}`),

  initiate: (bankAccountId: string, amount: number, currency = "NGN") =>
    apiFetch<{ payout: Payout }>("/api/payouts", {
      method: "POST",
      body: {
        bank_account_id: bankAccountId,
        amount,
        currency,
      },
    }),
};

/* ------------------------------------------------------------------ merchants */

export const merchantsAPI = {
  getMe: () => apiFetch<{ merchant: Merchant | null }>("/api/merchants/me"),

  apply: (displayName: string, applicationNote: string) =>
    apiFetch<{ merchant: Merchant }>("/api/merchants/apply", {
      method: "POST",
      body: { display_name: displayName, application_note: applicationNote },
    }),

  bankAccounts: {
    list: () =>
      apiFetch<{ bank_accounts: BankAccount[] }>(
        "/api/merchants/me/bank-accounts",
      ),

    add: (data: {
      bank_code: string;
      account_number: string;
      currency?: string;
      is_default?: boolean;
    }) =>
      apiFetch<{ bank_account: BankAccount }>(
        "/api/merchants/me/bank-accounts",
        { method: "POST", body: data },
      ),

    setDefault: (id: string) =>
      apiFetch<{ bank_account: BankAccount }>(
        `/api/merchants/me/bank-accounts/${id}/set-default`,
        { method: "POST" },
      ),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/merchants/me/bank-accounts/${id}`, {
        method: "DELETE",
      }),
  },

  updateSettings: (settings: MerchantSettings) =>
    apiFetch<{ merchant: Merchant }>("/api/merchants/me/settings", {
      method: "PATCH",
      body: settings,
    }),
};

/* ------------------------------------------------------------------ payments */

export const paymentsAPI = {
  init: (collectionShortCode: string, fieldValues: Record<string, unknown>) =>
    apiFetch<InitPaymentResult>("/api/payments/init", {
      method: "POST",
      body: {
        collection_short_code: collectionShortCode,
        field_values: fieldValues,
      },
    }),
};

/* ----------------------------------------------------------------- templates */

export const templatesAPI = {
  list: (scope: "all" | "mine" = "all") =>
    apiFetch<{ templates: Template[] }>("/api/templates", { query: { scope } }),

  get: (id: string) => apiFetch<{ template: Template }>(`/api/templates/${id}`),

  create: (name: string, description?: string) =>
    apiFetch<{ template: Template }>("/api/templates", {
      method: "POST",
      body: { name, description },
    }),

  update: (id: string, data: Partial<Template>) =>
    apiFetch<{ template: Template }>(`/api/templates/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/templates/${id}`, { method: "DELETE" }),

  getFields: (id: string) =>
    apiFetch<{ fields: CollectionField[] }>(`/api/templates/${id}/fields`),

  setFields: (id: string, fields: CollectionField[]) =>
    apiFetch<{ template: Template }>(`/api/templates/${id}/fields`, {
      method: "PUT",
      body: { fields },
    }),

  addField: (id: string, field: Omit<CollectionField, "id">) =>
    apiFetch<{ field: CollectionField }>(`/api/templates/${id}/fields`, {
      method: "POST",
      body: field,
    }),

  updateField: (
    id: string,
    fieldId: string,
    field: Partial<CollectionField>,
  ) =>
    apiFetch<{ field: CollectionField }>(`/api/templates/${id}/fields/${fieldId}`, {
      method: "PATCH",
      body: field,
    }),

  deleteField: (id: string, fieldId: string) =>
    apiFetch<{ success: boolean }>(`/api/templates/${id}/fields/${fieldId}`, {
      method: "DELETE",
    }),
};

/* --------------------------------------------------------------------- banks */

export const banksAPI = {
  list: (country = "NG") =>
    apiFetch<{ banks: Bank[] }>("/api/banks", { query: { country } }),
};

/* ------------------------------------------------------------------- uploads */

export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
}

export const uploadsAPI = {
  sign: () => apiFetch<UploadSignature>("/api/uploads/sign", { method: "POST" }),
};

/* --------------------------------------------------------------------- admin */

export const adminAPI = {
  getStats: () => apiFetch<AdminStats>("/api/admin/stats"),

  listMerchants: (status?: MerchantStatus) =>
    apiFetch<{ merchants: Merchant[] }>("/api/admin/merchants", {
      query: { status },
    }),

  approveMerchant: (merchantId: string, note?: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/approve`,
      { method: "POST", body: { note } },
    ),

  rejectMerchant: (merchantId: string, note?: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/reject`,
      { method: "POST", body: { note } },
    ),

  suspendMerchant: (merchantId: string, note?: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/suspend`,
      { method: "POST", body: { note } },
    ),

  refundTransaction: (transactionId: string, reason: string) =>
    apiFetch<{ refund: Refund }>(
      `/api/admin/transactions/${transactionId}/refund`,
      { method: "POST", body: { reason } },
    ),

  getTransactions: (query?: {
    status?: string;
    merchant_id?: string;
    limit?: number;
  }) =>
    apiFetch<{ transactions: Transaction[] }>("/api/admin/transactions", {
      query,
    }),

  getAuditLogs: (query?: {
    entity_type?: string;
    action?: string;
    limit?: number;
  }) => apiFetch<{ logs: AuditLog[] }>("/api/admin/audit-logs", { query }),
};

/* -------------------------------------------------------------------- health */

export const healthAPI = {
  check: (signal?: AbortSignal) =>
    apiFetch<{ status: string }>("/health", { anonymous: true, signal }),
};

/* ------------------------------------------------------------- webhook events */

export interface FlutterwaveWebhookEvent {
  id: string;
  type: "charge.completed" | string;
  timestamp: number;
  data: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: "succeeded" | string;
  };
}
