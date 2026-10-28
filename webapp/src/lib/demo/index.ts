/**
 * Demo backend.
 *
 * `VITE_DEMO_MODE` controls behaviour:
 *   auto (default) – probe the API once; if it does not answer, serve demo data
 *   true           – always serve demo data
 *   false          – never serve demo data (always hit the real API)
 *
 * The interceptor answers the same paths, shapes and status codes as the
 * documented backend, so the client code, auth flow and error handling under
 * test are the real ones.
 */

import {
  clearDatabase,
  computeBalances,
  demoFee,
  loadDatabase,
  nextId,
  saveDatabase,
  seedDatabase,
  type DemoAuditLog,
  type DemoBankAccount,
  type DemoCollection,
  type DemoDatabase,
  type DemoField,
  type DemoMerchant,
  type DemoNotify,
  type DemoTemplate,
  type DemoTransaction,
} from "./seed";

export { computeBalances, seedDatabase, clearDatabase as resetDemoStorage };

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);

export type ConnectionState = "checking" | "live" | "demo";

let state: ConnectionState = "checking";
let installed = false;
let database: DemoDatabase | null = null;

const listeners = new Set<(state: ConnectionState) => void>();

export function connectionState() {
  return state;
}

export function subscribeConnection(listener: (state: ConnectionState) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: ConnectionState) {
  state = next;
  listeners.forEach((listener) => listener(next));
}

export function isDemoMode() {
  return state === "demo";
}

function db() {
  if (!database) database = loadDatabase();
  return database;
}

function persist() {
  if (database) saveDatabase(database);
}

export function resetDemoData() {
  const fresh = seedDatabase();
  database = fresh;
  saveDatabase(fresh);
  DatabaseEvents.emit();
}

/** Lets the demo emit change events (used to fake webhook confirmations). */
const DatabaseEvents = {
  listeners: new Set<() => void>(),
  emit() {
    this.listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

export const onDemoDataChanged = (listener: () => void) =>
  DatabaseEvents.subscribe(listener);

/* ------------------------------------------------------------------ helpers */

const latency = () => 140 + Math.random() * 260;

function respond(
  status: number,
  data: unknown,
): { status: number; data: unknown } {
  return { status, data };
}

function fail(status: number, message: string) {
  return respond(status, { error: { message }, message });
}

function readToken(init?: RequestInit) {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  const auth = headers.get("Authorization");
  const stored = (() => {
    try {
      return localStorage.getItem("jeneviv.token");
    } catch {
      return null;
    }
  })();
  return auth?.replace(/^Bearer\s+/i, "") || stored;
}

function currentUser() {
  return db().user;
}

function isAuthed(init?: RequestInit) {
  return Boolean(readToken(init));
}

function merchantPayload(merchant: DemoMerchant, database: DemoDatabase) {
  const balances = computeBalances(database);
  return {
    ...merchant,
    wallet_balance_ngn: balances.collected,
    payouts_balance_ngn: balances.available,
    bank_accounts: database.bankAccounts,
  };
}

function collectionStats(collectionId: string, database: DemoDatabase) {
  const rows = database.transactions.filter(
    (t) => t.collection_id === collectionId,
  );
  const success = rows.filter((t) => t.status === "success");
  return {
    paid: success.length,
    collected: success.reduce((sum, t) => sum + t.amount, 0),
    pending: rows.filter((t) => t.status === "pending").length,
    failed: rows.filter((t) => t.status === "failed").length,
    total: rows.length,
  };
}

function notify(notifyEntry: Omit<DemoNotify, "id" | "created_at" | "read">) {
  const entry: DemoNotify = {
    ...notifyEntry,
    id: nextId("note"),
    read: false,
    created_at: new Date().toISOString(),
  };
  database!.notifications = [entry, ...database!.notifications].slice(0, 40);
}

function audit(entry: Omit<DemoAuditLog, "id" | "created_at" | "actor_uid">) {
  database!.auditLogs = [
    {
      ...entry,
      id: nextId("log"),
      actor_uid: database!.user.id,
      created_at: new Date().toISOString(),
    },
    ...database!.auditLogs,
  ].slice(0, 60);
}

/* ----------------------------------------------------------------- payment */

/** Mirrors how the gateway confirms a virtual-account transfer asynchronously. */
function scheduleConfirmation(transactionId: string, delay = 7000) {
  setTimeout(() => {
    const record = db().transactions.find((t) => t.id === transactionId);
    if (!record || record.status !== "pending") return;
    record.status = "success";
    record.paid_at = new Date().toISOString();
    record.reconciled = true;
    record.updated_at = record.paid_at;
    notify({
      type: "payment",
      title: `${record.currency === "NGN" ? "₦" : ""}${record.amount.toLocaleString()} received`,
      body: `${record.payer_name} paid into ${record.collection_name}.`,
    });
    persist();
    DatabaseEvents.emit();
  }, delay);
}

/* ------------------------------------------------------------------- router */

interface Ctx {
  method: string;
  path: string;
  params: URLSearchParams;
  body: Record<string, unknown>;
  init?: RequestInit;
}

function match(path: string, pattern: string) {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i];
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    else if (part !== pathParts[i]) return null;
  }
  return params;
}

