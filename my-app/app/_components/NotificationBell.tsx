"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

type NotificationBellProps = {
  href: string;
  storageKey: string;
};

let unreadCache: boolean | null = null;
let currentKey = "";

function readUnreadState(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return true; // Show dot by default if no data yet
    const list = JSON.parse(raw) as Array<{ unread?: boolean }>;
    return list.some((item) => Boolean(item.unread));
  } catch {
    return true;
  }
}

export default function NotificationBell({ href, storageKey }: NotificationBellProps) {
  const getSnapshot = () => {
    if (unreadCache !== null && currentKey === storageKey) return unreadCache;
    currentKey = storageKey;
    const next = readUnreadState(storageKey);
    unreadCache = next;
    return next;
  };

  const subscribe = (onStoreChange: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      unreadCache = readUnreadState(storageKey);
      onStoreChange();
    };
    const handleEvent = () => {
      unreadCache = readUnreadState(storageKey);
      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(`${storageKey}-updated`, handleEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(`${storageKey}-updated`, handleEvent);
    };
  };

  const hasUnread = useSyncExternalStore(subscribe, getSnapshot, () => true);

  return (
    <Link
      href={href}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
      title="Notifications"
    >
      {hasUnread && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </Link>
  );
}
