import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminAPI,
  APIError,
  apiFetch,
  banksAPI,
  collectionsAPI,
  merchantsAPI,
  payoutsAPI,
  refundsAPI,
  templatesAPI,
  transactionsAPI,
  withdrawalsAPI,
  type AdminStats,
  type AuditLog,
  type Bank,
  type BankAccount,
  type Collection,
  type CollectionField,
  type Merchant,
  type MerchantStatus,
  type Payout,
  type Refund,
  type KycView,
  type Template,
  type Transaction,
  type User,
  type Withdrawal,
} from "@/lib/api";
import { isDemoMode, onDemoDataChanged } from "@/lib/demo";

export function errorMessage(error: unknown) {
  if (error instanceof APIError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refetch: () => void;
  setData: (value: T | null) => void;
}

interface ResourceOptions {
  enabled?: boolean;
  pollMs?: number;
}

/**
 * Small data-fetching primitive: aborts in-flight requests, keeps the previous
 * value while refreshing, and re-runs when `deps` change.
 */
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: ResourceOptions = {},
): Resource<T> {
  const { enabled = true, pollMs } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const hasLoaded = useRef(false);
  const depKey = JSON.stringify(deps);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      if (hasLoaded.current) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await fetcherRef.current(controller.signal);
        if (cancelled) return;
        setData(result);
        setError(null);
        hasLoaded.current = true;
      } catch (err) {
        if (cancelled) return;
        if ((err as Error)?.name === "AbortError") return;
        setError(errorMessage(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();
    let timer: ReturnType<typeof setInterval> | undefined;
    if (pollMs) timer = setInterval(load, pollMs);

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, enabled, pollMs, nonce]);

  /* Demo mode mutates its store directly — refresh so the UI stays truthful. */
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = onDemoDataChanged(() =>
      setNonce((value) => value + 1),
    );
    return () => {
      unsubscribe();
    };
  }, [enabled]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, refreshing, refetch, setData };
}

/* -------------------------------------------------------------- collections */

export function useCollections(params?: { status?: string; search?: string }) {
  const deps = [params?.status ?? "", params?.search ?? ""];
  return useResource(
    () => collectionsAPI.list(params).then((r) => r.collections),
    deps,
  );
}

export type CollectionWithStats = Collection & {
  stats?: {
    paid: number;
    collected: number;
    pending: number;
    failed: number;
    total: number;
  };
};

export function useCollectionStats(
  params?: { status?: string; search?: string },
) {
  return useResource<CollectionWithStats[]>(
    () => collectionsAPI.list(params).then((r) => r.collections),
    [params?.status ?? "", params?.search ?? ""],
  ) as Resource<CollectionWithStats[]>;
}

export function useCollection(id?: string | null) {
  return useResource<CollectionWithStats>(
    (signal) =>
      collectionsAPI.get(id as string).then((r) => r.collection),
    [id ?? ""],
    { enabled: Boolean(id) },
  ) as Resource<CollectionWithStats>;
}

export function useCollectionByCode(shortCode?: string | null) {
  return useResource<Collection>(
    () => collectionsAPI.getByCode(shortCode as string).then((r) => r.collection),
    [shortCode ?? ""],
    { enabled: Boolean(shortCode) },
  );
}

export function useCollectionFields(id?: string | null) {
  return useResource<CollectionField[]>(
    () => collectionsAPI.fields(id as string).then((r) => r.fields),
    [id ?? ""],
    { enabled: Boolean(id) },
  );
}

export function useCollectionTransactions(
  id?: string | null,
  status?: string,
  pollMs?: number,
) {
  return useResource<Transaction[]>(
    () =>
      collectionsAPI
        .transactions(id as string, status ? { status } : undefined)
        .then((r) => r.transactions),
    [id ?? "", status ?? ""],
    { enabled: Boolean(id), pollMs },
  );
}

/* ------------------------------------------------------------- transactions */

