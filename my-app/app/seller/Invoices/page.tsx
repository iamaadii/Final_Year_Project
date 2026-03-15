"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type LineItem = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

type MatchResult = {
  decision?: string;
  confidence_score?: number;
  variance_flags?: { field: string; po: number; invoice: number; variance_pct: number }[];
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  buyerName?: string;
  totalAmount: number;
  issueDate?: string;
  dueDate?: string;
  status?: string;
};

type InvoiceDetail = Invoice & {
  lineItems?: LineItem[];
  matchResult?: MatchResult;
  buyerAddress?: string;
};

export default function InvoicesPage() {
  const [activeView, setActiveView] = useState<"list" | "detail">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formData, setFormData] = useState({ buyerName: "", gstin: "", amount: "", dueDate: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    apiFetch<ApiListResponse<Invoice>>("/invoices")
      .then((data) => {
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const viewDetail = (id: string) => {
    setSelectedInvoice(id);
    setActiveView("detail");
    setDetailLoading(true);
    apiFetch<InvoiceDetail>(`/invoices/${id}`)
      .then((data) => {
        setInvoiceDetail(data);
        setDetailLoading(false);
      })
      .catch(() => {
        setInvoiceDetail(null);
        setDetailLoading(false);
      });
  };

  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.buyerName.trim()) errors.buyerName = "Required";

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      errors.gstin = "Invalid GSTIN format";
    }

    if (!/^\d+(\.\d{1,2})?$/.test(formData.amount) || Number(formData.amount) <= 0) {
      errors.amount = "Invalid amount format";
    }

    if (!formData.dueDate) errors.dueDate = "Required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSavingDraft(true);
    try {
      await apiFetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          buyerName: formData.buyerName.trim(),
          gstin: formData.gstin.trim().toUpperCase(),
          totalAmount: Number(formData.amount),
          dueDate: formData.dueDate,
        }),
      });
      const refreshed = await apiFetch<ApiListResponse<Invoice>>("/invoices");
      setInvoices(refreshed.data || []);
      setShowManualEntry(false);
      setFormData({ buyerName: "", gstin: "", amount: "", dueDate: "" });
      setFormErrors({});
    } catch {
      setFormErrors({ form: "Failed to create invoice draft" });
    } finally {
      setSavingDraft(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.buyerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All Statuses" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

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
              Invoice Registry
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingest, track, and manage all your B2B seller invoices.
            </p>
          </div>
        </div>
      </header>

      {activeView === "list" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-2">Create Draft</h3>
              <p className="text-xs text-slate-500 mb-4 h-8">Manually enter a line-item invoice into the registry.</p>
              <button onClick={() => setShowManualEntry(true)} className="w-full rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">+ Manual Entry</button>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-[#cfe8e6] bg-[#e0f2f1]/50 p-5 shadow-sm text-center cursor-pointer hover:bg-[#e0f2f1]/60 transition-colors">
              <h3 className="font-bold text-[#0f1b2d] mb-2">Smart PDF Upload (OCR)</h3>
              <p className="text-xs text-[#0f1b2d] mb-4 h-8">Drag &amp; drop invoice PDFs for auto-extraction.</p>
              <span className="inline-block text-xs font-bold text-[#1b5b6a] underline decoration-blue-300 underline-offset-4">Click to Browse Files</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-2">GSTN Sync</h3>
              <p className="text-xs text-slate-500 mb-4 h-8">Fetch directly from Govt Portal using your secure ERP link.</p>
              <button className="w-full rounded-xl bg-slate-800 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition-colors">Run Sync Agent</button>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-slate-800">Invoice Registry Table</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Invoice or Buyer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] max-w-[200px]"
                  />
                  <svg className="w-4 h-4 absolute left-3 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 outline-none text-slate-700 bg-white font-semibold shadow-sm focus:border-[#1b5b6a]"
                >
                  <option>All Statuses</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Submitted</option>
                  <option>Under Review</option>
                  <option>Paid</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border-b border-slate-200 pr-4">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="uppercase tracking-wider text-[11px] font-semibold text-slate-700">
                  <tr>
                    <th className="p-4 w-1/6">Invoice No</th>
                    <th className="p-4 w-1/4">Enterprise Buyer</th>
                    <th className="p-4 w-1/6">Value</th>
                    <th className="p-4 w-1/6">Due Date</th>
                    <th className="p-4 w-1/6">Status</th>
                    <th className="p-4 text-right w-1/12">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="overflow-y-auto max-h-[520px] custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-600">
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-800 w-1/6">{inv.invoiceNumber}</td>
                      <td className="p-4 font-medium text-slate-700 w-1/4">{inv.buyerName || "-"}</td>
                      <td className="p-4 font-semibold text-slate-900 w-1/6">{fmt(inv.totalAmount)}</td>
                      <td className="p-4 w-1/6">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "-"}</td>
                      <td className="p-4 w-1/6">
                        <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                          inv.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                          inv.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                          inv.status === "Paid" ? "bg-[#e0f2f1]/60 text-[#0f1b2d]" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status || "Draft"}
                        </span>
                      </td>
                      <td className="p-4 text-right w-1/12">
                        <button onClick={() => viewDetail(inv._id)} className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] transition-colors">Review</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">No invoices found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <button onClick={() => setActiveView("list")} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors">
              &larr; Back to Registry
            </button>
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-3">
                Invoice Document Details
                {selectedInvoice && (
                  <span className="rounded bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">{selectedInvoice}</span>
                )}
              </h2>
            </div>
            {detailLoading ? (
              <div className="p-6 text-slate-500">Loading invoice details...</div>
            ) : !invoiceDetail ? (
              <div className="p-6 text-slate-500">No invoice details found.</div>
            ) : (
              <>
                <div className="p-6 bg-slate-50/50 flex-1 grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Billed To</p>
                      <p className="font-bold text-slate-800">{invoiceDetail.buyerName || "-"}</p>
                      <p className="text-sm text-slate-600">{invoiceDetail.buyerAddress || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Terms</p>
                      <p className="text-sm font-medium text-slate-800">
                        Due: {invoiceDetail.dueDate ? new Date(invoiceDetail.dueDate).toLocaleDateString("en-IN") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Invoice Amount</p>
                      <p className="text-3xl font-black text-slate-900">{fmt(invoiceDetail.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
                      <span className="rounded bg-slate-100 text-slate-800 px-2 py-1 text-xs font-bold whitespace-nowrap">
                        {invoiceDetail.status || "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm">Line Items Extract</h3>
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-semibold">
                      <tr>
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Unit</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceDetail.lineItems && invoiceDetail.lineItems.length > 0 ? (
                        invoiceDetail.lineItems.map((item, idx) => (
                          <tr key={`${item.description || "item"}-${idx}`}>
                            <td className="py-3 font-medium text-slate-800">{item.description || "Item"}</td>
                            <td className="py-3">{item.quantity ?? "-"}</td>
                            <td className="py-3">{item.unitPrice ? fmt(item.unitPrice) : "-"}</td>
                            <td className="py-3 text-right font-bold text-slate-900">{item.total ? fmt(item.total) : "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">No line items available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="border-b border-slate-200 bg-slate-800 p-4 shrink-0 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Dispute Chat
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                No active disputes found on this invoice ledger.
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex gap-2">
                <input type="text" placeholder="Type message..." className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b5b6a]" />
                <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900 transition-colors">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl relative">
            <button
              onClick={() => setShowManualEntry(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Draft Invoice</h2>
            <p className="text-sm text-slate-500 mb-6">Manually enter your invoice details into the registry. Formats are strictly validated.</p>

            <form onSubmit={handleManualEntrySubmit} className="space-y-4 text-sm">
              {formErrors.form && <p className="text-rose-500 text-xs font-semibold">{formErrors.form}</p>}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Enterprise Buyer Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={e => setFormData(f => ({...f, buyerName: e.target.value}))}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 ${formErrors.buyerName ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  placeholder="Buyer legal name"
                />
                {formErrors.buyerName && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.buyerName}</p>}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Buyer GSTIN <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => setFormData(f => ({...f, gstin: e.target.value.toUpperCase()}))}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 font-mono uppercase ${formErrors.gstin ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  placeholder="29ABCDE1234F2Z5"
                />
                {formErrors.gstin && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.gstin}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Gross Amount (INR) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData(f => ({...f, amount: e.target.value}))}
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 font-mono ${formErrors.amount ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                    placeholder="0.00"
                  />
                  {formErrors.amount && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.amount}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Due Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData(f => ({...f, dueDate: e.target.value}))}
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 text-slate-700 ${formErrors.dueDate ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  />
                  {formErrors.dueDate && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.dueDate}</p>}
                </div>
              </div>
              <button type="submit" disabled={savingDraft} className="w-full rounded-xl bg-[#0f1b2d] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#142338] mt-6 transition-colors disabled:opacity-60">
                {savingDraft ? "Submitting..." : "Submit to Registry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
