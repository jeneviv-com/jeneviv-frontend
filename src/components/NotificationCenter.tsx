"use client";

import { useNotifications } from "@/context/NotificationContext";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  InfoIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export function NotificationCenter() {
  const { notifications, removeNotification } = useNotifications();
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    setVisible(notifications.map((n) => n.id));
  }, [notifications]);

  const handleRemove = (id: string) => {
    setVisible((prev) => prev.filter((v) => v !== id));
    setTimeout(() => removeNotification(id), 300);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => {
        const isVisible = visible.includes(notification.id);
        const icons = {
          success: CheckCircle,
          error: AlertCircle,
          warning: AlertTriangle,
          info: InfoIcon,
        };

        const colors = {
          success: "bg-green-50 border-green-200 text-green-800",
          error: "bg-red-50 border-red-200 text-red-800",
          warning: "bg-amber-50 border-amber-200 text-amber-800",
          info: "bg-blue-50 border-blue-200 text-blue-800",
        };

        const Icon = icons[notification.type];

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto transform transition-all duration-300 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
          >
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${colors[notification.type]} backdrop-blur-sm shadow-lg`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm opacity-90 mt-0.5">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => handleRemove(notification.id)}
                className="flex-shrink-0 text-current opacity-40 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
