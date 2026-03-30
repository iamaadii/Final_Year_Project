"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield, AlertTriangle, ShieldCheck, Target, DollarSign,
  RefreshCw, ChevronDown, CalendarClock
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { apiFetch } from "@/lib/api/client";

type RadarInvoice = {
  _id: string;
  invoiceNumber: string;
  sellerName: string;
  totalAmount: number;
  amountPaid?: number;
  remainingAmount?: number;
  daysSince: number;
};

type RadarSummary = {
  safe: number;
  approaching: number;
  at_risk: number;
  breached: number;
  total: number;
  totalTaxExposure: number;
};

type RadarBuckets = {
  safe: RadarInvoice[];
  approaching: RadarInvoice[];
  at_risk: RadarInvoice[];
  breached: RadarInvoice[];
};

type RadarData = {
  summary: RadarSummary;
  buckets: RadarBuckets;
};

type CalendarEvent = {
  type: string;
  date: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  entityType: string;
  entityId: string;
  payload: {
    totalAmount?: number;
    vendorName?: string;
    status?: string;
    frequency?: string;
  };
};

type CalendarEnvelope = {
  success: boolean;
  data: {
    month: string;
    items: CalendarEvent[];
  };
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};

type TreasuryConfigResponse = {
  paused?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
  } | null;
};

const emptyRadarData: RadarData = {
  summary: {
    safe: 0,
    approaching: 0,
    at_risk: 0,
    breached: 0,
    total: 0,
    totalTaxExposure: 0,
  },
  buckets: {
    safe: [],
    approaching: [],
    at_risk: [],
    breached: [],
  },
};

