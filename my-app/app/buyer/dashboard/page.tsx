"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  ShieldAlert, ShieldCheck, Zap, ArrowRight, Anchor,
  Briefcase, Activity, Target, Shield, AlertTriangle, Clock3,
  Wallet, Building2, PlusCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";
import AIInsightsSidebar from "@/app/_components/dashboard/AIInsightsSidebar";

type OutflowDatum = { week: string; projectedOutflow: number; discountedDiscount: number };
type ComplianceDatum = { name: string; value: number; color: string };

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

type RadarData = {
  summary: {
    safe: number;
    approaching: number;
    at_risk: number;
    breached: number;
  };
};

type CashflowReport = {
  data?: {
    monthlyOutflow?: Array<{ month: string; total: number }>;
  };
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string } | null;
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

const quickActions = [
  { href: "/buyer/purchase-orders", title: "Create PO", subtitle: "Draft and send purchase orders", Icon: PlusCircle },
  { href: "/buyer/invoices", title: "Upload Invoice", subtitle: "Capture and classify supplier invoices", Icon: Activity },
  { href: "/buyer/compliance", title: "Run 43B(h) Check", subtitle: "Assess ageing and compliance risk", Icon: ShieldCheck },
  { href: "/buyer/vendors", title: "Add Vendor", subtitle: "Onboard supplier and documents", Icon: Building2 },
];

const recentActivity = [
  { title: "No invoice approval activity yet", meta: "Approvals will appear here", tone: "text-slate-500" },
  { title: "No compliance alerts raised", meta: "Risk updates sync from AP hub", tone: "text-emerald-600" },
  { title: "No treasury offers accepted", meta: "Yield decisions will appear here", tone: "text-amber-600" },
];

