import { useNotifications } from "@/context/NotificationContext";
import { Bell } from "lucide-react";

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read
                  ? "bg-slate-50 border-slate-200"
                  : "bg-white border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
