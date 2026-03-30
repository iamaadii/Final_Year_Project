"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api/client";

type PnlReport = {
  kind: "pnl";
  period: string;
  report: string;
  data: {
    grossRevenue: number;
    taxCollected: number;
    discounts: number;
    netRevenue: number;
  };
  monthlyBreakdown: { month: string; total: number }[];
};

type BalanceReport = {
  kind: "balance-sheet";
  period: string;
  report: string;
  data: {
    assets: {
      accountsReceivable: number;
      cashRealized: number;
      totalAssets: number;
    };
    liabilities: {
      accountsPayable: number;
      totalLiabilities: number;
    };
    equity: number;
  };
};

type AgingTotals = {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
};

type AgingReport = {
  kind: "aging";
  report: string;
  data: {
    totals: AgingTotals;
  };
};

type CashflowMonth = { month: string; total: number };

type CashflowReport = {
  kind: "cashflow";
  report: string;
  data: {
    monthlyInflow: CashflowMonth[];
    monthlyOutflow: CashflowMonth[];
  };
};

type ReportData = PnlReport | BalanceReport | AgingReport | CashflowReport;

type TabKey = "pnl" | "bs" | "cf" | "aging";

type Tab = { key: TabKey; label: string };

const TABS: Tab[] = [
  { key: "pnl", label: "P&L" },
  { key: "bs", label: "Balance Sheet" },
  { key: "cf", label: "Cash Flow" },
  { key: "aging", label: "AP Aging" },
];

const emptyPnl: PnlReport = {
  kind: "pnl",
  period: "",
  report: "Profit & Loss",
  data: { grossRevenue: 0, taxCollected: 0, discounts: 0, netRevenue: 0 },
  monthlyBreakdown: [],
};

const emptyBalance: BalanceReport = {
  kind: "balance-sheet",
  period: "",
  report: "Balance Sheet",
  data: {
    assets: { accountsReceivable: 0, cashRealized: 0, totalAssets: 0 },
    liabilities: { accountsPayable: 0, totalLiabilities: 0 },
    equity: 0,
  },
};

const emptyAging: AgingReport = {
  kind: "aging",
  report: "AP Aging",
  data: {
    totals: { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 },
  },
};

const emptyCashflow: CashflowReport = {
  kind: "cashflow",
  report: "Cash Flow",
  data: {
    monthlyInflow: [],
    monthlyOutflow: [],
  },
};

