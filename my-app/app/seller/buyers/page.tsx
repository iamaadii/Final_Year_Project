"use client";

import { useState } from "react";

export default function BuyersPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
               Counterparty Book
             </h1>
             <p className="mt-2 text-sm text-slate-500">
               Manage your linked Enterprise Buyers, track their payment performance, and invite new partners.
             </p>
           </div>
           <button 
             onClick={() => setShowInviteModal(true)}
             className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
             + Link New Enterprise
           </button>
        </div>
      </header>

      {/* Linked Enterprise Directory */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
         <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Linked Enterprise Network</h2>
            <div className="text-sm font-semibold text-slate-500">
              Showing 3 Active Links
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                     <th className="p-4">Enterprise Buyer</th>
                     <th className="p-4">Linkage Status</th>
                     <th className="p-4">Payment Performance</th>
                     <th className="p-4">Total Volumes (YTD)</th>
                     <th className="p-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition">
                     <td className="p-4">
                        <p className="font-bold text-slate-800 text-base">Alpha Corp</p>
                        <p className="text-xs text-slate-500 mt-0.5">Automotive Manufacturing</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">GST: 27AABCA1234F1Z5</p>
                     </td>
                     <td className="p-4">
                        <span className="rounded bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold leading-5">Active &amp; Verified</span>
                     </td>
                     <td className="p-4">
                        <div className="flex flex-col gap-1">
                           <p className="text-sm font-semibold text-slate-700">Avg: 48 Days</p>
                           <div className="w-full max-w-[120px] bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-400 h-full w-[100%]"></div>
                           </div>
                           <p className="text-[10px] text-rose-600 font-bold">+3 Days Past MSME Limit</p>
                        </div>
                     </td>
                     <td className="p-4">
                        <p className="font-semibold text-slate-900">₹142.5L</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">High Yield Participant</p>
                     </td>
                     <td className="p-4 text-right">
                        <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">View Ledgers</button>
                     </td>
                  </tr>
                  
                  <tr className="hover:bg-slate-50 transition">
                     <td className="p-4">
                        <p className="font-bold text-slate-800 text-base">Nexus Materials</p>
                        <p className="text-xs text-slate-500 mt-0.5">Heavy Infrastructure</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">GST: 07BBDCN8892G1Z9</p>
                     </td>
                     <td className="p-4">
                        <span className="rounded bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold leading-5">Active &amp; Verified</span>
                     </td>
                     <td className="p-4">
                        <div className="flex flex-col gap-1">
                           <p className="text-sm font-semibold text-slate-700">Avg: 32 Days</p>
                           <div className="w-full max-w-[120px] bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[65%]"></div>
                           </div>
                           <p className="text-[10px] text-emerald-600 font-bold">Excellent Compliance</p>
                        </div>
                     </td>
                     <td className="p-4">
                        <p className="font-semibold text-slate-900">₹88.0L</p>
                     </td>
                     <td className="p-4 text-right">
                        <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">View Ledgers</button>
                     </td>
                  </tr>

                  <tr className="hover:bg-slate-50 transition bg-blue-50/30">
                     <td className="p-4">
                        <p className="font-bold text-slate-800 text-base">Zeta Pharmaceuticals</p>
                        <p className="text-xs text-slate-500 mt-0.5">Healthcare</p>
                     </td>
                     <td className="p-4">
                        <span className="rounded bg-blue-100 text-blue-800 px-2.5 py-1 text-xs font-bold leading-5">Pending Buyer Approval</span>
                        <p className="text-[10px] text-slate-500 mt-1">Invite sent 2 days ago</p>
                     </td>
                     <td className="p-4">
                        <p className="text-xs text-slate-400 italic">Not enough data</p>
                     </td>
                     <td className="p-4">
                        <p className="font-semibold text-slate-900">₹0.00</p>
                     </td>
                     <td className="p-4 text-right">
                        <button className="text-sm font-semibold text-slate-500 hover:text-slate-800">Resend Invite</button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </section>

      {/* Invite Modal Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Enterprise</h2>
            <p className="text-sm text-slate-500 mb-6">Enter the buyer&apos;s GSTIN or portal invitation code to establish a B2B pairing.</p>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Enterprise GSTIN</label>
                  <input type="text" placeholder="e.g. 29ABCDE1234F2Z5" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono uppercase" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Finance/AP Email (Optional)</label>
                  <input type="email" placeholder="ap@enterprisename.com" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" />
               </div>
               <button 
                  onClick={() => setShowInviteModal(false)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 mt-2">
                  Send Invitiation Link
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
