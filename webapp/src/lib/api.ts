/**
 * Central API client for Jeneviv backend
 * Handles authentication, request building, and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Debug logging
const DEBUG = false;
function log(msg: string, data?: any) {
  if (DEBUG) console.log(`[API] ${msg}`, data);
}

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Core fetch wrapper with error handling and authentication
 */
async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Get session cookie if available
  if (typeof document !== "undefined") {
    const cookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find(
        (c) =>
          c.startsWith("better-auth.session_token=") ||
          c.startsWith("__Secure-better-auth.session_token="),
      );

    if (cookies) {
      headers["Cookie"] = cookies;
    }

    // Get origin for CORS
    headers["Origin"] = window.location.origin;
  }

  log(`${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle backend error format: { error: { code, message, details? } }
    const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}`;
    log(`Error: ${response.status} - ${errorMsg}`, data);
    throw new APIError(response.status, errorMsg, data);
  }

  log(`Success: ${response.status}`, data);
  return data;
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export const authAPI = {
  getSession: () =>
    apiFetch<{ session: Session; user: User }>("/api/auth/get-session"),

  signIn: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signUp: (name: string, email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  signOut: () =>
    apiFetch<{ success: boolean }>("/api/auth/sign-out", {
      method: "POST",
    }),
};

// ============================================================================
// COLLECTIONS ENDPOINTS
// ============================================================================

export interface CollectionField {
  id?: string;
  position: number;
  display_name: string;
  field_id: string;
  type: "short_text" | "long_text" | "number" | "email" | "phone" | "select" | "multiselect" | "image" | "file" | "date";
  required: boolean;
  options?: string[];
}

export interface Collection {
  id: string;
  merchant_id: string;
  short_code: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  cover_image_url?: string;
  is_active: boolean;
  fields?: CollectionField[];
  created_at: string;
  updated_at: string;
}

export interface CollectionTransaction {
  id: string;
  reference: string;
  customer_id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "expired";
  created_at: string;
}

export const collectionsAPI = {
  list: () => apiFetch<{ collections: Collection[] }>("/api/collections"),

  create: (data: {
    name: string;
    description?: string;
    amount: number;
    currency?: string;
    template_id?: string;
  }) =>
    apiFetch<{ collection: Collection }>("/api/collections", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    apiFetch<{ collection: Collection }>(`/api/collections/${id}`),

  getByCode: (code: string) =>
    apiFetch<{ collection: Collection }>(`/api/collections/by-code/${code}`),

  update: (id: string, data: Partial<Collection>) =>
    apiFetch<{ collection: Collection }>(`/api/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${id}`, {
      method: "DELETE",
    }),

  addField: (id: string, field: Omit<CollectionField, "id">) =>
    apiFetch<{ field: CollectionField }>(`/api/collections/${id}/fields`, {
      method: "POST",
      body: JSON.stringify(field),
    }),

  updateField: (id: string, fieldId: string, field: Partial<CollectionField>) =>
    apiFetch<{ field: CollectionField }>(`/api/collections/${id}/fields/${fieldId}`, {
      method: "PATCH",
      body: JSON.stringify(field),
    }),

  deleteField: (id: string, fieldId: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${id}/fields/${fieldId}`, {
      method: "DELETE",
    }),

  transactions: (id: string) =>
    apiFetch<{ transactions: CollectionTransaction[] }>(
      `/api/collections/${id}/transactions`,
    ),
};

// ============================================================================
// MERCHANTS ENDPOINTS
// ============================================================================

export interface BankAccount {
  id: string;
  bank_code: string;
  account_number: string;
  currency: string;
  is_default: boolean;
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  displayName: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  bankAccounts?: BankAccount[];
  settings?: {
    payout_mode: "manual" | "automatic";
    email_notification_for_transactions: boolean;
    email_notification_period: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const merchantsAPI = {
  getMe: () => apiFetch<{ merchant: Merchant }>("/api/merchants/me"),

  apply: (displayName: string, applicationNote: string) =>
    apiFetch<{ merchant: Merchant }>("/api/merchants/apply", {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        application_note: applicationNote,
      }),
    }),

  updateSettings: (settings: {
    payout_mode?: "manual" | "auto_daily" | "auto_weekly";
    email_notification_for_transactions?: boolean;
    email_notification_period?: "immediate" | "hourly" | "6hourly" | "12hourly" | "daily";
    default_bank_account_id?: string;
  }) =>
    apiFetch<{ merchant: Merchant }>("/api/merchants/me/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
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
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),

    setDefault: (id: string) =>
      apiFetch<{ bank_account: BankAccount }>(
        `/api/merchants/me/bank-accounts/${id}/set-default`,
        {
          method: "POST",
        },
      ),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/merchants/me/bank-accounts/${id}`, {
        method: "DELETE",
      }),
  },
};

// ============================================================================
// PAYMENTS ENDPOINTS
// ============================================================================

export interface Transaction {
  id: string;
  reference: string;
  customer_id: string;
  merchant_id: string;
  collection_id: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "expired";
  amount: number;
  platform_fee: number;
  gateway_fee: number;
  total_charged: number;
  currency: string;
  gateway: string;
  gateway_ref?: string;
  gateway_id?: string;
  paid_at?: string;
  settled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAccount {
  id: string;
  transaction_id: string;
  for_user_id: string;
  gateway: string;
  gateway_account_id: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
  currency: string;
  expiry_at: string;
  created_at: string;
}

export interface InitPaymentResult {
  transaction: Transaction;
  payment_account: PaymentAccount;
  breakdown: {
    amount: number;
    platform_fee: number;
    gateway_fee: number;
    total_charged: number;
    currency: string;
  };
}

export const paymentsAPI = {
  init: (collectionShortCode: string, fieldValues: Record<string, any>) =>
    apiFetch<InitPaymentResult>("/api/payments/init", {
      method: "POST",
      body: JSON.stringify({
        collection_short_code: collectionShortCode,
        field_values: fieldValues,
      }),
    }),
};

export const transactionsAPI = {
  get: (id: string) =>
    apiFetch<{ transaction: Transaction }>(`/api/transactions/${id}`),

  list: (filters?: { collection_id?: string; status?: string }) =>
    apiFetch<{ transactions: Transaction[] }>("/api/transactions", {
      method: "GET",
      ...(filters && {
        body: JSON.stringify(filters),
      }),
    }),

  reconcile: (ids: string[], reconciled: boolean) =>
    apiFetch<{ updated: number }>("/api/transactions/reconcile", {
      method: "PATCH",
      body: JSON.stringify({ ids, reconciled }),
    }),
};

// ============================================================================
// PAYOUTS ENDPOINTS
// ============================================================================

export interface Payout {
  id: string;
  merchant_id: string;
  bank_account_id: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "success" | "failed";
  gateway: string;
  gateway_tx_id?: string;
  gateway_ref: string;
  failure_reason?: string;
  initiated_by: "merchant" | "cron";
  initiated_by_uid?: string;
  created_at: string;
  updated_at: string;
}

export const payoutsAPI = {
  list: () => apiFetch<{ payouts: Payout[] }>("/api/payouts"),

  get: (id: string) => apiFetch<{ payout: Payout }>(`/api/payouts/${id}`),

  initiate: (bankAccountId: string, amount: number, currency?: string) =>
    apiFetch<{ payout: Payout }>("/api/payouts", {
      method: "POST",
      body: JSON.stringify({
        bank_account_id: bankAccountId,
        amount,
        currency,
      }),
    }),
};

export interface Template {
  id: string;
  merchant_id?: string;
  name: string;
  description?: string;
  fields?: CollectionField[];
  created_at: string;
  updated_at: string;
}

export const templatesAPI = {
  list: (scope?: "all" | "mine") =>
    apiFetch<{ templates: Template[] }>(
      `/api/templates?scope=${scope || "all"}`,
    ),

  get: (id: string) => apiFetch<{ template: Template }>(`/api/templates/${id}`),

  create: (name: string, description?: string) =>
    apiFetch<{ template: Template }>("/api/templates", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, data: Partial<Template>) =>
    apiFetch<{ template: Template }>(`/api/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/templates/${id}`, {
      method: "DELETE",
    }),

  addField: (id: string, field: Omit<CollectionField, "id">) =>
    apiFetch<{ field: CollectionField }>(`/api/templates/${id}/fields`, {
      method: "POST",
      body: JSON.stringify(field),
    }),

  updateField: (id: string, fieldId: string, field: Partial<CollectionField>) =>
    apiFetch<{ field: CollectionField }>(`/api/templates/${id}/fields/${fieldId}`, {
      method: "PATCH",
      body: JSON.stringify(field),
    }),

  deleteField: (id: string, fieldId: string) =>
    apiFetch<{ success: boolean }>(`/api/templates/${id}/fields/${fieldId}`, {
      method: "DELETE",
    }),

  getFields: (id: string) =>
    apiFetch<{ fields: CollectionField[] }>(`/api/templates/${id}/fields`),
};

// ============================================================================
// BANKS ENDPOINTS
// ============================================================================

export interface Bank {
  code: string;
  name: string;
  country: string;
}

export const banksAPI = {
  list: (country: string = "NG") =>
    apiFetch<{ banks: Bank[] }>(`/api/banks?country=${country}`),
};

// ============================================================================
// UPLOADS ENDPOINTS
// ============================================================================

export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
}

export const uploadsAPI = {
  sign: () =>
    apiFetch<UploadSignature>("/api/uploads/sign", {
      method: "POST",
    }),
};

// ============================================================================
// REFUNDS ENDPOINTS
// ============================================================================

export interface Refund {
  id: string;
  transaction_id: string;
  merchant_id: string;
  amount: number;
  reason: string;
  status: "pending" | "processing" | "success" | "failed";
  gateway_ref: string;
  initiated_by_uid: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

export const adminAPI = {
  refundTransaction: (transactionId: string, reason: string) =>
    apiFetch<{ refund: Refund }>(
      `/api/admin/transactions/${transactionId}/refund`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    ),

  listMerchants: (status?: "pending" | "approved" | "rejected" | "suspended") =>
    apiFetch<{ merchants: Merchant[] }>(
      `/api/admin/merchants?status=${status || "pending"}`,
    ),

  approveMerchant: (merchantId: string, note?: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    ),

  rejectMerchant: (merchantId: string, note?: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    ),

  suspendMerchant: (merchantId: string, note?: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/suspend`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    ),

  getStats: () =>
    apiFetch<{
      total_merchants: number;
      total_transactions: number;
      total_volume: number;
      pending_payouts: number;
    }>("/api/admin/stats"),

  getTransactions: (filters?: { status?: string; merchant_id?: string }) =>
    apiFetch<{ transactions: Transaction[] }>("/api/admin/transactions", {
      method: "GET",
      ...(filters && { body: JSON.stringify(filters) }),
    }),

  getAuditLogs: (filters?: { entity_type?: string; action?: string }) =>
    apiFetch<{
      logs: Array<{
        id: string;
        actor_uid?: string;
        action: string;
        entity_type: string;
        entity_id: string;
        metadata: Record<string, any>;
        created_at: string;
      }>;
    }>("/api/admin/audit-logs", {
      method: "GET",
      ...(filters && { body: JSON.stringify(filters) }),
    }),
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthAPI = {
  check: () => apiFetch<{ status: string }>("/health"),
};
