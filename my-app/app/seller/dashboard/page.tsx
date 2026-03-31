"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, AlertCircle, FileText,
  CreditCard, BarChart3, Users, Clock, Anchor, PlusCircle, Building2
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";
import AIInsightsSidebar from "@/app/_components/dashboard/AIInsightsSidebar";

type Invoice = {
  _id: string;
  totalAmount?: number;
  dueDate?: string;
  issueDate?: string;
  status?: string;
  buyerName?: string;
};

type ChartRow = { month: string; inflow: number; outflow: number; predictedInflow?: number; predictedOutflow?: number };

type InvoiceListResponse = {
  invoices: Invoice[];
};

type AccountingSummary = {
  totalReceivables: number;
  totalPayables: number;
  overdueAmount: number;
  overdueCount: number;
  paidThisMonth: number;
  outstandingCount: number;
  totalInvoices: number;
  cashInflow: number;
  cashOutflow: number;
  netWorkingCapital: number;
  dso: number;
  dpo: number;
  matchEfficiency: number;
  activeOffers: number;
  acceptedOffers: number;
  totalYieldEarned: number;
};

const emptySummary: AccountingSummary = {
  totalReceivables: 0,
  totalPayables: 0,
  overdueAmount: 0,
  overdueCount: 0,
  paidThisMonth: 0,
  outstandingCount: 0,
  totalInvoices: 0,
  cashInflow: 0,
  cashOutflow: 0,
  netWorkingCapital: 0,
  dso: 0,
  dpo: 0,
  matchEfficiency: 0,
  activeOffers: 0,
  acceptedOffers: 0,
  totalYieldEarned: 0,
};

type ChartTooltipPayload = { name?: string; value?: number; color?: string };

