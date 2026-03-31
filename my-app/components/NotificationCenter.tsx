"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

type Notification = {
  _id: string;
  isRead: boolean;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  body?: string; // Support for either field name
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.items) {
          setNotifications(data.data.items);
          setUnreadCount(data.data.unreadCount || 0);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();

    const eventSource = new EventSource("/api/notifications/stream");
    
    eventSource.addEventListener("notification", (event: any) => {
      try {
        const newNotif = JSON.parse(event.data) as Notification;
        setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
      } catch (err) {
        console.error("Failed to parse notification", err);
      }
    });

    return () => eventSource.close();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "connection_invite":
      case "approval_required":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "connection_accepted":
      case "financing_approved":
      case "match_success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "compliance_critical":
      case "approval_rejected":
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-rose-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead} 
                  className="text-xs font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No new notifications.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {notifications.map(notif => (
                    <li 
                      key={notif._id} 
                      className={`p-4 transition-colors cursor-pointer group hover:bg-slate-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                      onClick={() => markAsRead(notif._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm text-slate-900 leading-tight ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                              {notif.title}
                            </p>
                            {!notif.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
                            {notif.message || notif.body}
                          </p>
                          <p className="text-slate-400 text-[10px] mt-2 font-medium flex items-center gap-1">
                            {new Date(notif.createdAt).toLocaleDateString("en-IN", { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
              <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">
                View All Activity
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
