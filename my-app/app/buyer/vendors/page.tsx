"use client";

import BuyerRouteFrame from "../_components/BuyerRouteFrame";

export default function VendorsPage() {
  return (
    <BuyerRouteFrame>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Vendor Management System
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Onboarding pipeline, compliance vetting, and performance tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100">
                Upload CSV / ERP Sync
              </button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                + Generate Magic Invite Link
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Onboarding Pipeline */}
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Onboarding Pipeline</h2>
            <div className="grid gap-4 sm:grid-cols-3">
               
               <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Invited (4)</h3>
                  <div className="space-y-3">
                     <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <p className="font-semibold text-slate-800">Star Packaging</p>
                        <p className="text-xs text-slate-500 mt-1">Sent 2 days ago</p>
                     </div>
                     <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <p className="font-semibold text-slate-800">Lumos Tech</p>
                        <p className="text-xs text-slate-500 mt-1">Resent today</p>
                     </div>
                  </div>
               </div>

               <div className="rounded-2xl border border-blue-200 bg-blue-50/20 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4">Under Review (2)</h3>
                  <div className="space-y-3">
                     <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                        <p className="font-semibold text-slate-800">Delta Logistics</p>
                        <p className="text-xs text-slate-500 mt-1">Pending Udyam Verification</p>
                     </div>
                  </div>
               </div>

               <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4">Verified (128)</h3>
                  <div className="space-y-3">
                     <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start">
                           <p className="font-semibold text-slate-800">Nexus Materials</p>
                           <span className="flex h-2 w-2 rounded-full bg-emerald-500 mt-1.5"></span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">GSTIN MATCH</p>
                     </div>
                     <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start">
                           <p className="font-semibold text-slate-800">Alpha Core</p>
                           <span className="flex h-2 w-2 rounded-full bg-emerald-500 mt-1.5"></span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">GSTIN / UDYAM MATCH</p>
                     </div>
                  </div>
               </div>
               
            </div>
          </div>

          {/* Supplier Performance Leaderboard */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0">
               <h2 className="font-bold text-slate-800">Performance Leaderboard</h2>
               <p className="text-xs text-slate-500">Ranked by lowest exception rate & OTIF.</p>
            </div>
            <div className="p-0 overflow-y-auto">
               <ul className="divide-y divide-slate-100 text-sm">
                  <li className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                     <div>
                        <p className="font-bold text-slate-800">1. Alpha Core</p>
                        <p className="text-xs text-slate-500">0.2% Dispute Rate</p>
                     </div>
                     <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">A+</span>
                  </li>
                  <li className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                     <div>
                        <p className="font-bold text-slate-800">2. Nexus Materials</p>
                        <p className="text-xs text-slate-500">0.8% Dispute Rate</p>
                     </div>
                     <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">A</span>
                  </li>
                  <li className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                     <div>
                        <p className="font-bold text-slate-800">3. TechCorp India</p>
                        <p className="text-xs text-slate-500">2.1% Dispute Rate</p>
                     </div>
                     <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">B+</span>
                  </li>
                  <li className="p-4 hover:bg-rose-50/50 bg-rose-50/30 transition flex items-center justify-between">
                     <div>
                        <p className="font-bold text-slate-800">48. Generic Supply</p>
                        <p className="text-xs text-slate-500">18.4% Dispute Rate</p>
                     </div>
                     <span className="rounded bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800">C-</span>
                  </li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </BuyerRouteFrame>
  );
}
