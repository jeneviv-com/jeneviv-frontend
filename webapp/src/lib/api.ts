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

  // The bearer plugin returns the SIGNED session token in this header on
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

/**
 * Authenticated file download. A plain <a href> cannot carry the bearer token,
 * so fetch the blob first and hand the browser a temporary object URL.
 */
export async function downloadFile(endpoint: string, fallbackName: string) {
  const token = tokenStore.get();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text();
    let data: unknown = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
    throw new APIError(
      response.status,
      errorMessage(response.status, data),
      data,
      endpoint,
    );
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return filename;
}

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

/**
 * An entity a merchant files collections under — a school, a branch, a
 * department — with one logo used on its payer pages and receipts.
 */
export interface CollectionGroup {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  collection_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Collection {
  id: string;
  merchant_id?: string;
  group_id?: string | null;
  group?: CollectionGroup | null;
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
  /** The admin's note recorded with an approve / reject / suspend decision. */
  admin_review_note?: string;
  wallet_balance_ngn?: number;
  payouts_balance_ngn?: number;
  settings?: MerchantSettings;
  bank_accounts?: BankAccount[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KycView {
  kyc_status: "unverified" | "nin_verified" | "verified" | "rejected";
  can_collect: boolean;
  can_withdraw: boolean;
  nin_last4: string | null;
  verified_legal_name: string | null;
  nin_verified_at: string | null;
  bank_verified_at: string | null;
  logo_url: string | null;
  treasurer_name: string | null;
  treasurer_phone: string | null;
  escrow_enabled: boolean;
  wallet_balance_minor: number;
  payouts_balance_minor: number;
  withdrawable_minor: number;
  maturity: "unverified" | "nin_verified" | "ready";
}

export interface WithdrawalApproval {
  role: "rep" | "treasurer" | "system";
  label: string;
  at: string;
  detail?: string;
}

export type WithdrawalStatus =
  | "pending_treasurer"
  | "rejected"
  | "processing"
  | "success"
  | "failed"
  | "expired";

export interface Withdrawal {
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  source: "escrow" | "payouts";
  treasurer_name: string;
  treasurer_phone: string;
  requested_at: string;
  treasurer_approved_at: string | null;
  rejected_at: string | null;
  gateway: string | null;
  gateway_ref: string | null;
  gateway_tx_id: string | null;
  failure_reason: string | null;
  otp_expires_at: string;
  approvals: WithdrawalApproval[];
}

export interface ApprovalSummary {
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  school_name: string;
  treasurer_name: string;
  requested_by: string;
  requested_at: string;
  expires_at: string;
  expired: boolean;
}

export interface PublicReceipt {
  reference: string;
  school_name: string;
  logo_url: string | null;
  student_name: string;
  collection_name: string;
  payer_name: string;
  amount: number;
  currency: string;
  paid_at: string;
  nin_verified: boolean;
  bank_verified: boolean;
  verify_url: string;
  receipt_url: string;
  details: Array<{ label: string; value: string }>;
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
  status: "pending" | "needs_attention" | "success" | "failed";
  gateway_ref?: string;
  gateway_refund_id?: string;
  failure_reason?: string;
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

/* ------------------------------------------------------- field list helpers */

/**
 * The backend has no per-field PATCH or DELETE routes. Field edits are done by
 * loading the whole list, changing it, and saving it back with POST.
 * Fields are matched by field_id, which is stable, rather than by client-side
 * draft ids.
 */
function replaceFieldById(
  fields: CollectionField[],
  fieldId: string,
  change: Partial<CollectionField> | null,
): CollectionField[] {
  const next: CollectionField[] = [];
  for (const field of fields) {
    if (field.field_id !== fieldId) {
      next.push(field);
    } else if (change !== null) {
      next.push({ ...field, ...change });
    }
  }
  return next;
}

/** Strip client-only draft ids before saving. The server assigns real ids. */
function cleanFields(fields: CollectionField[]): CollectionField[] {
  return fields.map(({ id: _id, ...rest }) => rest as CollectionField);
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

  // Always clear the stored token on sign-out, even if the request fails.
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

/* -------------------------------------------------------- response shapes */

/**
 * The dashboard models are snake_case, drizzle rows arrive camelCase, and the
 * two backends nest payer fields differently — `{ collection, fields }` beside
 * each other, or `fields` inside the collection. Reading through these helpers
 * keeps every page independent of which server answered.
 */
function pickKey<T>(
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): T | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeField(raw: unknown): CollectionField {
  const row = asRecord(raw);
  return {
    ...(row as unknown as CollectionField),
    position: pickKey<number>(row, "position") ?? 0,
    display_name: pickKey<string>(row, "display_name", "displayName") ?? "",
    field_id: pickKey<string>(row, "field_id", "fieldId") ?? "",
    type: pickKey<FieldType>(row, "type") ?? "short_text",
    required: pickKey<boolean>(row, "required") ?? true,
    options: pickKey<string[]>(row, "options"),
  };
}

function readFields(value: unknown): CollectionField[] {
  return Array.isArray(value) ? value.map(normalizeField) : [];
}

/** Fields are returned beside the collection, or nested inside it. */
function fieldsFrom(payload: unknown, collection: unknown): CollectionField[] {
  const beside = readFields(pickKey<unknown[]>(asRecord(payload), "fields"));
  if (beside.length > 0) return beside;
  return readFields(pickKey<unknown[]>(asRecord(collection), "fields"));
}

function normalizeCollection(
  raw: unknown,
  fields?: CollectionField[],
): Collection {
  const row = asRecord(raw);
  const normalized = {
    ...(row as unknown as Collection),
    short_code: pickKey<string>(row, "short_code", "shortCode") ?? "",
    is_active: pickKey<boolean>(row, "is_active", "isActive") ?? true,
    merchant_id: pickKey<string>(row, "merchant_id", "merchantId"),
    cover_image_url: pickKey<string>(row, "cover_image_url", "coverImageUrl"),
    created_at: pickKey<string>(row, "created_at", "createdAt") ?? "",
    fields: fields ?? readFields(pickKey<unknown[]>(row, "fields")),
  };
  const updatedAt = pickKey<string>(row, "updated_at", "updatedAt");
  if (updatedAt) normalized.updated_at = updatedAt;
  return normalized;
}

/**
 * The API emits snake_case keys, so a merchant row arrives with `created_at`
 * and `admin_review_note` rather than the camelCase the pages read.
 */
function normalizeMerchant(raw: unknown): Merchant {
  const row = asRecord(raw);
  return {
    ...(row as unknown as Merchant),
    display_name: pickKey<string>(row, "display_name", "displayName"),
    application_note: pickKey<string>(row, "application_note", "applicationNote"),
    admin_review_note: pickKey<string>(row, "admin_review_note", "adminReviewNote"),
    createdAt: pickKey<string>(row, "created_at", "createdAt"),
    updatedAt: pickKey<string>(row, "updated_at", "updatedAt"),
  };
}

function normalizeGroup(raw: unknown): CollectionGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const row = asRecord(raw);
  const id = pickKey<string>(row, "id");
  if (!id) return null;
  return {
    id,
    name: pickKey<string>(row, "name") ?? "",
    description: pickKey<string>(row, "description") ?? null,
    logo_url: pickKey<string>(row, "logo_url", "logoUrl") ?? null,
    collection_count: pickKey<number>(row, "collection_count", "collectionCount"),
  };
}

/** Attaches the group that arrives beside the collection on the real API. */
function withGroup(
  collection: Collection,
  payload: unknown,
): Collection {
  const group =
    normalizeGroup(pickKey<unknown>(asRecord(payload), "group")) ??
    normalizeGroup(pickKey<unknown>(asRecord(collection), "group"));
  return group ? { ...collection, group } : collection;
}

function normalizeTemplate(
  raw: unknown,
  fields?: CollectionField[],
): Template {
  const row = asRecord(raw);
  const normalized = {
    ...(row as unknown as Template),
    merchant_id: pickKey<string>(row, "merchant_id", "merchantId"),
    is_public: pickKey<boolean>(row, "is_public", "isPublic") ?? false,
    created_at: pickKey<string>(row, "created_at", "createdAt") ?? "",
    fields: fields ?? readFields(pickKey<unknown[]>(row, "fields")),
  };
  const updatedAt = pickKey<string>(row, "updated_at", "updatedAt");
  if (updatedAt) normalized.updated_at = updatedAt;
  return normalized;
}

/* --------------------------------------------------------------- collections */

export interface CreateCollectionInput {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  template_id?: string;
  is_active?: boolean;
  group_id?: string | null;
}

export const collectionsAPI = {
  list: async (query?: { status?: string; search?: string }) => {
    const response = await apiFetch<{ collections?: unknown[] }>(
      "/api/collections",
      { query },
    );
    return {
      collections: (response.collections ?? []).map((item) =>
        normalizeCollection(item),
      ),
    };
  },

  create: async (data: CreateCollectionInput) => {
    const response = await apiFetch<{ collection?: unknown; fields?: unknown[] }>(
      "/api/collections",
      { method: "POST", body: data },
    );
    return {
      collection: normalizeCollection(
        response.collection,
        fieldsFrom(response, response.collection),
      ),
    };
  },

  get: async (id: string) => {
    const response = await apiFetch<{ collection?: unknown; fields?: unknown[] }>(
      `/api/collections/${id}`,
    );
    return {
      collection: withGroup(
        normalizeCollection(
          response.collection,
          fieldsFrom(response, response.collection),
        ),
        response,
      ),
    };
  },

  getByCode: async (shortCode: string) => {
    const response = await apiFetch<{ collection?: unknown; fields?: unknown[] }>(
      `/api/collections/by-code/${encodeURIComponent(shortCode)}`,
    );
    return {
      collection: withGroup(
        normalizeCollection(
          response.collection,
          fieldsFrom(response, response.collection),
        ),
        response,
      ),
    };
  },

  update: async (id: string, data: Partial<Collection>) => {
    const response = await apiFetch<{ collection?: unknown }>(
      `/api/collections/${id}`,
      { method: "PATCH", body: data },
    );
    return { collection: normalizeCollection(response.collection) };
  },

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${id}`, {
      method: "DELETE",
    }),

  /**
   * The backend has no GET /:id/fields route, so the fields come back with the
   * collection — beside it on the real API, nested inside it in demo mode.
   */
  fields: async (id: string) => {
    const response = await apiFetch<{ collection?: unknown; fields?: unknown[] }>(
      `/api/collections/${id}`,
    );
    return { fields: fieldsFrom(response, response.collection) };
  },

  /** Replace the whole field list. POST is the method the backend accepts. */
  setFields: async (id: string, fields: CollectionField[]) => {
    const response = await apiFetch<{ fields?: unknown[] }>(
      `/api/collections/${id}/fields`,
      { method: "POST", body: { fields: cleanFields(fields) } },
    );
    return { fields: readFields(response.fields) };
  },

  addField: (id: string, field: Omit<CollectionField, "id">) =>
    apiFetch<{ field: CollectionField }>(`/api/collections/${id}/fields`, {
      method: "POST",
      body: field,
    }),

  /** No per-field PATCH route. Loads the list, edits one field, saves it back. */
  updateField: async (
    id: string,
    fieldId: string,
    field: Partial<CollectionField>,
  ) => {
    const { fields } = await collectionsAPI.fields(id);
    const next = replaceFieldById(fields, fieldId, field);
    await collectionsAPI.setFields(id, next);
    const updated = next.find((f) => f.field_id === fieldId);
    return { field: updated as CollectionField };
  },

  /** No per-field DELETE route. Loads the list, removes the field, saves it back. */
  deleteField: async (id: string, fieldId: string) => {
    const { fields } = await collectionsAPI.fields(id);
    await collectionsAPI.setFields(id, replaceFieldById(fields, fieldId, null));
    return { success: true };
  },

  transactions: (id: string, query?: { status?: string }) =>
    apiFetch<{ transactions: Transaction[] }>(
      `/api/collections/${id}/transactions`,
      { query },
    ),

  exportFile: (id: string, status: "paid" | "unpaid") =>
    downloadFile(
      `/api/collections/${id}/export?status=${status}`,
      `collection-${status}.xlsx`,
    ),
};

/* ------------------------------------------------------------------- groups */

export const groupsAPI = {
  list: () =>
    apiFetch<{ groups: CollectionGroup[] }>("/api/collection-groups").then((r) => ({
      groups: r.groups ?? [],
    })),

  create: (data: {
    name: string;
    description?: string;
    logo_url?: string | null;
  }) =>
    apiFetch<{ group: CollectionGroup }>("/api/collection-groups", {
      method: "POST",
      body: data,
    }),

  update: (
    id: string,
    data: Partial<{ name: string; description: string | null; logo_url: string | null }>,
  ) =>
    apiFetch<{ group: CollectionGroup }>(`/api/collection-groups/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/collection-groups/${id}`, {
      method: "DELETE",
    }),
};

/* -------------------------------------------------------------- transactions */

export const transactionsAPI = {
  /**
   * Not confirmed on the backend: I found GET /:id and PATCH /reconcile, but no
   * list route. If the list returns 404, the backend needs GET / added.
   */
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

/* -------------------------------------------------------------------- refunds */

/**
 * No /api/refunds routes exist on the backend yet. Refunds are only created
 * through the admin endpoint (adminAPI.refundTransaction). These calls will
 * return 404 until the routes are added.
 */
export const refundsAPI = {
  list: (limit?: number) =>
    apiFetch<{ refunds: Refund[] }>("/api/refunds", { query: { limit } }),

  /** Paystack could not route a refund without the payer's bank details. */
  retry: (refundId: string, accountNumber: string, bankCode: string) =>
    apiFetch<{ refund: Refund }>(`/api/refunds/${refundId}/retry`, {
      method: "POST",
      body: { account_number: accountNumber, bank_code: bankCode },
    }),
};

/* ------------------------------------------------------------------ merchants */

export const merchantsAPI = {
  getMe: async () => {
    const response = await apiFetch<{ merchant?: unknown }>("/api/merchants/me");
    return {
      merchant: response.merchant
        ? normalizeMerchant(response.merchant)
        : null,
    };
  },

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

    /**
     * No set-default route on the backend. The default is stored as
     * settings.default_bank_account_id, so this saves that setting instead.
     */
    setDefault: (id: string) =>
      apiFetch<{ merchant: Merchant }>("/api/merchants/me/settings", {
        method: "PATCH",
        body: { default_bank_account_id: id },
      }),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/merchants/me/bank-accounts/${id}`, {
        method: "DELETE",
      }),
  },

  updateSettings: (settings: MerchantSettings & { logo_url?: string | null }) =>
    apiFetch<{ merchant: Merchant }>("/api/merchants/me/settings", {
      method: "PATCH",
      body: settings,
    }),

  getKyc: () => apiFetch<{ kyc: KycView }>("/api/merchants/me/kyc"),

  verifyNin: (nin: string) =>
    apiFetch<{ kyc: KycView }>("/api/merchants/me/kyc/nin", {
      method: "POST",
      body: { nin },
    }),

  verifyBank: (bankCode: string, accountNumber: string) =>
    apiFetch<{ kyc: KycView }>("/api/merchants/me/kyc/bank", {
      method: "POST",
      body: { bank_code: bankCode, account_number: accountNumber },
    }),

  setTreasurer: (name: string, phone: string) =>
    apiFetch<{ kyc: KycView }>("/api/merchants/me/treasurer", {
      method: "PATCH",
      body: { treasurer_name: name, treasurer_phone: phone },
    }),
};

/* -------------------------------------------------------------- withdrawals */

export const withdrawalsAPI = {
  list: () => apiFetch<{ withdrawals: Withdrawal[] }>("/api/withdrawals"),

  get: (id: string) =>
    apiFetch<{ withdrawal: Withdrawal }>(`/api/withdrawals/${id}`),

  create: (amount: number) =>
    apiFetch<{
      withdrawal: Withdrawal;
      approval_link?: string;
      dev_otp?: string;
    }>("/api/withdrawals", {
      method: "POST",
      body: { amount, currency: "NGN" },
    }),
};

/* ----------------------------------------------------------- approvals (public) */

export const approvalsAPI = {
  get: (token: string) =>
    apiFetch<{ approval: ApprovalSummary }>(
      `/api/approvals/${encodeURIComponent(token)}`,
      { anonymous: true },
    ),

  approve: (token: string, otp: string) =>
    apiFetch<{ withdrawal: Withdrawal }>(
      `/api/approvals/${encodeURIComponent(token)}/approve`,
      { method: "POST", body: { otp }, anonymous: true },
    ),

  reject: (token: string, reason?: string) =>
    apiFetch<{ withdrawal: Withdrawal }>(
      `/api/approvals/${encodeURIComponent(token)}/reject`,
      { method: "POST", body: { reason }, anonymous: true },
    ),
};

/* --------------------------------------------------------------- verification */

export const verifyAPI = {
  get: (reference: string) =>
    apiFetch<{ valid: boolean; receipt: PublicReceipt }>(
      `/api/verify/${encodeURIComponent(reference)}`,
      { anonymous: true },
    ),

  receiptUrl: (reference: string) =>
    apiConfig.withBase(
      `/api/verify/${encodeURIComponent(reference)}/receipt.pdf`,
    ),
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
  list: async (scope: "all" | "mine" = "all") => {
    const response = await apiFetch<{ templates?: unknown[] }>("/api/templates", {
      query: { scope },
    });
    const templates = (response.templates ?? []).map((item) =>
      normalizeTemplate(item),
    );

    // Some backends return the list without payer fields. Fill the gaps so the
    // list shows what each template asks for and the editor never opens empty,
    // which would silently overwrite the saved fields.
    await Promise.all(
      templates.map(async (template) => {
        if (template.fields && template.fields.length > 0) return;
        try {
          const result = await templatesAPI.getFields(template.id);
          template.fields = result.fields;
        } catch {
          /* keep the template listed even if its fields cannot be read */
        }
      }),
    );

    return { templates };
  },

  get: async (id: string) => {
    const response = await apiFetch<{ template?: unknown; fields?: unknown[] }>(
      `/api/templates/${id}`,
    );
    return {
      template: normalizeTemplate(
        response.template,
        fieldsFrom(response, response.template),
      ),
    };
  },

  create: async (name: string, description?: string) => {
    const response = await apiFetch<{ template?: unknown }>("/api/templates", {
      method: "POST",
      body: { name, description },
    });
    return { template: normalizeTemplate(response.template) };
  },

  update: async (id: string, data: Partial<Template>) => {
    const response = await apiFetch<{ template?: unknown }>(
      `/api/templates/${id}`,
      { method: "PATCH", body: data },
    );
    return { template: normalizeTemplate(response.template) };
  },

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/templates/${id}`, { method: "DELETE" }),

  getFields: async (id: string) => {
    const response = await apiFetch<{ fields?: unknown[] }>(
      `/api/templates/${id}/fields`,
    );
    return { fields: readFields(response.fields) };
  },

  /** Replace the whole field list. POST is the method the backend accepts. */
  setFields: async (id: string, fields: CollectionField[]) => {
    const response = await apiFetch<{ fields?: unknown[] }>(
      `/api/templates/${id}/fields`,
      { method: "POST", body: { fields: cleanFields(fields) } },
    );
    return { fields: readFields(response.fields) };
  },

  addField: (id: string, field: Omit<CollectionField, "id">) =>
    apiFetch<{ field: CollectionField }>(`/api/templates/${id}/fields`, {
      method: "POST",
      body: field,
    }),

  /** No per-field PATCH route. Loads the list, edits one field, saves it back. */
  updateField: async (
    id: string,
    fieldId: string,
    field: Partial<CollectionField>,
  ) => {
    const { fields } = await templatesAPI.getFields(id);
    const next = replaceFieldById(fields, fieldId, field);
    await templatesAPI.setFields(id, next);
    const updated = next.find((f) => f.field_id === fieldId);
    return { field: updated as CollectionField };
  },

  /** No per-field DELETE route. Loads the list, removes the field, saves it back. */
  deleteField: async (id: string, fieldId: string) => {
    const { fields } = await templatesAPI.getFields(id);
    await templatesAPI.setFields(id, replaceFieldById(fields, fieldId, null));
    return { success: true };
  },
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
  folder?: string;
  resource_type: "image" | "raw" | "video" | "auto";
  upload_url: string;
}

export const uploadsAPI = {
  sign: (folder?: string, resourceType: "image" | "raw" | "video" | "auto" = "image") =>
    apiFetch<UploadSignature>("/api/uploads/sign", {
      method: "POST",
      body: { folder, resource_type: resourceType },
    }),
};

/**
 * Uploads a picked file straight to Cloudinary using a short-lived signature
 * from our API. Merchants choose an image instead of pasting a URL, and the
 * signed folder keeps every asset on our own cloud.
 */
export async function uploadImage(file: File, folder = "jeneviv/groups"): Promise<string> {
  const signed = await uploadsAPI.sign(folder, "image");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.api_key);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);
  if (signed.folder) body.append("folder", signed.folder);

  const response = await fetch(signed.upload_url, { method: "POST", body });
  const payload = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !payload.secure_url) {
    throw new APIError(
      response.status,
      payload.error?.message || "The image could not be uploaded. Try a smaller file.",
      payload,
      "/uploads",
    );
  }
  return payload.secure_url;
}

/* --------------------------------------------------------------------- admin */

export const adminAPI = {
  /**
   * The backend has no /api/admin/stats, /api/admin/transactions or
   * /api/admin/audit-logs routes yet. Those calls return 404 until added.
   */
  getStats: () => apiFetch<AdminStats>("/api/admin/stats"),

  /** Exists on the backend: GET /api/admin/merchants. */
  listMerchants: async (status?: MerchantStatus) => {
    const response = await apiFetch<{ merchants?: unknown[] }>(
      "/api/admin/merchants",
      { query: { status } },
    );
    return { merchants: (response.merchants ?? []).map(normalizeMerchant) };
  },

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

  /** Exists on the backend: POST /api/admin/transactions/:id/refund. */
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
