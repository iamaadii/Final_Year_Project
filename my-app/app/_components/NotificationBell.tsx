"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type NotificationBellProps = {
  href: string;
  storageKey: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};

type NotificationData = {
  unreadCount: number;
};

function readUnreadState(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const list = JSON.parse(raw) as Array<{ unread?: boolean }>;
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.some((item) => Boolean(item.unread));
  } catch {
    return false;
  }
}

export default function NotificationBell({ href, storageKey }: NotificationBellProps) {
  const [hasUnread, setHasUnread] = useState(() => readUnreadState(storageKey));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const updateFromApi = async () => {
      try {
        const response = await apiFetch<ApiEnvelope<NotificationData>>("/api/notifications?limit=1&page=1");
        if (!mounted || !response.success) return;
        const nextUnread = Number(response.data.unreadCount || 0);
        setUnreadCount(nextUnread);
        setHasUnread(nextUnread > 0);
      } catch {
        if (!mounted) return;
        setHasUnread(readUnreadState(storageKey));
      }
    };

    updateFromApi();

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      setHasUnread(readUnreadState(storageKey));
    };
    const customHandler = () => setHasUnread(readUnreadState(storageKey));

    const source = new EventSource("/api/notifications/stream");
    const streamHandler = () => {
      setHasUnread(true);
      setUnreadCount((prev) => Math.max(1, prev + 1));
      updateFromApi();
    };
    source.addEventListener("notification", streamHandler as EventListener);

    window.addEventListener("storage", storageHandler);
    window.addEventListener(`${storageKey}-updated`, customHandler);

    return () => {
      mounted = false;
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener(`${storageKey}-updated`, customHandler);
      source.removeEventListener("notification", streamHandler as EventListener);
      source.close();
    };
  }, [storageKey]);

  return (
    <Link
      href={href}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
      title="Notifications"
    >
      {hasUnread && (
        <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-red-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </Link>
  );
}