export default function BuyerReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pnl");
  const [days, setDays] = useState(90);
  const [reportData, setReportData] = useState<ReportData>(emptyPnl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        if (activeTab === "pnl") {
          const data = await apiFetch<Omit<PnlReport, "kind">>(`/api/accounting/reports?type=pnl&days=${days}`);
          setReportData({
            kind: "pnl",
            report: data.report || emptyPnl.report,
            period: data.period || `Last ${days} days`,
            data: {
              grossRevenue: Number(data.data?.grossRevenue || 0),
              taxCollected: Number(data.data?.taxCollected || 0),
              discounts: Number(data.data?.discounts || 0),
              netRevenue: Number(data.data?.netRevenue || 0),
            },
            monthlyBreakdown: Array.isArray(data.monthlyBreakdown) ? data.monthlyBreakdown : [],
          });
          return;
        }

        if (activeTab === "bs") {
          const data = await apiFetch<Omit<BalanceReport, "kind" | "period">>(`/api/accounting/reports?type=balance-sheet&days=${days}`);
          setReportData({
            kind: "balance-sheet",
            report: data.report || emptyBalance.report,
            period: `As of ${new Date().toISOString().slice(0, 10)}`,
            data: {
              assets: {
                accountsReceivable: Number(data.data?.assets?.accountsReceivable || 0),
                cashRealized: Number(data.data?.assets?.cashRealized || 0),
                totalAssets: Number(data.data?.assets?.totalAssets || 0),
              },
              liabilities: {
                accountsPayable: Number(data.data?.liabilities?.accountsPayable || 0),
                totalLiabilities: Number(data.data?.liabilities?.totalLiabilities || 0),
              },
              equity: Number(data.data?.equity || 0),
            },
          });
          return;
        }

        if (activeTab === "cf") {
          const data = await apiFetch<Omit<CashflowReport, "kind">>(`/api/accounting/reports?type=cashflow&days=${days}`);
          setReportData({
            kind: "cashflow",
            report: data.report || emptyCashflow.report,
            data: {
              monthlyInflow: Array.isArray(data.data?.monthlyInflow) ? data.data.monthlyInflow : [],
              monthlyOutflow: Array.isArray(data.data?.monthlyOutflow) ? data.data.monthlyOutflow : [],
            },
          });
          return;
        }

        const data = await apiFetch<Omit<AgingReport, "kind">>(`/api/accounting/reports?type=aging&days=${days}`);
        setReportData({
          kind: "aging",
          report: data.report || emptyAging.report,
          data: {
            totals: {
              current: Number(data.data?.totals?.current || 0),
              d1_30: Number(data.data?.totals?.d1_30 || 0),
              d31_60: Number(data.data?.totals?.d31_60 || 0),
              d61_90: Number(data.data?.totals?.d61_90 || 0),
              d90plus: Number(data.data?.totals?.d90plus || 0),
            },
          },
        });
      } catch {
        if (activeTab === "pnl") setReportData(emptyPnl);
        if (activeTab === "bs") setReportData(emptyBalance);
        if (activeTab === "cf") setReportData(emptyCashflow);
        if (activeTab === "aging") setReportData(emptyAging);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [activeTab, days]);

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const agingCards: { label: string; key: keyof AgingTotals; bg: string; border: string; text: string }[] = [
    { label: "Current", key: "current", bg: "bg-emerald-50/50", border: "border-emerald-200", text: "text-emerald-700" },
    { label: "1-30d", key: "d1_30", bg: "bg-amber-50/50", border: "border-amber-200", text: "text-amber-700" },
    { label: "31-60d", key: "d31_60", bg: "bg-orange-50/50", border: "border-orange-200", text: "text-orange-700" },
    { label: "61-90d", key: "d61_90", bg: "bg-rose-50/50", border: "border-rose-200", text: "text-rose-700" },
    { label: "90d+", key: "d90plus", bg: "bg-red-50/50", border: "border-red-200", text: "text-red-700" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <header className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-[#1b5b6a] w-8 h-8" /> Financial Reports
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">Profit & Loss, Balance Sheet, Cash Flow, and AP Aging reports.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm"
            >
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
              <option value={365}>Last 1 Year</option>
            </select>
            <button
              onClick={exportData}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </header>

      <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-inner w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.key ? "bg-white text-[#0f1b2d] shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading && <div className="p-10 text-center text-slate-400">Loading report...</div>}

        {!loading && reportData.kind === "pnl" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Profit & Loss Statement</h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{reportData.period}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Gross Revenue</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{fmt(reportData.data.grossRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 p-5">
                <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Tax Collected</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{fmt(reportData.data.taxCollected)}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Discounts</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{fmt(reportData.data.discounts)}</p>
              </div>
              <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 p-5">
                <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Net Revenue</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{fmt(reportData.data.netRevenue)}</p>
              </div>
            </div>
            {reportData.monthlyBreakdown.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthlyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="total" name="Revenue" fill="#1b5b6a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No monthly breakdown available yet.</p>
            )}
          </div>
        )}

        {!loading && reportData.kind === "balance-sheet" && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-800">Balance Sheet</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4">Assets</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Accounts Receivable</span><span className="font-bold">{fmt(reportData.data.assets.accountsReceivable)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Cash Realized</span><span className="font-bold">{fmt(reportData.data.assets.cashRealized)}</span></div>
                  <div className="flex justify-between border-t pt-3 border-emerald-200"><span className="font-bold text-emerald-800">Total</span><span className="font-black text-emerald-900">{fmt(reportData.data.assets.totalAssets)}</span></div>
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                <h3 className="text-sm font-bold text-rose-800 uppercase tracking-widest mb-4">Liabilities</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Accounts Payable</span><span className="font-bold">{fmt(reportData.data.liabilities.accountsPayable)}</span></div>
                  <div className="flex justify-between border-t pt-3 border-rose-200"><span className="font-bold text-rose-800">Total</span><span className="font-black text-rose-900">{fmt(reportData.data.liabilities.totalLiabilities)}</span></div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 p-5 flex flex-col justify-center items-center">
                <h3 className="text-sm font-bold text-[#1b5b6a] uppercase tracking-widest mb-2">Equity</h3>
                <p className="text-3xl font-black text-[#0f1b2d]">{fmt(reportData.data.equity)}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && reportData.kind === "cashflow" && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-800">Cash Flow Statement</h2>
            {(reportData.data.monthlyInflow.length > 0 || reportData.data.monthlyOutflow.length > 0) ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.data.monthlyOutflow.map((row) => ({
                      month: row.month,
                      outflow: row.total,
                      inflow: reportData.data.monthlyInflow.find((x) => x.month === row.month)?.total || 0,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="inflow" name="Inflow" fill="#1b5b6a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="outflow" name="Outflow" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-12 text-slate-400 font-medium">Cash flow data reflects settled invoices. Process and settle invoices to see cash flow here.</p>
            )}
          </div>
        )}

        {!loading && reportData.kind === "aging" && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-800">{reportData.report || "AP Aging"}</h2>
            <div className="grid gap-4 sm:grid-cols-5">
              {agingCards.map((b) => (
                <div key={b.key} className={`rounded-2xl border ${b.border} ${b.bg} p-4 text-center`}>
                  <p className={`text-xs font-bold ${b.text} uppercase tracking-widest`}>{b.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{fmt(reportData.data.totals[b.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