function pathMatch(ctx: Ctx, pattern: string) {
  return match(ctx.path, pattern);
}

async function route(ctx: Ctx) {
  const { method, path, params, body } = ctx;
  const database = db();

  /* -------------------------------------------------------------- public */

  if (path === "/health") return respond(200, { status: "ok", mode: "demo" });

  if (path === "/api/banks" && method === "GET") {
    return respond(200, {
      banks: [
        { code: "035", name: "Wema Bank", country: "NG" },
        { code: "058", name: "GTBank", country: "NG" },
        { code: "011", name: "First Bank of Nigeria", country: "NG" },
        { code: "044", name: "Access Bank", country: "NG" },
        { code: "057", name: "Zenith Bank", country: "NG" },
        { code: "232", name: "Sterling Bank", country: "NG" },
        { code: "033", name: "United Bank for Africa", country: "NG" },
        { code: "215", name: "Unity Bank", country: "NG" },
        { code: "214", name: "FCMB", country: "NG" },
        { code: "070", name: "Fidelity Bank", country: "NG" },
        { code: "221", name: "Stanbic IBTC", country: "NG" },
        { code: "101", name: "Providus Bank", country: "NG" },
        { code: "999991", name: "Moniepoint MFB", country: "NG" },
        { code: "999992", name: "OPay Digital Services", country: "NG" },
        { code: "100004", name: "Opay", country: "NG" },
        { code: "100033", name: "PalmPay", country: "NG" },
      ],
    });
  }

  if (path === "/api/auth/get-session" && method === "GET") {
    if (!isAuthed(ctx.init)) return respond(200, { session: null, user: null });
    return respond(200, {
      session: {
        id: "sess_demo",
        userId: database.user.id,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      user: currentUser(),
    });
  }

  if (path === "/api/auth/sign-in/email" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email.includes("@")) return fail(400, "Enter a valid email address.");
    if (password.length < 6)
      return fail(400, "Password must be at least 6 characters.");

    const signup = database.signedUpUser;
    const SEED_EMAIL = "coordinator@jeneviv.test";
    const SEED_USER_ID = "user_demo_001";
    if (signup && signup.user.email.toLowerCase() === email) {
      database.user = signup.user;
      if (database.merchant.userId !== signup.user.id) {
        database.merchant = {
          ...database.merchant,
          userId: signup.user.id,
          display_name: signup.user.name,
          status: "pending",
          application_note: "",
        };
      }
    } else if (email !== database.user.email.toLowerCase()) {
      database.user = {
        ...database.user,
        email,
        name: email.split("@")[0].replace(/[._]/g, " "),
        role: "user",
      };
    }

    // Signing back in with the seeded coordinator email restores the canonical
    // seeded workspace (approved merchant, collections, transactions), even if
    // a previous session's sign-up corrupted the demo user/merchant in place.
    // The seed user id is the invariant: only user_demo_001 owns the approved
    // merchant_demo_001, so any other id means the workspace was overwritten.
    if (email === SEED_EMAIL && database.user.id !== SEED_USER_ID) {
      resetDemoData();
    }

    database.token = `demo_${Math.random().toString(36).slice(2, 12)}`;
    persist();
    return respond(200, {
      token: database.token,
      user: database.user,
      session: {
        id: nextId("sess"),
        userId: database.user.id,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
  }

  if (path === "/api/auth/sign-up/email" && method === "POST") {
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!name) return fail(400, "Enter your full name.");
    if (!email.includes("@")) return fail(400, "Enter a valid email address.");
    if (password.length < 8)
      return fail(400, "Use at least 8 characters for your password.");

    const user = {
      ...database.user,
      id: nextId("user"),
      name,
      email,
      emailVerified: false,
      role: "user" as const,
      createdAt: new Date().toISOString(),
    };
    database.user = user;
    database.signedUpUser = { user, password };
    database.token = `demo_${Math.random().toString(36).slice(2, 12)}`;
    database.merchant = {
      ...database.merchant,
      id: nextId("merchant"),
      userId: user.id,
      display_name: name,
      status: "pending",
      application_note: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    database.collections = [];
    database.transactions = [];
    database.payouts = [];
    database.bankAccounts = [];
    database.refunds = [];
    persist();
    return respond(200, {
      token: database.token,
      user,
      session: {
        id: nextId("sess"),
        userId: user.id,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
  }

  if (path === "/api/auth/sign-out" && method === "POST") {
    database.token = "";
    persist();
    return respond(200, { success: true });
  }

  if (path === "/api/auth/sign-in/social" && method === "POST") {
    return fail(
      400,
      "Google sign-in needs the live backend and a configured client ID.",
    );
  }

  if (path === "/api/payments/init" && method === "POST") {
    const shortCode = String(
      body.collection_short_code || body.short_code || "",
    ).toUpperCase();
    const collection = database.collections.find(
      (c) => c.short_code.toUpperCase() === shortCode,
    );
    if (!collection) return fail(404, "That collection link is not valid.");
    if (!collection.is_active)
      return fail(400, "This collection is closed and is no longer accepting payments.");

    const fieldValues = (body.field_values || {}) as Record<string, unknown>;

    for (const field of collection.fields) {
      if (field.required) {
        const value = fieldValues[field.field_id];
        if (value === undefined || value === null || String(value).trim() === "")
          return fail(400, `${field.display_name} is required.`);
      }
    }

    const duplicate = database.transactions.find(
      (t) =>
        t.collection_id === collection.id &&
        t.status !== "failed" &&
        collection.fields.some(
          (field) =>
            field.required &&
            String(t.field_values[field.field_id] ?? "").toLowerCase() ===
              String(fieldValues[field.field_id] ?? "").toLowerCase(),
        ) &&
        JSON.stringify(
          collection.fields.map((f) => String(t.field_values[f.field_id] ?? "")),
        ) ===
          JSON.stringify(
            collection.fields.map((f) => String(fieldValues[f.field_id] ?? "")),
          ),
    );
    if (duplicate)
      return fail(
        409,
        "We already have a payment for these details in this collection.",
      );

    const payerName =
      (fieldValues.full_name as string) ||
      (fieldValues.parent_name as string) ||
      (fieldValues.member_name as string) ||
      (fieldValues.attendee_name as string) ||
      (fieldValues.student_name as string) ||
      "Payer";

    const { platform, total } = demoFee(collection.amount);
    const transaction: DemoTransaction = {
      id: nextId("txn"),
      reference: `JNV-${collection.short_code}-${Math.floor(Math.random() * 9000 + 1000)}`,
      customer_id: nextId("cus"),
      merchant_id: collection.merchant_id,
      collection_id: collection.id,
      collection_name: collection.name,
      payer_name: payerName,
      payer_email: (fieldValues.email as string) || "",
      status: "pending",
      amount: collection.amount,
      platform_fee: platform,
      gateway_fee: Math.round(collection.amount * 0.014),
      total_charged: total,
      currency: collection.currency,
      gateway: "flutterwave",
      gateway_ref: `FLW-${Math.floor(Math.random() * 900000 + 100000)}`,
      field_values: fieldValues,
      reconciled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    database.transactions = [transaction, ...database.transactions];

    const accountNumber = `${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    const paymentAccount = {
      id: nextId("pva"),
      transaction_id: transaction.id,
      gateway: "flutterwave",
      account_number: accountNumber,
      account_name: "JENEVIV / FLUTTERWAVE COLLECTIONS",
      bank_code: "035",
      bank_name: "Wema Bank",
      currency: collection.currency,
      expiry_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    persist();
    scheduleConfirmation(transaction.id);

    return respond(200, {
      transaction,
      payment_account: paymentAccount,
      breakdown: {
        amount: collection.amount,
        platform_fee: platform,
        gateway_fee: transaction.gateway_fee,
        total_charged: total,
        currency: collection.currency,
      },
    });
  }

  const byCode = pathMatch(ctx, "/api/collections/by-code/:code");
  if (byCode && method === "GET") {
    const collection = database.collections.find(
      (c) => c.short_code.toUpperCase() === byCode.code.toUpperCase(),
    );
    if (!collection) return fail(404, "We could not find that collection.");
    return respond(200, { collection });
  }

  /* -------------------------------------------------------------- authed */

  if (!isAuthed(ctx.init)) return fail(401, "Sign in to continue.");

  if (path === "/api/merchants/me" && method === "GET") {
    return respond(200, {
      merchant: merchantPayload(database.merchant, database),
    });
  }

  if (path === "/api/merchants/apply" && method === "POST") {
    const displayName = String(body.display_name || "").trim();
    const note = String(body.application_note || "").trim();
    if (displayName.length < 2)
      return fail(400, "Enter the name your collectors will recognise.");
    database.merchant = {
      ...database.merchant,
      display_name: displayName,
      application_note: note,
      status: "pending",
      updatedAt: new Date().toISOString(),
    };
    audit({
      action: "merchant.applied",
      entity_type: "merchant",
      entity_id: database.merchant.id,
      metadata: { display_name: displayName },
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, {
      merchant: merchantPayload(database.merchant, database),
    });
  }

  if (path === "/api/merchants/me/settings" && method === "PATCH") {
    database.merchant.settings = {
      ...database.merchant.settings,
      ...(body as object),
    };
    database.merchant.updatedAt = new Date().toISOString();
    persist();
    return respond(200, {
      merchant: merchantPayload(database.merchant, database),
    });
  }

  if (path === "/api/merchants/me/bank-accounts" && method === "GET") {
    return respond(200, { bank_accounts: database.bankAccounts });
  }

  if (path === "/api/merchants/me/bank-accounts" && method === "POST") {
    const bankCode = String(body.bank_code || "");
    const accountNumber = String(body.account_number || "");
    if (accountNumber.length !== 10)
      return fail(400, "A Nigerian NUBAN account number has 10 digits.");
    if (!bankCode) return fail(400, "Choose your bank.");
    if (
      database.bankAccounts.some((account) => account.account_number === accountNumber)
    )
      return fail(409, "That account number is already linked.");

    const account: DemoBankAccount = {
      id: nextId("bank_acct"),
      bank_code: bankCode,
      bank_name:
        bankCode === "035"
          ? "Wema Bank"
          : bankCode === "058"
            ? "GTBank"
            : "Unverified Bank",
      account_number: accountNumber,
      account_name: database.merchant.display_name.toUpperCase().slice(0, 40),
      currency: String(body.currency || "NGN"),
      is_default: Boolean(body.is_default) || database.bankAccounts.length === 0,
      createdAt: new Date().toISOString(),
    };
    if (account.is_default)
      database.bankAccounts = database.bankAccounts.map((existing) => ({
        ...existing,
        is_default: false,
      }));
    database.bankAccounts = [...database.bankAccounts, account];
    audit({
      action: "bank_account.added",
      entity_type: "bank_account",
      entity_id: account.id,
      metadata: { account_number: account.account_number },
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, { bank_account: account });
  }

  const setDefault = pathMatch(ctx, "/api/merchants/me/bank-accounts/:id/set-default");
  if (setDefault && method === "POST") {
    const account = database.bankAccounts.find((a) => a.id === setDefault.id);
    if (!account) return fail(404, "Bank account not found.");
    database.bankAccounts = database.bankAccounts.map((existing) => ({
      ...existing,
      is_default: existing.id === account.id,
    }));
    database.merchant.settings.default_bank_account_id = account.id;
    persist();
    return respond(200, { bank_account: { ...account, is_default: true } });
  }

  const deleteBank = pathMatch(ctx, "/api/merchants/me/bank-accounts/:id");
  if (deleteBank && method === "DELETE") {
    database.bankAccounts = database.bankAccounts.filter(
      (account) => account.id !== deleteBank.id,
    );
    persist();
    DatabaseEvents.emit();
    return respond(200, { success: true });
  }

  /* --------------------------------------------------------- collections */

  if (path === "/api/collections" && method === "GET") {
    const status = params.get("status");
    const search = (params.get("search") || "").toLowerCase();
    let collections = database.collections.slice();
    if (status === "active") collections = collections.filter((c) => c.is_active);
    if (status === "paused") collections = collections.filter((c) => !c.is_active);
    if (search)
      collections = collections.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.short_code.toLowerCase().includes(search),
      );
    return respond(200, {
      collections: collections.map((collection) => ({
        ...collection,
        stats: collectionStats(collection.id, database),
      })),
    });
  }

  if (path === "/api/collections" && method === "POST") {
    const name = String(body.name || "").trim();
    const amount = Number(body.amount || 0);
    if (name.length < 2) return fail(400, "Give the collection a name.");
    if (!amount || amount <= 0)
      return fail(400, "Enter the amount each payer should send.");

    const templateId = body.template_id ? String(body.template_id) : null;
    const template = templateId
      ? database.templates.find((t) => t.id === templateId)
      : null;

    const shortCode =
      (String(body.short_code || "").trim() ||
        name
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 6)
          .toUpperCase() ||
        "PAY") + "";

    let uniqueCode = shortCode;
    let suffix = 1;
    while (
      database.collections.some(
        (collection) => collection.short_code.toUpperCase() === uniqueCode.toUpperCase(),
      )
    ) {
      suffix += 1;
      uniqueCode = `${shortCode.slice(0, 5)}${suffix}`;
    }

    const collection: DemoCollection = {
      id: nextId("col"),
      merchant_id: database.merchant.id,
      short_code: uniqueCode,
      name,
      description: String(body.description || ""),
      amount,
      currency: String(body.currency || "NGN"),
      is_active: body.is_active === undefined ? true : Boolean(body.is_active),
      target_payers: Number(body.target_payers || 0) || 0,
      fields: template ? template.fields.map((f, i) => ({ ...f, position: i })) : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    database.collections = [collection, ...database.collections];
    audit({
      action: "collection.created",
      entity_type: "collection",
      entity_id: collection.id,
      metadata: { name: collection.name, amount: collection.amount },
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, { collection });
  }

  const collectionById = pathMatch(ctx, "/api/collections/:id");
  if (collectionById) {
    const collection = database.collections.find((c) => c.id === collectionById.id);
    if (!collection) return fail(404, "Collection not found.");

    if (method === "GET")
      return respond(200, {
        collection: {
          ...collection,
          stats: collectionStats(collection.id, database),
        },
      });

    if (method === "PATCH") {
      Object.assign(collection, {
        ...body,
        updated_at: new Date().toISOString(),
      });
      persist();
      DatabaseEvents.emit();
      return respond(200, { collection });
    }

    if (method === "DELETE") {
      database.collections = database.collections.filter(
        (c) => c.id !== collection.id,
      );
      database.transactions = database.transactions.filter(
        (t) => t.collection_id !== collection.id,
      );
      audit({
        action: "collection.deleted",
        entity_type: "collection",
        entity_id: collection.id,
        metadata: { name: collection.name },
      });
      persist();
      DatabaseEvents.emit();
      return respond(200, { success: true });
    }
  }

  const collectionFields = pathMatch(ctx, "/api/collections/:id/fields");
  if (collectionFields) {
    const collection = database.collections.find((c) => c.id === collectionFields.id);
    if (!collection) return fail(404, "Collection not found.");

    if (method === "GET") return respond(200, { fields: collection.fields });

    if (method === "PUT") {
      const fields = Array.isArray(body.fields)
        ? (body.fields as DemoField[])
        : [];
      collection.fields = fields.map((field, index) => ({
        ...field,
        id: field.id || nextId("f"),
        position: index,
        field_id: field.field_id,
      }));
      collection.updated_at = new Date().toISOString();
      persist();
      DatabaseEvents.emit();
      return respond(200, { collection });
    }

    if (method === "POST") {
      const field = body as unknown as DemoField;
      if (!field.display_name) return fail(400, "The field needs a label.");
      const created: DemoField = {
        ...field,
        id: nextId("f"),
        position: collection.fields.length,
        field_id: field.field_id || `field_${collection.fields.length + 1}`,
        required: Boolean(field.required),
      };
      collection.fields = [...collection.fields, created];
      persist();
      DatabaseEvents.emit();
      return respond(200, { field: created });
    }
  }

  const collectionField = pathMatch(ctx, "/api/collections/:id/fields/:fieldId");
  if (collectionField) {
    const collection = database.collections.find((c) => c.id === collectionField.id);
    if (!collection) return fail(404, "Collection not found.");
    const index = collection.fields.findIndex((f) => f.id === collectionField.fieldId);
    if (index < 0) return fail(404, "Field not found.");

    if (method === "PATCH") {
      collection.fields[index] = { ...collection.fields[index], ...body };
      persist();
      DatabaseEvents.emit();
      return respond(200, { field: collection.fields[index] });
    }
    if (method === "DELETE") {
      collection.fields.splice(index, 1);
      collection.fields = collection.fields.map((f, i) => ({ ...f, position: i }));
      persist();
      DatabaseEvents.emit();
      return respond(200, { success: true });
    }
  }

  const collectionTxns = pathMatch(ctx, "/api/collections/:id/transactions");
  if (collectionTxns && method === "GET") {
    const collection = database.collections.find((c) => c.id === collectionTxns.id);
    if (!collection) return fail(404, "Collection not found.");
    const status = params.get("status");
    let rows = database.transactions.filter((t) => t.collection_id === collection.id);
    if (status) rows = rows.filter((t) => t.status === status);
    return respond(200, { transactions: rows });
  }

  /* -------------------------------------------------------- transactions */

  if (path === "/api/transactions" && method === "GET") {
    let rows = database.transactions.slice();
    const collectionId = params.get("collection_id");
    const status = params.get("status");
    const search = (params.get("search") || "").toLowerCase();
    if (collectionId) rows = rows.filter((t) => t.collection_id === collectionId);
    if (status && status !== "all") rows = rows.filter((t) => t.status === status);
    if (search)
      rows = rows.filter(
        (t) =>
          t.reference.toLowerCase().includes(search) ||
          t.payer_name.toLowerCase().includes(search) ||
          JSON.stringify(t.field_values).toLowerCase().includes(search),
      );
    return respond(200, { transactions: rows, total: rows.length });
  }

  if (path === "/api/transactions/reconcile" && method === "PATCH") {
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : [];
    const reconciled = Boolean(body.reconciled);
    let updated = 0;
    database.transactions = database.transactions.map((transaction) => {
      if (!ids.includes(transaction.id)) return transaction;
      updated += 1;
      return {
        ...transaction,
        reconciled,
        updated_at: new Date().toISOString(),
      };
    });
    audit({
      action: reconciled ? "transactions.reconciled" : "transactions.unreconciled",
      entity_type: "transaction",
      entity_id: ids.join(","),
      metadata: { count: updated },
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, { updated });
  }

  const transactionById = pathMatch(ctx, "/api/transactions/:id");
  if (transactionById && method === "GET") {
    const transaction = database.transactions.find((t) => t.id === transactionById.id);
    if (!transaction) return fail(404, "Transaction not found.");
    return respond(200, { transaction });
  }

  /* ------------------------------------------------------------- payouts */

  if (path === "/api/payouts" && method === "GET") {
    const status = params.get("status");
    let rows = database.payouts.slice();
    if (status && status !== "all") rows = rows.filter((p) => p.status === status);
    return respond(200, { payouts: rows });
  }

  if (path === "/api/payouts" && method === "POST") {
    const bankAccountId = String(body.bank_account_id || "");
    const amount = Number(body.amount || 0);
    const account = database.bankAccounts.find((a) => a.id === bankAccountId);
    if (!account) return fail(400, "Choose the bank account to pay out to.");
    if (amount <= 0) return fail(400, "Enter an amount greater than zero.");

    const balances = computeBalances(database);
    if (amount > balances.available)
      return fail(
        400,
        `You can withdraw up to ₦${balances.available.toLocaleString()} right now.`,
      );

    const payout = {
      id: nextId("payout"),
      merchant_id: database.merchant.id,
      bank_account_id: account.id,
      account_number: account.account_number,
      account_name: account.account_name,
      bank_code: account.bank_code,
      amount,
      currency: String(body.currency || "NGN"),
      status: "pending" as const,
      gateway: "flutterwave",
      gateway_ref: `PAY-${Date.now()}`,
      initiated_by: "merchant" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    database.payouts = [payout, ...database.payouts];
    audit({
      action: "payout.initiated",
      entity_type: "payout",
      entity_id: payout.id,
      metadata: { amount },
    });
    notify({
      type: "payout",
      title: "Payout requested",
      body: `₦${amount.toLocaleString()} is on its way to ${account.bank_name} ••${account.account_number.slice(-4)}.`,
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, { payout });
  }

  const payoutById = pathMatch(ctx, "/api/payouts/:id");
  if (payoutById && method === "GET") {
    const payout = database.payouts.find((p) => p.id === payoutById.id);
    if (!payout) return fail(404, "Payout not found.");
    return respond(200, { payout });
  }

  /* ----------------------------------------------------------- templates */

  if (path === "/api/templates" && method === "GET") {
    const scope = params.get("scope") || "all";
    const templates =
      scope === "mine"
        ? database.templates.filter((t) => t.merchant_id === database.merchant.id)
        : database.templates;
    return respond(200, { templates });
  }

  if (path === "/api/templates" && method === "POST") {
    const name = String(body.name || "").trim();
    if (name.length < 2) return fail(400, "Give the template a name.");
    const template: DemoTemplate = {
      id: nextId("tmpl"),
      merchant_id: database.merchant.id,
      name,
      description: String(body.description || ""),
      is_public: false,
      fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    database.templates = [template, ...database.templates];
    persist();
    DatabaseEvents.emit();
    return respond(200, { template });
  }

  const templateFields = pathMatch(ctx, "/api/templates/:id/fields");
  if (templateFields) {
    const template = database.templates.find((t) => t.id === templateFields.id);
    if (!template) return fail(404, "Template not found.");
    if (method === "GET") return respond(200, { fields: template.fields });
    if (method === "PUT") {
      template.fields = (Array.isArray(body.fields) ? body.fields : []).map(
        (field: DemoField, index: number) => ({
          ...field,
          id: field.id || nextId("f"),
          position: index,
        }),
      );
      template.updated_at = new Date().toISOString();
      persist();
      DatabaseEvents.emit();
      return respond(200, { template });
    }
    if (method === "POST") {
      const field = body as unknown as DemoField;
      const created: DemoField = {
        ...field,
        id: nextId("f"),
        position: template.fields.length,
        field_id: field.field_id || `field_${template.fields.length + 1}`,
      };
      template.fields = [...template.fields, created];
      persist();
      DatabaseEvents.emit();
      return respond(200, { field: created });
    }
  }

  const templateField = pathMatch(ctx, "/api/templates/:id/fields/:fieldId");
  if (templateField) {
    const template = database.templates.find((t) => t.id === templateField.id);
    if (!template) return fail(404, "Template not found.");
    const index = template.fields.findIndex((f) => f.id === templateField.fieldId);
    if (index < 0) return fail(404, "Field not found.");
    if (method === "PATCH") {
      template.fields[index] = { ...template.fields[index], ...body };
      persist();
      DatabaseEvents.emit();
      return respond(200, { field: template.fields[index] });
    }
    if (method === "DELETE") {
      template.fields.splice(index, 1);
      template.fields = template.fields.map((f, i) => ({ ...f, position: i }));
      persist();
      DatabaseEvents.emit();
      return respond(200, { success: true });
    }
  }

  const templateById = pathMatch(ctx, "/api/templates/:id");
  if (templateById) {
    const template = database.templates.find((t) => t.id === templateById.id);
    if (!template) return fail(404, "Template not found.");
    if (method === "GET") return respond(200, { template });
    if (method === "PATCH") {
      Object.assign(template, { ...body, updated_at: new Date().toISOString() });
      persist();
      DatabaseEvents.emit();
      return respond(200, { template });
    }
    if (method === "DELETE") {
      database.templates = database.templates.filter((t) => t.id !== template.id);
      persist();
      DatabaseEvents.emit();
      return respond(200, { success: true });
    }
  }

  /* -------------------------------------------------------------- uploads */

  if (path === "/api/uploads/sign" && method === "POST") {
    return fail(
      501,
      "Image uploads need Cloudinary keys on the live backend.",
    );
  }

  /* ---------------------------------------------------------------- admin */

  if (path === "/api/admin/stats" && method === "GET") {
    const balances = computeBalances(database);
    return respond(200, {
      total_merchants: database.adminMerchants.length,
      pending_merchants: database.adminMerchants.filter((m) => m.status === "pending")
        .length,
      total_transactions: database.transactions.length,
      total_volume: balances.collected,
      pending_payouts: database.payouts.filter((p) => p.status === "pending").length,
    });
  }

  if (path === "/api/admin/merchants" && method === "GET") {
    const status = params.get("status");
    const merchants = status
      ? database.adminMerchants.filter((m) => m.status === status)
      : database.adminMerchants;
    return respond(200, {
      merchants: merchants.map((m) => merchantPayload(m, database)),
    });
  }

  const merchantAction = pathMatch(ctx, "/api/admin/merchants/:id/:action");
  if (merchantAction && method === "POST") {
    const merchant = database.adminMerchants.find((m) => m.id === merchantAction.id);
    if (!merchant) return fail(404, "Merchant not found.");
    const nextStatus =
      merchantAction.action === "approve"
        ? "approved"
        : merchantAction.action === "reject"
          ? "rejected"
          : merchantAction.action === "suspend"
            ? "suspended"
            : null;
    if (!nextStatus) return fail(400, "Unknown merchant action.");
    merchant.status = nextStatus as DemoMerchant["status"];
    merchant.updatedAt = new Date().toISOString();
    audit({
      action: `merchant.${merchantAction.action}`,
      entity_type: "merchant",
      entity_id: merchant.id,
      metadata: { note: body.note ?? null },
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, { merchant: merchantPayload(merchant, database) });
  }

  const adminRefund = pathMatch(ctx, "/api/admin/transactions/:id/refund");
  if (adminRefund && method === "POST") {
    const transaction = database.transactions.find((t) => t.id === adminRefund.id);
    if (!transaction) return fail(404, "Transaction not found.");
    if (transaction.status !== "success")
      return fail(400, "Only successful payments can be refunded.");
    const refund = {
      id: nextId("refund"),
      transaction_id: transaction.id,
      merchant_id: transaction.merchant_id,
      amount: transaction.amount,
      reason: String(body.reason || ""),
      status: "processing" as const,
      gateway_ref: `RF-${transaction.reference}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    database.refunds = [refund, ...database.refunds];
    transaction.status = "cancelled";
    transaction.updated_at = new Date().toISOString();
    audit({
      action: "refund.requested",
      entity_type: "transaction",
      entity_id: transaction.id,
      metadata: { amount: refund.amount, reason: refund.reason },
    });
    notify({
      type: "refund",
      title: "Refund processing",
      body: `₦${refund.amount.toLocaleString()} is being returned for ${transaction.reference}.`,
    });
    persist();
    DatabaseEvents.emit();
    return respond(200, { refund });
  }

  if (path === "/api/admin/transactions" && method === "GET") {
    let rows = database.transactions.slice();
    const status = params.get("status");
    if (status && status !== "all") rows = rows.filter((t) => t.status === status);
    return respond(200, { transactions: rows });
  }

  if (path === "/api/admin/audit-logs" && method === "GET") {
    return respond(200, { logs: database.auditLogs });
  }

  /* ------------------------------------------------------- extra (local) */

  if (path === "/api/demo/refunds" && method === "GET") {
    return respond(200, { refunds: database.refunds });
  }

  if (path === "/api/demo/notifications" && method === "GET") {
    return respond(200, { notifications: database.notifications });
  }

  if (path === "/api/demo/notifications/read" && method === "POST") {
    database.notifications = database.notifications.map((entry) => ({
      ...entry,
      read: true,
    }));
    persist();
    DatabaseEvents.emit();
    return respond(200, { success: true });
  }

  if (path === "/api/demo/collections-metrics" && method === "GET") {
    return respond(200, {
      metrics: database.collections.map((collection) => ({
        collection_id: collection.id,
        ...collectionStats(collection.id, database),
      })),
    });
  }

  if (path === "/api/demo/reset" && method === "POST") {
    resetDemoData();
    return respond(200, { success: true });
  }

  return fail(404, `Demo backend has no route for ${ctx.method} ${ctx.path}`);
}

/* --------------------------------------------------------------- intercept */

const originalFetch: typeof window.fetch = window.fetch.bind(window);

function requestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

async function handleFetch(input: RequestInfo | URL, init?: RequestInit) {
  const rawUrl = requestUrl(input);

  if (!rawUrl.startsWith(API_BASE)) return null; // not our API

  const url = new URL(rawUrl);
  const method = (
    init?.method ||
    (typeof input === "object" && "method" in input ? input.method : "GET") ||
    "GET"
  ).toUpperCase();

  let body: Record<string, unknown> = {};
  if (typeof init?.body === "string" && init.body.length) {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = {};
    }
  }

  await new Promise((resolve) => setTimeout(resolve, latency()));

  const result = await route({
    method,
    path: url.pathname.replace(/\/$/, "") || "/",
    params: url.searchParams,
    body,
    init,
  });

  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: { "Content-Type": "application/json", "x-jeneviv-demo": "1" },
  });
}

const CONFIGURED_MODE = String(import.meta.env.VITE_DEMO_MODE ?? "false").toLowerCase();
let negotiation: Promise<ConnectionState> | null = null;

/**
 * Decides once whether requests should hit the real API or the demo dataset.
 * Runs the health probe through the untouched fetch so it can never recurse.
 */
function negotiate(): Promise<ConnectionState> {
  if (!negotiation) {
    negotiation = (async () => {
      if (CONFIGURED_MODE === "true") {
        setState("demo");
        return state;
      }
      if (CONFIGURED_MODE === "false") {
        setState("live");
        return state;
      }

      const timeout =
        typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
          ? AbortSignal.timeout(6000)
          : undefined;

      try {
        const response = await originalFetch(`${API_BASE}/health`, {
          headers: { Accept: "application/json" },
          signal: timeout,
        });
        if (!response.ok) throw new Error(`health ${response.status}`);
        setState("live");
      } catch {
        setState("demo");
      }
      return state;
    })();
  }
  return negotiation;
}

/**
 * Wraps fetch so later API calls can be served from demo data. Requests are
 * held briefly while the health probe finishes, which means no screen ever
 * races the connection check.
 */
function installInterceptor() {
  if (installed || CONFIGURED_MODE === "false") return;
  installed = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl = requestUrl(input);
    if (!rawUrl.startsWith(API_BASE)) return originalFetch(input, init);

    const decision = await negotiate();
    if (decision === "live") return originalFetch(input, init);

    const demoResponse = await handleFetch(input, init);
    return demoResponse ?? originalFetch(input, init);
  };
}

/** Called once when the dashboard boots. */
export async function initApiConnection() {
  installInterceptor();
  database = loadDatabase();
  return negotiate();
}

// Install immediately so payer pages and deep links work on first paint.
installInterceptor();
