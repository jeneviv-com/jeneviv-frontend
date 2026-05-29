"use client";

import { authAPI, User } from "@/lib/api";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    refreshSession();
  }, []);

  const refreshSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await authAPI.getSession();
      setUser(user);
    } catch (err) {
      setUser(null);
      // Session expired or not authenticated - this is normal
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await authAPI.signIn(email, password);
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await authAPI.signUp(name, email, password);
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.signOut();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign out";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    refreshSession,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
