"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCircle, AlertTriangle, Zap, Trash2, CheckCheck, X, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

type NotificationType = "info" | "warning" | "success" | "action";
type PaymentFilter = "all" | "full" | "partial";
type NotificationTab = "all" | "unread" | "compliance" | "invoices" | "approvals";

type PendingDelete = {
  item: NotificationItem;
  timeoutId: ReturnType<typeof setTimeout>;
};

type NotificationItem = {
  _id: string;
  type: string;
  priority?: "low" | "medium" | "high" | "critical";
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  createdAt: string;
};

type NotificationListData = {
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
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

type Props = {
  dashboardHref: string;
  storageKey: string;
  title?: string;
};

const PAGE_SIZE = 25;
const TAB_ORDER: NotificationTab[] = ["all", "unread", "compliance", "invoices", "approvals"];
const PAYMENT_ORDER: PaymentFilter[] = ["all", "full", "partial"];

const iconMap: Record<NotificationType, React.ReactNode> = {
  info: <Bell size={16} className="text-[#1b5b6a]" />,
  warning: <AlertTriangle size={16} className="text-amber-600" />,
  success: <CheckCircle size={16} className="text-emerald-600" />,
  action: <Zap size={16} className="text-[#0f1b2d]" />,
};

const bgMap: Record<NotificationType, string> = {
  info: "bg-[#e0f2f1]/50 border-[#cfe8e6]",
  warning: "bg-amber-50 border-amber-100",
  success: "bg-emerald-50 border-emerald-100",
  action: "bg-slate-50 border-slate-200",
};

function toUIType(item: NotificationItem): NotificationType {
  const type = (item.type || "").toLowerCase();
  if (type.includes("warning") || type.includes("overdue") || item.priority === "high" || item.priority === "critical") return "warning";
  if (type.includes("success") || type.includes("approved") || type.includes("paid") || type.includes("submitted") || type.includes("done") || type.includes("partially_settled")) return "success";
  if (type.includes("required") || type.includes("action") || type.includes("review")) return "action";
  return "info";
}

function getPaymentOutcome(item: NotificationItem): PaymentFilter {
  const type = (item.type || "").toLowerCase();
  if (type === "invoice_paid") return "full";
  if (type === "invoice_partially_settled") return "partial";
  return "all";
}

function getNotificationTab(item: NotificationItem): Exclude<NotificationTab, "all" | "unread"> | null {
  const type = (item.type || "").toLowerCase();
  if (type.includes("approval")) return "approvals";
  if (type.includes("compliance") || type.includes("invoice_overdue") || type.includes("invoice_due")) return "compliance";
  if (
    type.includes("invoice")
    || type.includes("match")
    || type.includes("ocr")
    || type.includes("einvoice")
    || type.includes("dispute")
    || type.includes("reminder")
  ) {
    return "invoices";
  }
  return null;
}

function getToastBorder(priority?: NotificationItem["priority"]): string {
  if (priority === "critical") return "border-red-500";
  if (priority === "high") return "border-amber-500";
  return "border-[#1b5b6a]";
}

async function loadNotifications(params?: {
  page?: number;
  limit?: number;
  type?: "invoice_paid" | "invoice_partially_settled";
}) {
  const query = new URLSearchParams({
    page: String(params?.page || 1),
    limit: String(params?.limit || PAGE_SIZE),
  });
  if (params?.type) query.set("type", params.type);
  return apiFetch<NotificationListData>(`/api/notifications?${query.toString()}`);
}

export default function NotificationsInbox({ dashboardHref, storageKey, title = "Notifications" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allItems, setAllItems] = useState<NotificationItem[]>([]);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [streamConnected, setStreamConnected] = useState<boolean | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [animateIn, setAnimateIn] = useState(false);
  const [allPage, setAllPage] = useState(1);
  const [allHasMore, setAllHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const tabRefs = useRef<Partial<Record<NotificationTab, HTMLButtonElement | null>>>({});
  const paymentRefs = useRef<Partial<Record<PaymentFilter, HTMLButtonElement | null>>>({});
  const notificationRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingFocusIdRef = useRef<string | null>(null);

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimeoutsRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimeoutsRef.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast._id !== id));
  }, []);

  const clearPendingDeleteTimer = useCallback((entry: PendingDelete | null) => {
    if (!entry) return;
    clearTimeout(entry.timeoutId);
  }, []);

  const finalizeDelete = useCallback(async (item: NotificationItem) => {
    try {
      await apiFetch<ApiEnvelope<{ deleted: boolean }>>(`/api/notifications/${item._id}`, { method: "DELETE" });
    } catch {
      // Roll back locally when delete call fails.
      setAllItems((prev) => {
        if (prev.some((n) => n._id === item._id)) return prev;
        return [item, ...prev];
      });
      setItems((prev) => {
        const matchesPaymentFilter = paymentFilter === "all" || getPaymentOutcome(item) === paymentFilter;
        if (!matchesPaymentFilter) return prev;
        if (prev.some((n) => n._id === item._id)) return prev;
        return [item, ...prev];
      });
      if (!item.isRead) {
        setUnreadCount((count) => count + 1);
      }
    }
  }, [paymentFilter]);

  const undoPendingDelete = useCallback(() => {
    setPendingDelete((entry) => {
      if (!entry) return null;
      clearTimeout(entry.timeoutId);
      const { item } = entry;

      setAllItems((prev) => {
        if (prev.some((n) => n._id === item._id)) return prev;
        return [item, ...prev];
      });
      setItems((prev) => {
        const matchesPaymentFilter = paymentFilter === "all" || getPaymentOutcome(item) === paymentFilter;
        if (!matchesPaymentFilter) return prev;
        if (prev.some((n) => n._id === item._id)) return prev;
        return [item, ...prev];
      });
      if (!item.isRead) {
        setUnreadCount((count) => count + 1);
      }
      pendingFocusIdRef.current = item._id;
      setSelectedNotificationId(item._id);
      return null;
    });
  }, [paymentFilter]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${storageKey}-shortcuts-help`);
      if (raw === "1") setShowShortcutsHelp(true);
    } catch {
      // no-op
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}-shortcuts-help`, showShortcutsHelp ? "1" : "0");
    } catch {
      // no-op
    }
  }, [showShortcutsHelp, storageKey]);

  useEffect(() => {
    return () => {
      clearPendingDeleteTimer(pendingDelete);
    };
  }, [clearPendingDeleteTimer, pendingDelete]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const payment = searchParams.get("payment");

    const nextTab: NotificationTab | null = tab === "all" || tab === "unread" || tab === "compliance" || tab === "invoices" || tab === "approvals"
      ? tab
      : null;
    const nextPayment: PaymentFilter | null = payment === "all" || payment === "full" || payment === "partial"
      ? payment
      : null;

    if (nextTab && nextTab !== activeTab) setActiveTab(nextTab);
    if (nextPayment && nextPayment !== paymentFilter) setPaymentFilter(nextPayment);
  }, [activeTab, paymentFilter, searchParams]);

  // Intentionally do not sync filters back to the URL to avoid noisy updates.

  const refreshInbox = useCallback(async (initialLoad = false) => {
    if (initialLoad) setLoading(true);
    if (!initialLoad) setRefreshing(true);
    try {
      const data = await loadNotifications({ page: 1, limit: PAGE_SIZE });
      const nextItems = data.items || [];
      setAllItems(nextItems);
      setItems(nextItems);
      setAllPage(1);
      setAllHasMore(data.page * data.limit < data.total);
      setUnreadCount(Number(data.unreadCount || 0));
      setLastSyncedAt(new Date().toISOString());
    } finally {
      if (initialLoad) setLoading(false);
      if (!initialLoad) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshInbox(true);
  }, [refreshInbox]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setItems(allItems);
  }, [allItems]);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");

    const onOpen = () => {
      setStreamConnected(true);
    };

    const onError = () => {
      setStreamConnected(false);
    };

    const onNotification = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const item = payload && typeof payload === "object" && payload._id ? payload as NotificationItem : null;
        if (!item) return;

        const matchesPaymentFilter = paymentFilter === "all"
          || (paymentFilter === "full" && getPaymentOutcome(item) === "full")
          || (paymentFilter === "partial" && getPaymentOutcome(item) === "partial");

        setAllItems((prev) => {
          const existing = prev.find((n) => n._id === item._id);
          if (!existing && !item.isRead) {
            setUnreadCount((count) => count + 1);
          } else if (existing && existing.isRead && !item.isRead) {
            setUnreadCount((count) => count + 1);
          } else if (existing && !existing.isRead && item.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }

          const deduped = prev.filter((n) => n._id !== item._id);
          return [item, ...deduped].slice(0, 500);
        });

        if (matchesPaymentFilter) {
          setItems((prev) => {
            const deduped = prev.filter((n) => n._id !== item._id);
            return [item, ...deduped].slice(0, 500);
          });
        }
        setToasts((prev) => [item, ...prev.filter((n) => n._id !== item._id)].slice(0, 3));
        const existingTimer = toastTimeoutsRef.current[item._id];
        if (existingTimer) clearTimeout(existingTimer);
        toastTimeoutsRef.current[item._id] = setTimeout(() => {
          dismissToast(item._id);
        }, 5000);
        setLastSyncedAt(new Date().toISOString());
      } catch {
        // no-op
      }
    };

    es.addEventListener("open", onOpen);
    es.addEventListener("error", onError);
    es.addEventListener("notification", onNotification as EventListener);
    return () => {
      es.removeEventListener("open", onOpen);
      es.removeEventListener("error", onError);
      es.removeEventListener("notification", onNotification as EventListener);
      es.close();
    };
  }, [dismissToast, paymentFilter]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowShortcutsHelp(false);
      Object.values(toastTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
      toastTimeoutsRef.current = {};
      setToasts([]);
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
      Object.values(toastTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
      toastTimeoutsRef.current = {};
    };
  }, []);

  const moveFilterFocus = useCallback((current: NotificationTab, key: string) => {
    const currentIndex = TAB_ORDER.indexOf(current);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (key === "ArrowRight") nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = TAB_ORDER.length - 1;

    if (nextIndex !== currentIndex) {
      const nextTab = TAB_ORDER[nextIndex];
      setActiveTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  }, []);

  const movePaymentFocus = useCallback((current: PaymentFilter, key: string) => {
    const currentIndex = PAYMENT_ORDER.indexOf(current);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (key === "ArrowRight") nextIndex = (currentIndex + 1) % PAYMENT_ORDER.length;
    if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + PAYMENT_ORDER.length) % PAYMENT_ORDER.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = PAYMENT_ORDER.length - 1;

    if (nextIndex !== currentIndex) {
      const nextFilter = PAYMENT_ORDER[nextIndex];
      setPaymentFilter(nextFilter);
      paymentRefs.current[nextFilter]?.focus();
    }
  }, []);

  useEffect(() => {
    try {
      const raw = JSON.stringify(allItems.map((item) => ({ id: item._id, unread: !item.isRead })));
      localStorage.setItem(storageKey, raw);
      window.dispatchEvent(new Event(`${storageKey}-updated`));
    } catch {
      // no-op
    }
  }, [allItems, storageKey]);

  const fullPaidCount = useMemo(
    () => allItems.filter((n) => getPaymentOutcome(n) === "full").length,
    [allItems],
  );

  const partialSettledCount = useMemo(
    () => allItems.filter((n) => getPaymentOutcome(n) === "partial").length,
    [allItems],
  );

  const tabCounts = useMemo(() => {
    const base = items;
    return {
      all: base.length,
      unread: base.filter((n) => !n.isRead).length,
      compliance: base.filter((n) => getNotificationTab(n) === "compliance").length,
      invoices: base.filter((n) => getNotificationTab(n) === "invoices").length,
      approvals: base.filter((n) => getNotificationTab(n) === "approvals").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;

    if (activeTab === "unread") result = result.filter((n) => !n.isRead);
    if (activeTab === "compliance") result = result.filter((n) => getNotificationTab(n) === "compliance");
    if (activeTab === "invoices") result = result.filter((n) => getNotificationTab(n) === "invoices");
    if (activeTab === "approvals") result = result.filter((n) => getNotificationTab(n) === "approvals");

    if (paymentFilter !== "all") {
      result = result.filter((n) => getPaymentOutcome(n) === paymentFilter);
    }

    return result;
  }, [activeTab, items, paymentFilter]);

  const hasMore = allHasMore;

  const focusNotificationCard = useCallback((id: string | null) => {
    if (!id) return;
    setSelectedNotificationId(id);
    window.requestAnimationFrame(() => {
      notificationRefs.current[id]?.focus();
    });
  }, []);

  const moveSelectionByOffset = useCallback((offset: number) => {
    if (filtered.length === 0) return;
    const currentIndex = selectedNotificationId
      ? filtered.findIndex((item) => item._id === selectedNotificationId)
      : -1;
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.min(Math.max(baseIndex + offset, 0), filtered.length - 1);
    const nextId = filtered[nextIndex]?._id || null;
    focusNotificationCard(nextId);
  }, [filtered, focusNotificationCard, selectedNotificationId]);

  const queueNextNotificationFocus = useCallback((currentId: string) => {
    const index = filtered.findIndex((item) => item._id === currentId);
    if (index < 0) return;
    const nextId = filtered[index + 1]?._id || filtered[index - 1]?._id || null;
    pendingFocusIdRef.current = nextId;
    setSelectedNotificationId(nextId);
  }, [filtered]);

  useEffect(() => {
    if (!pendingFocusIdRef.current) return;
    const targetId = pendingFocusIdRef.current;
    const target = notificationRefs.current[targetId];
    if (target) {
      target.focus();
      pendingFocusIdRef.current = null;
    }
  }, [filtered]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedNotificationId(null);
      return;
    }
    if (!selectedNotificationId || !filtered.some((item) => item._id === selectedNotificationId)) {
      setSelectedNotificationId(filtered[0]._id);
    }
  }, [filtered, selectedNotificationId]);

  const markUnread = useCallback(async (id: string) => {
    setSubmitting(id);
    try {
      const response = await apiFetch<ApiEnvelope<NotificationItem>>(`/api/notifications/${id}/unread`, { method: "POST" });
      if (response.success) {
        const wasRead = Boolean(allItems.find((n) => n._id === id)?.isRead);
        setAllItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false, readAt: null } : n)));
        setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false, readAt: null } : n)));
        if (wasRead) {
          setUnreadCount((count) => count + 1);
        }
      }
    } finally {
      setSubmitting(null);
    }
  }, [allItems]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = allPage + 1;
      const data = await loadNotifications({ page: nextPage, limit: PAGE_SIZE });
      const nextItems = data.items || [];

      setAllItems((prev) => {
        const seen = new Set(prev.map((item) => item._id));
        const toAdd = nextItems.filter((item) => !seen.has(item._id));
        return [...prev, ...toAdd];
      });
      setAllPage(nextPage);
      setAllHasMore(data.page * data.limit < data.total);
    } finally {
      setLoadingMore(false);
    }
  }, [allPage, hasMore, loadingMore]);

  useEffect(() => {
    const onGlobalShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target
        && (target.tagName === "INPUT"
          || target.tagName === "TEXTAREA"
          || target.tagName === "SELECT"
          || target.isContentEditable);
      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      if (key === "j") {
        event.preventDefault();
        moveSelectionByOffset(1);
      }
      if (key === "k") {
        event.preventDefault();
        moveSelectionByOffset(-1);
      }
      if (key === "u" && selectedNotificationId) {
        const selected = filtered.find((item) => item._id === selectedNotificationId);
        if (selected && selected.isRead) {
          event.preventDefault();
          void markUnread(selected._id);
        }
      }
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        undoPendingDelete();
      }
      if ((event.key === "?" || (event.key === "/" && event.shiftKey)) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setShowShortcutsHelp((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onGlobalShortcuts);
    return () => {
      window.removeEventListener("keydown", onGlobalShortcuts);
    };
  }, [filtered, markUnread, moveSelectionByOffset, selectedNotificationId, undoPendingDelete]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const shouldLoad = entries.some((entry) => entry.isIntersecting);
        if (shouldLoad && !loadingMore) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore]);

  const markRead = async (id: string) => {
    if (activeTab === "unread") {
      queueNextNotificationFocus(id);
    }
    setSubmitting(id);
    try {
      const response = await apiFetch<ApiEnvelope<NotificationItem>>(`/api/notifications/${id}/read`, { method: "POST" });
      if (response.success) {
        setAllItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
        setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setSubmitting(null);
    }
  };

  const markAllRead = async () => {
    setSubmitting("all");
    try {
      const response = await apiFetch<ApiEnvelope<{ modifiedCount: number }>>("/api/notifications/read-all", { method: "POST" });
      if (response.success) {
        setAllItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })));
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })));
        setUnreadCount(0);
      }
    } finally {
      setSubmitting(null);
    }
  };

  const clearRead = async () => {
    if (submitting === "clear-read") return;
    const readIds = allItems.filter((n) => n.isRead).map((n) => n._id);
    if (readIds.length === 0) return;

    setSubmitting("clear-read");
    try {
      const response = await apiFetch<ApiEnvelope<{ deletedCount: number }>>("/api/notifications/clear-read", { method: "POST" });
      if (response.success) {
        setAllItems((prev) => prev.filter((n) => !n.isRead));
        setItems((prev) => prev.filter((n) => !n.isRead));
      }
    } finally {
      setSubmitting(null);
    }
  };

  const remove = async (id: string) => {
    queueNextNotificationFocus(id);
    setSubmitting(id);
    try {
      const targetFromAll = allItems.find((n) => n._id === id);
      if (!targetFromAll) return;

      if (pendingDelete) {
        clearTimeout(pendingDelete.timeoutId);
        await finalizeDelete(pendingDelete.item);
        setPendingDelete(null);
      }

      if (!targetFromAll.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setAllItems((prev) => prev.filter((n) => n._id !== id));
      setItems((prev) => prev.filter((n) => n._id !== id));

      const timeoutId = setTimeout(() => {
        void finalizeDelete(targetFromAll);
        setPendingDelete((current) => {
          if (current?.item._id === targetFromAll._id) return null;
          return current;
        });
      }, 5000);

      setPendingDelete({ item: targetFromAll, timeoutId });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#1b5b6a]" />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-6 pb-12 transition-all duration-300 ${animateIn ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[60] flex w-[min(92vw,420px)] flex-col gap-2" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div key={toast._id} role="status" className={`rounded-xl border-l-4 border border-slate-200 bg-white px-4 py-3 shadow-lg ${getToastBorder(toast.priority)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{toast.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{toast.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {toast.actionUrl && (
                    <Link href={toast.actionUrl} className="text-xs font-bold text-[#1b5b6a] hover:text-[#164854]">
                      View Invoice &rarr;
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => dismissToast(toast._id)}
                    aria-label="Dismiss notification"
                    className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <header className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
              <Bell className="h-8 w-8 text-[#1b5b6a]" />
              {title}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500" aria-live="polite">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void refreshInbox(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0 || submitting === "all"}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </button>
            <button
              onClick={clearRead}
              disabled={submitting === "clear-read"}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Read
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${streamConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
            {streamConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {streamConnected ? "Live" : "Reconnecting"}
          </span>
          {lastSyncedAt && (
            <span>
              Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Notification category tabs">
          <button ref={(el) => { tabRefs.current.all = el; }} role="tab" aria-selected={activeTab === "all"} onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); moveFilterFocus("all", e.key); } }} onClick={() => setActiveTab("all")} className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${activeTab === "all" ? "border-slate-300 bg-slate-100 text-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            All ({tabCounts.all})
          </button>
          <button ref={(el) => { tabRefs.current.unread = el; }} role="tab" aria-selected={activeTab === "unread"} onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); moveFilterFocus("unread", e.key); } }} onClick={() => setActiveTab("unread")} className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${activeTab === "unread" ? "border-slate-300 bg-slate-100 text-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            Unread ({tabCounts.unread})
          </button>
          <button ref={(el) => { tabRefs.current.compliance = el; }} role="tab" aria-selected={activeTab === "compliance"} onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); moveFilterFocus("compliance", e.key); } }} onClick={() => setActiveTab("compliance")} className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${activeTab === "compliance" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            Compliance ({tabCounts.compliance})
          </button>
          <button ref={(el) => { tabRefs.current.invoices = el; }} role="tab" aria-selected={activeTab === "invoices"} onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); moveFilterFocus("invoices", e.key); } }} onClick={() => setActiveTab("invoices")} className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${activeTab === "invoices" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            Invoices ({tabCounts.invoices})
          </button>
          <button ref={(el) => { tabRefs.current.approvals = el; }} role="tab" aria-selected={activeTab === "approvals"} onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); moveFilterFocus("approvals", e.key); } }} onClick={() => setActiveTab("approvals")} className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${activeTab === "approvals" ? "border-[#cfe8e6] bg-[#e0f2f1]/70 text-[#1b5b6a]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            Approvals ({tabCounts.approvals})
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Payment event filters">
          <button
            ref={(el) => { paymentRefs.current.all = el; }}
            onClick={() => setPaymentFilter("all")}
            onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); movePaymentFocus("all", e.key); } }}
            aria-pressed={paymentFilter === "all"}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${paymentFilter === "all" ? "border-slate-300 bg-slate-100 text-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            All Payment Events
          </button>
          <button
            ref={(el) => { paymentRefs.current.full = el; }}
            onClick={() => setPaymentFilter("full")}
            onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); movePaymentFocus("full", e.key); } }}
            aria-pressed={paymentFilter === "full"}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${paymentFilter === "full" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Full Paid ({fullPaidCount})
          </button>
          <button
            ref={(el) => { paymentRefs.current.partial = el; }}
            onClick={() => setPaymentFilter("partial")}
            onKeyDown={(e) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); movePaymentFocus("partial", e.key); } }}
            aria-pressed={paymentFilter === "partial"}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${paymentFilter === "partial" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Partially Settled ({partialSettledCount})
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-medium text-slate-500">
            Keyboard: J/K navigate, R read, U unread, D delete, Enter open, Esc dismiss toasts.
          </p>
          <button
            type="button"
            onClick={() => setShowShortcutsHelp((prev) => !prev)}
            aria-expanded={showShortcutsHelp}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            ? Shortcuts
          </button>
        </div>

        {showShortcutsHelp && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-sm">
            <p><span className="font-semibold text-slate-700">J / K</span> move selection</p>
            <p><span className="font-semibold text-slate-700">R</span> mark selected unread notification as read</p>
            <p><span className="font-semibold text-slate-700">U</span> mark selected read notification as unread</p>
            <p><span className="font-semibold text-slate-700">D or Delete</span> delete selected notification</p>
            <p><span className="font-semibold text-slate-700">Enter</span> open selected notification link</p>
            <p><span className="font-semibold text-slate-700">?</span> toggle this help panel</p>
            <p><span className="font-semibold text-slate-700">Esc</span> close help and dismiss active toasts</p>
          </div>
        )}

        <div className="mt-4">
          <Link
            href={dashboardHref}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="space-y-3">
        {pendingDelete && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Notification deleted.
                <span className="ml-1 font-semibold">Undo within 5 seconds.</span>
              </p>
              <button
                type="button"
                onClick={undoPendingDelete}
                className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Undo
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Bell className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-500">No notifications yet.</p>
            <p className="mt-1 text-xs text-slate-400">Invoice, compliance, and integration events will appear here.</p>
          </div>
        )}

        {filtered.map((n) => {
          const uiType = toUIType(n);
          const paymentOutcome = getPaymentOutcome(n);
          const isSelected = selectedNotificationId === n._id;
          return (
            <div
              key={n._id}
              ref={(el) => { notificationRefs.current[n._id] = el; }}
              tabIndex={0}
              role="article"
              aria-label={`${n.title}. ${n.isRead ? "Read" : "Unread"}. Press ${n.isRead ? "U to mark unread" : "R to mark read"}, D to delete${n.actionUrl ? ", Enter to open" : ""}.`}
              onFocus={() => setSelectedNotificationId(n._id)}
              onKeyDown={(e) => {
                const key = e.key.toLowerCase();
                if (key === "r" && !n.isRead && submitting !== n._id) {
                  e.preventDefault();
                  void markRead(n._id);
                }
                if (key === "u" && n.isRead && submitting !== n._id) {
                  e.preventDefault();
                  void markUnread(n._id);
                }
                if ((key === "d" || e.key === "Delete") && submitting !== n._id) {
                  e.preventDefault();
                  void remove(n._id);
                }
                if (e.key === "Enter" && n.actionUrl) {
                  e.preventDefault();
                  router.push(n.actionUrl);
                }
              }}
              className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5b6a]/40 ${isSelected ? "border-[#1b5b6a]/40 ring-1 ring-[#1b5b6a]/30" : ""} ${!n.isRead ? `${bgMap[uiType]} border-l-4 border-l-[#1c8b85]` : "border-slate-200 bg-white opacity-80"}`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${!n.isRead ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                  {iconMap[uiType]}
                </div>
                <div className="min-w-0 flex-1">
                  {isSelected && (
                    <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5">
                      {n.actionUrl && (
                        <button
                          onClick={() => {
                            if (n.actionUrl) router.push(n.actionUrl);
                          }}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-[#1b5b6a] hover:bg-slate-50"
                        >
                          Open
                        </button>
                      )}
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n._id)}
                          disabled={submitting === n._id}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Mark Read
                        </button>
                      )}
                      {n.isRead && (
                        <button
                          onClick={() => markUnread(n._id)}
                          disabled={submitting === n._id}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Mark Unread
                        </button>
                      )}
                      <button
                        onClick={() => remove(n._id)}
                        disabled={submitting === n._id}
                        className="rounded-md border border-rose-200 bg-white px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${!n.isRead ? "text-slate-900" : "text-slate-600"}`}>{n.title}</h3>
                    {paymentOutcome === "full" && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Full Paid
                      </span>
                    )}
                    {paymentOutcome === "partial" && (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Partially Settled
                      </span>
                    )}
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#1b5b6a]" />}
                  </div>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-400">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      {n.actionUrl && (
                        <Link href={n.actionUrl} className="text-xs font-semibold text-[#1b5b6a] hover:text-[#164854]">
                          Open
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n._id)}
                          disabled={submitting === n._id}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Mark Read
                        </button>
                      )}
                      {n.isRead && (
                        <button
                          onClick={() => markUnread(n._id)}
                          disabled={submitting === n._id}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Mark Unread
                        </button>
                      )}
                      <button
                        onClick={() => remove(n._id)}
                        disabled={submitting === n._id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length > 0 && hasMore && (
          <div className="pt-2">
            <div ref={loadMoreSentinelRef} className="h-2 w-full" aria-hidden="true" />
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
