"use client";

import { useEffect, useState } from "react";

type Notification = {
  _id: string;
  isRead: boolean;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

type NotificationResponse = {
  notifications?: Notification[];
};

export function NotificationCenter({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: NotificationResponse) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
        }
      })
      .catch(console.error);

    // SSE connection
    const eventSource = new EventSource("/api/notifications/stream");
    
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const newNotif = JSON.parse(event.data) as Notification;
        if (newNotif.type !== "ping") {
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          setUnreadCount((c) => c + 1);
        }
      } catch {
        // Handle parsing error
      }
    };

    return () => eventSource.close();
  }, [userId]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden text-sm">
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-[#1b5b6a] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No new notifications.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <li 
                    key={notif._id} 
                    className={`p-4 hover:bg-slate-50 transition cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-blue-50/30'}`}
                    onClick={() => markAsRead(notif._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {notif.type === "alert" ? "🚨" : notif.type === "success" ? "✅" : "🔔"}
                      </div>
                      <div>
                        <p className={`text-slate-800 ${!notif.isRead ? 'font-semibold' : ''}`}>{notif.title}</p>
                        <p className="text-slate-600 text-xs mt-1">{notif.message}</p>
                        <p className="text-slate-400 text-[10px] mt-2 font-mono">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
