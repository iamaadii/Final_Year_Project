"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";

type ExceptionRow = {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: string;
  reason: string;
  reasonClass: string;
  aging: string;
  agingHot: boolean;
  data: {
    poAmount: string;
    poQty: string;
    invAmount: string;
    invQty: string;
    grnMatch: string;
    aiScore: number;
    varianceMsg: string;
  };
};

export default function ApHubPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ invoices?: {
      _id: string;
      invoiceNumber: string;
      sellerName?: string;
      totalAmount?: number;
      dueDate?: string;
      matchResult?: { decision?: string; confidenceScore?: number; varianceFlags?: { field: string }[] };
    }[] }>("/invoices?status=Under%20Review")
      .then((data) => {
        const rows = (data.invoices || []).map((inv) => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber || inv._id,
          vendor: inv.sellerName || "Vendor",
          amount: `INR ${Number(inv.totalAmount || 0).toLocaleString("en-IN")}`,
          reason: inv.matchResult?.decision === "HARD_REJECT" ? "Hard Reject" : "Needs Review",
          reasonClass: inv.matchResult?.decision === "HARD_REJECT" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800",
          aging: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "--",
          agingHot: false,
          data: {
            poAmount: "--",
            poQty: "--",
            invAmount: `INR ${Number(inv.totalAmount || 0).toLocaleString("en-IN")}`,
            invQty: "--",
            grnMatch: "--",
            aiScore: Math.round(inv.matchResult?.confidenceScore || 0),
            varianceMsg: inv.matchResult?.varianceFlags?.length ? "Variance detected across invoice lines." : "Awaiting match signals.",
          },
        })) as ExceptionRow[];
        setExceptions(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActionMessage(null);
    setActionError(null);
  }, [selectedInvoice]);

  const activeException = exceptions.find((e) => e.id === selectedInvoice) || null;

  const removeException = (id: string) => {
    setExceptions((current) => current.filter((row) => row.id !== id));
    setSelectedInvoice((current) => (current === id ? null : current));
  };

  const handleApproveOverride = async () => {
    if (!activeException) return;
    setActionLoading(true);
    setActionMessage(null);
    setActionError(null);
    try {
      await apiFetch(`/invoices/${activeException.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Approved" }),
      });
      setActionMessage("Invoice approved and moved out of the exception queue.");
      removeException(activeException.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to approve invoice.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async (reasonLabel: string) => {
    if (!activeException) return;
    const reason = window.prompt("Enter dispute reason:", reasonLabel);
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    setActionMessage(null);
    setActionError(null);
    try {
      await apiFetch(`/invoices/${activeException.id}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setActionMessage("Dispute raised and sent to the seller.");
      removeException(activeException.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to raise dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              AP Processing Hub
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Exception queue, AI 3-way match verification, and dispute management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Filter: 43B(h) At Risk
            </button>
            <button className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142338] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Auto-Resolve Selected
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Exception Queue (Action Required)</h2>
              <p className="text-xs text-slate-500">Invoices that failed AI straight-through processing rules.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-slate-200 text-slate-700 px-3 py-1 font-semibold border border-slate-300">0 Exceptions</span>
            </div>
          </div>
          <div className="sm:hidden space-y-3 p-4">
            {exceptions.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-12 w-12" />}
                title="No invoices yet"
                description="Invite a vendor to start receiving invoices, or create a Purchase Order."
                primaryCTA={{ label: "Invite Vendor", href: "/buyer/vendors?action=invite" }}
                secondaryCTA={{ label: "Create PO", href: "/buyer/ap-hub?action=create-po" }}
              />
            ) : (
              exceptions.map((ex) => (
                <div key={`${ex.id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-[var(--brand-ink)]">{ex.invoiceNumber}</p>
                      <p className="text-sm text-[var(--brand-ocean)]">{ex.vendor}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${ex.reasonClass}`}>{ex.reason}</span>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-[var(--chart-muted-2)]">Due {ex.aging}</span>
                    <span className="font-semibold text-[var(--brand-ink)]">{ex.amount}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button className="text-xs font-semibold text-[#1b5b6a] hover:text-[#0f1b2d]" onClick={() => setSelectedInvoice(ex.id)}>
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[640px] w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="sticky left-0 z-10 bg-slate-50 p-4">Invoice / Vendor</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Exception Reason</th>
                  <th className="p-4">Aging Limit</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6">
                      <EmptyState
                        icon={<Inbox className="h-12 w-12" />}
                        title="No invoices yet"
                        description="Invite a vendor to start receiving invoices, or create a Purchase Order."
                        primaryCTA={{ label: "Invite Vendor", href: "/buyer/vendors?action=invite" }}
                        secondaryCTA={{ label: "Create PO", href: "/buyer/ap-hub?action=create-po" }}
                      />
                    </td>
                  </tr>
                ) : (
                  exceptions.map((ex) => (
                    <tr key={ex.id}
                      className={`transition cursor-pointer ${selectedInvoice === ex.id ? "bg-[#e0f2f1]/60" : "hover:bg-slate-50"} ${ex.agingHot && selectedInvoice !== ex.id ? "bg-rose-50/20" : ""}`}
                      onClick={() => setSelectedInvoice(ex.id)}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-slate-300" /></td>
                      <td className="sticky left-0 z-10 bg-[var(--brand-sand)] p-4">
                        <p className={`font-semibold ${selectedInvoice === ex.id ? "text-[#0f1b2d]" : "text-slate-800"}`}>{ex.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">{ex.vendor}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-900">{ex.amount}</td>
                      <td className="p-4"><span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${ex.reasonClass}`}>{ex.reason}</span></td>
                      <td className="p-4 flex items-center gap-2">
                        <span className={`font-bold ${ex.agingHot ? "text-rose-600" : (ex.reason === "Missing GRN" ? "text-amber-600" : "text-slate-600")}`}>{ex.aging}</span>
                        {ex.agingHot && <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-[#1b5b6a] hover:text-[#0f1b2d] font-bold text-xs" onClick={(e) => { e.stopPropagation(); setSelectedInvoice(ex.id); }}>Review &rarr;</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-3 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {exceptions.length} exceptions</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-200 bg-white rounded hover:bg-slate-100">&lt;</button>
              <button className="px-2 py-1 border border-slate-200 bg-white rounded hover:bg-slate-100">&gt;</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col relative animate-in slide-in-from-right-8 duration-300">
          <div className="border-b border-slate-800 bg-slate-900 p-4 shrink-0 flex justify-between items-center text-white">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                AI Match Inspector
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">No exception selected</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-[#cfe8e6]">--</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">FUZZY SCORE</span>
            </div>
          </div>

          <div className="p-0 flex-1 flex flex-col text-sm bg-slate-50">
            {!activeException ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-medium p-6 text-center">
                Select an exception from the queue to view PO, GRN, and invoice matching details.
              </div>
            ) : (
              <>
                <div className="p-4 bg-white border-b border-rose-100 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-widest">Supplier Invoice</span>
                    <span className="font-black text-rose-600">{activeException.data.invAmount}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono bg-slate-100 p-1.5 rounded inline-block">Line: {activeException.data.invQty}</p>
                </div>

                <div className="p-4 bg-white border-b border-emerald-100 relative shadow-sm z-10">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-widest">Procurement PO</span>
                    <span className="font-black text-emerald-600">{activeException.data.poAmount}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono bg-slate-100 p-1.5 rounded inline-block">Line: {activeException.data.poQty}</p>
                </div>

                <div className="p-4 bg-white border-b border-[#cfe8e6] relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1b5b6a]"></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-widest">Goods Receipt (GRN)</span>
                    <span className="font-black text-[#1b5b6a]">{activeException.data.grnMatch} Matches</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono bg-slate-100 p-1.5 rounded inline-block">ERP Physical Intake Sync</p>
                </div>

                <div className="p-5 flex flex-col gap-3 mt-auto bg-slate-100 border-t border-slate-200 border-dashed">
                  <div className="bg-white border text-xs border-slate-200 p-3 rounded-xl shadow-sm">
                    <strong className="text-slate-800">System Diagnosis:</strong>
                    <p className="text-slate-600 mt-1">{activeException.data.varianceMsg}</p>
                  </div>

                  {actionMessage ? (
                    <p className="text-xs font-semibold text-emerald-700">{actionMessage}</p>
                  ) : null}
                  {actionError ? (
                    <p className="text-xs font-semibold text-rose-600">{actionError}</p>
                  ) : null}

                  <div className="flex gap-2 w-full mt-2">
                    <button
                      onClick={handleApproveOverride}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-700 transition-all text-xs disabled:opacity-60"
                    >
                      {actionLoading ? "Processing..." : "Approve Override"}
                    </button>
                    <button
                      onClick={() => handleRaiseDispute("Invoice rejected during AP review")}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl border-2 border-slate-300 bg-white py-2.5 font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all text-xs disabled:opacity-60"
                    >
                      Reject / Return
                    </button>
                  </div>
                  <button
                    onClick={() => handleRaiseDispute("Initiate dispute collaboration")}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-slate-800 py-2.5 font-bold text-white shadow-sm hover:bg-slate-900 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                    Initiate Vendor Dispute Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
