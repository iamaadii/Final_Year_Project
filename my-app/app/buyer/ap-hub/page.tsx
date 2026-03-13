"use client";

import BuyerRouteFrame from "../_components/BuyerRouteFrame";

export default function ApHubPage() {
  return (
    <BuyerRouteFrame>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                AP Processing Hub
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Exception Queue, 3-Way Match interface, and bulk processing actions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                Export Queue
              </button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Process Selected (Bulk)
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Exception & Dispute Queue Table */}
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Action Required Queue</h2>
                <p className="text-xs text-slate-500">Invoices failing straight-through processing.</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-rose-100 text-rose-700 px-3 py-1 font-semibold">12 Critical</span>
                <span className="rounded-full bg-slate-200 text-slate-700 px-3 py-1 font-semibold">45 Total</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="p-4 w-12"><input type="checkbox" className="rounded" /></th>
                    <th className="p-4">Invoice / Vendor</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Exception Reason</th>
                    <th className="p-4">Aging</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition bg-rose-50/30">
                    <td className="p-4"><input type="checkbox" className="rounded" /></td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">INV-88203</p>
                      <p className="text-xs text-slate-500">TechCorp India</p>
                    </td>
                    <td className="p-4 font-medium text-slate-900">₹14,50,000</td>
                    <td className="p-4"><span className="rounded-md bg-rose-100 text-rose-700 px-2 py-1 text-[11px] font-semibold">Price Variance</span></td>
                    <td className="p-4 flex items-center gap-2">
                       <span className="text-rose-600 font-bold">28 Days</span>
                       <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                    </td>
                    <td className="p-4 text-right">
                       <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Review</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="p-4"><input type="checkbox" className="rounded" /></td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">INV-99301</p>
                      <p className="text-xs text-slate-500">Global Supply Ltd</p>
                    </td>
                    <td className="p-4 font-medium text-slate-900">₹2,30,000</td>
                    <td className="p-4"><span className="rounded-md bg-amber-100 text-amber-700 px-2 py-1 text-[11px] font-semibold">Missing GRN</span></td>
                    <td className="p-4 font-medium text-amber-600">12 Days</td>
                    <td className="p-4 text-right">
                       <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Review</button>
                    </td>
                  </tr>
                   <tr className="hover:bg-slate-50 transition">
                    <td className="p-4"><input type="checkbox" className="rounded" /></td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">INV-88910</p>
                      <p className="text-xs text-slate-500">Apex Machinery</p>
                    </td>
                    <td className="p-4 font-medium text-slate-900">₹8,90,000</td>
                    <td className="p-4"><span className="rounded-md bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold">Tax Mismatch</span></td>
                    <td className="p-4 text-slate-600">4 Days</td>
                    <td className="p-4 text-right">
                       <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Review</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
              Showing 3 of 45 exceptions
            </div>
          </div>

          {/* 3-Way Match Split View Demo Pane */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-800 p-4 shrink-0 flex justify-between items-center text-white">
              <h2 className="font-bold">Match Interface: INV-88203</h2>
            </div>
            <div className="p-0 flex-1 flex flex-col divide-y divide-slate-100 text-sm">
               <div className="p-4 bg-rose-50/50">
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-slate-800">Invoice Document</span>
                     <span className="font-bold text-slate-900">₹14,50,000</span>
                  </div>
                  <p className="text-xs text-slate-500">Qty: 100 units @ ₹14,500/ea</p>
               </div>
               <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-slate-800">Purchase Order (PO)</span>
                     <span className="font-bold text-emerald-600">₹14,00,000</span>
                  </div>
                  <p className="text-xs text-slate-500">Qty: 100 units @ ₹14,000/ea</p>
               </div>
               <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-slate-800">Goods Receipt (GRN)</span>
                     <span className="font-bold text-emerald-600">100 / 100</span>
                  </div>
                  <p className="text-xs text-slate-500">Received physically at WH-A</p>
               </div>
               
               <div className="p-4 bg-slate-50 flex flex-col gap-3 mt-auto">
                 <p className="text-xs font-semibold text-rose-600 mb-1">Variance: ₹50,000 (Unit Price exceeds PO by ₹500)</p>
                 <div className="flex gap-2">
                    <button className="w-full rounded-xl bg-blue-600 py-2 font-semibold text-white shadow-sm hover:bg-blue-700">Approve Override</button>
                 </div>
                 <button className="w-full rounded-xl border border-slate-300 bg-white py-2 font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Initiate Chat Dispute</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </BuyerRouteFrame>
  );
}
