"use client";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
               The Insight Engine
             </h1>
             <p className="mt-2 text-sm text-slate-500">
               Generate Receivables Aging reports and statutory GST export structures.
             </p>
           </div>
        </div>
      </header>

      {/* Reports Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Receivables Aging Matrix */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
               <h2 className="font-bold text-slate-800">Receivables Aging Matrix</h2>
               <p className="text-xs text-slate-500">Analyze liquidity health based on MSME Section 43B(h) timelines.</p>
            </div>
            <div className="p-6 space-y-6">
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-semibold text-slate-700">Current (0-15 Days)</span>
                   </div>
                   <span className="font-bold text-slate-900">₹32.0L</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-semibold text-slate-700">Approaching Limit (16-45 Days)</span>
                   </div>
                   <span className="font-bold text-slate-900">₹48.3L</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 bg-rose-50/50 -mx-6 px-6 pt-3">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-sm font-bold text-rose-800">Overdue (&gt; 45 Days Sec 43B(h))</span>
                   </div>
                   <span className="font-bold text-rose-700">₹4.2L</span>
                </div>

                <button className="w-full mt-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  Export Aging Ledger (CSV)
                </button>
            </div>
        </section>

        {/* Exporter Utility */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
               <h2 className="font-bold text-slate-800">Statutory Data Exporter</h2>
               <p className="text-xs text-slate-500">Download formatted reports for your CA or ERP software.</p>
            </div>
            <div className="p-6 space-y-5">
               
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Report Export Type</label>
                  <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none">
                     <option>GSTR-1 Sales Register Extract</option>
                     <option>Early Payment Yield &amp; Discounting Cost Analysis</option>
                     <option>Exception &amp; Dispute Log</option>
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label>
                     <input type="date" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label>
                     <input type="date" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 outline-none" />
                  </div>
               </div>

               <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-3 text-sm mt-2">
                  <div className="text-blue-600 mt-0.5">
                     <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  </div>
                  <p className="text-blue-800">GSTR-1 extracts are formatted directly for the GST Offline Tool or direct integration with Tally ERP 9.</p>
               </div>
               
               <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-900 mt-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Generate Report Package
               </button>

            </div>
        </section>

      </div>
    </div>
  );
}
