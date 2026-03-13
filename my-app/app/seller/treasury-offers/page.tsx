"use client";

import { useState } from "react";

export default function TreasuryOffersPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "evaluate">("pipeline");
  const [sliderAPR, setSliderAPR] = useState(12); // Dynamic Discount APR
  const invoiceAmount = 1450000; // ₹14.5L
  const daysEarly = 32;

  // Simple formula: Daily Rate * Days Early * Amount
  const discountAmount = Math.round((sliderAPR / 36500) * daysEarly * invoiceAmount);
  const netSettlement = invoiceAmount - discountAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
               The Yield Engine
             </h1>
             <p className="mt-2 text-sm text-slate-500">
               Access internal enterprise liquidity by participating in dynamic discounting programs.
             </p>
           </div>
        </div>
      </header>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-max">
         <button 
           onClick={() => setActiveTab("pipeline")}
           className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pipeline" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            Liquidity Pipeline (Available Offers)
         </button>
         <button 
           onClick={() => setActiveTab("evaluate")}
           className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "evaluate" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            Discount Proposal Engine
         </button>
      </div>

      {activeTab === "pipeline" && (
         <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
               <h2 className="font-bold text-slate-800">Available Early Payment Bids</h2>
               <div className="flex gap-2">
                  <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 font-semibold text-xs">2 Active Bids</span>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                     <tr>
                        <th className="p-4">Enterprise / Invoice</th>
                        <th className="p-4">Original Value</th>
                        <th className="p-4">Days Early</th>
                        <th className="p-4 bg-emerald-50/50">Buyer Bid (APR)</th>
                        <th className="p-4 bg-emerald-50/50">Net Immediate Settlement</th>
                        <th className="p-4 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     
                     <tr className="hover:bg-slate-50 transition">
                        <td className="p-4">
                           <p className="font-bold text-slate-800 text-base">Alpha Corp</p>
                           <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">INV-88203</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">₹14,50,000</td>
                        <td className="p-4 font-semibold text-slate-700">32 Days</td>
                        <td className="p-4 bg-emerald-50/30">
                           <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold whitespace-nowrap">12.0% APR</span>
                        </td>
                        <td className="p-4 bg-emerald-50/30 font-bold text-emerald-700 text-base">
                           ₹14,34,740
                           <p className="font-normal text-[10px] text-slate-500 mt-0.5">Implied cost: ₹15,260</p>
                        </td>
                        <td className="p-4 text-right">
                           <button onClick={() => setActiveTab("evaluate")} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Evaluate</button>
                        </td>
                     </tr>
                     
                     <tr className="hover:bg-slate-50 transition">
                        <td className="p-4">
                           <p className="font-bold text-slate-800 text-base">Nexus Materials</p>
                           <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">INV-99301</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">₹2,30,000</td>
                        <td className="p-4 font-semibold text-slate-700">12 Days</td>
                        <td className="p-4 bg-emerald-50/30">
                           <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold whitespace-nowrap">9.5% APR</span>
                        </td>
                        <td className="p-4 bg-emerald-50/30 font-bold text-emerald-700 text-base">
                           ₹2,29,281
                           <p className="font-normal text-[10px] text-slate-500 mt-0.5">Implied cost: ₹719</p>
                        </td>
                        <td className="p-4 text-right">
                           <button onClick={() => setActiveTab("evaluate")} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Evaluate</button>
                        </td>
                     </tr>

                  </tbody>
               </table>
            </div>
         </section>
      )}

      {activeTab === "evaluate" && (
         <div className="grid gap-6 lg:grid-cols-2">
            
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
               <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">Offer Term Sheet</h2>
                  <span className="rounded bg-slate-200 text-slate-800 px-2 py-1 text-[10px] font-bold tracking-widest uppercase">INV-88203</span>
               </div>
               <div className="p-6 space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                     <span className="text-sm font-semibold text-slate-600">Enterprise Buyer</span>
                     <span className="font-bold text-slate-900">Alpha Corp</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                     <span className="text-sm font-semibold text-slate-600">Maturity Date (Due)</span>
                     <span className="font-bold text-slate-900">14-Apr-2026 (32 days early)</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                     <span className="text-sm font-semibold text-slate-600">Base Invoice Value</span>
                     <span className="font-bold text-slate-900">₹14,50,000</span>
                  </div>
                  
                  <div className="bg-emerald-50 border justify-between flex items-center border-emerald-100 rounded-xl p-4">
                     <div>
                        <span className="block text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Buyer Target Offer</span>
                        <span className="text-2xl font-black text-emerald-900">12.0% <span className="text-sm font-bold opacity-75">APR</span></span>
                     </div>
                     <div className="text-right">
                        <span className="block text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Est. Net Clearing</span>
                        <span className="text-xl font-black text-emerald-700">₹14,34,740</span>
                     </div>
                  </div>

               </div>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm overflow-hidden flex flex-col">
               <div className="border-b border-blue-100 bg-blue-100/50 p-4 shrink-0">
                  <h2 className="font-bold text-blue-900">Discount Proposal Engine</h2>
                  <p className="text-xs text-blue-800 mt-1">Accept the buyer&apos;s target, or slide to counter-offer your desired rate.</p>
               </div>
               <div className="p-6 space-y-8 flex-1 flex flex-col justify-between">
                  
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-700 text-sm">Your Proposal APR</span>
                        <span className="font-bold text-2xl text-blue-700">{sliderAPR.toFixed(1)}%</span>
                     </div>
                     <input 
                        type="range" 
                        min="8" 
                        max="18" 
                        step="0.1" 
                        value={sliderAPR}
                        onChange={(e) => setSliderAPR(Number(e.target.value))}
                        className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                     />
                     <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                        <span>8.0%</span>
                        <span>18.0%</span>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-600">Implied Discount Cost</span>
                        <span className="font-bold text-rose-600">- ₹{discountAmount.toLocaleString("en-IN")}</span>
                     </div>
                     <div className="flex justify-between items-center text-lg">
                        <span className="font-bold text-slate-800">Final Settlement Delivery</span>
                        <span className="font-black text-emerald-700">₹{netSettlement.toLocaleString("en-IN")}</span>
                     </div>
                  </div>

                  {sliderAPR === 12.0 ? (
                     <button className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-sm hover:bg-emerald-700 text-lg transition-colors">
                        Accept Buyer Offer (Immediate Clearing)
                     </button>
                  ) : (
                     <button className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-sm hover:bg-blue-700 text-lg transition-colors">
                        Submit Counter-Offer Bid
                     </button>
                  )}

               </div>
            </section>

         </div>
      )}
    </div>
  );
}
