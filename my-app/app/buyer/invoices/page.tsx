"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarCheck2, FileText, ShieldCheck, ArrowUpRight, UploadCloud, X } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";
import { InvoicePDF } from "@/components/InvoicePDF";

type LineItem = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

type Invoice = {
  _id: string;
  invoiceNumber?: string;
  sellerName?: string;
  totalAmount?: number;
  amountPaid?: number;
  issueDate?: string;
  dueDate?: string;
  status?: string;
};

type InvoiceDetail = Invoice & {
  buyerName?: string;
  buyerAddress?: string;
  sellerEmail?: string;
  buyerEmail?: string;
  lineItems?: LineItem[];
  taxAmount?: number;
  subtotalAmount?: number;
};

type SellerOption = {
  _id: string;
  name?: string;
  email?: string;
  reliabilityScore?: number;
};

const paidStatuses = ["Paid", "Settled", "paid"];

export default function BuyerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [sellerQuery, setSellerQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "dispute" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshInvoices = async () => {
    const data = await apiFetch<{ invoices?: Invoice[] }>("/invoices");
    setInvoices(data.invoices || []);
  };

  useEffect(() => {
    refreshInvoices()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<{ sellers?: SellerOption[] }>("/sellers")
      .then((data) => setSellers(data.sellers || []))
      .catch(() => setSellers([]));
  }, []);

  const viewDetail = (id: string) => {
    setSelectedInvoice(id);
    setDetailLoading(true);
    setActionMessage(null);
    setActionError(null);
    apiFetch<{ invoice: InvoiceDetail }>(`/invoices/${id}`)
      .then((data) => {
        setInvoiceDetail(data.invoice || null);
        setDetailLoading(false);
      })
      .catch(() => {
        setInvoiceDetail(null);
        setDetailLoading(false);
      });
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadMessage(null);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF invoice file.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (selectedSellerId) form.append("sellerId", selectedSellerId);
      const result = await apiFetch<{ message?: string; invoiceId?: string; sellerId?: string }>("/invoices/ocr", {
        method: "POST",
        body: form,
      });
      setUploadMessage(result.message || "Invoice uploaded successfully.");
      if (result.sellerId && !selectedSellerId) {
        setSelectedSellerId(result.sellerId);
      }
      await refreshInvoices();
      if (result.invoiceId) {
        viewDetail(result.invoiceId);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      handleUpload(file);
      event.target.value = "";
    }
  };

  const handleApproveInvoice = async () => {
    if (!selectedInvoice) return;
    setActionLoading(true);
    setActionMessage(null);
    setActionError(null);
    try {
      await apiFetch(`/invoices/${selectedInvoice}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Approved" }),
      });
      setActionMessage("Invoice approved.");
      await refreshInvoices();
      viewDetail(selectedInvoice);
      setConfirmOpen(false);
      setConfirmAction(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to approve invoice.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!selectedInvoice) return;
    if (!disputeReason.trim()) {
      setActionError("Dispute reason is required.");
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    setActionError(null);
    try {
      await apiFetch(`/invoices/${selectedInvoice}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason: disputeReason.trim() }),
      });
      setActionMessage("Dispute raised and sent to the supplier.");
      await refreshInvoices();
      viewDetail(selectedInvoice);
      setConfirmOpen(false);
      setConfirmAction(null);
      setDisputeReason("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to raise dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = useMemo(() => {
    const unique = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.status) unique.add(inv.status);
    });
    return ["All Statuses", ...Array.from(unique)];
  }, [invoices]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase())
      || (inv.sellerName || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "All Statuses") return true;
    if (statusFilter === "Paid") return paidStatuses.includes(inv.status || "");
    return inv.status === statusFilter;
  });

  const metrics = useMemo(() => {
    const outstanding = invoices.filter((inv) => !paidStatuses.includes(inv.status || ""));
    const outstandingValue = outstanding.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const disputedCount = invoices.filter((inv) => inv.status === "Disputed").length;
    const dueSoonCount = outstanding.filter((inv) => {
      if (!inv.dueDate) return false;
      const due = new Date(inv.dueDate).getTime();
      const days = Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;

    return {
      outstandingCount: outstanding.length,
      outstandingValue,
      disputedCount,
      dueSoonCount,
    };
  }, [invoices]);

  const fmt = (value: number) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

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
              <FileText className="text-[#1b5b6a] w-8 h-8" />
              Buyer Invoice Registry
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Track supplier invoices, payment status, and dispute readiness in one view.
            </p>
            {uploadMessage ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">{uploadMessage}</p>
            ) : null}
            {uploadError ? (
              <p className="mt-2 text-xs font-semibold text-rose-600">{uploadError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={sellerQuery}
              onChange={(e) => setSellerQuery(e.target.value)}
              placeholder="Search supplier"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
            />
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select supplier</option>
              {sellers
                .filter((seller) => {
                  const query = sellerQuery.trim().toLowerCase();
                  if (!query) return true;
                  return (seller.name || "").toLowerCase().includes(query)
                    || (seller.email || "").toLowerCase().includes(query);
                })
                .map((seller) => (
                <option key={seller._id} value={seller._id}>
                  {seller.name || seller.email || "Supplier"}
                  {typeof seller.reliabilityScore === "number" ? ` (Score ${seller.reliabilityScore})` : ""}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-xl bg-[#0f1b2d] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#142338] transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <UploadCloud size={16} /> {uploading ? "Uploading..." : "Upload Invoice"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 portal-section-enter portal-section-enter-delay-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Outstanding Invoices</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{metrics.outstandingCount}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Value: {fmt(metrics.outstandingValue)}</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-widest font-bold text-amber-700">Due Soon (7 Days)</p>
          <p className="mt-2 text-3xl font-black text-amber-800">{metrics.dueSoonCount}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Follow up with vendors</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-widest font-bold text-rose-700">Disputes Raised</p>
          <p className="mt-2 text-3xl font-black text-rose-800">{metrics.disputedCount}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Under review</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-700">Compliant Queue</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{Math.max(0, metrics.outstandingCount - metrics.disputedCount)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">On-track invoices</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 portal-surface-soft portal-section-enter portal-section-enter-delay-2">
        <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
          <div>
            <h2 className="font-bold text-slate-800">Invoice Tracker</h2>
            <p className="text-xs text-slate-500">Search, filter, and review invoice status.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice or vendor"
              className="w-full sm:w-64 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#1b5b6a]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white overflow-hidden portal-surface-soft portal-section-enter portal-section-enter-delay-2">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Invoices ({filteredInvoices.length})</h3>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck size={14} /> Updated moments ago
          </div>
        </div>
        <div className="sm:hidden p-4 space-y-3">
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No invoices yet"
              description="Once suppliers submit invoices, they will appear here for review."
              primaryCTA={{ label: "Go to AP Hub", href: "/buyer/ap-hub" }}
            />
          ) : (
            filteredInvoices.map((inv) => (
              <div key={`${inv._id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{inv.invoiceNumber || inv._id}</p>
                    <p className="text-xs text-slate-500">{inv.sellerName || "Supplier"}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {inv.status || "Pending"}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "--"}</span>
                  <span className="font-semibold text-slate-900">{fmt(Number(inv.totalAmount || 0))}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => viewDetail(inv._id)}
                    className="text-xs font-semibold text-slate-700 hover:text-[#0f1b2d] mr-3"
                  >
                    Review
                  </button>
                  <a
                    href={`/api/invoices/${inv._id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] inline-flex items-center gap-1"
                  >
                    View PDF <ArrowUpRight size={12} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4">Invoice</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <EmptyState
                      icon={<FileText className="h-12 w-12" />}
                      title="No invoices yet"
                      description="Once suppliers submit invoices, they will appear here for review."
                      primaryCTA={{ label: "Go to AP Hub", href: "/buyer/ap-hub" }}
                    />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-900">{inv.invoiceNumber || inv._id}</td>
                    <td className="p-4">{inv.sellerName || "Supplier"}</td>
                    <td className="p-4">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-IN") : "--"}</td>
                    <td className="p-4">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "--"}</td>
                    <td className="p-4 font-semibold text-slate-900">{fmt(Number(inv.totalAmount || 0))}</td>
                    <td className="p-4">
                      <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                        inv.status === "Disputed"
                          ? "bg-rose-100 text-rose-800"
                          : paidStatuses.includes(inv.status || "")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                      }`}>
                        {inv.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => viewDetail(inv._id)}
                        className="text-sm font-semibold text-slate-700 hover:text-[#0f1b2d] mr-4"
                      >
                        Review
                      </button>
                      <a
                        href={`/api/invoices/${inv._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] inline-flex items-center gap-1"
                      >
                        View PDF <ArrowUpRight size={12} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && invoices.length > 0 ? (
          <div className="border-t border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 flex items-center gap-2">
            <AlertTriangle size={14} /> No invoices match the current filters.
          </div>
        ) : null}
      </div>

      {selectedInvoice ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm portal-section-enter">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice Detail</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {invoiceDetail?.invoiceNumber || selectedInvoice}
              </h2>
              <p className="text-sm text-slate-500">{invoiceDetail?.sellerName || "Supplier"}</p>
            </div>
            <button
              onClick={() => {
                setSelectedInvoice(null);
                setInvoiceDetail(null);
                setShowPdfPreview(false);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-slate-500 hover:text-slate-800"
              aria-label="Close invoice detail"
            >
              <X size={16} />
            </button>
          </div>

          {detailLoading ? (
            <div className="mt-6 flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b5b6a]"></div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Issue Date</p>
                      <p className="font-semibold text-slate-800">
                        {invoiceDetail?.issueDate ? new Date(invoiceDetail.issueDate).toLocaleDateString("en-IN") : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</p>
                      <p className="font-semibold text-slate-800">
                        {invoiceDetail?.dueDate ? new Date(invoiceDetail.dueDate).toLocaleDateString("en-IN") : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</p>
                      <p className="font-semibold text-slate-800">{fmt(Number(invoiceDetail?.totalAmount || 0))}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
                      <p className="font-semibold text-slate-800">{invoiceDetail?.status || "Pending"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Line Items</h3>
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-semibold">
                      <tr>
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2 text-right">Unit</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceDetail?.lineItems && invoiceDetail.lineItems.length > 0 ? (
                        invoiceDetail.lineItems.map((item, idx) => (
                          <tr key={`${item.description || "item"}-${idx}`}>
                            <td className="py-2 font-medium text-slate-800">{item.description || "Item"}</td>
                            <td className="py-2">{item.quantity ?? "-"}</td>
                            <td className="py-2 text-right">{item.unitPrice ? fmt(item.unitPrice) : "-"}</td>
                            <td className="py-2 text-right font-semibold text-slate-900">{item.total ? fmt(item.total) : "-"}</td>
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
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <p className="text-sm font-bold text-slate-800">Invoice Document</p>
                {actionMessage ? (
                  <p className="text-xs font-semibold text-emerald-700">{actionMessage}</p>
                ) : null}
                {actionError ? (
                  <p className="text-xs font-semibold text-rose-600">{actionError}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setConfirmAction("approve");
                      setConfirmOpen(true);
                    }}
                    disabled={actionLoading}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {actionLoading ? "Working..." : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction("dispute");
                      setConfirmOpen(true);
                    }}
                    disabled={actionLoading}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60"
                  >
                    Raise Dispute
                  </button>
                </div>
                <button
                  onClick={() => setShowPdfPreview((prev) => !prev)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showPdfPreview ? "Hide PDF Preview" : "Show PDF Preview"}
                </button>
                <a
                  href={`/api/invoices/${selectedInvoice}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#1b5b6a] hover:text-[#0f1b2d] inline-flex items-center gap-1"
                >
                  Open PDF <ArrowUpRight size={12} />
                </a>
                {showPdfPreview ? (
                  <div className="mt-2">
                    <InvoicePDF invoice={invoiceDetail} />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm portal-section-enter">
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="text-[#1b5b6a] w-6 h-6" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Need exception handling?</p>
            <p className="text-xs text-slate-500">Use the AP Hub to review mismatched invoices, raise disputes, and approve overrides.</p>
          </div>
        </div>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {confirmAction === "approve" ? "Approve invoice?" : "Raise dispute?"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {confirmAction === "approve"
                ? "This will mark the invoice as approved for payment processing."
                : "Provide a reason so the supplier can resolve the dispute quickly."}
            </p>

            {confirmAction === "dispute" ? (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Dispute reason</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b5b6a]"
                  placeholder="Describe the mismatch or issue"
                />
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmAction(null);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction === "approve" ? handleApproveInvoice : handleRaiseDispute}
                disabled={actionLoading}
                className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${
                  confirmAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionLoading ? "Working..." : confirmAction === "approve" ? "Approve" : "Raise Dispute"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
