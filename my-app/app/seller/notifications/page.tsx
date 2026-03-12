"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const initialNotifications = [
  {
    id: "N-3001",
    title: "Invoice INV-3012 needs correction",
    description: "Buyer requested GST line-item clarification before approval.",
    time: "5 mins ago",
    unread: true,
  },
  {
    id: "N-3002",
    title: "Early payment offer received",
    description: "A new accelerated payment offer is available for INV-3020.",
    time: "22 mins ago",
    unread: true,
  },
  {
    id: "N-3003",
    title: "Verification reminder",
    description:
      "Please update pending profile fields to avoid settlement delays.",
    time: "1 hour ago",
    unread: false,
  },
];

export default function SellerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeNotificationId, setActiveNotificationId] = useState<
    string | null
  >(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sellerNotifications");
      if (!raw) {
        localStorage.setItem(
          "sellerNotifications",
          JSON.stringify(initialNotifications),
        );
        return;
      }
      const parsed = JSON.parse(raw) as typeof initialNotifications;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setNotifications(parsed);
        return;
      }
      localStorage.setItem(
        "sellerNotifications",
        JSON.stringify(initialNotifications),
      );
    } catch {
      localStorage.setItem(
        "sellerNotifications",
        JSON.stringify(initialNotifications),
      );
    }
  }, []);

  useEffect(() => {
    router.prefetch("/seller/dashboard?refresh=0");
  }, [router]);

  function markAllRead() {
    const next = notifications.map((item) => ({ ...item, unread: false }));
    setNotifications(next);
    localStorage.setItem("sellerNotifications", JSON.stringify(next));
    window.dispatchEvent(new Event("seller-notifications-updated"));
  }

  const activeNotification =
    notifications.find((item) => item.id === activeNotificationId) || null;

  function handleBackToDashboard() {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => {
      router.push(`/seller/dashboard?refresh=${Date.now()}`);
    }, 180);
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-8 sm:px-6">
      <div
        className={`mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 shadow transition-all duration-700 sm:p-8 ${
          isLeaving
            ? "-translate-y-2 scale-95 opacity-0"
            : animateIn
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              Activities
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Track recent actions, payment signals, and verification alerts
              from your seller account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-xl border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Mark All Read
            </button>
            <button
              type="button"
              onClick={handleBackToDashboard}
              disabled={isLeaving}
              className="rounded-xl border border-slate-700 bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {isLeaving ? "Redirecting..." : "Back to Dashboard"}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {notifications.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNotificationId(item.id)}
              className={`block w-full rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-slate-100/80 p-5 text-left shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
                animateIn
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: `${120 + index * 70}ms` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {item.unread ? (
                    <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
                  ) : null}
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">
                    {item.title}
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                  {item.time}
                </span>
              </div>
              <p className="mt-3 pl-6 text-sm leading-7 text-slate-600 sm:text-base">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {activeNotification ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 p-4 backdrop-blur-[2px]"
          onClick={() => setActiveNotificationId(null)}
        >
          <div
            className="mx-auto mt-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {activeNotification.title}
              </h2>
              <button
                type="button"
                onClick={() => setActiveNotificationId(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {activeNotification.time}
            </p>
            <p className="mt-5 text-base leading-7 text-slate-700">
              {activeNotification.description}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
