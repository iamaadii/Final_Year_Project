"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type DiscountOffer = {
  status?: "offered" | "accepted" | "declined" | "none";
  discountRate?: number;
  discountAmount?: number;
  offeredAt?: string;
  respondedAt?: string;
};

type Invoice = {
  _id: string;
  status?: string;
  dueDate?: string;
  updatedAt?: string;
  createdAt?: string;
  invoiceNumber: string;
  sellerName?: string;
  totalAmount?: number;
  discountOffer?: DiscountOffer;
};

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "action";
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  link?: string;
}

function generateNotifications(invoices: Invoice[]): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  invoices.forEach((inv) => {
    if (inv.status === "Overdue" || (inv.dueDate && new Date(inv.dueDate) < now && !["Paid", "Settled"].includes(inv.status || ""))) {
      notifications.push({
        id: `overdue-${inv._id}`,
        type: "warning",
        title: "Invoice Overdue",
        message: `Invoice ${inv.invoiceNumber} from ${inv.sellerName || "Seller"} is overdue. Amount: INR ${inv.totalAmount?.toLocaleString("en-IN")}`,
        timestamp: inv.dueDate || inv.updatedAt || new Date().toISOString(),
        unread: true,
      });
    }

    if (inv.status === "Pending Approval") {
      notifications.push({
        id: `pending-${inv._id}`,
        type: "action",
        title: "Invoice Pending Approval",
        message: `Invoice ${inv.invoiceNumber} from ${inv.sellerName || "Seller"} requires your review. Amount: INR ${inv.totalAmount?.toLocaleString("en-IN")}`,
        timestamp: inv.createdAt || inv.updatedAt || new Date().toISOString(),
        unread: true,
        link: "/buyer/ap-hub",
      });
    }

    if (inv.discountOffer?.status === "offered") {
      notifications.push({
        id: `discount-${inv._id}`,
        type: "info",
        title: "Discount Offer Sent",
        message: `Early payment offer of ${inv.discountOffer.discountRate}% sent for ${inv.invoiceNumber}. Awaiting seller response.`,
        timestamp: inv.discountOffer.offeredAt || inv.updatedAt || new Date().toISOString(),
        unread: true,
      });
    }

    if (inv.discountOffer?.status === "accepted") {
      notifications.push({
        id: `discount-accept-${inv._id}`,
        type: "success",
        title: "Discount Accepted",
        message: `Seller accepted your early payment offer for ${inv.invoiceNumber}. You saved INR ${inv.discountOffer.discountAmount?.toLocaleString("en-IN")}`,
        timestamp: inv.discountOffer.respondedAt || inv.updatedAt || new Date().toISOString(),
        unread: false,
      });
    }

    if (inv.status === "Approved") {
      notifications.push({
        id: `approved-${inv._id}`,
        type: "success",
        title: "Invoice Approved",
        message: `Invoice ${inv.invoiceNumber} has been approved. Amount: INR ${inv.totalAmount?.toLocaleString("en-IN")}`,
        timestamp: inv.updatedAt || new Date().toISOString(),
        unread: false,
      });
    }
  });

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const iconMap = {
  info: <Bell size={16} className="text-[#1b5b6a]" />,
  warning: <AlertTriangle size={16} className="text-amber-600" />,
  success: <CheckCircle size={16} className="text-emerald-600" />,
  action: <Zap size={16} className="text-[#0f1b2d]" />,
};

const bgMap = {
  info: "bg-[#e0f2f1]/50 border-[#cfe8e6]",
  warning: "bg-amber-50 border-amber-100",
  success: "bg-emerald-50 border-emerald-100",
  action: "bg-slate-50 border-slate-200",
};

export default function BuyerNotificationsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    let isMounted = true;
    apiFetch<ApiListResponse<Invoice>>("/invoices")
      .then((data) => {
        if (!isMounted) return;
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  const notifications = generateNotifications(invoices);
  const filtered = filter === "unread" ? notifications.filter((n) => n.unread) : notifications;
  const unreadCount = notifications.filter((n) => n.unread).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <header className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Bell className="text-[#1b5b6a] w-8 h-8" />
              Notifications
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
            <button onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
              All ({notifications.length})
            </button>
            <button onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === "unread" ? "bg-white text-[#0f1b2d] shadow-sm" : "text-slate-500"}`}>
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Bell className="mx-auto text-slate-300 w-12 h-12 mb-4" />
            <p className="text-slate-500 font-medium">No notifications yet.</p>
            <p className="text-xs text-slate-400 mt-1">Invoice events will appear here automatically.</p>
          </div>
        )}
        {filtered.map((n) => (
          <div key={n.id}
            className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${n.unread ? bgMap[n.type] : "bg-white border-slate-200 opacity-80"}`}>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.unread ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                {iconMap[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-bold ${n.unread ? "text-slate-900" : "text-slate-600"}`}>{n.title}</h3>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-[#1b5b6a]" />}
                </div>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  {new Date(n.timestamp).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", year: "2-digit",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
