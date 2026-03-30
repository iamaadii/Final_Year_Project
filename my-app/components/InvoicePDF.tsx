"use client";

import { useRef } from "react";

type LineItem = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

type InvoiceData = {
  invoiceNumber?: string;
  sellerName?: string;
  sellerGstin?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerGstin?: string;
  issueDate?: string | Date;
  dueDate?: string | Date;
  lineItems?: LineItem[];
  totalAmount?: number;
  taxAmount?: number;
};

export function InvoicePDF({ invoice }: { invoice: InvoiceData | null }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Restore React handlers
    }
  };

  if (!invoice) return null;

  return (
    <div className="bg-slate-100 p-8 rounded-2xl flex flex-col items-center">
      <div className="flex w-full max-w-3xl justify-end mb-4 gap-2">
        <button 
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-900 transition"
        >
          Print / Download PDF
        </button>
      </div>
      
      {/* The Printable Container */}
      <div ref={printRef} className="w-full max-w-3xl bg-white p-12 shadow-md Print-Only-Invoice container">
        <div className="flex justify-between items-start border-b-2 border-[#1b5b6a] pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#0f1b2d] uppercase tracking-tighter">INVOICE</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">#{invoice.invoiceNumber || "DRAFT"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-[#1b5b6a]">{invoice.sellerName || "Nexus Three Vendor"}</h2>
            {invoice.sellerGstin && <p className="text-sm text-slate-500">GSTIN: {invoice.sellerGstin}</p>}
          </div>
        </div>

        <div className="flex justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Billed To</p>
            <p className="font-bold text-slate-800 text-lg">{invoice.buyerName}</p>
            <p className="text-sm border-l-2 border-slate-200 pl-3 mt-2 text-slate-600">
              {invoice.buyerAddress || "No address provided."}
            </p>
            {invoice.buyerGstin && <p className="text-sm text-slate-500 mt-2 font-mono">GSTIN: {invoice.buyerGstin}</p>}
          </div>
          
          <div className="text-right">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Issue Date</p>
              <p className="font-semibold text-slate-800">
                {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "Pending"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Due Date</p>
              <p className="font-semibold text-slate-800">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Pending"}
              </p>
            </div>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-y-2 border-slate-200 bg-slate-50 text-slate-800 text-sm">
              <th className="py-3 px-4 font-bold">Description</th>
              <th className="py-3 px-4 font-bold text-center">Qty</th>
              <th className="py-3 px-4 font-bold text-right">Unit Price</th>
              <th className="py-3 px-4 font-bold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100 text-sm text-slate-700">
                <td className="py-4 px-4 font-medium">{item.description || "Service / Product"}</td>
                <td className="py-4 px-4 text-center">{item.quantity || 1}</td>
                <td className="py-4 px-4 text-right">INR {(item.unitPrice || 0).toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-bold text-slate-900">INR {(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
            {(!invoice.lineItems || invoice.lineItems.length === 0) && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 italic">No line items specified.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end border-t-2 border-slate-800 pt-6">
          <div className="w-64">
            <div className="flex justify-between mb-2 text-sm text-slate-600">
              <span>Subtotal:</span>
              <span>INR {Number(invoice.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-slate-600">
              <span>Tax (GST):</span>
              <span>INR {Number(invoice.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-y border-slate-200 font-bold text-lg text-[#0f1b2d]">
              <span>Total:</span>
              <span>INR {Number((invoice.totalAmount || 0) + (invoice.taxAmount || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-xs text-slate-400 text-center border-t border-slate-100 pt-8">
          Generated securely by Nexus Three Invoice OS.
        </div>
      </div>
    </div>
  );
}
