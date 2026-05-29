/**
 * Central API client for Jeneviv backend
 * Handles authentication, request building, and error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      error.message || `HTTP ${response.status}`,
      error,
    );
  }

  return response.json();
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
  position: number;
  display_name: string;
  field_id: string;
  type: "short_text" | "select" | "phone" | "email" | "number";
  required: boolean;
  options?: string[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  shortCode: string;
  amount: number;
  currency: string;
  status: "active" | "closed" | "paused";
  fields?: CollectionField[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionTransaction {
  id: string;
  reference: string;
  payerName: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export const collectionsAPI = {
  list: () => apiFetch<{ collections: Collection[] }>("/api/collections"),

  create: (data: {
    name: string;
    description: string;
    amount: number;
    currency: string;
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

  setFields: (id: string, fields: CollectionField[]) =>
    apiFetch<{ collection: Collection }>(`/api/collections/${id}/fields`, {
      method: "POST",
      body: JSON.stringify({ fields }),
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

  bankAccounts: {
    list: () =>
      apiFetch<{ bank_accounts: BankAccount[] }>(
        "/api/merchants/me/bank-accounts",
      ),

    add: (data: {
      bank_code: string;
      account_number: string;
      currency: string;
      is_default: boolean;
    }) =>
      apiFetch<{ bank_account: BankAccount }>(
        "/api/merchants/me/bank-accounts",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/merchants/me/bank-accounts/${id}`, {
        method: "DELETE",
      }),
  },

  updateSettings: (settings: {
    payout_mode?: string;
    email_notification_for_transactions?: boolean;
    email_notification_period?: string;
  }) =>
    apiFetch<{ merchant: Merchant }>("/api/merchants/me/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),
};

// ============================================================================
// PAYMENTS ENDPOINTS
// ============================================================================

export interface Transaction {
  id: string;
  reference: string;
  collectionId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  payerName: string;
  payerEmail: string;
  fieldValues: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export const paymentsAPI = {
  init: (collectionShortCode: string, fieldValues: Record<string, string>) =>
    apiFetch<{
      transaction: Transaction;
      payment_account: PaymentAccount;
    }>("/api/payments/init", {
      method: "POST",
      body: JSON.stringify({
        collection_short_code: collectionShortCode,
        field_values: fieldValues,
      }),
    }),
};

// ============================================================================
// TRANSACTIONS ENDPOINTS
// ============================================================================

export const transactionsAPI = {
  get: (id: string) =>
    apiFetch<{ transaction: Transaction }>(`/api/transactions/${id}`),

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
  merchantId: string;
  bankAccountId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  gatewayRef: string;
  createdAt: string;
  updatedAt: string;
}

export const payoutsAPI = {
  list: () => apiFetch<{ payouts: Payout[] }>("/api/payouts"),

  get: (id: string) => apiFetch<{ payout: Payout }>(`/api/payouts/${id}`),

  initiate: (bankAccountId: string, amount: number, currency: string) =>
    apiFetch<{ payout: Payout }>("/api/payouts", {
      method: "POST",
      body: JSON.stringify({
        bank_account_id: bankAccountId,
        amount,
        currency,
      }),
    }),
};

// ============================================================================
// TEMPLATES ENDPOINTS
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  fields?: CollectionField[];
  createdAt: string;
  updatedAt: string;
}

export const templatesAPI = {
  list: (scope?: "all" | "mine") =>
    apiFetch<{ templates: Template[] }>(
      `/api/templates?scope=${scope || "all"}`,
    ),

  get: (id: string) => apiFetch<{ template: Template }>(`/api/templates/${id}`),

  create: (name: string, description: string) =>
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

  setFields: (id: string, fields: CollectionField[]) =>
    apiFetch<{ template: Template }>(`/api/templates/${id}/fields`, {
      method: "POST",
      body: JSON.stringify({ fields }),
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
// ADMIN ENDPOINTS
// ============================================================================

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: "pending" | "processing" | "completed" | "failed";
  gatewayRef: string;
  createdAt: string;
}

export const adminAPI = {
  refundTransaction: (transactionId: string, reason: string) =>
    apiFetch<{ refund: Refund }>(
      `/api/admin/transactions/${transactionId}/refund`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    ),

  listMerchants: (status?: string) =>
    apiFetch<{ merchants: Merchant[] }>(
      `/api/admin/merchants?status=${status || "pending"}`,
    ),

  approveMerchant: (merchantId: string, note: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    ),

  rejectMerchant: (merchantId: string, note: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    ),

  suspendMerchant: (merchantId: string, note: string) =>
    apiFetch<{ merchant: Merchant }>(
      `/api/admin/merchants/${merchantId}/suspend`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    ),
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthAPI = {
  check: () => apiFetch<{ status: string }>("/health"),
};
