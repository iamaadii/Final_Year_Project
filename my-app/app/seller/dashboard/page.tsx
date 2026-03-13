"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SellerDashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
               Liquidity Hub
             </h1>
             <p className="mt-2 text-sm text-slate-500">
               Track your outstanding receivables and incoming early payment offers.
             </p>
           </div>
           <div className="flex flex-wrap gap-3">
              <Link href="/seller/invoices" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 transition-colors">
                 + Create / Upload Invoice
              </Link>
              <Link href="/seller/buyers" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                 + Add Counterparty
              </Link>
              <Link href="/seller/reports" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                 Generate Report
              </Link>
           </div>
        </div>
      </header>

      {/* Financial KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</h3>
           <p className="mt-2 text-3xl font-black text-slate-900">₹84.5L</p>
           <p className="mt-2 text-xs font-semibold text-slate-500">Across 12 Buyers</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
           <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Approved &amp; Ready</h3>
           <p className="mt-2 text-3xl font-black text-emerald-900">₹62.0L</p>
           <p className="mt-2 text-xs font-semibold text-emerald-700">Eligible for Early Payment</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
           <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Active Offers</h3>
           <p className="mt-2 text-3xl font-black text-blue-900">3 Bids</p>
           <p className="mt-2 text-xs font-semibold text-blue-700">Click to review yield impact</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
           <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider">At Risk (Overdue)</h3>
           <p className="mt-2 text-3xl font-black text-rose-900">₹4.2L</p>
           <p className="mt-2 text-xs font-semibold text-rose-700">Approaching 45-day MSME Limit</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Urgent Action Items */}
         <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0">
               <h2 className="font-bold text-slate-800">Urgent Action Items</h2>
            </div>
            <div className="p-4 flex-1 space-y-4">
               <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h3 className="font-bold text-blue-900 text-sm">New Discount Offer</h3>
                  <p className="text-xs text-blue-800 mt-1">Alpha Corp offered early settlement at 12% APR.</p>
                  <Link href="/seller/treasury-offers" className="mt-3 inline-block text-xs font-bold text-blue-700 hover:text-blue-900">Review Offer &rarr;</Link>
               </div>
               <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <h3 className="font-bold text-rose-900 text-sm">Disputed Invoice</h3>
                  <p className="text-xs text-rose-800 mt-1">INV-88203 was flagged by Nexus Materials for Price Variance.</p>
                  <Link href="/seller/invoices" className="mt-3 inline-block text-xs font-bold text-rose-700 hover:text-rose-900">Resolve Dispute &rarr;</Link>
               </div>
            </div>
         </div>

         {/* Cash Flow Forecast Chart Placeholder */}
         <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex justify-between items-center">
               <h2 className="font-bold text-slate-800">30/60/90 Day Cash Flow Forecast</h2>
               <select className="text-xs border border-slate-300 rounded px-2 py-1 outline-none text-slate-700 bg-white font-semibold shadow-sm">
                  <option>Next 30 Days</option>
                  <option>Next 60 Days</option>
                  <option>Next 90 Days</option>
               </select>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50/30">
               {/* Decorative Chart Placeholder */}
               <div className="relative w-full max-w-lg h-56 flex">
                   {/* Y-Axis Labels */}
                   <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 pr-2 pb-6 pt-2 items-end">
                      <span>₹50L</span>
                      <span>₹25L</span>
                      <span>0</span>
                   </div>
                   {/* Grid & Chart */}
                   <div className="flex-1 flex items-end justify-between px-6 pb-0 border-b-2 border-l-2 border-slate-300 relative bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:2rem_2rem]">
                       <div className="w-12 bg-indigo-500 rounded-t-sm h-[30%] shadow-md relative group cursor-pointer transition-all hover:bg-indigo-600 hover:-translate-y-1">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 1: ₹15L Expected</div>
                          <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W1</div>
                       </div>
                       <div className="w-12 bg-emerald-500 rounded-t-sm h-[75%] shadow border border-emerald-600 hover:bg-emerald-600 hover:-translate-y-1 transition-all cursor-pointer relative group">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 2: ₹42L Expected</div>
                          <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W2</div>
                       </div>
                       <div className="w-12 bg-purple-500 rounded-t-sm h-[20%] shadow-md relative group cursor-pointer transition-all hover:bg-purple-600 hover:-translate-y-1">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 3: ₹8L Expected</div>
                          <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W3</div>
                       </div>
                       <div className="w-12 bg-amber-500 rounded-t-sm h-[40%] shadow border border-amber-600 hover:bg-amber-600 hover:-translate-y-1 transition-all cursor-pointer relative group">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 font-bold z-10 whitespace-nowrap">Week 4: ₹18L Expected</div>
                          <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-500">W4</div>
                       </div>
                   </div>
               </div>
               <p className="mt-8 text-sm text-slate-500 italic text-center">
                  Predictive chart based on authorized invoice clearing dates and historical buyer payment cycles.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
