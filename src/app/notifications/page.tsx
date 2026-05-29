"use client";

import { useNotifications } from "@/context/NotificationContext";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  InfoIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const typeConfig = {
  success: {
    icon: CheckCircle,
    label: "Success",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  info: {
    icon: InfoIcon,
    label: "Info",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
};

export default function NotificationsPage() {
  const {
    notifications,
    removeNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  const grouped = useMemo(() => {
    const today: typeof notifications = [];
    const yesterday: typeof notifications = [];
    const older: typeof notifications = [];

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    notifications.forEach((n) => {
      const notifDate = new Date(
        n.timestamp.getFullYear(),
        n.timestamp.getMonth(),
        n.timestamp.getDate(),
      );

      if (notifDate.getTime() === todayStart.getTime()) {
        today.push(n);
      } else if (notifDate.getTime() === yesterdayStart.getTime()) {
        yesterday.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, older };
  }, [notifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "All caught up!"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <InfoIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              No notifications yet
            </h2>
            <p className="text-slate-500">
              Your notifications will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today */}
            {grouped.today.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Today
                </h2>
                <div className="space-y-2">
                  {grouped.today.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Yesterday */}
            {grouped.yesterday.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Yesterday
                </h2>
                <div className="space-y-2">
                  {grouped.yesterday.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Older */}
            {grouped.older.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Older
                </h2>
                <div className="space-y-2">
                  {grouped.older.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: any;
  onRead: () => void;
  onRemove: () => void;
}

function NotificationItem({
  notification,
  onRead,
  onRemove,
}: NotificationItemProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;
  const isRead = notification.read;

  return (
    <div
      className={`p-4 rounded-lg border transition-colors cursor-pointer group ${
        isRead
          ? "bg-white border-slate-200 hover:bg-slate-50"
          : "bg-blue-50 border-blue-200 hover:bg-blue-100"
      }`}
      onClick={!isRead ? onRead : undefined}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 p-2.5 rounded-full ${config.bg} ${config.color}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">
                {notification.title}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {notification.message}
              </p>
            </div>
            {!isRead && (
              <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-blue-600 mt-1" />
            )}
          </div>

          <p className="text-xs text-slate-500 mt-3">
            {formatTime(new Date(notification.timestamp))}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
