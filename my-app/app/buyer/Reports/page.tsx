"use client";

import BuyerRouteFrame from "../_components/BuyerRouteFrame";

export default function ReportsPage() {
  return (
    <BuyerRouteFrame>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                The Audit Hub
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                GST Reconciler, TDS Withholding Reports, and Custom Data Exporter.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* GST & ITC Reconciler */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
               <h2 className="font-bold text-slate-800">GST &amp; ITC Reconciler</h2>
               <p className="text-xs text-slate-500">Detecting mismatches between GSTR-2B and Purchase Register.</p>
            </div>
            <div className="p-6">
               <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-rose-800 mb-1">Attention Required</h3>
                  <p className="text-sm text-rose-700">₹4.2L of ITC is at risk across 12 invoices due to supplier non-filing.</p>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                     <span className="text-slate-600 font-medium">Fully Matched (GSTR-2B)</span>
                     <span className="font-bold text-emerald-600">₹84.5L (92%)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                     <span className="text-slate-600 font-medium">Mismatched Value</span>
                     <span className="font-bold text-amber-600">₹3.2L</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-600 font-medium">Not Found in GSTR-2B</span>
                     <span className="font-bold text-rose-600">₹1.0L</span>
                  </div>
               </div>
               <button className="mt-6 w-full rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Run Full Reconciliation Sync
               </button>
            </div>
          </div>

          {/* Data Exporter Form */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
             <div className="border-b border-slate-200 bg-slate-50 p-4">
               <h2 className="font-bold text-slate-800">Custom Data Exporter</h2>
               <p className="text-xs text-slate-500">Generate compliance extracts for ERP integration.</p>
            </div>
            <div className="p-6 space-y-5">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Report Type</label>
                  <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                     <option>TDS Withholding Summary (Sec 194Q)</option>
                     <option>Section 43B(h) Auditor Certificate</option>
                     <option>Early Payment Yield Ledger</option>
                     <option>Vendor Exception Log</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                     <input type="date" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                     <input type="date" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none" />
                  </div>
               </div>
               <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="includeVerified" className="rounded border-slate-300 text-blue-600" defaultChecked />
                  <label htmlFor="includeVerified" className="text-sm text-slate-600">Only include verified vendors (Udyam/GSTIN)</label>
               </div>
               <button className="w-full rounded-xl bg-slate-800 py-3 font-semibold text-white shadow-sm hover:bg-slate-900 mt-2">
                  Generate CSV Export
               </button>
            </div>
          </div>
        </div>
      </div>
    </BuyerRouteFrame>
  );
}
