"use client";

import { useState } from "react";
import BuyerRouteFrame from "../_components/BuyerRouteFrame";

export default function SettingsPage() {
  const [showAddRule, setShowAddRule] = useState(false);
  const [showConfigureSync, setShowConfigureSync] = useState(false);
  const [showEnableWebhook, setShowEnableWebhook] = useState(false);

  const handleGenericSubmit = (e: React.FormEvent, callback: () => void) => {
    e.preventDefault();
    callback();
  };

  return (
    <BuyerRouteFrame>
      <div className="space-y-6 max-w-4xl mx-auto lg:mx-0 pb-12">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                The Control Room
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                System configuration, RBAC, Multi-Entity management, and Webhooks.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
               <span className="font-semibold text-slate-700">Active Entity:</span>
               <select className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 font-bold text-blue-900 outline-none focus:border-blue-500">
                  <option>Holdings Parent Corp</option>
                  <option>Manufacturing Sub Inc</option>
                  <option>Retail Logistics LLC</option>
               </select>
            </div>
          </div>
        </header>

        {/* Maker/Checker RBAC Config */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
           <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center">
               <div>
                  <h2 className="font-bold text-slate-800">Maker/Checker Authorization Matrix</h2>
                  <p className="text-xs text-slate-500">Configure thresholds for AP processing.</p>
               </div>
               <button onClick={() => setShowAddRule(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">+ Add Rule</button>
           </div>
           <div className="p-6">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-600">
                   <thead className="border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                     <tr>
                       <th className="pb-3 whitespace-nowrap">Action Type</th>
                       <th className="pb-3 whitespace-nowrap">Threshold Limit</th>
                       <th className="pb-3 whitespace-nowrap">Required Roles (Maker)</th>
                       <th className="pb-3 whitespace-nowrap">Required Roles (Checker)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     <tr>
                       <td className="py-4 font-semibold text-slate-800 whitespace-nowrap">Invoice Approval</td>
                       <td className="py-4 text-slate-500 whitespace-nowrap">&lt; ₹5,00,000</td>
                       <td className="py-4 whitespace-nowrap"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">AP_CLERK</span></td>
                       <td className="py-4 whitespace-nowrap"><span className="text-slate-400 italic text-xs">Auto-Approve</span></td>
                     </tr>
                     <tr>
                       <td className="py-4 font-semibold text-slate-800 whitespace-nowrap">Invoice Approval</td>
                       <td className="py-4 text-slate-500 whitespace-nowrap">≥ ₹5,00,000</td>
                       <td className="py-4 whitespace-nowrap"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">AP_CLERK</span></td>
                       <td className="py-4 whitespace-nowrap"><span className="rounded bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">FINANCE_MGR</span></td>
                     </tr>
                     <tr>
                       <td className="py-4 font-semibold text-slate-800 whitespace-nowrap">Early Payment Yield Release</td>
                       <td className="py-4 text-slate-500 whitespace-nowrap">Any</td>
                       <td className="py-4 whitespace-nowrap"><span className="rounded bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">FINANCE_MGR</span></td>
                       <td className="py-4 whitespace-nowrap"><span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">TREASURER</span></td>
                     </tr>
                   </tbody>
                 </table>
               </div>
           </div>
        </section>

        {/* ERP Integrations */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
           <div className="border-b border-slate-200 bg-slate-50 p-4">
               <h2 className="font-bold text-slate-800">ERP &amp; Webhook Integrations</h2>
               <p className="text-xs text-slate-500">Manage real-time sync with SAP/Oracle systems.</p>
           </div>
           <div className="p-6 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4 rounded-xl border border-slate-200 p-4">
                 <div>
                    <h3 className="font-bold text-slate-800">Inbound PO &amp; GRN Sync</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <span className="text-emerald-600 font-semibold">Healthy (Last Ping: 2m ago)</span></p>
                 </div>
                 <button onClick={() => setShowConfigureSync(true)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Configure</button>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-4 rounded-xl border border-slate-200 p-4">
                 <div>
                    <h3 className="font-bold text-slate-800">Payment Instruction Outbound (Webhooks)</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <span className="text-slate-400 font-semibold">Disabled</span></p>
                    <p className="text-xs text-slate-400 mt-1 italic font-mono">https://api.internal-erp.local/v1/settlements</p>
                 </div>
                 <button onClick={() => setShowEnableWebhook(true)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors">Enable Webhook</button>
              </div>
           </div>
        </section>

      </div>

      {/* Add Rule Dialog Placeholder */}
      {showAddRule && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
               <button onClick={() => setShowAddRule(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-2">Add Authorization Rule</h2>
               <p className="text-sm text-slate-500 mb-6">Create a new Maker/Checker rule for your organization.</p>
               <form onSubmit={(e) => handleGenericSubmit(e, () => setShowAddRule(false))} className="space-y-4 text-sm">
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Action Type</label>
                     <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="INVOICE_APPROVAL">Invoice Approval</option>
                        <option value="PAYMENT_RELEASE">Payment Release</option>
                        <option value="VENDOR_ONBOARDING">Vendor Onboarding</option>
                     </select>
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Threshold Limit (₹)</label>
                     <input type="number" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 500000" />
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Required Maker Role</label>
                     <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="AP_CLERK">AP Clerk</option>
                        <option value="FINANCE_MGR">Finance Manager</option>
                        <option value="TREASURER">Treasurer</option>
                     </select>
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 mt-2 transition-colors">Save Rule</button>
               </form>
            </div>
         </div>
      )}

      {/* Configure ERP Sync Dialog Placeholder */}
      {showConfigureSync && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
               <button onClick={() => setShowConfigureSync(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-2">Configure ERP Sync</h2>
               <p className="text-sm text-slate-500 mb-6">Update your ERP credentials and sync interval.</p>
               <form onSubmit={(e) => handleGenericSubmit(e, () => setShowConfigureSync(false))} className="space-y-4 text-sm">
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">API Key</label>
                     <input type="password" value="************************" readOnly className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Sync Interval</label>
                     <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="5m">Every 5 minutes</option>
                        <option value="15m">Every 15 minutes</option>
                        <option value="1h">Every hour</option>
                     </select>
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-900 mt-2 transition-colors">Save Configuration</button>
               </form>
            </div>
         </div>
      )}

      {/* Enable Webhook Dialog Placeholder */}
      {showEnableWebhook && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
               <button onClick={() => setShowEnableWebhook(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-2">Enable Webhook</h2>
               <p className="text-sm text-slate-500 mb-6">Set up your endpoint to receive real-time payment instruction payloads.</p>
               <form onSubmit={(e) => handleGenericSubmit(e, () => setShowEnableWebhook(false))} className="space-y-4 text-sm">
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Endpoint URL</label>
                     <input type="url" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://api.yourdomain.com/webhooks/payments" required />
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Webhook Secret (for HMAC validation)</label>
                     <input type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs" defaultValue="whsec_1234567890abcdef" />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 mt-2 transition-colors">Activate Webhook</button>
               </form>
            </div>
         </div>
      )}
    </BuyerRouteFrame>
  );
}
