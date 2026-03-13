"use client";

import BuyerRouteFrame from "../_components/BuyerRouteFrame";

export default function TreasuryPage() {
  return (
    <BuyerRouteFrame>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Treasury & Yield Generator
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage internal liquidity allocation, dynamic discounting rules, and the early payment ledger.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                Pause All Programs
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Liquidity Allocation & Sliders */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex justify-between items-center">
               <div>
                  <h2 className="font-bold text-slate-800">Dynamic Discounting Program Config</h2>
                  <p className="text-xs text-slate-500">Only internal treasury funds are utilized.</p>
               </div>
               <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold tracking-widest uppercase">Active</span>
            </div>
            <div className="p-6 space-y-8">
               
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-slate-700">Total Allocated Liquidity Pool</span>
                     <span className="font-bold text-2xl text-slate-900">₹50 Cr</span>
                  </div>
                  <input type="range" min="10" max="100" defaultValue="50" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                     <span>₹10 Cr</span>
                     <span>₹100 Cr</span>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-slate-700">Target APR Yield Rule</span>
                     <span className="font-bold text-2xl text-blue-700">12.0%</span>
                  </div>
                  <input type="range" min="8" max="18" step="0.5" defaultValue="12" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                     <span>8.0%</span>
                     <span>18.0%</span>
                  </div>
               </div>

               <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-4 items-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">i</div>
                  <div>
                     <p className="font-semibold text-blue-900">Auto-Offer Enabled</p>
                     <p className="text-sm text-blue-800 mt-1">Vendors will automatically see an early payment slider in their dashboard calculated against the target 12.0% APR curve over their respective invoice remaining duration.</p>
                  </div>
               </div>
               
               <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-sm hover:bg-blue-700">Update Liquidity Parameters</button>
            </div>
          </div>

           {/* Manual Bid Desk / Early Payment Ledger */}
           <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Manual Bid Desk & Settlement Ledger</h2>
                <p className="text-xs text-slate-500">Review requested discounts for immediate clearing.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Invoice Value</th>
                    <th className="p-4 text-center">Implied APR</th>
                    <th className="p-4 text-right">Net Payout</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">A1 Suppliers</p>
                      <p className="text-[10px] text-slate-500 uppercase">INV-0912</p>
                    </td>
                    <td className="p-4 font-medium text-slate-900">₹5,00,000</td>
                    <td className="p-4 text-center">
                       <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">14.5%</span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                       ₹4,92,500
                       <p className="text-[10px] text-slate-500 font-normal mt-0.5 whitespace-nowrap">Includes ₹1k TDS cutoff</p>
                    </td>
                    <td className="p-4 text-right">
                       <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Clear</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">Nexus Materials</p>
                      <p className="text-[10px] text-slate-500 uppercase">INV-4411</p>
                    </td>
                    <td className="p-4 font-medium text-slate-900">₹12,40,000</td>
                    <td className="p-4 text-center">
                       <span className="rounded bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800">9.2%</span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                       ₹12,28,000
                    </td>
                    <td className="p-4 text-right">
                       <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Counter</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </BuyerRouteFrame>
  );
}
