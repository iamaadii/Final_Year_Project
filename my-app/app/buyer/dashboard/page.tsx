"use client";

import Link from "next/link";
import BuyerRouteFrame from "../_components/BuyerRouteFrame";

export default function BuyerDashboardPage() {
  return (
    <BuyerRouteFrame>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                The Command Center
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Phase 1 SaaS MVP: 45-day MSME Rule Tracking, Procurement Alerts, and Yield Pipeline.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/buyer/ap-hub" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 transition-colors">
                + Create AP Invoice
              </Link>
              <Link href="/buyer/vendors" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                 Link New Vendor
              </Link>
              <Link href="/buyer/reports" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                Generate Report
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* MSME Compliance Radar */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <h2 className="font-bold text-slate-800">MSME Compliance Radar (45-Day Rule)</h2>
              <p className="text-xs text-slate-500">Section 43B(h) compliance monitor across all vendors.</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">At Risk (30-45 Days)</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-rose-900">12</p>
                  <p className="mt-1 text-xs text-rose-700">Invoices nearing breach</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Approaching (15-30 Days)</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-amber-900">45</p>
                  <p className="mt-1 text-xs text-amber-700">In workflow</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Safe (&lt;15 Days)</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-900">328</p>
                  <p className="mt-1 text-xs text-emerald-700">Recently uploaded</p>
                </div>
              </div>

              {/* Cash Outflow Predictor Placeholder */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                 <h3 className="text-sm font-bold text-slate-800 mb-4 inline-block bg-slate-100 rounded-lg px-3 py-1">30-Day Cash Outflow Projection</h3>
                 <div className="relative w-full h-56 flex">
                     {/* Y-Axis Labels */}
                     <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 pr-2 pb-6 pt-2 items-end">
                        <span>₹100L</span>
                        <span>₹50L</span>
                        <span>0</span>
                     </div>
                     {/* Grid & Chart */}
                     <div className="flex-1 flex items-end justify-between px-6 pb-0 border-b-2 border-l-2 border-slate-300 relative bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:2rem_2rem]">
                         <div className="w-16 bg-rose-500 rounded-t-sm h-[60%] shadow-md relative group cursor-pointer transition-all hover:bg-rose-600 hover:-translate-y-1">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 1: ₹60L Outflow</div>
                            <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W1</div>
                         </div>
                         <div className="w-16 bg-amber-500 rounded-t-sm h-[85%] shadow border border-amber-600 hover:bg-amber-600 hover:-translate-y-1 transition-all cursor-pointer relative group">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 2: ₹85L Outflow</div>
                            <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W2</div>
                         </div>
                         <div className="w-16 bg-indigo-500 rounded-t-sm h-[30%] shadow-md relative group cursor-pointer transition-all hover:bg-indigo-600 hover:-translate-y-1">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 3: ₹30L Outflow</div>
                            <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W3</div>
                         </div>
                         <div className="w-16 bg-emerald-500 rounded-t-sm h-[40%] shadow border border-emerald-600 hover:bg-emerald-600 hover:-translate-y-1 transition-all cursor-pointer relative group">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 4: ₹40L Outflow</div>
                            <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W4</div>
                         </div>
                     </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Treasury Yield Tracker */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="font-bold text-slate-800">Treasury Yield Tracker</h2>
                <p className="text-xs text-slate-500">Returns generated via Dynamic Discounting.</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-slate-600">Yield Realized (MTD)</span>
                    <span className="text-sm font-bold text-emerald-600">₹4.2L</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 w-[65%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-slate-600">Target Pipeline</span>
                    <span className="text-sm font-bold text-blue-600">₹8.5L</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2.5 w-[35%] rounded-full"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 leading-snug">Average return on liquidity deployed is <strong className="text-slate-800">11.4% APR</strong> over the trailing 30 days.</p>
                </div>
              </div>
            </div>

            {/* Procurement Bottleneck Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="font-bold text-slate-800">Bottleneck Alerts</h2>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="p-4 flex gap-3">
                  <div className="mt-0.5 flex-shrink-0"><span className="flex h-2 w-2 rounded-full bg-amber-500 mt-1"></span></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">GRN Pending: 14 Invoices</p>
                    <p className="text-xs text-slate-500 mt-0.5">Stuck at Warehouse B receiving desk.</p>
                  </div>
                </div>
                <div className="p-4 flex gap-3">
                  <div className="mt-0.5 flex-shrink-0"><span className="flex h-2 w-2 rounded-full bg-rose-500 mt-1"></span></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Price Mismatch: XYZ Corp</p>
                    <p className="text-xs text-slate-500 mt-0.5">PO #40292 exceeds standard tolerance limit.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuyerRouteFrame>
  );
}
