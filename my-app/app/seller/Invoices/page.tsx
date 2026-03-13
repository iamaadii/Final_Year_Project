"use client";

import { useState } from "react";

const initialInvoices = [
  { id: "INV-88203", buyer: "Alpha Corp", value: 1450000, date: "14-Apr-2026", status: "Disputed" },
  { id: "INV-99301", buyer: "Nexus Materials", value: 230000, date: "24-Mar-2026", status: "Approved" },
  { id: "INV-11045", buyer: "Omega Logistics", value: 645000, date: "10-Apr-2026", status: "Pending" },
  { id: "INV-0992A", buyer: "Alpha Corp", value: 1100000, date: "18-Mar-2026", status: "Discounted" },
  { id: "INV-55102", buyer: "Zeta Pharma", value: 85000, date: "05-May-2026", status: "Approved" },
  { id: "INV-33211", buyer: "Nexus Materials", value: 410000, date: "12-Apr-2026", status: "Pending" },
  { id: "INV-77420", buyer: "Alpha Corp", value: 920000, date: "28-Apr-2026", status: "Approved" },
  { id: "INV-66192", buyer: "Omega Logistics", value: 255000, date: "02-May-2026", status: "Pending" },
  { id: "INV-88500", buyer: "Zeta Pharma", value: 1560000, date: "10-May-2026", status: "Pending" },
  { id: "INV-11200", buyer: "Alpha Corp", value: 340000, date: "15-Apr-2026", status: "Approved" },
  { id: "INV-99882", buyer: "Tech Flow Inc", value: 780000, date: "20-Apr-2026", status: "Pending" },
  { id: "INV-44332", buyer: "Nexus Materials", value: 120000, date: "25-Mar-2026", status: "Approved" },
];

