"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"identity" | "bank" | "team">("identity");

  // Security State
  const [isRevealed, setIsRevealed] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Dialog States
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);

  const handleRevealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
       setIsRevealed(true);
       setShowPasswordDialog(false);
       setPassword("");
       setPasswordError("");
    } else {
       setPasswordError("Incorrect password. Try 'admin123'");
    }
  };

  const handleGenericSubmit = (e: React.FormEvent, callback: () => void) => {
    e.preventDefault();
    callback();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto lg:mx-0 pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
               The Trust Anchor
             </h1>
             <p className="mt-2 text-sm text-slate-500">
               Manage your enterprise identity, verified bank channels, and team access.
             </p>
           </div>
        </div>
      </header>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-max overflow-x-auto max-w-full">
         <button 
           onClick={() => setActiveTab("identity")}
           className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "identity" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            Statutory Identity Wallet
         </button>
         <button 
           onClick={() => setActiveTab("bank")}
           className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            Bank Accounts
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
         </button>
         <button 
           onClick={() => setActiveTab("team")}
           className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "team" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            Team Access
         </button>
      </div>

      {activeTab === "identity" && (
         <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
               <div>
                  <h2 className="font-bold text-slate-800">Statutory Identities</h2>
                  <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">
                    Trust Profile: 100%
                  </div>
               </div>
               {!isRevealed && (
                  <button onClick={() => setShowPasswordDialog(true)} className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 shadow-sm transition-colors flex items-center gap-2">
                     <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m0 0v2m0-2h-2m2 0h2m-6-5a4 4 0 118 0v2H8v-2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                     Reveal Secure Info
                  </button>
               )}
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-3">
               
               <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm relative overflow-hidden flex flex-col h-[160px]">
                  <div className="absolute top-0 right-0 p-3">
                     <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </div>
                  <h3 className="font-bold text-emerald-900 text-sm tracking-widest uppercase mb-1 flex-1">Goods &amp; Service Tax</h3>
                  <div>
                     <p className={`text-xl font-mono text-slate-800 font-bold mb-1 ${!isRevealed ? "select-none blur-sm opacity-60" : ""}`}>
                        {isRevealed ? "27AABCA1234F1Z5" : "●●●●●●●●●●●●●●●"}
                     </p>
                     <p className="text-[10px] text-slate-500 font-semibold uppercase">Verified: Jan 12, 2024</p>
                  </div>
               </div>

               <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm relative overflow-hidden flex flex-col h-[160px]">
                  <div className="absolute top-0 right-0 p-3">
                     <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </div>
                  <h3 className="font-bold text-emerald-900 text-sm tracking-widest uppercase mb-1 flex-1">Permanent Account No</h3>
                  <div>
                     <p className={`text-xl font-mono text-slate-800 font-bold mb-1 ${!isRevealed ? "select-none blur-sm opacity-60" : ""}`}>
                        {isRevealed ? "AABCA1234F" : "●●●●●●●●●●"}
                     </p>
                     <p className="text-[10px] text-slate-500 font-semibold uppercase">Verified via NSDL</p>
                  </div>
               </div>

               <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 shadow-sm relative overflow-hidden flex flex-col h-[160px]">
                  <div className="absolute top-0 right-0 p-3">
                     <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Action Required</span>
                  </div>
                  <h3 className="font-bold text-amber-900 text-sm tracking-widest uppercase mb-1 flex-1">Udyam Registration</h3>
                  <div>
                     {isRevealed ? (
                        <div className="space-y-2">
                           <input type="text" placeholder="UDYAM-MH-00-1234567" className="w-full text-xs font-mono uppercase rounded border border-slate-300 px-2 py-1 outline-none focus:border-blue-500" />
                           <button className="rounded px-3 py-1.5 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm w-full transition-colors">Verify Udyam</button>
                        </div>
                     ) : (
                        <div>
                           <p className="text-[11px] text-amber-800 font-medium mb-3 italic">Not Linked. Link Udyam to enforce MSME 45-day protection SLA.</p>
                           <button onClick={() => setShowPasswordDialog(true)} className="rounded px-3 py-1.5 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm w-full transition-colors">Verify Udyam</button>
                        </div>
                     )}
                  </div>
               </div>

            </div>
         </section>
      )}

      {activeTab === "bank" && (
         <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
               <h2 className="font-bold text-slate-800">Penny Drop Verified Accounts</h2>
               <button onClick={() => setShowAddAccount(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 rounded-lg px-3 py-1 hover:bg-blue-100">+ Add Account</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                     <tr>
                        <th className="p-4 whitespace-nowrap">Bank Profile</th>
                        <th className="p-4 whitespace-nowrap">Account Number</th>
                        <th className="p-4 whitespace-nowrap">Holder Name (Match)</th>
                        <th className="p-4 whitespace-nowrap">Penny Drop Status</th>
                        <th className="p-4"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     <tr className="hover:bg-slate-50 transition">
                        <td className="p-4">
                           <p className="font-bold text-slate-800 text-base whitespace-nowrap">HDFC Bank</p>
                           <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">IFSC: HDFC0001234</p>
                           <p className="text-[10px] text-slate-400 mt-1 uppercase whitespace-nowrap">Primary Settlement</p>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-700 whitespace-nowrap">XXXX-XXXX-8921</td>
                        <td className="p-4 font-semibold text-slate-700 whitespace-nowrap">Alpha Manufacturing Pvt Ltd</td>
                        <td className="p-4 whitespace-nowrap">
                           <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold">Verified Match</span>
                        </td>
                        <td className="p-4 text-right">
                           <button className="text-sm font-semibold text-slate-500 hover:text-slate-800">Edit</button>
                        </td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition opacity-60">
                        <td className="p-4">
                           <p className="font-bold text-slate-800 text-base whitespace-nowrap">State Bank of India</p>
                           <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">IFSC: SBIN004321</p>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-700 whitespace-nowrap">XXXX-XXXX-1102</td>
                        <td className="p-4 font-semibold text-slate-700 whitespace-nowrap">Alpha Mfg</td>
                        <td className="p-4 whitespace-nowrap">
                           <span className="rounded bg-rose-100 text-rose-800 px-2 py-1 text-xs font-bold">Mismatch Failed</span>
                        </td>
                        <td className="p-4 text-right">
                           <button className="text-sm font-semibold text-rose-600 hover:text-rose-800">Resolve</button>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </section>
      )}


      {activeTab === "team" && (
         <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
               <h2 className="font-bold text-slate-800">Team Access Control (RBAC)</h2>
               <button onClick={() => setShowInviteUser(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 rounded-lg px-3 py-1 hover:bg-blue-100">+ Invite User</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                     <tr>
                        <th className="p-4 whitespace-nowrap">Operator Name</th>
                        <th className="p-4 whitespace-nowrap">Role Assignment</th>
                        <th className="p-4 whitespace-nowrap">Last Active</th>
                        <th className="p-4"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     <tr className="hover:bg-slate-50 transition">
                        <td className="p-4 whitespace-nowrap">
                           <p className="font-bold text-slate-800">Prashant Rao</p>
                           <p className="text-xs text-slate-500 mt-0.5">prashant.rao@alphacorp.in</p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                           <span className="rounded bg-slate-200 text-slate-800 px-2 py-1 text-xs font-bold">OWNER</span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs whitespace-nowrap">Today, 09:41 AM</td>
                        <td className="p-4 text-right text-slate-400 whitespace-nowrap">-</td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition">
                        <td className="p-4 whitespace-nowrap">
                           <p className="font-bold text-slate-800">Nisha Gupta</p>
                           <p className="text-xs text-slate-500 mt-0.5">n.gupta@alphacorp.in</p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                           <span className="rounded bg-blue-100 text-blue-800 px-2 py-1 text-xs font-bold">TREASURY_CLERK</span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs whitespace-nowrap">Yesterday, 14:12 PM</td>
                        <td className="p-4 text-right whitespace-nowrap">
                           <button className="text-sm font-semibold text-blue-600 hover:underline">Manage</button>
                        </td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition">
                        <td className="p-4 whitespace-nowrap">
                           <p className="font-bold text-slate-800">Ajay Verma</p>
                           <p className="text-xs text-slate-500 mt-0.5">a.verma@alphacorp.in</p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                           <span className="rounded bg-amber-100 text-amber-800 px-2 py-1 text-xs font-bold">BILLING_ADMIN</span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs whitespace-nowrap">10 Mar 2026</td>
                        <td className="p-4 text-right whitespace-nowrap">
                           <button className="text-sm font-semibold text-blue-600 hover:underline">Manage</button>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </section>
      )}

      {/* Password Reveal Dialog */}
      {showPasswordDialog && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
               <button 
                  onClick={() => { setShowPasswordDialog(false); setPasswordError(""); setPassword(""); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
               >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-2">Security Challenge</h2>
               <p className="text-sm text-slate-500 mb-6">Enter your account password to reveal sensitive details (PAN, GSTIN).</p>
               
               <form onSubmit={handleRevealSubmit} className="space-y-4 text-sm">
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Password</label>
                     <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-1 ${passwordError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
                        placeholder="••••••••"
                        autoFocus
                     />
                     {passwordError && <p className="text-rose-500 text-xs mt-1.5 font-semibold">{passwordError}</p>}
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-900 mt-2 transition-colors">
                     Unlock Data
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Add Account Dialog Placeholder */}
      {showAddAccount && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
               <button onClick={() => setShowAddAccount(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-2">Add Bank Account</h2>
               <p className="text-sm text-slate-500 mb-6">Enter details for automated Penny Drop verification.</p>
               <form onSubmit={(e) => handleGenericSubmit(e, () => setShowAddAccount(false))} className="space-y-4 text-sm">
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Account Number</label>
                     <input type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 50100293849" />
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">IFSC Code</label>
                     <input type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase font-mono" placeholder="HDFC0001234" />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 mt-2 transition-colors">Initiate Verification</button>
               </form>
            </div>
         </div>
      )}

      {/* Invite User Dialog Placeholder */}
      {showInviteUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
               <button onClick={() => setShowInviteUser(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-2">Invite Team Member</h2>
               <p className="text-sm text-slate-500 mb-6">Send an invite link to onboard a new operator to your workspace.</p>
               <form onSubmit={(e) => handleGenericSubmit(e, () => setShowInviteUser(false))} className="space-y-4 text-sm">
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
                     <input type="email" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="colleague@company.com" />
                  </div>
                  <div>
                     <label className="block font-semibold text-slate-700 mb-1.5">Assign Role</label>
                     <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="TREASURY_CLERK">Treasury Clerk</option>
                        <option value="BILLING_ADMIN">Billing Admin</option>
                        <option value="VIEWER">Viewer Only</option>
                     </select>
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-900 mt-2 transition-colors">Send Invitation</button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}