export function useTransactions(
  filters?: {
    collection_id?: string;
    status?: string;
    search?: string;
  },
  pollMs?: number,
) {
  const key = JSON.stringify(filters ?? {});
  return useResource<Transaction[]>(
    () => transactionsAPI.list(filters).then((r) => r.transactions),
    [key],
    { pollMs },
  );
}

export function useTransaction(id?: string | null) {
  return useResource<Transaction>(
    () => transactionsAPI.get(id as string).then((r) => r.transaction),
    [id ?? ""],
    { enabled: Boolean(id) },
  );
}

/* ------------------------------------------------------------------ payouts */

export function usePayouts(status?: string) {
  return useResource<Payout[]>(
    () => payoutsAPI.list(status ? { status } : undefined).then((r) => r.payouts),
    [status ?? ""],
  );
}

export function usePayout(id?: string | null) {
  return useResource<Payout>(
    () => payoutsAPI.get(id as string).then((r) => r.payout),
    [id ?? ""],
    { enabled: Boolean(id) },
  );
}

/* ------------------------------------------------------------ merchant data */

export function useMerchant() {
  return useResource<Merchant | null>(
    () => merchantsAPI.getMe().then((r) => r.merchant ?? null),
    [],
  );
}

export function useKyc() {
  return useResource<KycView>(
    () => merchantsAPI.getKyc().then((r) => r.kyc),
    [],
  );
}

export function useWithdrawals() {
  return useResource<Withdrawal[]>(
    () => withdrawalsAPI.list().then((r) => r.withdrawals),
    [],
  );
}

export function useBankAccounts() {
  return useResource<BankAccount[]>(
    () => merchantsAPI.bankAccounts.list().then((r) => r.bank_accounts),
    [],
  );
}

export function useBanks(country = "NG") {
  return useResource<Bank[]>(
    () => banksAPI.list(country).then((r) => r.banks),
    [country],
  );
}

/* ---------------------------------------------------------------- templates */

export function useTemplates(scope: "all" | "mine" = "all") {
  return useResource<Template[]>(
    () => templatesAPI.list(scope).then((r) => r.templates),
    [scope],
  );
}

export function useTemplate(id?: string | null) {
  return useResource<Template>(
    () => templatesAPI.get(id as string).then((r) => r.template),
    [id ?? ""],
    { enabled: Boolean(id) },
  );
}

/* -------------------------------------------------------------------- admin */

export function useAdminStats(enabled = true) {
  return useResource<AdminStats>(() => adminAPI.getStats(), [], { enabled });
}

export function useAdminMerchants(status?: MerchantStatus) {
  return useResource<Merchant[]>(
    () => adminAPI.listMerchants(status).then((r) => r.merchants),
    [status ?? ""],
  );
}

export function useAdminTransactions(status?: string) {
  return useResource<Transaction[]>(
    () => adminAPI.getTransactions({ status }).then((r) => r.transactions),
    [status ?? ""],
  );
}

export function useAuditLogs() {
  return useResource<AuditLog[]>(
    () => adminAPI.getAuditLogs().then((r) => r.logs),
    [],
  );
}

/* ------------------------------------------------------------------ refunds */

export function useRefunds() {
  return useResource<Refund[]>(
    async () => {
      if (isDemoMode()) {
        const response = await apiFetch<{ refunds: Refund[] }>(
          "/api/demo/refunds",
        );
        return response.refunds;
      }
      try {
        const response = await refundsAPI.list();
        return response.refunds;
      } catch (err) {
        // Refunds endpoint may not be fully implemented yet
        // Return empty array instead of failing
        if (err instanceof APIError && (err.status === 404 || err.status >= 500)) {
          return [];
        }
        throw err;
      }
    },
    [isDemoMode() ? "demo" : "live"],
  );
}

/* ---------------------------------------------------------------- user roster */

export function useSessionUser() {
  return useResource<User | null>(() =>
    apiFetch<{ user: User | null }>("/api/auth/get-session").then(
      (r) => r.user ?? null,
    ),
  );
}

/* ------------------------------------------------------------------- actions */

export function useAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        setError(errorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { run, loading, error, setError, reset: () => setError(null) };
}