export default function InvoicesPage() {
  const [activeView, setActiveView] = useState<"list" | "detail">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  
  // Modal State
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formData, setFormData] = useState({ buyerName: "", gstin: "", amount: "", dueDate: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const viewDetail = (id: string) => {
    setSelectedInvoice(id);
    setActiveView("detail");
  };

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.buyerName.trim()) errors.buyerName = "Required";
    
    // GSTIN 15-char alpha-numeric validation
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
       errors.gstin = "Invalid GSTIN format";
    }
    
    // Amount validation
    if (!/^\d+(\.\d{1,2})?$/.test(formData.amount) || Number(formData.amount) <= 0) {
       errors.amount = "Invalid amount format";
    }

    if (!formData.dueDate) errors.dueDate = "Required";

    if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       return;
    }

    // Success (Mock)
    setShowManualEntry(false);
    setFormData({ buyerName: "", gstin: "", amount: "", dueDate: "" });
    setFormErrors({});
  };

  const filteredInvoices = initialInvoices.filter(inv => {
     const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           inv.buyer.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesStatus = filterStatus === "All Statuses" || inv.status === filterStatus;
     return matchesSearch && matchesStatus;
  });

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
            
            {/* Invoice Ingestion Hub */}
            <div className="grid gap-4 lg:grid-cols-3">
               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
                  <h3 className="font-bold text-slate-800 mb-2">Create Draft</h3>
                  <p className="text-xs text-slate-500 mb-4 h-8">Manually enter a line-item invoice into the registry.</p>
                  <button onClick={() => setShowManualEntry(true)} className="w-full rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">+ Manual Entry</button>
               </div>
               <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 shadow-sm text-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <h3 className="font-bold text-blue-900 mb-2">Smart PDF Upload (OCR)</h3>
                  <p className="text-xs text-blue-800 mb-4 h-8">Drag &amp; drop invoice PDFs for auto-extraction.</p>
                  <span className="inline-block text-xs font-bold text-blue-700 underline decoration-blue-300 underline-offset-4">Click to Browse Files</span>
               </div>
               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
                  <h3 className="font-bold text-slate-800 mb-2">GSTN Sync</h3>
                  <p className="text-xs text-slate-500 mb-4 h-8">Fetch directly from Govt Portal using your secure ERP link.</p>
                  <button className="w-full rounded-xl bg-slate-800 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition-colors">Run Sync Agent</button>
               </div>
            </div>

            {/* Master Invoice Table (Invoice Registry) */}
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
                          className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                     </div>
                     <select 
                       value={filterStatus}
                       onChange={(e) => setFilterStatus(e.target.value)}
                       className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 outline-none text-slate-700 bg-white font-semibold shadow-sm focus:border-blue-500"
                     >
                        <option>All Statuses</option>
                        <option>Approved</option>
                        <option>Disputed</option>
                        <option>Pending</option>
                        <option>Discounted</option>
                     </select>
                  </div>
               </div>
               
               {/* Fixed Header */}
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
               
               {/* Scrollable Body - limits visually to ~10 rows before scrolling */}
               <div className="overflow-y-auto max-h-[520px] custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-600">
                     <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                           <tr key={inv.id} className="hover:bg-slate-50 transition">
                              <td className="p-4 font-bold text-slate-800 w-1/6">{inv.id}</td>
                              <td className="p-4 font-medium text-slate-700 w-1/4">{inv.buyer}</td>
                              <td className="p-4 font-semibold text-slate-900 w-1/6">₹{inv.value.toLocaleString("en-IN")}</td>
                              <td className={`p-4 w-1/6 ${inv.status === "Discounted" ? "line-through text-slate-400" : ""}`}>{inv.date}</td>
                              <td className="p-4 w-1/6">
                                 <span className={`rounded px-2 py-1 text-xs font-bold whitespace-nowrap ${
                                    inv.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                                    inv.status === "Disputed" ? "bg-rose-100 text-rose-800" :
                                    inv.status === "Discounted" ? "bg-blue-100 text-blue-800" :
                                    "bg-amber-100 text-amber-800"
                                 }`}>
                                    {inv.status}
                                 </span>
                              </td>
                              <td className="p-4 text-right w-1/12">
                                 <button onClick={() => viewDetail(inv.id)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Review</button>
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
            {/* Split Screen Document View */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[500px]">
               <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 flex items-center gap-3">
                     Invoice Document Details
                     <span className="rounded bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">{selectedInvoice}</span>
                  </h2>
               </div>
               <div className="p-6 bg-slate-50/50 flex-1 grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Billed To</p>
                        <p className="font-bold text-slate-800">Alpha Corp Manufacturing</p>
                        <p className="text-sm text-slate-600">Block B, Tech Park, Pune.</p>
                     </div>
                     <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Terms</p>
                        <p className="text-sm font-medium text-slate-800">Net 45 (Due: 14-Apr-2026)</p>
                     </div>
                  </div>
                  <div className="space-y-4 text-right">
                     <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Invoice Amount</p>
                        <p className="text-3xl font-black text-slate-900">₹14,50,000</p>
                     </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
                        {selectedInvoice === "INV-88203" ? (
                           <span className="rounded bg-rose-100 text-rose-800 px-2 py-1 text-xs font-bold whitespace-nowrap">Disputed - Price Variance</span>
                        ) : (
                           <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold whitespace-nowrap">Approved</span>
                        )}
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
                        <tr>
                           <td className="py-3 font-medium text-slate-800">Industrial Steel Spools (Grade 4)</td>
                           <td className="py-3">100</td>
                           <td className="py-3">₹14,500</td>
                           <td className="py-3 text-right font-bold text-slate-900">₹14,50,000</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Dispute Resolution Chat */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
               <div className="border-b border-slate-200 bg-slate-800 p-4 shrink-0 flex items-center justify-between">
                  <h2 className="font-bold text-white flex items-center gap-2">
                     <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                     Dispute Chat
                  </h2>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
                  
                  {selectedInvoice === "INV-88203" ? (
                     <>
                        <div className="flex flex-col gap-1 items-start w-[85%]">
                           <span className="text-[10px] font-bold text-slate-500 ml-1">Alpha Corp AP User</span>
                           <div className="bg-slate-200 text-slate-800 rounded-2xl rounded-tl-none p-3 text-sm shadow-sm">
                              The unit price on this invoice exceeds our contracted PO limits. Please revise and issue a credit note, or provide an updated invoice document.
                           </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end w-[85%] ml-auto">
                           <span className="text-[10px] font-bold text-slate-500 mr-1">You</span>
                           <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-sm shadow-sm">
                              Hi, checking with our sales team regarding the PO override. Will update the document end of day.
                           </div>
                        </div>
                     </>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                        No active disputes found on this invoice ledger.
                     </div>
                  )}

               </div>
               <div className="p-3 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex gap-2">
                     <input type="text" placeholder="Type message..." className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                     <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900 transition-colors">Send</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Manual Entry Dialog */}
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
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Enterprise Buyer Name <span className="text-rose-500">*</span></label>
                     <input 
                        type="text" 
                        value={formData.buyerName} 
                        onChange={e => setFormData(f => ({...f, buyerName: e.target.value}))}
                        className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 ${formErrors.buyerName ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
                        placeholder="e.g. Alpha Corp"
                     />
                     {formErrors.buyerName && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.buyerName}</p>}
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Buyer GSTIN <span className="text-rose-500">*</span></label>
                     <input 
                        type="text" 
                        value={formData.gstin}
                        onChange={e => setFormData(f => ({...f, gstin: e.target.value.toUpperCase()}))}
                        className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 font-mono uppercase ${formErrors.gstin ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
                        placeholder="29ABCDE1234F2Z5"
                     />
                     {formErrors.gstin && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.gstin}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">Gross Amount (₹) <span className="text-rose-500">*</span></label>
                        <input 
                           type="number" 
                           step="0.01"
                           value={formData.amount}
                           onChange={e => setFormData(f => ({...f, amount: e.target.value}))}
                           className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 font-mono ${formErrors.amount ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
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
                           className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 text-slate-700 ${formErrors.dueDate ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
                        />
                        {formErrors.dueDate && <p className="text-rose-500 text-xs mt-1 font-semibold">{formErrors.dueDate}</p>}
                     </div>
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 mt-6 transition-colors">
                     Submit to Registry
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
