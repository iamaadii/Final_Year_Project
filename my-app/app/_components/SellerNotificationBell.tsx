"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";

let unreadCache: boolean | null = null;

function readUnreadState() {
  try {
    const raw = localStorage.getItem("sellerNotifications");
    if (!raw) return true;
    const list = JSON.parse(raw) as Array<{ unread?: boolean }>;
    return list.some((item) => Boolean(item.unread));
  } catch {
    return true;
  }
}

export default function SellerNotificationBell() {
  const getSnapshot = () => {
    if (unreadCache !== null) return unreadCache;
    const next = readUnreadState();
    unreadCache = next;
    return next;
  };

  const subscribe = (onStoreChange: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "sellerNotifications") return;
      unreadCache = readUnreadState();
      onStoreChange();
    };
    const handleManualUpdate = () => {
      unreadCache = readUnreadState();
      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("seller-notifications-updated", handleManualUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("seller-notifications-updated", handleManualUpdate);
    };
  };

  const hasUnread = useSyncExternalStore(subscribe, getSnapshot, () => true);

  return (
    <Link
      href="/seller/notifications"
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
      title="Notifications"
    >
      {hasUnread ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
      <Image src="/notification.svg" alt="" width={24} height={24} aria-hidden="true" className="h-6 w-6" />
    </Link>
  );
}