export default function BuyerCompliancePage() {
  const [radarData, setRadarData] = useState<RadarData>(emptyRadarData);
  const [calendarItems, setCalendarItems] = useState<CalendarEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedBucket, setExpandedBucket] = useState<keyof RadarBuckets | null>(null);
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const loadRadar = useCallback(() => {
    setLoading(true);

    const unwrapPayload = <T,>(payload: T | ApiEnvelope<T>): T => {
      if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
        return (payload as ApiEnvelope<T>).data;
      }
      return payload as T;
    };

    Promise.all([
      apiFetch<RadarData>("/api/compliance/43bh-radar"),
      apiFetch<CalendarEnvelope>(`/api/compliance/calendar?month=${currentMonth}`),
      apiFetch<TreasuryConfigResponse | ApiEnvelope<TreasuryConfigResponse>>("/treasury/config").catch(() => ({ paused: false })),
    ])
      .then(([radar, calendar, config]) => {
        setRadarData(radar);
        if (calendar.success) {
          setCalendarItems(calendar.data.items || []);
        }
        const configData = unwrapPayload(config);
        setPaused(Boolean(configData?.paused || false));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRadar();
  }, [loadRadar]);

  const fmt = (n: number) => `INR ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const markPaid = async (invoiceId: string) => {
    const invoice = [
      ...buckets.safe,
      ...buckets.approaching,
      ...buckets.at_risk,
      ...buckets.breached,
    ].find((item) => item._id === invoiceId);

    if (!invoice) return;

    if (paused) {
      alert("Treasury programs are paused. Resume programs to continue.");
      return;
    }

    const totalAmount = Number(invoice.totalAmount || 0);
    const amountPaid = Number(invoice.amountPaid || 0);
    const remainingAmount = Number(invoice.remainingAmount ?? Math.max(totalAmount - amountPaid, 0));

    if (remainingAmount <= 0) {
      loadRadar();
      return;
    }

    try {
      await apiFetch(`/api/invoices/${invoiceId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({
          amount: remainingAmount,
          paymentDate: new Date().toISOString(),
          paymentMode: "manual",
          notes: "Settled outstanding amount from compliance radar",
        }),
      });
      loadRadar();
    } catch {
      alert("Failed to update invoice");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  const summary = radarData.summary;
  const buckets = radarData.buckets;

  const chartData = [
    { name: "Safe (<30 Days)", value: summary.safe, color: "#10B981" },
    { name: "Approaching (30-38 Days)", value: summary.approaching, color: "#F59E0B" },
    { name: "At Risk (39-44 Days)", value: summary.at_risk, color: "#F97316" },
    { name: "Breached (45+ Days)", value: summary.breached, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const bucketConfig = [
    { key: "breached", label: "BREACHED - 45+ Days (Tax Deduction Disallowed)", icon: AlertTriangle, borderColor: "border-red-200", bgColor: "bg-red-50/80", headerBg: "bg-red-100", textColor: "text-red-900", badgeColor: "bg-red-200 text-red-800", count: summary.breached },
    { key: "at_risk", label: "AT RISK - 39-44 Days", icon: Target, borderColor: "border-orange-200", bgColor: "bg-orange-50/50", headerBg: "bg-orange-100", textColor: "text-orange-900", badgeColor: "bg-orange-200 text-orange-800", count: summary.at_risk },
    { key: "approaching", label: "APPROACHING - 30-38 Days", icon: Target, borderColor: "border-amber-200", bgColor: "bg-amber-50/50", headerBg: "bg-amber-100", textColor: "text-amber-900", badgeColor: "bg-amber-200 text-amber-800", count: summary.approaching },
    { key: "safe", label: "SAFE - Under 30 Days", icon: ShieldCheck, borderColor: "border-emerald-200", bgColor: "bg-emerald-50/30", headerBg: "bg-emerald-100", textColor: "text-emerald-900", badgeColor: "bg-emerald-200 text-emerald-800", count: summary.safe },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <header className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Shield className="text-[#1b5b6a] w-8 h-8" />
              Section 43B(h) Compliance Radar
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Track MSME payment deadlines to prevent income tax deduction disallowance.
            </p>
          </div>
          <button
            onClick={loadRadar}
            className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#142338] transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </header>

      {paused && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Treasury programs are currently paused. Payment actions are disabled.
        </div>
      )}

      {summary.totalTaxExposure > 0 && (
        <div className="rounded-3xl border-2 border-red-300 bg-red-50 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <DollarSign className="text-red-600" size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-red-900">Tax Deduction at Risk</h2>
            <p className="text-sm text-red-800 mt-1">
              {summary.breached} invoice(s) have crossed the 45-day MSME payment threshold.
              Per Section 43B(h), these expenses will be <strong>disallowed as tax deductions</strong> in your ITR.
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-red-900">{fmt(summary.totalTaxExposure)}</p>
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-1">Exposure Amount</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center">
          <div className="w-64 h-64 relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-slate-400 font-medium">
                No compliance data yet.
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800">{summary.total}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoices</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {bucketConfig.map((b) => (
            <div
              key={b.key}
              className={`rounded-2xl border ${b.borderColor} ${b.bgColor} p-5 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setExpandedBucket(expandedBucket === b.key ? null : b.key)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <b.icon size={16} className={b.textColor} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${b.textColor}`}>{b.label.split(" - ")[0]}</span>
                </div>
                <span className={`text-2xl font-black ${b.textColor}`}>{b.count}</span>
              </div>
              <p className={`text-xs font-semibold mt-2 ${b.textColor} opacity-75`}>{b.label.split(" - ")[1]}</p>
              <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${b.textColor} opacity-60`}>
                Click to {expandedBucket === b.key ? "collapse" : "expand"} <ChevronDown size={12} className={expandedBucket === b.key ? "rotate-180" : ""} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <CalendarClock size={16} /> Compliance Calendar ({currentMonth})
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming obligations</span>
        </div>
        <div className="sm:hidden p-4 space-y-3">
          {calendarItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-center text-sm text-slate-500">
              No compliance events found for this month.
            </div>
          ) : (
            calendarItems.map((item, index) => (
              <div key={`calendar-mobile-${item.entityType}-${item.entityId}-${index}`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                <div className="flex justify-between items-start gap-3">
                  <p className="font-semibold text-slate-900">{new Date(item.date).toLocaleDateString("en-IN")}</p>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${
                      item.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : item.severity === "high"
                          ? "bg-orange-100 text-orange-700"
                          : item.severity === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{item.type.replace(/_/g, " ")}</p>
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Date</th>
                <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Event</th>
                <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Type</th>
                <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calendarItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-medium">No compliance events found for this month.</td>
                </tr>
              )}
              {calendarItems.map((item, index) => (
                <tr key={`${item.entityType}-${item.entityId}-${index}`} className="hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 bg-white px-5 py-4 font-semibold text-slate-900">{new Date(item.date).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-4 text-slate-700">{item.title}</td>
                  <td className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">{item.type.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        item.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : item.severity === "high"
                            ? "bg-orange-100 text-orange-700"
                            : item.severity === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expandedBucket && buckets[expandedBucket]?.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`${bucketConfig.find((b) => b.key === expandedBucket)?.headerBg || "bg-slate-100"} p-5 border-b`}>
            <h2 className="font-bold text-slate-800">{bucketConfig.find((b) => b.key === expandedBucket)?.label} - {buckets[expandedBucket].length} Invoices</h2>
          </div>
          <div className="sm:hidden p-4 space-y-3">
            {buckets[expandedBucket].map((inv) => (
              <div key={`${inv._id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                    <p className="text-sm text-slate-600 mt-1">{inv.sellerName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${bucketConfig.find((b) => b.key === expandedBucket)?.badgeColor}`}>
                    {inv.daysSince} days
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Invoice Amount</span>
                  <span className="text-right font-bold text-slate-900">{fmt(inv.totalAmount)}</span>
                  <span className="text-slate-500">Paid So Far</span>
                  <span className="text-right font-semibold text-emerald-700">{fmt(Number(inv.amountPaid || 0))}</span>
                  <span className="text-slate-500">Outstanding</span>
                  <span className="text-right font-bold text-amber-700">{fmt(Number(inv.remainingAmount ?? Math.max(Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0)))}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => markPaid(inv._id)}
                    disabled={paused || Number(inv.remainingAmount ?? Math.max(Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0)) <= 0}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {Number(inv.remainingAmount ?? Math.max(Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0)) > 0 ? "Settle Remaining" : "Settled"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Invoice #</th>
                  <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Vendor</th>
                  <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Invoice Amount</th>
                  <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Paid So Far</th>
                  <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Outstanding</th>
                  <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Days Since Approval</th>
                  <th className="px-5 py-3 font-bold text-xs uppercase text-slate-600 tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buckets[expandedBucket].map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-5 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 text-slate-700">{inv.sellerName}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-5 py-4 font-semibold text-emerald-700">{fmt(Number(inv.amountPaid || 0))}</td>
                    <td className="px-5 py-4 font-bold text-amber-700">{fmt(Number(inv.remainingAmount ?? Math.max(Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0)))}</td>
                    <td className="px-5 py-4 font-bold">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${bucketConfig.find((b) => b.key === expandedBucket)?.badgeColor}`}>
                        {inv.daysSince} days
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => markPaid(inv._id)}
                        disabled={paused || Number(inv.remainingAmount ?? Math.max(Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0)) <= 0}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                      >
                        {Number(inv.remainingAmount ?? Math.max(Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0)) > 0 ? "Settle Remaining" : "Settled"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
