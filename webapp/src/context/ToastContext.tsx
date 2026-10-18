import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}

export interface FeedItem {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
  dismiss: (id: string) => void;
  feed: FeedItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearFeed: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const FEED_KEY = "jeneviv.feed";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    try {
      const raw = localStorage.getItem(FEED_KEY);
      return raw ? (JSON.parse(raw) as FeedItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, 40)));
    } catch {
      /* ignore */
    }
  }, [feed]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), toast.tone === "error" ? 7000 : 4500);
    },
    [dismiss],
  );

  const remember = useCallback((tone: ToastTone, title: string, body?: string) => {
    setFeed((current) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          tone,
          title,
          body,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...current,
      ].slice(0, 40),
    );
  }, []);

  const success = useCallback(
    (title: string, body?: string) => {
      push({ tone: "success", title, body });
      remember("success", title, body);
    },
    [push, remember],
  );

  const error = useCallback(
    (title: string, body?: string) => {
      push({ tone: "error", title, body });
      remember("error", title, body);
    },
    [push, remember],
  );

  const info = useCallback(
    (title: string, body?: string) => {
      push({ tone: "info", title, body });
      remember("info", title, body);
    },
    [push, remember],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      push,
      success,
      error,
      info,
      dismiss,
      feed,
      unreadCount: feed.filter((item) => !item.read).length,
      markAllRead: () =>
        setFeed((current) => current.map((item) => ({ ...item, read: true }))),
      markRead: (id: string) =>
        setFeed((current) =>
          current.map((item) => (item.id === id ? { ...item, read: true } : item)),
        ),
      clearFeed: () => setFeed([]),
    }),
    [toasts, push, success, error, info, dismiss, feed],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