const CustomOutflowTooltip = ({ active, payload, label }: ChartTooltipProps) => {
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

export default function BuyerDashboardPage() {
  const [summary, setSummary] = useState<AccountingSummary>(emptySummary);
  const [outflowData, setOutflowData] = useState<OutflowDatum[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceDatum[]>([]);

  useEffect(() => {
    let mounted = true;

    const unwrapPayload = <T,>(payload: T | ApiEnvelope<T> | null): T | null => {
      if (!payload || typeof payload !== "object") return payload as T | null;
      if ("data" in payload) {
        return ((payload as ApiEnvelope<T>).data || null) as T | null;
      }
      return payload as T;
    };

    Promise.allSettled([
      apiFetch<AccountingSummary | ApiEnvelope<AccountingSummary>>("/api/accounting/summary"),
      apiFetch<RadarData | ApiEnvelope<RadarData>>("/api/compliance/43bh-radar"),
      apiFetch<CashflowReport | ApiEnvelope<CashflowReport>>("/api/accounting/reports?type=cashflow&days=180"),
    ])
      .then(([summaryRes, radarRes, cashflowRes]) => {
        if (!mounted) return;

        const summaryDataRaw = summaryRes.status === "fulfilled" ? summaryRes.value : null;
        const radarDataRaw = radarRes.status === "fulfilled" ? radarRes.value : null;
        const cashflowDataRaw = cashflowRes.status === "fulfilled" ? cashflowRes.value : null;

        const summaryData = unwrapPayload(summaryDataRaw) || emptySummary;
        const radarData = unwrapPayload(radarDataRaw);
        const cashflowData = unwrapPayload(cashflowDataRaw);

        setSummary(summaryData || emptySummary);

        const compliance: ComplianceDatum[] = [
          { name: "Safe (<30 Days)", value: Number(radarData?.summary?.safe || 0), color: "#10B981" },
          { name: "Approaching (30-38 Days)", value: Number(radarData?.summary?.approaching || 0), color: "#F59E0B" },
          { name: "Risk (39-45 Days)", value: Number((radarData?.summary?.at_risk || 0) + (radarData?.summary?.breached || 0)), color: "#EF4444" },
        ].filter((row) => row.value > 0);
        setComplianceData(compliance);

        const monthlyOutflow = cashflowData?.data?.monthlyOutflow || [];
        const transformed = monthlyOutflow.slice(-6).map((row) => ({
          week: row.month,
          projectedOutflow: Math.round(Number(row.total || 0) / 100000),
          discountedDiscount: Math.round(Number(row.total || 0) / 100000),
        }));
        setOutflowData(transformed);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const safeCount = complianceData.find((d) => d.name.includes("Safe"))?.value || 0;
  const approachingCount = complianceData.find((d) => d.name.includes("Approaching"))?.value || 0;
  const riskCount = complianceData.find((d) => d.name.includes("Risk"))?.value || summary.overdueCount;
  const totalInvoices = summary.totalInvoices || complianceData.reduce((sum, d) => sum + d.value, 0);
  const hasCompliance = complianceData.length > 0;
  const hasOutflow = outflowData.length > 0;
  const hasDashboardData = Number(summary.totalInvoices || 0) > 0 || hasCompliance || hasOutflow;
  const upcomingOutflow = summary.cashOutflow > 0 ? Math.round(summary.cashOutflow / 100000) : outflowData.reduce((sum, row) => sum + row.discountedDiscount, 0);

  const formatLakhs = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}L`;

  if (!hasDashboardData) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 portal-page portal-module-transition">
        <header className="rounded-3xl p-6 portal-surface portal-section-enter">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                <Briefcase className="text-[#1b5b6a] w-8 h-8" />
                Enterprise Command Center
              </h1>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Connect your AP systems to unlock real-time MSME compliance, cashflow forecasts, and yield insights.
              </p>
            </div>
          </div>
        </header>

        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="Your AP hub is almost ready"
          description="Complete your setup to start seeing invoice analytics and cashflow insights."
          primaryCTA={{ label: "Continue Setup", href: "/onboarding" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 portal-page portal-module-transition">
      <header className="rounded-3xl p-6 portal-surface portal-section-enter">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Briefcase className="text-[#1b5b6a] w-8 h-8" />
              Enterprise Command Center
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Connect your AP systems to unlock real-time MSME compliance, cashflow forecasts, and yield insights.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/buyer/ap-hub" className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#142338] transition-all flex items-center gap-2 hover:-translate-y-0.5">
              <Activity className="w-4 h-4" />
              Process AP Exceptions
            </Link>
            <Link href="/buyer/vendors" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-[#f7f4ef] transition-all flex items-center gap-2 hover:-translate-y-0.5">
              Link Vendor
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Open Invoices</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.outstandingCount || totalInvoices}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Across connected vendors</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-[11px] uppercase tracking-widest font-bold text-rose-700">Critical Risk</p>
          <p className="mt-2 text-3xl font-black text-rose-800">{riskCount}</p>
          <p className="mt-2 text-xs font-semibold text-rose-600">Invoices nearing 45-day mark</p>
        </div>
        <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-[11px] uppercase tracking-widest font-bold text-[#1b5b6a]">Expected Outflow</p>
          <p className="mt-2 text-3xl font-black text-[#0f1b2d]">{formatLakhs(upcomingOutflow)}</p>
          <p className="mt-2 text-xs font-semibold text-[#1b5b6a]">Next 6 weeks projection</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0f1b2d] to-[#12263c] p-5 shadow-sm text-white hover:shadow-md transition-all duration-300">
          <p className="text-[11px] uppercase tracking-widest font-bold text-slate-300">Liquidity Insight</p>
          <p className="mt-2 text-3xl font-black">{summary.matchEfficiency}%</p>
          <p className="mt-2 text-xs font-semibold text-slate-300">Invoice auto-match efficiency</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row p-6 items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Shield className="text-slate-500" /> MSME 43B(h) Radar
              </h2>
              <p className="text-xs text-slate-500 font-medium mb-6">Live AI monitoring across connected MSME vendors.</p>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500 w-5 h-5" />
                    <span className="text-sm font-bold text-emerald-900">Safe Zone (&lt;15 Days)</span>
                  </div>
                  <span className="text-xl font-black text-emerald-600">{safeCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-amber-100 bg-amber-50/50">
                  <div className="flex items-center gap-3">
                    <Target className="text-amber-500 w-5 h-5" />
                    <span className="text-sm font-bold text-amber-900">Approaching (15-30 Days)</span>
                  </div>
                  <span className="text-xl font-black text-amber-600">{approachingCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-rose-200 bg-rose-50/80 shadow-inner relative overflow-hidden group hover:bg-rose-100 transition-colors cursor-pointer">
                  <div className="absolute right-0 top-0 h-full w-12 bg-rose-500 opacity-10 group-hover:opacity-20 transition-opacity flex items-center justify-center -skew-x-12 translate-x-2"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <AlertTriangle className="text-rose-600 w-5 h-5" />
                    <span className="text-sm font-bold text-rose-900">Critical Risk (30-45 Days)</span>
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-2xl font-black text-rose-700">{riskCount}</span>
                    <ArrowRight className="text-rose-600 w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-64 h-64 flex-shrink-0 relative flex items-center justify-center">
              {hasCompliance ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 font-medium">
                  No compliance data yet.
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{totalInvoices}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoices</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-2 pt-6 flex flex-col">
            <div className="px-6 flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Projected Cash Outflow and Saving</h3>
                <p className="text-xs text-slate-500 font-medium">Predictive model factoring in accepted early payment discounts.</p>
              </div>
              <div className="bg-slate-100 rounded-lg px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                Next 6 Weeks
              </div>
            </div>
            <div className="w-full h-[320px] p-4">
              {hasOutflow ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={outflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                    <Tooltip content={<CustomOutflowTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />

                    <Bar dataKey="projectedOutflow" name="Standard Outflow Prediction" fill="#94A3B8" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.6} />
                    <Bar dataKey="discountedDiscount" name="Actual Outflow (Discount Saved)" fill="#1b5b6a" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Line type="monotone" dataKey="projectedOutflow" name="Upper Baseline Limit" stroke="#0f1b2d" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-slate-400 font-medium">
                  No cashflow projections yet. Connect invoices to generate forecasts.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#1b5b6a]" /> Recent Activity
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {recentActivity.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:bg-white transition-colors duration-200">
                  <p className={`text-sm font-semibold ${item.tone}`}>{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" /> Quick Create
              </h2>
            </div>
            <div className="p-4 grid gap-3">
              {quickActions.map(({ href, title, subtitle, Icon }) => (
                <Link
                  key={title}
                  href={href}
                  className="rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-3 hover:bg-[#f7f4ef] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="rounded-lg bg-slate-100 p-2">
                    <Icon className="w-4 h-4 text-[#1b5b6a]" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800">{title}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-[#0f1b2d] to-[#0b1422] text-white shadow-xl overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-6 opacity-5"><Zap size={120} /></div>
          <div className="p-6 relative z-10">
            <h2 className="font-bold text-slate-300 flex items-center gap-2 mb-6">
              <Zap className="text-amber-400" size={18} /> Treasury Yield Tracker
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Yield Realized (MTD)</span>
                  <span className="text-lg font-black text-amber-400 drop-shadow">INR 0</span>
                </div>
                <div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden shadow-inner border border-slate-600/50 relative">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-400 w-[0%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Target Pipeline</span>
                  <span className="text-lg font-black text-[#7fb6ad]">INR 0</span>
                </div>
                <div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden shadow-inner border border-slate-600/50 relative">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1b5b6a] to-[#7fb6ad] w-[0%] rounded-full"></div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-700/50">
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Average ROI</h4>
                  <p className="text-2xl font-black text-white mt-1">0.0% <span className="text-sm text-slate-400 tracking-normal font-semibold">APR</span></p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">No yield data available yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#1b5b6a]" /> Bank Position
            </h2>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
              <span className="font-semibold text-slate-700">Operating Account</span>
              <span className="font-black text-slate-900">INR 0</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
              <span className="font-semibold text-slate-700">Escrow Reserve</span>
              <span className="font-black text-slate-900">INR 0</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#cfe8e6] bg-[#e0f2f1]/40 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><Anchor size={80} /></div>
          <h3 className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Industry Average DPO</h3>
          <p className="mt-2 text-4xl font-black text-[#0f1b2d] drop-shadow-sm">--<span className="text-xl text-[#1b5b6a]/70 ml-1">Days</span></p>
          <div className="mt-3 bg-white border border-[#cfe8e6] rounded-xl p-3 shadow-sm">
            <p className="text-sm font-bold text-slate-800 flex justify-between">
              <span>Your Reality:</span>
              <span className="text-emerald-600">--</span>
            </p>
            <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed">
              Connect invoice history to benchmark your DPO.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-rose-100 bg-rose-50/50 p-4 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-rose-900 flex items-center gap-2">
              <ShieldAlert size={16} /> Bottlenecks
            </h2>
          </div>
          <div className="p-6 text-sm text-slate-500">
            No bottlenecks detected yet. Connect your AP workflow to start tracking exceptions.
          </div>
        </div>
      </section>

      <AIInsightsSidebar insightsHref="/buyer/reports" />
    </div>
  );
}
