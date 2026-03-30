"use client";

import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, Calculator, FileText, Download, Copy,
  CheckCircle, Clock, X, CalendarClock
} from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  buyerName?: string;
  totalAmount: number;
  issueDate: string;
  dueDate?: string;
  status?: string;
  paymentTermsDays?: number;
  msmedDeadline?: string;
};

type PenaltyData = {
  principal: number;
  interest: number;
  totalPayable: number;
  appliedRateAnnual: string;
  rbiBaseRate: string;
  error?: string;
};

type SamadhaanDoc = {
  invoiceNumber: string;
  filename?: string;
  documentText: string;
};

type CalendarEvent = {
  type: string;
  date: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  entityType: string;
  entityId: string;
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

export default function SellerCompliancePage() {
  const [complianceView, setComplianceView] = useState<"receivables" | "payables">("receivables");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [penaltyData, setPenaltyData] = useState<PenaltyData | null>(null);
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [samadhaanDoc, setSamadhaanDoc] = useState<SamadhaanDoc | null>(null);
  const [samadhaanLoading, setSamadhaanLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<ApiListResponse<Invoice>>("/api/invoices"),
      apiFetch<CalendarEnvelope>(`/api/compliance/calendar?month=${new Date().toISOString().slice(0, 7)}`),
    ])
      .then(([invoiceData, calendarData]) => {
        setInvoices(invoiceData.data || []);
        if (calendarData.success) {
          setCalendarItems(calendarData.data.items || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const getDeadline = (inv: Invoice) => {
    if (inv.msmedDeadline) return new Date(inv.msmedDeadline);
    const d = new Date(inv.issueDate);
    d.setDate(d.getDate() + Math.min(inv.paymentTermsDays || 45, 45));
    return d;
  };

  const unpaidStatuses = ["Pending Approval", "Approved", "Under Review", "Overdue", "Disputed"];
  const unpaid = invoices.filter((i) => unpaidStatuses.includes(i.status || ""));
  const overdue = unpaid.filter((i) => getDeadline(i) < now);
  const approaching = unpaid.filter((i) => {
    const dl = getDeadline(i);
    const daysLeft = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  });
  const compliant = unpaid.filter((i) => {
    const dl = getDeadline(i);
    const daysLeft = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 7;
  });

  const totalOverdueAmount = overdue.reduce((s, i) => s + i.totalAmount, 0);
  const isPayables = complianceView === "payables";
  const fmt = (n: number) => `INR ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const loadPenalty = async (invoiceId: string) => {
    setPenaltyLoading(true);
    setPenaltyData(null);
    try {
      const data = await apiFetch<PenaltyData>(`/api/compliance/penalty-calc/${invoiceId}`);
      setPenaltyData(data);
    } catch {
      setPenaltyData({
        principal: 0,
        interest: 0,
        totalPayable: 0,
        appliedRateAnnual: "",
        rbiBaseRate: "",
        error: "Failed to load penalty data",
      });
    }
    setPenaltyLoading(false);
  };

  const launchSamadhaan = async (invoiceId: string) => {
    setSamadhaanLoading(true);
    setSamadhaanDoc(null);
    try {
      const data = await apiFetch<SamadhaanDoc>("/api/compliance/samadhaan-draft", {
        method: "POST",
        body: JSON.stringify({ invoiceId }),
      });
      if (data.documentText) {
        setSamadhaanDoc(data);
        setShowModal(true);
      } else {
        alert("Could not generate document");
      }
    } catch {
      alert("Failed to generate Samadhaan document");
    }
    setSamadhaanLoading(false);
  };

  const copyToClipboard = () => {
    if (samadhaanDoc?.documentText) {
      navigator.clipboard.writeText(samadhaanDoc.documentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadDoc = () => {
    if (!samadhaanDoc) return;
    const blob = new Blob([samadhaanDoc.documentText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = samadhaanDoc.filename || "samadhaan_form1.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <Shield className="text-[#1b5b6a] w-8 h-8" />
              {isPayables ? "Payables Compliance Center" : "MSMED Compliance Center"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {isPayables
                ? "Track your supplier payment obligations and prevent payable-side compliance breaches."
                : "Track your payment rights under the MSMED Act, 2006. Calculate penalties and generate Samadhaan escalation documents."}
            </p>
          </div>
          <div className="flex items-center portal-toggle-shell">
            <button
              onClick={() => setComplianceView("receivables")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${!isPayables ? "bg-white text-[#0f1b2d] shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              Receivables
            </button>
            <button
              onClick={() => setComplianceView("payables")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${isPayables ? "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              Payables
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 portal-section-enter portal-section-enter-delay-1">
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm portal-kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-rose-600" size={18} />
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-widest">{isPayables ? "Overdue Payables" : "Overdue Invoices"}</h3>
          </div>
          <p className="text-4xl font-black text-rose-900">{overdue.length}</p>
          <p className="mt-2 text-sm font-semibold text-rose-700">{fmt(totalOverdueAmount)} {isPayables ? "to disburse" : "at risk"}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm portal-kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-amber-600" size={18} />
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest">{isPayables ? "Payments Due Soon" : "Approaching Deadline"}</h3>
          </div>
          <p className="text-4xl font-black text-amber-900">{approaching.length}</p>
          <p className="mt-2 text-sm font-semibold text-amber-700">{isPayables ? "Supplier dues in 7 days" : "Due within 7 days"}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm portal-kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-emerald-600" size={18} />
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{isPayables ? "Planned" : "Compliant"}</h3>
          </div>
          <p className="text-4xl font-black text-emerald-900">{compliant.length}</p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">{isPayables ? "Beyond 7-day window" : "Within payment limits"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden portal-section-enter portal-section-enter-delay-1">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <CalendarClock size={16} /> Compliance Calendar
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Statutory and invoice events</span>
        </div>
        <div className="sm:hidden p-4 space-y-3">
          {calendarItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-center text-sm text-slate-500">
              No compliance events found for the current month.
            </div>
          ) : (
            calendarItems.map((item, idx) => (
              <div key={`calendar-mobile-${item.entityType}-${item.entityId}-${idx}`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                <div className="flex justify-between items-start gap-3">
                  <p className="font-semibold text-slate-900">{new Date(item.date).toLocaleDateString("en-IN")}</p>
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
                <th className="sticky left-0 z-10 bg-slate-50 px-5 py-3 font-bold text-xs uppercase tracking-wider text-slate-600">Date</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-slate-600">Event</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-slate-600">Category</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-slate-600">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calendarItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-medium">No compliance events found for the current month.</td>
                </tr>
              )}
              {calendarItems.map((item, idx) => (
                <tr key={`${item.entityType}-${item.entityId}-${idx}`} className="hover:bg-slate-50/50">
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

      <div className="rounded-3xl bg-white overflow-hidden portal-surface-soft portal-section-enter portal-section-enter-delay-1">
        <div className="border-b border-rose-100 bg-rose-50/50 p-5">
          <h2 className="font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle size={16} /> {isPayables ? "Payable Compliance Risk Register" : "Overdue Invoices - Penalty Interest Accruing"}
          </h2>
          <p className="text-xs text-rose-700 mt-1">
            {isPayables
              ? "Act early on overdue supplier bills to avoid dispute escalation and reputation impact."
              : "Compound interest at 3x RBI Bank Rate with monthly rests (MSMED Act, Section 16)"}
          </p>
        </div>
        <div className="sm:hidden p-4 space-y-3">
          {overdue.length === 0 ? (
            <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-center text-sm text-slate-500">
              {isPayables
                ? "No overdue payables. Your supplier obligations are within limits."
                : "No overdue invoices. All payments are within MSMED limits."}
            </div>
          ) : (
            overdue.map((inv) => {
              const deadline = getDeadline(inv);
              const daysOver = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={`${inv._id}-mobile`} className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                      <p className="text-sm text-slate-600 mt-1">{inv.buyerName}</p>
                    </div>
                    <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-lg text-xs font-bold">
                      {daysOver} days
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Amount</span>
                    <span className="text-right font-bold text-slate-900">{fmt(inv.totalAmount)}</span>
                    <span className="text-slate-500">Deadline</span>
                    <span className="text-right font-semibold text-rose-600">{deadline.toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {isPayables ? (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                          onClick={() => alert("Payment scheduling workflow will be connected to treasury disbursement APIs.")}
                        >
                          Schedule Payment
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
                          onClick={() => alert("Supplier communication workflow will be connected to notification APIs.")}
                        >
                          Notify Supplier
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => loadPenalty(inv._id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
                        >
                          <Calculator size={12} /> Penalty
                        </button>
                        <button
                          onClick={() => launchSamadhaan(inv._id)}
                          disabled={samadhaanLoading}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <FileText size={12} /> Samadhaan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">{isPayables ? "Supplier" : "Buyer"}</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Deadline</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Days Over</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">
                    {isPayables
                      ? "No overdue payables. Your supplier obligations are within limits."
                      : "No overdue invoices. All payments are within MSMED limits."}
                  </td>
                </tr>
              )}
              {overdue.map((inv) => {
                const deadline = getDeadline(inv);
                const daysOver = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={inv._id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-5 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 text-slate-700">{inv.buyerName}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-5 py-4 text-rose-600 font-semibold">{deadline.toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-lg text-xs font-bold">
                        {daysOver} days
                      </span>
                    </td>
                    <td className="px-5 py-4 flex gap-2">
                      {isPayables ? (
                        <>
                          <button
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                            onClick={() => alert("Payment scheduling workflow will be connected to treasury disbursement APIs.")}
                          >
                            Schedule Payment
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
                            onClick={() => alert("Supplier communication workflow will be connected to notification APIs.")}
                          >
                            Notify Supplier
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => loadPenalty(inv._id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
                          >
                            <Calculator size={12} /> Penalty
                          </button>
                          <button
                            onClick={() => launchSamadhaan(inv._id)}
                            disabled={samadhaanLoading}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <FileText size={12} /> Samadhaan
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!isPayables && (penaltyLoading || penaltyData) && (
        <div className="rounded-3xl bg-white p-6 portal-surface-soft portal-section-enter portal-section-enter-delay-2">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Calculator size={18} /> Penalty Interest Calculation
          </h3>
          {penaltyLoading ? (
            <div className="flex items-center gap-3 text-slate-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
              Calculating...
            </div>
          ) : penaltyData?.error ? (
            <p className="text-rose-600 font-semibold">{penaltyData.error}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Principal</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{fmt(penaltyData?.principal || 0)}</p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Interest Accrued</p>
                <p className="mt-1 text-2xl font-black text-rose-900">{fmt(penaltyData?.interest || 0)}</p>
              </div>
              <div className="bg-[#e0f2f1]/50 rounded-2xl p-4 border border-[#cfe8e6]">
                <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Total Payable</p>
                <p className="mt-1 text-2xl font-black text-[#0f1b2d]">{fmt(penaltyData?.totalPayable || 0)}</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Rate Applied</p>
                <p className="mt-1 text-2xl font-black text-amber-900">{penaltyData?.appliedRateAnnual}</p>
                <p className="text-xs text-amber-700 font-medium">3x RBI Rate ({penaltyData?.rbiBaseRate})</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!isPayables && showModal && samadhaanDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} /> Samadhaan Form 1
                </h3>
                <p className="text-xs text-slate-500 mt-1">Auto-generated escalation document for {samadhaanDoc.invoiceNumber}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap text-sm font-mono text-slate-800 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                {samadhaanDoc.documentText}
              </pre>
            </div>
            <div className="border-t border-slate-200 p-4 flex gap-3 shrink-0">
              <button
                onClick={copyToClipboard}
                className="flex-1 rounded-xl bg-slate-900 text-white py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                onClick={downloadDoc}
                className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-800 py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Download size={14} /> Download .txt
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-[#cfe8e6] bg-[#e0f2f1]/40 p-6 shadow-sm portal-section-enter portal-section-enter-delay-2">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">{isPayables ? "Your Obligations Under MSMED Act, 2006" : "Your Rights Under MSMED Act, 2006"}</h3>
        <div className="grid gap-3 sm:grid-cols-2 text-xs text-[#0f1b2d]">
          <div className="bg-white rounded-xl p-4 border border-[#cfe8e6]">
            <p className="font-bold mb-1">No Written Agreement</p>
            <p>Payment must be made within <span className="font-black">15 days</span> of invoice receipt (Section 15).</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#cfe8e6]">
            <p className="font-bold mb-1">With Written Agreement</p>
            <p>Payment shall not exceed <span className="font-black">45 days</span> from invoice date (Section 15).</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#cfe8e6]">
            <p className="font-bold mb-1">Delayed Payment Interest</p>
            <p>Compound interest at <span className="font-black">3x RBI Bank Rate</span> with monthly rests (Section 16).</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#cfe8e6]">
            <p className="font-bold mb-1">Samadhaan Escalation</p>
            <p>File complaint with <span className="font-black">MSME Facilitation Council</span> via the Samadhaan portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

