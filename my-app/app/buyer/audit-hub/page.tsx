"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type AuditEvent = {
  action: string;
  userName?: string;
  timestamp: string;
  details?: string;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  sellerName?: string;
  totalAmount: number;
  status?: string;
  auditTrail?: AuditEvent[];
  updatedAt?: string;
  createdAt?: string;
};

type TimelineEvent = AuditEvent & {
  invoiceNumber?: string;
  invoiceId?: string;
  sellerName?: string;
  totalAmount?: number;
};

export default function AuditHubPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    apiFetch<ApiListResponse<Invoice>>("/invoices")
      .then((data) => {
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allEvents: TimelineEvent[] = invoices
    .flatMap((inv) =>
      (inv.auditTrail || []).map((event) => ({
        ...event,
        invoiceNumber: inv.invoiceNumber,
        invoiceId: inv._id,
        sellerName: inv.sellerName,
        totalAmount: inv.totalAmount,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const statusEvents: TimelineEvent[] = invoices.map((inv) => ({
    action: `invoice_${inv.status?.toLowerCase().replace(/\s+/g, "_") || "created"}`,
    userName: inv.sellerName,
    timestamp: inv.updatedAt || inv.createdAt || new Date().toISOString(),
    details: `Invoice ${inv.invoiceNumber}: status = ${inv.status} | Amount: INR ${inv.totalAmount.toLocaleString("en-IN")}`,
    invoiceNumber: inv.invoiceNumber,
    sellerName: inv.sellerName,
    totalAmount: inv.totalAmount,
  }));

  const combined = [...allEvents, ...statusEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = searchTerm
    ? combined.filter(
        (e) =>
          e.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.details?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : combined;

  const getActionIcon = (action: string) => {
    if (action?.includes("approve") || action?.includes("accepted")) return <CheckCircle size={14} className="text-emerald-600" />;
    if (action?.includes("reject") || action?.includes("declined")) return <XCircle size={14} className="text-rose-600" />;
    if (action?.includes("match") || action?.includes("review")) return <RefreshCw size={14} className="text-[#1b5b6a]" />;
    if (action?.includes("dispute") || action?.includes("overdue")) return <AlertTriangle size={14} className="text-amber-600" />;
    return <Clock size={14} className="text-slate-400" />;
  };

  const getActionBadge = (action: string) => {
    if (action?.includes("approve") || action?.includes("accepted")) return "bg-emerald-100 text-emerald-800";
    if (action?.includes("reject") || action?.includes("declined")) return "bg-rose-100 text-rose-800";
    if (action?.includes("match")) return "bg-[#e0f2f1]/60 text-[#0f1b2d]";
    if (action?.includes("discount") || action?.includes("offer")) return "bg-[#e0f2f1]/60 text-[#1b5b6a]";
    return "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <header className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <FileText className="text-[#1b5b6a] w-8 h-8" />
              Audit Hub
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Complete audit trail of all invoice actions - approvals, rejections, matches, and offers.
            </p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1b5b6a]/20 focus:border-[#1b5b6a]/40"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Total Events</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Invoices Tracked</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{invoices.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Latest Activity</p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {filtered.length > 0
              ? new Date(filtered[0].timestamp).toLocaleString("en-IN")
              : "No activity"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5">
          <h2 className="font-bold text-slate-800">Audit Trail Timeline</h2>
        </div>
        <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 font-medium">
              No audit events yet. Actions on invoices (approve, reject, match, offer) will appear here.
            </div>
          )}
          {filtered.map((event, idx) => (
            <div key={`${event.invoiceId || "evt"}-${idx}`} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                {getActionIcon(event.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionBadge(event.action)}`}>
                    {event.action?.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {event.invoiceNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    by {event.userName || "System"}
                  </span>
                </div>
                {event.details && (
                  <p className="text-sm text-slate-600 truncate">{event.details}</p>
                )}
              </div>
              <div className="text-xs text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                {new Date(event.timestamp).toLocaleString("en-IN", {
                  day: "2-digit", month: "short", year: "2-digit",
                  hour: "2-digit", minute: "2-digit"
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

