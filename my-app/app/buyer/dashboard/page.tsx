"use client";

import Link from "next/link";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  ShieldAlert, ShieldCheck, Zap, ArrowRight, Anchor,
  Briefcase, Activity, Target, Shield, AlertTriangle
} from "lucide-react";

type OutflowDatum = { week: string; projectedOutflow: number; discountedDiscount: number };

const outflowData: OutflowDatum[] = [];

const complianceData: { name: string; value: number; color: string }[] = [];

type ChartTooltipPayload = { name?: string; value?: number; color?: string };
type ChartTooltipProps = { active?: boolean; payload?: ChartTooltipPayload[]; label?: string };

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
  const safeCount = complianceData.find((d) => d.name.includes("Safe"))?.value || 0;
  const approachingCount = complianceData.find((d) => d.name.includes("Approaching"))?.value || 0;
  const riskCount = complianceData.find((d) => d.name.includes("Risk"))?.value || 0;
  const totalInvoices = complianceData.reduce((sum, d) => sum + d.value, 0);
  const hasCompliance = complianceData.length > 0;
  const hasOutflow = outflowData.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <header className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-6 shadow-sm sticky top-4 z-30">
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

      <div className="grid gap-6 lg:grid-cols-3">
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

        </div>
      </div>
    </div>
  );
}
