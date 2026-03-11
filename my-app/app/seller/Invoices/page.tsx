"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import DisputeResolutionChat from "../_components/DisputeResolutionChat";

type InvoiceStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Disputed"
  | "Settled"
  | "Partially Settled";

type InvoiceItem = {
  label: string;
  date: string;
  qty: number;
  total: string;
};

type InvoiceRecord = {
  id: string;
  buyer: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  status: InvoiceStatus;
  billTo: string;
  location: string;
  kenietNumber: string;
  taxDate: string;
  items: InvoiceItem[];
};

type ApiInvoice = {
  _id: string;
  invoiceNumber: string;
  buyerName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    total: number;
  }>;
};

type BuyerOption = {
  _id: string;
  name: string;
  email: string;
};

type ParsedInvoiceDraft = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  buyerName: string;
  buyerEmail: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

type AuditTrailEvent = {
  title: string;
  detail: string;
  tone: "primary" | "success" | "neutral" | "warning";
};

const invoices: InvoiceRecord[] = [
  {
    id: "INV-2024-001",
    buyer: "ABC Corp",
    issueDate: "2024-12-12",
    dueDate: "2025-01-11",
    amount: "Rs 2,300.00",
    status: "Disputed",
    billTo: "ABC Corp",
    location: "Manufacturer Bnagh Ltp. Mkr - 20331",
    kenietNumber: "Tar-11-03-2024",
    taxDate: "11/03/2024",
    items: [
      { label: "Item #1", date: "03/03/2024", qty: 1, total: "Rs 140.00" },
      { label: "Item #2", date: "03/03/2024", qty: 1, total: "Rs 20.00" },
    ],
  },
  {
    id: "INV-2024-002",
    buyer: "ABC Corp",
    issueDate: "2024-12-13",
    dueDate: "2025-01-11",
    amount: "Rs 7,500.00",
    status: "Partially Settled",
    billTo: "ABC Corp",
    location: "Manufacturer Bnagh Ltp. Mkr - 20331",
    kenietNumber: "Tar-12-03-2024",
    taxDate: "12/03/2024",
    items: [
      { label: "Item #1", date: "03/11/2024", qty: 2, total: "Rs 320.00" },
      { label: "Item #2", date: "03/12/2024", qty: 4, total: "Rs 180.00" },
    ],
  },
  {
    id: "INV-2024-003",
    buyer: "Zenith Foods",
    issueDate: "2024-11-10",
    dueDate: "2024-12-10",
    amount: "Rs 5,500.00",
    status: "Approved",
    billTo: "Zenith Foods",
    location: "Warehouse 2, Pune - 411001",
    kenietNumber: "Tar-13-03-2024",
    taxDate: "13/03/2024",
    items: [
      { label: "Item #1", date: "03/13/2024", qty: 1, total: "Rs 550.00" },
    ],
  },
  {
    id: "INV-2024-004",
    buyer: "Orbit Retail",
    issueDate: "2024-10-14",
    dueDate: "2024-11-14",
    amount: "Rs 3,500.00",
    status: "Settled",
    billTo: "Orbit Retail",
    location: "Retail Hub, Chennai - 600001",
    kenietNumber: "Tar-14-03-2024",
    taxDate: "14/03/2024",
    items: [
      { label: "Item #1", date: "03/14/2024", qty: 1, total: "Rs 350.00" },
    ],
  },
  {
    id: "INV-2024-005",
    buyer: "Nova Pharma",
    issueDate: "2024-09-18",
    dueDate: "2024-10-18",
    amount: "Rs 1,600.00",
    status: "Pending Approval",
    billTo: "Nova Pharma",
    location: "Plant 5, Indore - 452001",
    kenietNumber: "Tar-15-03-2024",
    taxDate: "15/03/2024",
    items: [
      { label: "Item #1", date: "03/15/2024", qty: 1, total: "Rs 160.00" },
    ],
  },
  {
    id: "INV-2024-006",
    buyer: "Orbit Retail",
    issueDate: "2024-08-21",
    dueDate: "2024-09-21",
    amount: "Rs 1,700.00",
    status: "Draft",
    billTo: "Orbit Retail",
    location: "Retail Hub, Chennai - 600001",
    kenietNumber: "Tar-16-03-2024",
    taxDate: "16/03/2024",
    items: [
      { label: "Item #1", date: "03/16/2024", qty: 1, total: "Rs 170.00" },
    ],
  },
];

