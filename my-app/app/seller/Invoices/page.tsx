"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Trash2, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { EmptyState } from "@/components/EmptyState";
import { AIInsightsData } from "@/components/AIInsightsData";
import { InvoicePDF } from "@/components/InvoicePDF";
import { Portal } from "@/components/Portal";

type LineItem = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

type MatchResult = {
  decision?: string;
  confidenceScore?: number;
  varianceFlags?: { field: string; po: number; invoice: number; variancePct: number }[];
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  buyerName?: string;
  ledgerType?: "receivable" | "payable";
  totalAmount: number;
  taxAmount?: number;
  subtotalAmount?: number;
  amountPaid?: number;
  issueDate?: string;
  dueDate?: string;
  status?: string;
  financingStatus?: string;
  isFinanced?: boolean;
  ocrNeedsReview?: boolean;
  sellerId?: string;
  buyerId?: string;
};

type InvoiceDetail = Invoice & {
  lineItems?: LineItem[];
  matchResult?: MatchResult;
  buyerAddress?: string;
  sellerName?: string;
  sellerGstin?: string;
  buyerGstin?: string;
  ocrConfidence?: number | null;
  ocrNeedsReview?: boolean;
  ocrLowConfidenceFields?: string[];
};

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [moduleMode, setModuleMode] = useState<"receivables" | "expenses" | "review">("receivables");
  const [activeView, setActiveView] = useState<"list" | "detail">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);
  const [connectedBuyers, setConnectedBuyers] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formData, setFormData] = useState({ 
    invoiceNumber: "", 
    buyerName: "", 
    gstin: "", 
    amount: "", 
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] 
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInvoicesFromPayload = (payload: { invoices?: Invoice[] } | null) => payload?.invoices || [];

  const refreshInvoices = async () => {
    const payload = await apiFetch<{ invoices?: Invoice[] }>("/api/invoices");
    setInvoices(getInvoicesFromPayload(payload));
  };

  useEffect(() => {
    apiFetch<{ invoices?: Invoice[] }>("/api/invoices")
      .then((data) => {
        setInvoices(getInvoicesFromPayload(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch user profile for RBAC
    apiFetch<{ user: { role: string } }>("/api/users/me")
      .then(res => setUserProfile(res.user))
      .catch(() => {});

    // Fetch connected buyers for manual entry
    apiFetch<{ buyers: any[] }>("/api/buyers")
      .then(res => setConnectedBuyers(res.buyers || []))
      .catch(() => {});

    // Handle buyerId from Ledger view
    const bId = new URLSearchParams(window.location.search).get("buyerId");
    if (bId) {
      setSelectedBuyerId(bId);
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to archive this invoice for audit purposes?")) return;
    try {
      await apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
      refreshInvoices();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiFetch(`/api/invoices/${id}`, { 
        method: "PATCH", 
        body: JSON.stringify({ isDeleted: false }) 
      });
      refreshInvoices();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Restore failed");
    }
  };

  const viewDetail = useCallback((id: string) => {
    setSelectedInvoice(id);
    setActiveView("detail");
    setDetailLoading(true);
    if (id !== selectedInvoice) {
      setDisputeMessage(null);
      setDisputeError(null);
    }
    apiFetch<{ invoice: InvoiceDetail }>(`/api/invoices/${id}`)
      .then((data) => {
        setInvoiceDetail(data?.invoice || null);
        setDetailLoading(false);
      })
      .catch(() => {
        setInvoiceDetail(null);
        setDetailLoading(false);
      });
  }, [selectedInvoice]);

  useEffect(() => {
    const invoiceId = searchParams.get("id");
    if (!invoiceId || invoiceId === selectedInvoice) return;
    viewDetail(invoiceId);
  }, [searchParams, selectedInvoice, viewDetail]);

  useEffect(() => {
    if (searchParams.get("action") !== "upload") return;
    fileInputRef.current?.click();
  }, [searchParams]);

  const handleOcrUpload = async (file?: File | null) => {
    if (!file) return;

    setOcrError(null);
    setOcrMessage(null);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setOcrError("Please upload a PDF invoice file.");
      return;
    }

    setOcrUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await apiFetch<{ message?: string; invoiceId?: string }>("/api/invoices/ocr", {
        method: "POST",
        body: form,
      });
      setOcrMessage(result.message || "Invoice extracted. Review the draft before submitting.");
      await refreshInvoices();
      if (result.invoiceId) {
        setModuleMode("review");
        viewDetail(result.invoiceId);
      }
    } catch (error) {
      setOcrError(error instanceof Error ? error.message : "OCR upload failed.");
    } finally {
      setOcrUploading(false);
    }
  };

  const handleOcrFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      handleOcrUpload(file);
      event.target.value = "";
    }
  };

  const handleOcrDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    handleOcrUpload(file);
  };

  const handleSubmitForApproval = async () => {
    if (!invoiceDetail) return;
    setReviewSubmitting(true);
    try {
      await apiFetch(`/api/invoices/${invoiceDetail._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Pending Approval" }),
      });
      await refreshInvoices();
      viewDetail(invoiceDetail._id);
    } catch (error) {
      setOcrError(error instanceof Error ? error.message : "Failed to submit for approval.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!invoiceDetail) return;
    const reason = window.prompt("Enter dispute reason for this invoice:");
    if (!reason || !reason.trim()) return;

    setDisputeSubmitting(true);
    setDisputeMessage(null);
    setDisputeError(null);
    try {
      await apiFetch(`/api/invoices/${invoiceDetail._id}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setDisputeMessage("Dispute raised and shared with the buyer.");
      await refreshInvoices();
      viewDetail(invoiceDetail._id);
    } catch (error) {
      setDisputeError(error instanceof Error ? error.message : "Failed to raise dispute.");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.buyerName.trim()) errors.buyerName = "Required";
    if (!formData.invoiceNumber.trim()) errors.invoiceNumber = "Required";

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      errors.gstin = "Invalid GSTIN format";
    }

    if (!/^\d+(\.\d{1,2})?$/.test(formData.amount) || Number(formData.amount) <= 0) {
      errors.amount = "Invalid amount format";
    }

    if (!formData.issueDate) errors.issueDate = "Required";
    if (!formData.dueDate) errors.dueDate = "Required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSavingDraft(true);
    try {
      await apiFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          invoiceNumber: formData.invoiceNumber.trim(),
          buyerName: formData.buyerName.trim(),
          gstin: formData.gstin.trim().toUpperCase(),
          totalAmount: Number(formData.amount),
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          deliveryDate: formData.issueDate,
          ledgerType: moduleMode === "expenses" ? "payable" : "receivable",
        }),
      });
      const refreshed = await apiFetch<{ invoices?: Invoice[] }>("/api/invoices");
      setInvoices(getInvoicesFromPayload(refreshed));
      setShowManualEntry(false);
      setFormData({ 
        invoiceNumber: "", 
        buyerName: "", 
        gstin: "", 
        amount: "", 
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] 
      });
      setFormErrors({});
    } catch (error) {
      setFormErrors({ form: error instanceof Error ? error.message : "Failed to create invoice draft" });
    } finally {
      setSavingDraft(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const isExpense = inv.ledgerType === "payable";
    const needsReview = Boolean(inv.ocrNeedsReview)
      || inv.status?.toLowerCase() === "draft"
      || inv.status?.toLowerCase() === "review";
    
    let modeMatch = false;
    if (moduleMode === "review") modeMatch = needsReview;
    else if (moduleMode === "expenses") modeMatch = isExpense && !needsReview;
    else modeMatch = !isExpense && !needsReview;

    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.buyerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "All Statuses"
      || (filterStatus === "Paid" ? ["Paid", "paid"].includes(inv.status || "") : inv.status === filterStatus);
    const matchesBuyer = !selectedBuyerId || inv.buyerId === selectedBuyerId;
    return modeMatch && matchesSearch && matchesStatus && matchesBuyer;
  });

  const reviewQueueCount = invoices.filter((inv) => Boolean(inv.ocrNeedsReview)
    || inv.status?.toLowerCase() === "draft"
    || inv.status?.toLowerCase() === "review").length;

  const totalModeValue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const overdueModeValue = filteredInvoices
    .filter((inv) => inv.dueDate && new Date(inv.dueDate) < new Date() && !["Paid", "paid", "Settled"].includes(inv.status || ""))
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const uniqueCounterparties = new Set(filteredInvoices.map((inv) => inv.buyerName || "Unknown")).size;

  const ocrConfidencePct = invoiceDetail?.ocrConfidence !== null && invoiceDetail?.ocrConfidence !== undefined
    ? Math.round(Number(invoiceDetail.ocrConfidence) * 100)
    : null;
  const showOcrReview = moduleMode === "review" || Boolean(invoiceDetail?.ocrNeedsReview);
  const lowConfidenceFields = invoiceDetail?.ocrLowConfidenceFields || [];
  const canRaiseDispute = Boolean(invoiceDetail)
    && !["Paid", "Settled", "paid", "Disputed"].includes(invoiceDetail?.status || "");

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;
  
  const safeFmtDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 portal-page portal-module-transition">
      <header className="rounded-2xl p-6 portal-surface portal-section-enter">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Dual Ledger Registry
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Toggle between receivables and expenses to track who owes you and who you owe.
            </p>
          </div>
          <div className="flex items-center portal-toggle-shell">
            <button
              onClick={() => setModuleMode("receivables")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${moduleMode === "receivables" ? "bg-white text-[#0f1b2d] shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              Receivables
            </button>
            <button
              onClick={() => setModuleMode("expenses")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${moduleMode === "expenses" ? "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              Expenses / Payables
            </button>
            <button
              onClick={() => setModuleMode("review")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${moduleMode === "review" ? "bg-white text-amber-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              OCR Review Queue
              {reviewQueueCount > 0 && (
                <span className="bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full text-xs">{reviewQueueCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {activeView === "list" ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-3 portal-section-enter portal-section-enter-delay-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm portal-kpi-card">
              <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">
                {moduleMode === "expenses" ? "Total Payables" : "Total Receivables"}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">{fmt(totalModeValue)}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm portal-kpi-card">
              <p className="text-[11px] uppercase tracking-widest font-bold text-rose-700">Overdue Value</p>
              <p className="mt-2 text-2xl font-black text-rose-800">{fmt(overdueModeValue)}</p>
            </div>
            <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 p-4 shadow-sm portal-kpi-card">
              <p className="text-[11px] uppercase tracking-widest font-bold text-[#1b5b6a]">
                {moduleMode === "expenses" ? "Creditors" : "Buyers"}
              </p>
              <p className="mt-2 text-2xl font-black text-[#0f1b2d]">{uniqueCounterparties}</p>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-2">Create Draft</h3>
              <p className="text-xs text-slate-500 mb-4 h-8">
                {moduleMode === "expenses"
                  ? "Capture payable entries and track what you owe to vendors."
                  : "Manually enter a line-item invoice into the registry."}
              </p>
              <button onClick={() => setShowManualEntry(true)} className="w-full rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">+ Manual Entry</button>
            </div>
            <div
              className="rounded-2xl border-2 border-dashed border-[#cfe8e6] bg-[#e0f2f1]/50 p-5 shadow-sm text-center cursor-pointer hover:bg-[#e0f2f1]/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleOcrDrop}
              onDragOver={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
            >
              <h3 className="font-bold text-[#0f1b2d] mb-2">Smart PDF Upload (OCR)</h3>
              <p className="text-xs text-[#0f1b2d] mb-4 h-8">Drag &amp; drop invoice PDFs for auto-extraction.</p>
              <span className="inline-block text-xs font-bold text-[#1b5b6a] underline decoration-blue-300 underline-offset-4">
                {ocrUploading ? "Extracting..." : "Click to Browse Files"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleOcrFileChange}
                className="hidden"
                disabled={ocrUploading}
              />
              {ocrMessage && <p className="mt-3 text-xs font-semibold text-emerald-700">{ocrMessage}</p>}
              {ocrError && <p className="mt-3 text-xs font-semibold text-rose-600">{ocrError}</p>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-2">GSTN Sync</h3>
              <p className="text-xs text-slate-500 mb-4 h-8">Fetch directly from Govt Portal using your secure ERP link.</p>
              <button className="w-full rounded-xl bg-slate-800 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition-colors">Run Sync Agent</button>
            </div>
          </div>

          <section className="rounded-2xl bg-white overflow-hidden flex flex-col portal-surface-soft portal-section-enter portal-section-enter-delay-2">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-slate-800">Invoice Registry Table</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={moduleMode === "expenses" ? "Search Invoice or Creditor..." : "Search Invoice or Buyer..."}
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
                  <option>Partially Settled</option>
                  <option>Paid</option>
                </select>
              </div>
            </div>

            <div className="sm:hidden p-4 space-y-3">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                <div key={`${inv._id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{inv.buyerName || "-"}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                      inv.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                      inv.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                        inv.status === "Partially Settled" ? "bg-sky-100 text-sky-800" :
                      ["Paid", "paid"].includes(inv.status || "") ? "bg-[#e0f2f1]/60 text-[#0f1b2d]" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {inv.status || "Draft"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">{moduleMode === "expenses" ? "Payable" : "Receivable"}</span>
                    <span className="text-right font-semibold text-slate-900">{fmt(inv.totalAmount)}</span>
                    <span className="text-slate-500">Due Date</span>
                    <span className="text-right text-slate-700">{safeFmtDate(inv.dueDate)}</span>
                  </div>
                  {inv.status === "Partially Settled" && Number(inv.amountPaid || 0) > 0 ? (
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Paid: {fmt(Number(inv.amountPaid || 0))}
                    </p>
                  ) : null}
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => viewDetail(inv._id)} className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] transition-colors">
                      {moduleMode === "review" ? "Fix Extraction" : "Review"}
                    </button>
                  </div>
                </div>
              )) : (
                <EmptyState
                  icon={<FileText className="h-12 w-12" />}
                  title="No invoices yet"
                  description="Upload an invoice PDF for AI extraction, or create one manually."
                  primaryCTA={{ label: "Upload Invoice", onClick: () => fileInputRef.current?.click() }}
                  secondaryCTA={{ label: "Create Manually", onClick: () => setShowManualEntry(true) }}
                />
              )}
            </div>

            <div className="hidden sm:block bg-slate-50 border-b border-slate-200 pr-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="min-w-[720px] w-full text-left text-sm text-slate-600">
                <thead className="uppercase tracking-wider text-[11px] font-semibold text-slate-700">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 p-4 w-1/6">Invoice No</th>
                    <th className="p-4 w-1/4">{moduleMode === "expenses" ? "You Owe To" : "Enterprise Buyer"}</th>
                    <th className="p-4 w-1/6">{moduleMode === "expenses" ? "Payable" : "Receivable"}</th>
                    <th className="p-4 w-1/6">Due Date</th>
                    <th className="p-4 w-1/6">Status</th>
                    <th className="p-4 w-1/6">Finance</th>
                    <th className="p-4 text-right w-1/12">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="hidden sm:block overflow-y-auto max-h-[520px] custom-scrollbar overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="min-w-[720px] w-full text-left text-sm text-slate-600">
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition">
                      <td className="sticky left-0 z-10 bg-white p-4 font-bold text-slate-800 w-1/6">{inv.invoiceNumber}</td>
                      <td className="p-4 font-medium text-slate-700 w-1/4">{inv.buyerName || "-"}</td>
                        <td className="p-4 font-semibold text-slate-900 w-1/6">
                          <p>{fmt(inv.totalAmount)}</p>
                          {inv.status === "Partially Settled" && Number(inv.amountPaid || 0) > 0 ? (
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                              Paid: {fmt(Number(inv.amountPaid || 0))}
                            </p>
                          ) : null}
                        </td>
                      <td className="p-4 w-1/6">{safeFmtDate(inv.dueDate)}</td>
                      <td className="p-4 w-1/6">
                        <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                          inv.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                          inv.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                            inv.status === "Partially Settled" ? "bg-sky-100 text-sky-800" :
                          ["Paid", "paid"].includes(inv.status || "") ? "bg-[#e0f2f1]/60 text-[#0f1b2d]" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status || "Draft"}
                        </span>
                      </td>
                      <td className="p-4 w-1/6 text-xs font-bold">
                        {inv.financingStatus && inv.financingStatus !== "Not Requested" ? (
                          <span className={`px-2 py-1 rounded-full border ${
                            inv.financingStatus === "Funded" ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-slate-300 text-slate-500 bg-slate-50"
                          }`}>
                            {inv.financingStatus}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right w-1/12 space-x-3 flex items-center justify-end">
                        <button onClick={() => viewDetail(inv._id)} className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] transition-colors">
                          {moduleMode === "review" ? "Fix Extraction" : "Review"}
                        </button>
                        {["super_admin", "company_admin"].includes(userProfile?.role || "") && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(inv._id); }} 
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                            title="Archive Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-6">
                        <EmptyState
                          icon={<FileText className="h-12 w-12" />}
                          title="No invoices yet"
                          description="Upload an invoice PDF for AI extraction, or create one manually."
                          primaryCTA={{ label: "Upload Invoice", onClick: () => fileInputRef.current?.click() }}
                          secondaryCTA={{ label: "Create Manually", onClick: () => setShowManualEntry(true) }}
                        />
                      </td>
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
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{moduleMode === "expenses" ? "Creditor" : "Billed To"}</p>
                      <p className="font-bold text-slate-800">{invoiceDetail.buyerName || "-"}</p>
                      <p className="text-sm text-slate-600">{invoiceDetail.buyerAddress || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Terms</p>
                      <p className="text-sm font-medium text-slate-800">
                        Due: {safeFmtDate(invoiceDetail.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{moduleMode === "expenses" ? "Amount Owed" : "Invoice Amount"}</p>
                      <p className="text-3xl font-black text-slate-900">{fmt(invoiceDetail.totalAmount)}</p>
                      {invoiceDetail.status === "Partially Settled" && Number(invoiceDetail.amountPaid || 0) > 0 ? (
                        <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                          <p>Paid: <span className="font-semibold text-emerald-700">{fmt(Number(invoiceDetail.amountPaid || 0))}</span></p>
                          <p>Remaining: <span className="font-semibold text-amber-700">{fmt(Math.max(0, Number(invoiceDetail.totalAmount || 0) - Number(invoiceDetail.amountPaid || 0)))}</span></p>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
                      <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                        invoiceDetail.status === "Partially Settled"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {invoiceDetail.status || "Draft"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {disputeMessage ? (
                        <p className="text-xs font-semibold text-emerald-700">{disputeMessage}</p>
                      ) : null}
                      {disputeError ? (
                        <p className="text-xs font-semibold text-rose-600">{disputeError}</p>
                      ) : null}
                      <button
                        onClick={handleRaiseDispute}
                        disabled={!canRaiseDispute || disputeSubmitting}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60"
                      >
                        {disputeSubmitting ? "Raising Dispute..." : "Raise Dispute"}
                      </button>
                    </div>
                  </div>
                </div>
                {showOcrReview && (
                  <div className="p-6 border-t border-slate-200 bg-amber-50/40">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">OCR Review</p>
                        <p className="text-sm text-slate-700">
                          {ocrConfidencePct !== null
                            ? `Extraction confidence: ${ocrConfidencePct}%`
                            : "Extraction confidence pending"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPdfPreview((prev) => !prev)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {showPdfPreview ? "Hide PDF Preview" : "Show PDF Preview"}
                        </button>
                        <button
                          onClick={handleSubmitForApproval}
                          disabled={reviewSubmitting}
                          className="rounded-lg bg-[#0f1b2d] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60"
                        >
                          {reviewSubmitting ? "Submitting..." : "Send for Approval"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 h-2 w-full rounded-full bg-amber-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${ocrConfidencePct ?? 0}%` }}
                      />
                    </div>
                    {lowConfidenceFields.length > 0 && (
                      <p className="mt-3 text-xs font-semibold text-amber-700">
                        Low-confidence fields: {lowConfidenceFields.join(", ")}
                      </p>
                    )}
                  </div>
                )}

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
                {showPdfPreview && (
                  <div className="p-6 border-t border-slate-200 bg-white">
                    <InvoicePDF invoice={invoiceDetail} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-1 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px] gap-6">
            <AIInsightsData 
              invoiceId={selectedInvoice} 
              matchResult={invoiceDetail?.matchResult} 
              onSuggestGL={() => {}} 
            />
          </div>
        </div>
      )}

      {showManualEntry && (
        <Portal>
          <div 
            className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-500"
            onClick={(e) => e.target === e.currentTarget && setShowManualEntry(false)}
          >
            <div className="w-full max-w-lg rounded-[2.5rem] bg-white p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-200 relative mt-12 animate-in zoom-in-95 slide-in-from-top-12 duration-500">
            <button
              onClick={() => setShowManualEntry(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{moduleMode === "expenses" ? "Create Draft Expense" : "Create Draft Invoice"}</h2>
            <p className="text-sm text-slate-500 mb-6">Manually enter your {moduleMode === "expenses" ? "payable" : "invoice"} details into the registry. Formats are strictly validated.</p>

            <form onSubmit={handleManualEntrySubmit} className="space-y-4 text-sm">
              {formErrors.form && <p className="text-rose-500 text-xs font-semibold">{formErrors.form}</p>}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Business Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={formData.buyerName}
                    onChange={e => {
                      const selected = connectedBuyers.find(b => (b.companyName || b.name) === e.target.value);
                      setFormData(f => ({
                        ...f, 
                        buyerName: e.target.value,
                        gstin: selected?.gstNumber || f.gstin
                      }));
                    }}
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 appearance-none bg-white ${formErrors.buyerName ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  >
                    <option value="">Select a connected business</option>
                    {connectedBuyers.map((b, i) => (
                      <option key={i} value={b.companyName || b.name}>{b.companyName || b.name} ({b.gstNumber || "No GSTIN"})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
                {connectedBuyers.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-semibold italic">No connected buyers found. Please invite them in the Counterparties tab first.</p>
                )}
                {formErrors.buyerName && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.buyerName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Invoice Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={e => setFormData(f => ({...f, invoiceNumber: e.target.value}))}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 ${formErrors.invoiceNumber ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  placeholder="e.g. INV-2024-001"
                />
                {formErrors.invoiceNumber && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.invoiceNumber}</p>}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Business GSTIN <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => setFormData(f => ({...f, gstin: e.target.value.toUpperCase()}))}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 font-mono uppercase ${formErrors.gstin ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  placeholder="29ABCDE1234F2Z5"
                />
                {formErrors.gstin && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.gstin}</p>}
              </div>
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

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Issue Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={e => {
                      const newIssue = e.target.value;
                      if (!newIssue) {
                        setFormData(f => ({ ...f, issueDate: "" }));
                        return;
                      }
                      const issueDateObj = new Date(newIssue);
                      if (isNaN(issueDateObj.getTime())) {
                        setFormData(f => ({ ...f, issueDate: newIssue }));
                        return;
                      }
                      setFormData(f => ({
                        ...f, 
                        issueDate: newIssue,
                        dueDate: new Date(issueDateObj.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                      }));
                    }}
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 text-slate-700 ${formErrors.issueDate ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-[#1b5b6a] focus:ring-[#1b5b6a]"}`}
                  />
                  {formErrors.issueDate && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.issueDate}</p>}
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
                {savingDraft ? "Submitting..." : moduleMode === "expenses" ? "Submit Expense to Registry" : "Submit to Registry"}
              </button>
            </form>
          </div>
        </div>
      </Portal>
    )}
    </div>
  );
}
