"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock, AlertTriangle, TrendingUp, DollarSign, ArrowUpRight,
  Filter
} from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type Invoice = {
  _id: string;
  status?: string;
  dueDate: string;
  issueDate: string;
  buyerName?: string;
  totalAmount: number;
  invoiceNumber: string;
};

type Bucket = { label: string; color: "emerald" | "amber" | "orange" | "rose" | "red"; days: number };

export default function ReceivablesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBucket, setFilterBucket] = useState("all");

  useEffect(() => {
    apiFetch<ApiListResponse<Invoice>>("/invoices")
      .then((data) => {
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const unpaidStatuses = ["Pending Approval", "Approved", "Under Review", "Overdue", "Disputed"];
  const unpaid = invoices.filter((i) => unpaidStatuses.includes(i.status || ""));

  const getBucket = (inv: Invoice): Bucket => {
    const due = new Date(inv.dueDate);
    const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { label: "Current", color: "emerald", days: 0 };
    if (days <= 30) return { label: "1-30 Days", color: "amber", days };
    if (days <= 60) return { label: "31-60 Days", color: "orange", days };
    if (days <= 90) return { label: "61-90 Days", color: "rose", days };
    return { label: "90+ Days", color: "red", days };
  };

  const buckets: Record<string, Invoice[]> = {
    current: unpaid.filter((i) => getBucket(i).label === "Current"),
    d1_30: unpaid.filter((i) => getBucket(i).label === "1-30 Days"),
    d31_60: unpaid.filter((i) => getBucket(i).label === "31-60 Days"),
    d61_90: unpaid.filter((i) => getBucket(i).label === "61-90 Days"),
    d90plus: unpaid.filter((i) => getBucket(i).label === "90+ Days"),
  };

  const totalsByBucket: Record<string, number> = {
    current: buckets.current.reduce((s, i) => s + i.totalAmount, 0),
    d1_30: buckets.d1_30.reduce((s, i) => s + i.totalAmount, 0),
    d31_60: buckets.d31_60.reduce((s, i) => s + i.totalAmount, 0),
    d61_90: buckets.d61_90.reduce((s, i) => s + i.totalAmount, 0),
    d90plus: buckets.d90plus.reduce((s, i) => s + i.totalAmount, 0),
  };

  const totalReceivables = unpaid.reduce((s, i) => s + i.totalAmount, 0);
  const oldestInvoice = unpaid.length > 0
    ? unpaid.reduce((oldest, i) => new Date(i.issueDate) < new Date(oldest.issueDate) ? i : oldest)
    : null;
  const oldestAge = oldestInvoice
    ? Math.floor((now.getTime() - new Date(oldestInvoice.issueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const expectedIn14 = unpaid
    .filter((i) => {
      const due = new Date(i.dueDate);
      const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 14;
    })
    .reduce((s, i) => s + i.totalAmount, 0);
  const expectedIn30 = unpaid
    .filter((i) => {
      const due = new Date(i.dueDate);
      const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    })
    .reduce((s, i) => s + i.totalAmount, 0);

  const filtered = filterBucket === "all" ? unpaid : buckets[filterBucket] || [];
  const fmt = (n: number) => `INR ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

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
              <DollarSign className="text-[#1b5b6a] w-8 h-8" />
              Receivables Management
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Track outstanding invoices, aging analysis, and expected collections.
            </p>
          </div>
          <Link
            href="/seller/invoices"
            className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#142338] transition-all flex items-center gap-2"
          >
            + New Invoice
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-white to-[#e0f2f1]/40 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Total Receivables</h3>
          <p className="mt-3 text-3xl font-black text-slate-900">{fmt(totalReceivables)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{unpaid.length} outstanding invoices</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={12} /> Expected (14 Days)
          </h3>
          <p className="mt-3 text-3xl font-black text-emerald-800">{fmt(expectedIn14)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Coming due within 2 weeks</p>
        </div>
        <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-white to-[#e0f2f1]/40 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Expected (30 Days)</h3>
          <p className="mt-3 text-3xl font-black text-slate-900">{fmt(expectedIn30)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Within 1 month</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1">
            <Clock size={12} /> Oldest Invoice
          </h3>
          <p className="mt-3 text-3xl font-black text-rose-800">{oldestAge} <span className="text-lg">days</span></p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{oldestInvoice?.invoiceNumber || "-"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Receivables Aging</h2>
        <div className="flex gap-1 h-8 rounded-xl overflow-hidden bg-slate-100">
          {[
            { key: "current", label: "Current", color: "bg-emerald-500" },
            { key: "d1_30", label: "1-30d", color: "bg-amber-500" },
            { key: "d31_60", label: "31-60d", color: "bg-orange-500" },
            { key: "d61_90", label: "61-90d", color: "bg-rose-500" },
            { key: "d90plus", label: "90d+", color: "bg-red-700" },
          ].map((b) => {
            const pct = totalReceivables > 0 ? (totalsByBucket[b.key] / totalReceivables) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={b.key}
                className={`${b.color} flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity`}
                style={{ width: `${Math.max(pct, 3)}%` }}
                onClick={() => setFilterBucket(b.key)}
                title={`${b.label}: ${fmt(totalsByBucket[b.key])}`}
              >
                {pct > 10 ? `${b.label} ${fmt(totalsByBucket[b.key])}` : ""}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
          {[
            { key: "all", label: "All", color: "text-slate-700" },
            { key: "current", label: `Current (${buckets.current.length})`, color: "text-emerald-700" },
            { key: "d1_30", label: `1-30d (${buckets.d1_30.length})`, color: "text-amber-700" },
            { key: "d31_60", label: `31-60d (${buckets.d31_60.length})`, color: "text-orange-700" },
            { key: "d61_90", label: `61-90d (${buckets.d61_90.length})`, color: "text-rose-700" },
            { key: "d90plus", label: `90d+ (${buckets.d90plus.length})`, color: "text-red-700" },
          ].map((b) => (
            <button
              key={b.key}
              onClick={() => setFilterBucket(b.key)}
              className={`px-3 py-1 rounded-lg border transition-all ${
                filterBucket === b.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : `${b.color} border-slate-200 hover:bg-slate-50`
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Filter size={16} /> {filterBucket === "all" ? "All Outstanding" : filterBucket.replace("_", "-")} Invoices ({filtered.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Invoice #</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Buyer</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Issue Date</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Age</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No invoices in this bucket. Create invoices from the Invoices page.
                  </td>
                </tr>
              )}
              {filtered.map((inv) => {
                const bucket = getBucket(inv);
                const daysOld = Math.floor((now.getTime() - new Date(inv.issueDate).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <Link href="/seller/invoices" className="hover:text-[#1b5b6a] flex items-center gap-1">
                        {inv.invoiceNumber} <ArrowUpRight size={12} />
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{inv.buyerName}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(inv.issueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
                        ${bucket.color === "emerald" ? "bg-emerald-100 text-emerald-800" : ""}
                        ${bucket.color === "amber" ? "bg-amber-100 text-amber-800" : ""}
                        ${bucket.color === "orange" ? "bg-orange-100 text-orange-800" : ""}
                        ${bucket.color === "rose" ? "bg-rose-100 text-rose-800" : ""}
                        ${bucket.color === "red" ? "bg-red-100 text-red-800" : ""}
                      `}>
                        {bucket.days > 0 && <AlertTriangle size={10} />}
                        {daysOld}d
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold
                        ${inv.status === "Approved" ? "bg-emerald-100 text-emerald-800" : ""}
                        ${inv.status === "Pending Approval" ? "bg-amber-100 text-amber-800" : ""}
                        ${inv.status === "Overdue" ? "bg-rose-100 text-rose-800" : ""}
                        ${inv.status === "Disputed" ? "bg-red-100 text-red-800" : ""}
                        ${!"Approved,Pending Approval,Overdue,Disputed".split(",").includes(inv.status || "") ? "bg-slate-100 text-slate-700" : ""}
                      `}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
