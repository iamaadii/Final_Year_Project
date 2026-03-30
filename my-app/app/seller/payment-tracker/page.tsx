"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { calculatePenalty, getMsmedDeadline } from "@/lib/complianceCalc";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  buyerName?: string;
  totalAmount?: number;
  amountPaid?: number;
  issueDate?: string;
  deliveryDate?: string;
  dueDate?: string;
  msmedDeadline?: string | null;
  paymentTermsDays?: number;
  paymentReceivedAt?: string | null;
  status?: string;
};

type TrackerRow = {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  dueDate: string;
  msmedDeadline: string;
  overdueDays: number;
  principal: number;
  penalty: number;
  status: string;
  urgency: "ok" | "due-soon" | "overdue" | "settled";
};

const paidStatuses = ["Paid", "Settled", "paid"];
const MS_IN_DAY = 1000 * 60 * 60 * 24;

const computeOverdueDays = (deadline: Date, paidAt?: Date | null) => {
  const now = paidAt ?? new Date();
  const diff = Math.floor((now.getTime() - deadline.getTime()) / MS_IN_DAY);
  return Math.max(0, diff);
};

export default function PaymentTrackerPage() {
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ invoices?: Invoice[] }>("/invoices")
      .then((data) => {
        const next = (data.invoices || []).map((inv) => {
          const baseDate = inv.deliveryDate || inv.issueDate || inv.dueDate || null;
          const msmedDate = inv.msmedDeadline
            ? new Date(inv.msmedDeadline)
            : baseDate
              ? getMsmedDeadline(baseDate, inv.paymentTermsDays || 45)
              : null;
          const paidAt = inv.paymentReceivedAt ? new Date(inv.paymentReceivedAt) : null;
          const overdueDays = msmedDate ? computeOverdueDays(msmedDate, paidAt) : 0;
          const isSettled = paidStatuses.includes(inv.status || "");
          const total = Number(inv.totalAmount || 0);
          const paid = Number(inv.amountPaid || 0);
          const principal = isSettled ? 0 : Math.max(0, total - paid);
          const penalty = calculatePenalty(principal, overdueDays).interest;

          const msmedDisplay = msmedDate ? msmedDate.toLocaleDateString("en-IN") : "--";
          const dueDisplay = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "--";

          let urgency: TrackerRow["urgency"] = "ok";
          if (isSettled) urgency = "settled";
          else if (overdueDays > 0) urgency = "overdue";
          else if (msmedDate) {
            const daysToDeadline = Math.ceil((msmedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysToDeadline <= 7) urgency = "due-soon";
          }

          return {
            id: inv._id,
            invoiceNumber: inv.invoiceNumber || inv._id,
            buyerName: inv.buyerName || "Buyer",
            dueDate: dueDisplay,
            msmedDeadline: msmedDisplay,
            overdueDays,
            principal,
            penalty,
            status: inv.status || "Pending",
            urgency,
          };
        });
        setRows(next);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (value: number) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const totals = useMemo(() => {
    const outstanding = rows.reduce((sum, row) => sum + row.principal, 0);
    const overdue = rows.filter((row) => row.urgency === "overdue").reduce((sum, row) => sum + row.principal, 0);
    const dueSoon = rows.filter((row) => row.urgency === "due-soon").reduce((sum, row) => sum + row.principal, 0);
    const penalty = rows.filter((row) => row.urgency === "overdue").reduce((sum, row) => sum + row.penalty, 0);
    return { outstanding, overdue, dueSoon, penalty };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 portal-page portal-module-transition">
      <header className="rounded-3xl p-6 portal-surface portal-section-enter">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <CalendarClock className="text-[#1b5b6a] w-8 h-8" />
              MSME Payment Tracker
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Track MSMED deadlines, overdue days, and penalty exposure across receivables.
            </p>
          </div>
          <Link
            href="/seller/invoices"
            className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#142338] transition-all"
          >
            View Invoice Registry
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 portal-section-enter portal-section-enter-delay-1">
        <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-white to-[#e0f2f1]/40 p-6 shadow-sm">
          <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Outstanding Balance</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{fmt(totals.outstanding)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">All unpaid receivables</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/60 p-6 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1">
            <AlertTriangle size={12} /> Due In 7 Days
          </p>
          <p className="mt-3 text-3xl font-black text-amber-800">{fmt(totals.dueSoon)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Requires proactive follow-ups</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-6 shadow-sm">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Overdue Principal</p>
          <p className="mt-3 text-3xl font-black text-rose-800">{fmt(totals.overdue)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Past MSMED deadline</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Penalty Interest (Est.)</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{fmt(totals.penalty)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">As per MSMED Act rate</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white overflow-hidden portal-surface-soft portal-section-enter portal-section-enter-delay-2">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">MSMED Exposure Ledger</h2>
          <span className="text-xs text-slate-500">{rows.length} invoices tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4">Invoice</th>
                <th className="p-4">Buyer</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">MSMED Deadline</th>
                <th className="p-4">Overdue</th>
                <th className="p-4">Penalty</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No invoices found. Upload or create invoices to begin tracking MSME exposure.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-900">{row.invoiceNumber}</td>
                    <td className="p-4">{row.buyerName}</td>
                    <td className="p-4">{row.dueDate}</td>
                    <td className="p-4">{row.msmedDeadline}</td>
                    <td className="p-4">
                      {row.urgency === "settled" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      ) : row.overdueDays > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                          {row.overdueDays} days
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">On track</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{fmt(row.penalty)}</td>
                    <td className="p-4">
                      <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                        row.urgency === "overdue"
                          ? "bg-rose-100 text-rose-800"
                          : row.urgency === "due-soon"
                            ? "bg-amber-100 text-amber-800"
                            : row.urgency === "settled"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-800"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/seller/invoices?id=${row.id}`}
                        className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] transition-colors inline-flex items-center gap-1"
                      >
                        Review <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