const statusOptions: Array<{ label: string; value: "all" | InvoiceStatus }> = [
  { label: "All Status", value: "all" },
  { label: "Disputed", value: "Disputed" },
  { label: "Approved", value: "Approved" },
  { label: "Settled", value: "Settled" },
  { label: "Partially Settled", value: "Partially Settled" },
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "Draft", value: "Draft" },
];
function statusClass(status: InvoiceStatus) {
  if (status === "Draft") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Pending Approval")
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "Approved")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Disputed") return "bg-rose-100 text-rose-800 border-rose-200";
  if (status === "Partially Settled")
    return "bg-cyan-100 text-cyan-800 border-cyan-200";
  return "bg-teal-100 text-teal-800 border-teal-200";
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB");
}

function formatMonthLabel(month: string) {
  const d = new Date(`${month}-01T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function toTaxDate(dateISO: string) {
  const [year, month, day] = dateISO.split("-");
  return `${day}/${month}/${year}`;
}

function formatRs(amount: number) {
  return `Rs ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildAuditTrail(invoice: InvoiceRecord | null): AuditTrailEvent[] {
  if (!invoice) return [];

  const events: AuditTrailEvent[] = [
    {
      title: "Invoice uploaded by Seller",
      detail: `${formatDate(invoice.issueDate)} (${invoice.id})`,
      tone: "primary",
    },
  ];

  if (invoice.status === "Draft") {
    events.push({
      title: "Draft saved",
      detail: "Awaiting final submission for buyer approval",
      tone: "neutral",
    });
    return events;
  }

  if (invoice.status === "Pending Approval") {
    events.push({
      title: "Approval request sent to Buyer",
      detail: `Pending review by ${invoice.buyer}`,
      tone: "warning",
    });
    return events;
  }

  if (invoice.status === "Approved") {
    events.push({
      title: "Approved by Buyer",
      detail: `Approved for payment processing (${invoice.buyer})`,
      tone: "success",
    });
    return events;
  }

  if (invoice.status === "Partially Settled") {
    events.push(
      {
        title: "Approved by Buyer",
        detail: `Approved and moved to settlement workflow`,
        tone: "success",
      },
      {
        title: "Part payment received",
        detail: `Remaining amount due by ${formatDate(invoice.dueDate)}`,
        tone: "warning",
      },
    );
    return events;
  }

  if (invoice.status === "Settled") {
    events.push(
      {
        title: "Approved by Buyer",
        detail: `Approved and processed for payment`,
        tone: "success",
      },
      {
        title: "Payment settled",
        detail: `Invoice fully settled (${invoice.amount})`,
        tone: "success",
      },
    );
    return events;
  }

  if (invoice.status === "Disputed") {
    events.push(
      {
        title: "Dispute raised by Buyer",
        detail: `Buyer ${invoice.buyer} requested corrections`,
        tone: "warning",
      },
      {
        title: "Awaiting seller action",
        detail: "Revise document and re-submit for approval",
        tone: "neutral",
      },
    );
    return events;
  }

  return events;
}

export default function SellerInvoicesPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRecord[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [buyers, setBuyers] = useState<BuyerOption[]>([]);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);
  const [isGstnConnected, setIsGstnConnected] = useState(true);
  const [isGstnBusy, setIsGstnBusy] = useState(false);
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [ocrDraft, setOcrDraft] = useState<ParsedInvoiceDraft | null>(null);
  const [ocrPreviewText, setOcrPreviewText] = useState("");
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [ocrConsentChecked, setOcrConsentChecked] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [ingestionMessage, setIngestionMessage] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(
    "all",
  );
  const [buyerFilter, setBuyerFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function mapApiInvoiceToRow(inv: ApiInvoice): InvoiceRecord {
    const issueISO = String(inv.issueDate || "").slice(0, 10);
    const dueISO = String(inv.dueDate || "").slice(0, 10);
    const safeIssue = issueISO || new Date().toISOString().slice(0, 10);
    const safeDue = dueISO || safeIssue;
    const items =
      Array.isArray(inv.lineItems) && inv.lineItems.length > 0
        ? inv.lineItems.map((item, idx) => ({
            label: item.description || `Item #${idx + 1}`,
            date: formatDate(safeIssue),
            qty: Number(item.quantity || 0),
            total: formatRs(Number(item.total || 0)),
          }))
        : [{ label: "Item #1", date: formatDate(safeIssue), qty: 1, total: formatRs(Number(inv.totalAmount || 0)) }];

    return {
      id: inv.invoiceNumber || inv._id,
      buyer: inv.buyerName || "Buyer",
      issueDate: safeIssue,
      dueDate: safeDue,
      amount: formatRs(Number(inv.totalAmount || 0)),
      status: inv.status || "Pending Approval",
      billTo: inv.buyerName || "Buyer",
      location: inv.notes || "Stored in invoice registry",
      kenietNumber: `Tar-${safeIssue.split("-").reverse().join("-")}`,
      taxDate: toTaxDate(safeIssue),
      items,
    };
  }

  async function fetchInvoicesFromApi() {
    setIsLoadingInvoices(true);
    try {
      const res = await fetch("/api/invoices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setIngestionMessage(data?.message || `Failed to load invoices (${res.status})`);
        setInvoiceRows(invoices);
        return;
      }
      const rows = Array.isArray(data?.invoices)
        ? (data.invoices as ApiInvoice[]).map(mapApiInvoiceToRow)
        : [];
      setInvoiceRows(rows);
      if (!selectedId && rows.length > 0) setSelectedId(rows[0].id);
    } catch {
      setIngestionMessage("Unable to reach invoice API.");
      setInvoiceRows(invoices);
    } finally {
      setIsLoadingInvoices(false);
    }
  }

  async function fetchBuyers() {
    setIsLoadingBuyers(true);
    try {
      const res = await fetch("/api/buyers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        return;
      }
      setBuyers(Array.isArray(data?.buyers) ? (data.buyers as BuyerOption[]) : []);
    } catch {
      // no-op
    } finally {
      setIsLoadingBuyers(false);
    }
  }

  useEffect(() => {
    fetchInvoicesFromApi();
    fetchBuyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createInvoiceViaApi(payload: Record<string, unknown>) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }
    return data as {
      invoice: ApiInvoice;
      approvalRequestSent?: boolean;
      approvalRequestError?: string;
    };
  }

  function makeInvoiceId() {
    const year = new Date().getFullYear();
    const suffix = String(Date.now()).slice(-4);
    return `INV-${year}-${suffix}`;
  }

  async function handleManualEntry() {
    try {
      const invoiceNumber = makeInvoiceId();
      const issueDate = new Date().toISOString().slice(0, 10);
      const deliveryDate = issueDate;
      const created = await createInvoiceViaApi({
        invoiceNumber,
        issueDate,
        deliveryDate,
        paymentTermsDays: 45,
        subtotalAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        status: "Draft",
        notes: "Created from Manual Entry",
        lineItems: [{ description: "Draft Item", quantity: 1, unitPrice: 0, total: 0 }],
      });
      const row = mapApiInvoiceToRow(created.invoice);
      setInvoiceRows((prev) => [row, ...prev]);
      setSelectedId(row.id);
      setIngestionMessage(`Draft invoice ${row.id} created and saved to database.`);
    } catch (error) {
      setIngestionMessage(error instanceof Error ? error.message : "Manual invoice creation failed.");
    }
  }

  async function processPdfFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const pdfFiles = files.filter(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfFiles.length === 0) {
      setIngestionMessage("Only PDF files are allowed for OCR upload.");
      return;
    }

    setIsPdfProcessing(true);
    setIngestionMessage(`Processing ${pdfFiles.length} PDF file(s) via OCR...`);
    try {
      const fd = new FormData();
      fd.append("file", pdfFiles[0]);
      const res = await fetch("/api/invoices/ocr", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setIngestionMessage(data?.message || "OCR parsing failed.");
        return;
      }

      const extracted = data?.extracted as ParsedInvoiceDraft;
      if (!extracted) {
        setIngestionMessage("No invoice details were extracted from the PDF.");
        return;
      }

      setOcrDraft({
        invoiceNumber: extracted.invoiceNumber || makeInvoiceId(),
        issueDate: extracted.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: extracted.dueDate || "",
        buyerName: extracted.buyerName || "Buyer",
        buyerEmail: extracted.buyerEmail || "",
        subtotalAmount: Number(extracted.subtotalAmount || 0),
        taxAmount: Number(extracted.taxAmount || 0),
        totalAmount: Number(extracted.totalAmount || 0),
        notes: extracted.notes || "Extracted from uploaded PDF",
        lineItems:
          Array.isArray(extracted.lineItems) && extracted.lineItems.length > 0
            ? extracted.lineItems
            : [{ description: "Parsed Item", quantity: 1, unitPrice: 0, total: 0 }],
      });
      setOcrPreviewText(String(data?.rawTextPreview || ""));
      setOcrConsentChecked(false);
      const matchedBuyer = buyers.find(
        (b) => b.email.toLowerCase() === String(extracted.buyerEmail || "").toLowerCase(),
      );
      setSelectedBuyerId(matchedBuyer?._id || "");
      setIngestionMessage(
        "PDF parsed successfully. Please review extracted details and confirm before sending approval request.",
      );
    } catch (error) {
      setIngestionMessage(error instanceof Error ? error.message : "OCR ingestion failed.");
    } finally {
      setIsPdfProcessing(false);
    }
  }

  async function handleConfirmOcrApproval() {
    if (!ocrDraft) return;
    if (!selectedBuyerId) {
      setIngestionMessage("Please select a buyer before sending approval request.");
      return;
    }
    if (!ocrConsentChecked) {
      setIngestionMessage("Please confirm consent before sending approval request.");
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const payload = {
        invoiceNumber: ocrDraft.invoiceNumber || makeInvoiceId(),
        buyerId: selectedBuyerId,
        issueDate: ocrDraft.issueDate || new Date().toISOString().slice(0, 10),
        deliveryDate: ocrDraft.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: ocrDraft.dueDate || undefined,
        paymentTermsDays: 45,
        subtotalAmount: Number(ocrDraft.subtotalAmount || 0),
        taxAmount: Number(ocrDraft.taxAmount || 0),
        totalAmount: Number(ocrDraft.totalAmount || 0),
        status: "Pending Approval",
        notes: `${ocrDraft.notes || ""} | Approval request sent to buyer.`,
        lineItems: ocrDraft.lineItems,
      };

      const created = await createInvoiceViaApi({
        ...payload,
        sendApprovalRequest: true,
      });
      const row = mapApiInvoiceToRow(created.invoice);
      setInvoiceRows((prev) => [row, ...prev]);
      setSelectedId(row.id);
      setIngestionMessage(created.approvalRequestSent
        ? `Approval request sent to buyer and invoice ${row.id} stored in database.`
        : `Invoice ${row.id} stored, but approval email could not be sent (${created.approvalRequestError || "email not configured"}).`);
      setOcrDraft(null);
      setOcrPreviewText("");
      setOcrConsentChecked(false);
      setSelectedBuyerId("");
    } catch (error) {
      setIngestionMessage(
        error instanceof Error ? error.message : "Failed to send approval request.",
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  }

  async function handleToggleGstn() {
    if (isGstnBusy) return;
    setIsGstnBusy(true);

    if (!isGstnConnected) {
      try {
        const amount = Number((Math.random() * 12000 + 2000).toFixed(2));
        const invoiceNumber = makeInvoiceId();
        const issueDate = new Date().toISOString().slice(0, 10);
        const deliveryDate = issueDate;
        const created = await createInvoiceViaApi({
          invoiceNumber,
          issueDate,
          deliveryDate,
          paymentTermsDays: 45,
          subtotalAmount: amount,
          taxAmount: 0,
          totalAmount: amount,
          status: "Approved",
          notes: "Fetched via GSTN sync",
          lineItems: [{ description: "GSTN Item", quantity: 1, unitPrice: amount, total: amount }],
        });
        const row = mapApiInvoiceToRow(created.invoice);
        setInvoiceRows((prev) => [row, ...prev]);
        setSelectedId(row.id);
        setIsGstnConnected(true);
        setIsGstnBusy(false);
        setIngestionMessage(`GSTN connected. Pulled invoice ${row.id} from database.`);
      } catch (error) {
        setIsGstnBusy(false);
        setIngestionMessage(error instanceof Error ? error.message : "GSTN sync failed.");
      }
      return;
    }

    setIsGstnConnected(false);
    setIsGstnBusy(false);
    setIngestionMessage("GSTN portal disconnected.");
  }

  const buyerOptions = useMemo(
    () => [
      "all",
      ...Array.from(new Set(invoiceRows.map((inv) => inv.buyer))).sort(),
    ],
    [invoiceRows],
  );
  const monthOptions = useMemo(
    () => [
      "all",
      ...Array.from(new Set(invoiceRows.map((inv) => monthKey(inv.issueDate))))
        .sort()
        .reverse(),
    ],
    [invoiceRows],
  );

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return invoiceRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.id.toLowerCase().includes(query) ||
        row.buyer.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      const matchesBuyer = buyerFilter === "all" || row.buyer === buyerFilter;
      const matchesMonth =
        monthFilter === "all" || monthKey(row.issueDate) === monthFilter;
      return matchesSearch && matchesStatus && matchesBuyer && matchesMonth;
    });
  }, [invoiceRows, searchText, statusFilter, buyerFilter, monthFilter]);

  // Derive the selected invoice without relying on selectedId being initialized:
  // 1. If selectedId is set and exists in filtered, use it.
  // 2. Otherwise fall back to the first filtered item (or first invoice).
  const selectedInvoice = useMemo(() => {
    if (selectedId) {
      const match = filtered.find((row) => row.id === selectedId);
      if (match) return match;
    }
    return filtered[0] ?? invoiceRows[0] ?? null;
  }, [selectedId, filtered, invoiceRows]);

  const selectedSubtotal = useMemo(
    () =>
      (selectedInvoice?.items || []).reduce((sum, item) => {
        const numeric = Number(item.total.replace(/[^0-9.]/g, ""));
        return Number.isFinite(numeric) ? sum + numeric : sum;
      }, 0),
    [selectedInvoice],
  );
  const auditTrail = useMemo(
    () => buildAuditTrail(selectedInvoice),
    [selectedInvoice],
  );
  const hasActiveFilters =
    statusFilter !== "all" ||
    buyerFilter !== "all" ||
    monthFilter !== "all" ||
    searchText.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          The Core Ledger: Invoices Module
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Invoice Ingestion Hub
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Manual Entry
            </h2>
            <button
              type="button"
              onClick={handleManualEntry}
              className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Create Draft Invoice
            </button>
            <p className="mt-3 text-sm text-slate-600">
              Create an invoice line by line.
            </p>
          </article>

          <article
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsPdfDragging(true);
            }}
            onDragLeave={() => setIsPdfDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsPdfDragging(false);
              processPdfFiles(e.dataTransfer.files);
            }}
            className={`cursor-pointer rounded-xl border border-dashed p-4 text-center transition ${
              isPdfDragging
                ? "border-blue-500 bg-blue-50"
                : "border-sky-300 bg-sky-50/60"
            }`}
          >
            <h2 className="text-lg font-semibold text-slate-900">
              PDF Upload (OCR)
            </h2>
            <p className="mt-6 text-sm font-medium text-slate-700">
              Drag &amp; Drop PDFs Here or Click to Upload.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              OCR will extract invoice data automatically.
            </p>
            <p className="mt-2 text-xs font-semibold text-blue-700">
              {isPdfProcessing ? "OCR processing in progress..." : "Ready for upload"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => processPdfFiles(e.target.files)}
            />
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              GSTN Portal Fetch
            </h2>
            <button
              type="button"
              onClick={handleToggleGstn}
              disabled={isGstnBusy}
              className="mt-2 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {isGstnBusy
                ? "Please wait..."
                : isGstnConnected
                  ? "Disconnect GSTN Portal"
                  : "Connect to GSTN Portal"}
            </button>
            <p className="mt-3 text-sm text-slate-600">
              Fetch invoices directly via API from GSTN.
            </p>
            <p
              className={`mt-2 text-sm font-semibold ${
                isGstnBusy
                  ? "text-blue-700"
                  : isGstnConnected
                    ? "text-emerald-700"
                    : "text-slate-600"
              }`}
            >
              Status:{" "}
              {isGstnBusy
                ? "Syncing..."
                : isGstnConnected
                  ? "Connected"
                  : "Disconnected"}
            </p>
          </article>
        </div>
        {ingestionMessage ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
            {ingestionMessage}
          </p>
        ) : null}
        {ocrDraft ? (
          <section className="mt-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <h3 className="text-base font-semibold text-slate-900">
              Review Extracted Invoice Details
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Update fields if needed, choose buyer, then confirm to send approval request and store in database.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600">
                Invoice Number
                <input
                  value={ocrDraft.invoiceNumber}
                  onChange={(e) => setOcrDraft((prev) => (prev ? { ...prev, invoiceNumber: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Issue Date
                <input
                  type="date"
                  value={ocrDraft.issueDate}
                  onChange={(e) => setOcrDraft((prev) => (prev ? { ...prev, issueDate: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Due Date
                <input
                  type="date"
                  value={ocrDraft.dueDate}
                  onChange={(e) => setOcrDraft((prev) => (prev ? { ...prev, dueDate: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Buyer Name
                <input
                  value={ocrDraft.buyerName}
                  onChange={(e) => setOcrDraft((prev) => (prev ? { ...prev, buyerName: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Buyer Email
                <input
                  value={ocrDraft.buyerEmail}
                  onChange={(e) => setOcrDraft((prev) => (prev ? { ...prev, buyerEmail: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Buyer Account
                <select
                  value={selectedBuyerId}
                  onChange={(e) => setSelectedBuyerId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                >
                  <option value="">{isLoadingBuyers ? "Loading buyers..." : "Select buyer account"}</option>
                  {buyers.map((buyer) => (
                    <option key={buyer._id} value={buyer._id}>
                      {buyer.name} ({buyer.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Subtotal
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ocrDraft.subtotalAmount}
                  onChange={(e) =>
                    setOcrDraft((prev) =>
                      prev ? { ...prev, subtotalAmount: Number(e.target.value || 0) } : prev,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Tax
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ocrDraft.taxAmount}
                  onChange={(e) =>
                    setOcrDraft((prev) =>
                      prev ? { ...prev, taxAmount: Number(e.target.value || 0) } : prev,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Total
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ocrDraft.totalAmount}
                  onChange={(e) =>
                    setOcrDraft((prev) =>
                      prev ? { ...prev, totalAmount: Number(e.target.value || 0) } : prev,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
            </div>

            <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={ocrConsentChecked}
                onChange={(e) => setOcrConsentChecked(e.target.checked)}
                className="mt-0.5"
              />
              I confirm the extracted details are correct and permit sending approval request to the selected buyer and storing this invoice in the database.
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmOcrApproval}
                disabled={isSubmittingApproval || !ocrConsentChecked || !selectedBuyerId}
                className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingApproval ? "Sending approval..." : "Send Approval Request & Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOcrDraft(null);
                  setOcrConsentChecked(false);
                  setSelectedBuyerId("");
                  setOcrPreviewText("");
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>

            {ocrPreviewText ? (
              <details className="mt-3 rounded-lg border border-slate-200 bg-white p-2">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                  View Parsed PDF Text Preview
                </summary>
                <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
                  {ocrPreviewText}
                </pre>
              </details>
            ) : null}
          </section>
        ) : null}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1.6fr_1fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Master Invoice Table
            </h2>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
                <label className="relative block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "all" | InvoiceStatus)
                    }
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-[33px] text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </label>

                <label className="relative block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Buyer
                  </span>
                  <select
                    value={buyerFilter}
                    onChange={(e) => setBuyerFilter(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Buyers</option>
                    {buyerOptions
                      .filter((buyer) => buyer !== "all")
                      .map((buyer) => (
                        <option key={buyer} value={buyer}>
                          {buyer}
                        </option>
                      ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-[33px] text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </label>

                <label className="relative block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Month
                  </span>
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Months</option>
                    {monthOptions
                      .filter((month) => month !== "all")
                      .map((month) => (
                        <option key={month} value={month}>
                          {formatMonthLabel(month)}
                        </option>
                      ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-[33px] text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Search
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Invoice number or buyer..."
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setBuyerFilter("all");
                      setMonthFilter("all");
                      setSearchText("");
                    }}
                    disabled={!hasActiveFilters}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Buyer Name</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((row) => {
                  const isActive = selectedInvoice?.id === row.id;
                  return (
                    <tr
                      key={row.id}
                      className={`cursor-pointer border-t border-slate-200 ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-sky-700">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.buyer}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(row.issueDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(row.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{row.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {isLoadingInvoices ? (
                  <tr className="border-t border-slate-200">
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      Loading invoices...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      No invoices found for the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="flex flex-col gap-3 self-start">
          <h2 className="text-xl font-semibold text-slate-900">
            Split-Screen Invoice Detail View
          </h2>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedInvoice ? (
              <>
                <h3 className="text-2xl font-bold text-slate-900">
                  {selectedInvoice.id}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Structurally digitized invoice data
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">Bill To</p>
                    <p className="mt-1 text-slate-700">{selectedInvoice.billTo}</p>
                    <p className="text-slate-500">{selectedInvoice.location}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedInvoice.id}
                    </p>
                    <p className="mt-1 text-slate-700">Keniet Number</p>
                    <p className="text-slate-500">{selectedInvoice.kenietNumber}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                    <span>Line Items</span>
                    <span>Date</span>
                    <span>Qty</span>
                    <span className="text-right">Total</span>
                  </div>
                  {selectedInvoice.items.map((item) => (
                    <div
                      key={`${selectedInvoice.id}-${item.label}`}
                      className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] px-3 py-2 text-sm text-slate-700"
                    >
                      <span>{item.label}</span>
                      <span>{item.date}</span>
                      <span>{item.qty}</span>
                      <span className="text-right">{item.total}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">Subtotal</span>
                      <span className="font-semibold text-slate-900">
                        Rs {selectedSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-medium text-slate-700">Tax</span>
                      <span className="font-semibold text-slate-900">Rs 0.00</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-lg font-bold text-slate-900">
                        {selectedInvoice.amount}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No invoice selected. Create or sync an invoice to view details.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                Audit Trail
              </h3>
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Open Chat
              </button>
            </div>
            <ul className="mt-4 text-sm text-slate-700">
              {auditTrail.length > 0 ? (
                auditTrail.map((event, idx) => {
                  const isLast = idx === auditTrail.length - 1;
                  const toneClass =
                    event.tone === "success"
                      ? "border-emerald-500 bg-emerald-50"
                      : event.tone === "warning"
                        ? "border-amber-500 bg-amber-50"
                        : event.tone === "neutral"
                          ? "border-slate-300 bg-slate-100"
                          : "border-blue-500 bg-blue-50";
                  const dotClass =
                    event.tone === "success"
                      ? "bg-emerald-500"
                      : event.tone === "warning"
                        ? "bg-amber-500"
                        : event.tone === "neutral"
                          ? "bg-slate-400"
                          : "bg-blue-500";

                  return (
                    <li key={`${event.title}-${idx}`} className={`relative flex gap-3 ${isLast ? "" : "pb-4"}`}>
                      <span className={`relative mt-0.5 block h-5 w-5 shrink-0 rounded-full border-2 ${toneClass}`}>
                        <span className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${dotClass}`} />
                      </span>
                      {!isLast ? (
                        <span className="absolute left-[9px] top-6 h-[calc(100%-10px)] w-px bg-slate-200" />
                      ) : null}
                      <div>
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <p className="text-slate-500">{event.detail}</p>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-slate-500">No audit events available for this invoice.</li>
              )}
            </ul>
          </section>

          <DisputeResolutionChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </article>
      </section>
      </div>
    </div>
  );
}
