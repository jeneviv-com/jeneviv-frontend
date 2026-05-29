"use client";

import {
  APIError,
  collectionsAPI,
  merchantsAPI,
  payoutsAPI,
  templatesAPI,
  transactionsAPI,
} from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Generic hook for async operations
export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const message =
        error instanceof APIError ? error.message : "An error occurred";
      setState({ data: null, loading: false, error: message });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute, refetch: execute };
}

// ============================================================================
// COLLECTIONS HOOKS
// ============================================================================

export function useCollections() {
  return useAsync(() => collectionsAPI.list().then((r) => r.collections));
}

export function useCollection(id: string | null) {
  return useAsync(
    () =>
      id
        ? collectionsAPI.get(id).then((r) => r.collection)
        : Promise.reject("No ID provided"),
    !!id,
  );
}

export function useCollectionTransactions(collectionId: string) {
  return useAsync(() =>
    collectionsAPI.transactions(collectionId).then((r) => r.transactions),
  );
}

export function useCreateCollection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: {
      name: string;
      description: string;
      amount: number;
      currency: string;
      template_id?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await collectionsAPI.create(data);
        return result.collection;
      } catch (err) {
        const message =
          err instanceof APIError ? err.message : "Failed to create collection";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { create, loading, error };
}

// ============================================================================
// TRANSACTIONS HOOKS
// ============================================================================

export function useTransaction(id: string | null) {
  return useAsync(
    () =>
      id
        ? transactionsAPI.get(id).then((r) => r.transaction)
        : Promise.reject("No ID provided"),
    !!id,
  );
}

// ============================================================================
// PAYOUTS HOOKS
// ============================================================================

export function usePayouts() {
  return useAsync(() => payoutsAPI.list().then((r) => r.payouts));
}

export function usePayout(id: string | null) {
  return useAsync(
    () =>
      id
        ? payoutsAPI.get(id).then((r) => r.payout)
        : Promise.reject("No ID provided"),
    !!id,
  );
}

export function useInitiatePayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiate = useCallback(
    async (bankAccountId: string, amount: number, currency: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await payoutsAPI.initiate(
          bankAccountId,
          amount,
          currency,
        );
        return result.payout;
      } catch (err) {
        const message =
          err instanceof APIError ? err.message : "Failed to initiate payout";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { initiate, loading, error };
}

// ============================================================================
// MERCHANT HOOKS
// ============================================================================

export function useMerchant() {
  return useAsync(() => merchantsAPI.getMe().then((r) => r.merchant));
}

export function useBankAccounts() {
  return useAsync(() =>
    merchantsAPI.bankAccounts.list().then((r) => r.bank_accounts),
  );
}

export function useAddBankAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (data: {
      bank_code: string;
      account_number: string;
      currency: string;
      is_default: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await merchantsAPI.bankAccounts.add(data);
        return result.bank_account;
      } catch (err) {
        const message =
          err instanceof APIError ? err.message : "Failed to add bank account";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { add, loading, error };
}

// ============================================================================
// TEMPLATES HOOKS
// ============================================================================

export function useTemplates() {
  return useAsync(() => templatesAPI.list().then((r) => r.templates));
}

export function useTemplate(id: string | null) {
  return useAsync(
    () =>
      id
        ? templatesAPI.get(id).then((r) => r.template)
        : Promise.reject("No ID provided"),
    !!id,
  );
}

export function useCreateTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (name: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await templatesAPI.create(name, description);
      return result.template;
    } catch (err) {
      const message =
        err instanceof APIError ? err.message : "Failed to create template";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
