import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authAPI,
  APIError,
  merchantsAPI,
  onUnauthorized,
  tokenStore,
  type Merchant,
  type User,
} from "@/lib/api";
import {
  connectionState,
  initApiConnection,
  subscribeConnection,
  type ConnectionState,
} from "@/lib/demo";

interface AuthContextValue {
  user: User | null;
  merchant: Merchant | null;
  loading: boolean;
  connection: ConnectionState;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshMerchant: () => Promise<void>;
  setMerchant: (merchant: Merchant | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>(
    connectionState(),
  );

  const loadMerchant = useCallback(async () => {
    try {
      const response = await merchantsAPI.getMe();
      setMerchant(response.merchant ?? null);
    } catch {
      setMerchant(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { user: sessionUser } = await authAPI.getSession();
      setUser(sessionUser ?? null);
      if (sessionUser) await loadMerchant();
      else setMerchant(null);
    } catch (err) {
      if (err instanceof APIError && err.isAuthError) setUser(null);
      setUser((current) => current);
    }
  }, [loadMerchant]);

  const refreshMerchant = useCallback(async () => {
    await loadMerchant();
  }, [loadMerchant]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      const state = await initApiConnection();
      if (cancelled) return;
      setConnection(state);

      try {
        const { user: sessionUser } = await authAPI.getSession();
        if (cancelled) return;
        if (sessionUser) {
          setUser(sessionUser);
          await loadMerchant();
        }
      } catch {
        /* not signed in — expected on first load */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    const unsubscribeDemo = subscribeConnection(setConnection);
    const unsubscribeAuth = onUnauthorized(() => {
      setUser(null);
      setMerchant(null);
    });

    return () => {
      cancelled = true;
      unsubscribeDemo();
      unsubscribeAuth();
    };
  }, [loadMerchant]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const response = await authAPI.signIn(email, password);
      tokenStore.set(response.token ?? null);
      setUser(response.user);
      await loadMerchant();
    },
    [loadMerchant],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      const response = await authAPI.signUp(name, email, password);
      tokenStore.set(response.token ?? null);
      setUser(response.user);
      await loadMerchant();
    },
    [loadMerchant],
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.signOut();
    } catch {
      /* signing out locally is enough if the server is unreachable */
    }
    tokenStore.set(null);
    setUser(null);
    setMerchant(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      merchant,
      loading,
      connection,
      error,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
      refreshSession,
      refreshMerchant,
      setMerchant,
    }),
    [
      user,
      merchant,
      loading,
      connection,
      error,
      login,
      signup,
      logout,
      refreshSession,
      refreshMerchant,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