type ChartTooltipProps = { active?: boolean; payload?: ChartTooltipPayload[]; label?: string };

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={`${entry.name || "entry"}-${index}`} style={{ color: entry.color }} className="font-semibold flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span>INR {entry.value}L</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SellerDashboardPage() {
  const safeFmtDate = (dateStr?: string) => {
    if (!dateStr) return "No date";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Invalid date" : d.toLocaleDateString("en-IN");
  };

  const [viewMode, setViewMode] = useState<"RECEIVABLES" | "PAYABLES">("RECEIVABLES");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<AccountingSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<InvoiceListResponse>("/api/invoices"),
      apiFetch<AccountingSummary>("/api/accounting/summary"),
    ])
      .then(([invoicesRes, summaryRes]) => {
        if (invoicesRes.status === "fulfilled") {
          setInvoices(invoicesRes.value.invoices || []);
        }
        if (summaryRes.status === "fulfilled") {
          setSummary(summaryRes.value || emptySummary);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const activeInvoices = invoices.filter((inv) => !["Paid", "Settled", "paid"].includes(inv.status || ""));
  const totalReceivables = summary.totalReceivables || activeInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const approvedReceivables = activeInvoices
    .filter((inv) => inv.status === "Approved")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const overdueAmount = summary.overdueAmount || activeInvoices
    .filter((inv) => {
      if (!inv.dueDate) return false;
      const d = new Date(inv.dueDate);
      return !isNaN(d.getTime()) && d < now;
    })
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const cashFlowData = useMemo<ChartRow[]>(() => {
    if (!Array.isArray(invoices) || invoices.length === 0) return [];
    const map = new Map<string, ChartRow>();
    invoices.forEach((inv) => {
      if (!inv.issueDate || !inv.totalAmount) return;
      const d = new Date(inv.issueDate);
      if (isNaN(d.getTime())) return;
      const month = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      const current = map.get(month) || { month, inflow: 0, outflow: 0 };
      current.inflow += inv.totalAmount / 100000;
      map.set(month, current);
    });
    return Array.from(map.values()).slice(-8);
  }, [invoices]);

  const recentActivities = useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    return [...invoices]
      .filter((inv) => inv.issueDate)
      .sort((a, b) => {
        const da = new Date(a.issueDate!).getTime();
        const db = new Date(b.issueDate!).getTime();
        return isNaN(db) || isNaN(da) ? 0 : db - da;
      })
      .slice(0, 5)
      .map((inv) => ({
        title: inv.buyerName ? `Invoice for ${inv.buyerName}` : "Invoice updated",
        meta: `${inv.status || "Pending"} • ${safeFmtDate(inv.issueDate)}`,
      }));
  }, [invoices]);

  const topBuyers = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      const name = inv.buyerName || "Unknown Buyer";
      map.set(name, (map.get(name) || 0) + (inv.totalAmount || 0));
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [invoices]);

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto portal-page portal-module-transition">
        <header className="rounded-3xl p-5 portal-surface portal-section-enter">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  <Activity className="text-[#1b5b6a] w-6 h-6" />
                  MSME Liquidity Hub
                </h1>
              </div>
            </div>
          </div>
        </header>

        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Start your receivables journey"
          description="Send your first invoice to see cashflow forecasts and payment insights."
          primaryCTA={{ label: "Create Invoice", href: "/seller/invoices?action=create" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto portal-page portal-module-transition">
      <header className="rounded-3xl p-5 portal-surface portal-section-enter">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <Activity className="text-[#1b5b6a] w-6 h-6" />
                MSME Liquidity Hub
              </h1>
              <div className="flex items-center portal-toggle-shell">
                <button
                  onClick={() => setViewMode("RECEIVABLES")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === "RECEIVABLES" ? "bg-white text-[#0f1b2d] shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Income (Receivables)
                </button>
                <button
                  onClick={() => setViewMode("PAYABLES")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === "PAYABLES" ? "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Expenses (Payables)
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {viewMode === "RECEIVABLES"
                ? "Receivables visibility, discounting offers, and working capital signals."
                : "Outbound supplier payments and cash outflow tracking."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/seller/invoices" className="rounded-xl bg-[#0f1b2d] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#142338] transition-all flex items-center gap-2 hover:-translate-y-0.5">
              <FileText className="w-4 h-4" />
              {viewMode === "RECEIVABLES" ? "New Sales Invoice" : "Upload Vendor Bill"}
            </Link>
            <Link href="/seller/buyers" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-[#f7f4ef] transition-all flex items-center gap-2 hover:-translate-y-0.5">
              <Users className="w-4 h-4" />
              Directory
            </Link>
          </div>
        </div>
      </header>

      {viewMode === "RECEIVABLES" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-white to-[#e0f2f1]/50 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CreditCard size={48} /></div>
            <h3 className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Total Receivables</h3>
            <p className="mt-3 text-4xl font-black text-slate-900 drop-shadow-sm">{fmt(totalReceivables)}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/60 w-fit px-2 py-1 rounded-md border border-slate-200">
              <TrendingUp size={14} /> Based on active invoices
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Anchor size={48} /></div>
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Available to Discount</h3>
            <p className="mt-3 text-4xl font-black text-slate-900">{fmt(approvedReceivables)}</p>
            <p className="mt-3 text-xs font-semibold text-slate-500 bg-white/60 w-fit px-2 py-1 rounded-md">Approved invoices</p>
          </div>

          <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-white to-[#e0f2f1]/50 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BarChart3 size={48} /></div>
            <h3 className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Industry Average DSO</h3>
            <p className="mt-3 text-4xl font-black text-slate-900">--<span className="text-xl text-slate-500 ml-1">Days</span></p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/60 w-fit px-2 py-1 rounded-md border border-slate-200">
              <TrendingDown size={14} /> Connect invoice history
            </div>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle size={48} /></div>
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Overdue (&gt;45 Days)</h3>
            <p className="mt-3 text-4xl font-black text-rose-700">{fmt(overdueAmount)}</p>
            <p className="mt-3 text-xs font-semibold text-rose-600 bg-white/60 w-fit px-2 py-1 rounded-md">Overdue balance</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><CreditCard size={48} /></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payables</h3>
            <p className="mt-3 text-4xl font-black text-white drop-shadow-md">INR 0</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800 w-fit px-2 py-1 rounded-md">
              <TrendingUp size={14} /> Connect payables data
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest">Pending Match</h3>
            <p className="mt-3 text-4xl font-black text-amber-900">INR 0</p>
            <p className="mt-3 text-xs font-semibold text-amber-800 bg-white border border-amber-100 w-fit px-2 py-1 rounded-md">No pending matches</p>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 flex h-3 w-3 rounded-full bg-rose-200"></div>
            <h3 className="text-xs font-bold text-rose-800 uppercase tracking-widest">SLA Penalty Risk</h3>
            <p className="mt-3 text-4xl font-black text-rose-900">Low</p>
            <p className="mt-3 text-xs font-semibold text-rose-700 bg-white border border-rose-100 w-fit px-2 py-1 rounded-md">No invoices nearing limit</p>
          </div>

          <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-[#e0f2f1]/40 to-white p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Industry Average DPO</h3>
            <p className="mt-3 text-4xl font-black text-slate-900">--<span className="text-xl text-slate-500 ml-1">Days</span></p>
            <p className="mt-3 text-xs font-semibold text-[#1b5b6a] bg-white border border-[#cfe8e6] w-fit px-2 py-1 rounded-md">Connect payment history</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col p-2">
          <div className="p-4 md:p-6 pb-2 shrink-0 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {viewMode === "RECEIVABLES" ? "Cash Inflow Prediction Chart" : "Cash Outflow and DPO Prediction"}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">Comparing Actuals vs AI Predicted (in INR Lakhs)</p>
            </div>
          </div>
          <div className="flex-1 w-full h-[350px] p-4">
            {cashFlowData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-slate-400 font-medium">
                No cashflow data yet. Connect invoices to generate forecasts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold", paddingTop: "20px" }} />

                  {viewMode === "RECEIVABLES" && (
                    <>
                      <Bar dataKey="inflow" name="Actual Inflow" fill="#1b5b6a" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="outflow" name="Exp. Outflow (Ref)" stroke="#f97316" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} />
                    </>
                  )}
                  {viewMode === "PAYABLES" && (
                    <>
                      <Bar dataKey="outflow" name="Actual Outflow" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="inflow" name="Exp. Inflow (Ref)" stroke="#1b5b6a" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 shrink-0">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <Clock size={16} className="text-rose-500" /> Action Items
              </h2>
            </div>

            <div className="p-5 flex-1 space-y-4 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs text-slate-500">No action items yet. Connect invoices to surface disputes, offers, and alerts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <PlusCircle size={16} className="text-emerald-600" /> Quick Create
            </h2>
          </div>
          <div className="p-4 grid gap-3 text-sm">
            <Link href="/seller/invoices" className="rounded-xl border border-slate-200 bg-white p-3 hover:bg-[#f7f4ef] transition-all duration-200 flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#1b5b6a]" />
              <span className="font-semibold text-slate-700">Create Invoice</span>
            </Link>
            <Link href="/seller/buyers" className="rounded-xl border border-slate-200 bg-white p-3 hover:bg-[#f7f4ef] transition-all duration-200 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-[#1b5b6a]" />
              <span className="font-semibold text-slate-700">Add Counterparty</span>
            </Link>
            <Link href="/seller/receivables" className="rounded-xl border border-slate-200 bg-white p-3 hover:bg-[#f7f4ef] transition-all duration-200 flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-[#1b5b6a]" />
              <span className="font-semibold text-slate-700">Raise Discount Request</span>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <Activity size={16} className="text-[#1b5b6a]" /> Recent Activities
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {recentActivities.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                No invoice activity yet.
              </div>
            ) : (
              recentActivities.map((item) => (
                <div key={`${item.title}-${item.meta}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.meta}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-3xl border border-[#cfe8e6] bg-[#e0f2f1]/40 shadow-sm overflow-hidden">
          <div className="border-b border-[#cfe8e6] bg-white/60 p-5">
            <h2 className="font-bold text-[#0f1b2d] flex items-center gap-2 tracking-tight">
              <Users size={16} className="text-[#1b5b6a]" /> Top Counterparties by Exposure
            </h2>
          </div>
          <div className="p-4 grid gap-2 text-sm md:grid-cols-2">
            {topBuyers.length === 0 ? (
              <div className="rounded-xl border border-[#cfe8e6] bg-white p-3 text-xs text-slate-500">No exposure data yet.</div>
            ) : (
              topBuyers.map((buyer) => (
                <div key={buyer.name} className="rounded-xl border border-[#cfe8e6] bg-white p-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{buyer.name}</span>
                  <span className="font-black text-[#0f1b2d]">{fmt(buyer.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <AIInsightsSidebar insightsHref="/seller/reports" />
    </div>
  );
}
