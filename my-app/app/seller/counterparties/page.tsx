"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";
import { CSVBulkOnboarder } from "@/components/CSVBulkOnboarder";
import { Portal } from "@/components/Portal";

type CounterpartyLink = {
  _id: string;
  inviteeName: string;
  inviteeEmail?: string;
  inviteeGstin?: string;
  status: "pending" | "active" | "rejected";
  linkType: "buyer" | "vendor";
  inviterId?: { name: string; email: string; companyName: string };
  createdAt: string;
};

export default function CounterpartiesPage() {
  const [links, setLinks] = useState<CounterpartyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", gstin: "", email: "" });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const fetchLinks = async () => {
    try {
      const data = await apiFetch<{ links?: CounterpartyLink[] }>("/api/counterparties/invite");
      setLinks(data.links || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const pendingOut = links.filter((l) => l.status === "pending" && l.linkType === "buyer");
  const pendingIn = links.filter((l) => l.status === "pending" && l.linkType === "vendor");
  const activeBuyers = links.filter((l) => l.status === "active" && (l.linkType === "buyer" || l.linkType === "vendor"));

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSaving(true);
    try {
      await apiFetch("/api/counterparties/invite", {
        method: "POST",
        body: JSON.stringify({
          name: inviteForm.name.trim(),
          gstin: inviteForm.gstin.trim().toUpperCase(),
          email: inviteForm.email.trim(),
          linkType: "buyer",
        }),
      });
      setInviteForm({ name: "", gstin: "", email: "" });
      setShowInviteModal(false);
      fetchLinks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviteSaving(false);
    }
  };

  const handleRespond = async (linkId: string, action: "accept" | "reject") => {
    try {
      await apiFetch("/api/counterparties/respond", {
        method: "PATCH",
        body: JSON.stringify({ linkId, action }),
      });
      fetchLinks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Buyer Connections</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Manage your active buyer relationships and incoming connection requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Upload size={18} />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:translate-y-[-2px] transition-all"
          >
            <UserPlus size={18} />
            Invite Buyer
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-bold text-slate-900">No counterparties found</h3>
          <p className="mt-1 text-sm text-slate-500">Invite a buyer to establish a secure connection for invoicing.</p>
          <button
             onClick={() => setShowInviteModal(true)}
             className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#1b5b6a] border border-[#1b5b6a] shadow-sm hover:bg-slate-50"
          >
            Invite Now
          </button>
        </div>
      ) : (
        <div className="grid gap-8">
          {/* Section: Incoming Requests */}
          {pendingIn.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                Action Required: Connection Requests ({pendingIn.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingIn.map((link) => (
                  <div key={link._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="font-bold text-slate-900 text-lg uppercase">{link.inviterId?.companyName || link.inviterId?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Has invited you to connect for B2B workflow matching.</p>
                    <div className="flex gap-2 mt-5">
                      <button 
                        onClick={() => handleRespond(link._id, "accept")} 
                        className="flex-1 rounded-xl bg-[#1b5b6a] py-2 text-xs font-bold text-white hover:bg-[#154652] transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRespond(link._id, "reject")} 
                        className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Pipeline */}
          <div className="grid gap-8 md:grid-cols-2">
             <section className="space-y-4">
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Connections ({activeBuyers.length})</h2>
               <div className="space-y-3">
                 {activeBuyers.length === 0 && <p className="text-sm text-slate-400">No active buyers yet.</p>}
                 {activeBuyers.map((link) => (
                   <div key={link._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-emerald-500">
                     <div>
                       <p className="font-bold text-slate-900">{link.linkType === "buyer" ? link.inviteeName : (link.inviterId?.companyName || link.inviterId?.name)}</p>
                       <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-tight mt-0.5">Securely Connected • {new Date(link.createdAt).toLocaleDateString("en-IN")}</p>
                     </div>
                     <span className="text-[10px] font-bold text-slate-400">ID: ...{link._id.slice(-6)}</span>
                   </div>
                 ))}
               </div>
             </section>

             <section className="space-y-4">
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Pending Sent ({pendingOut.length})</h2>
               <div className="space-y-3">
                 {pendingOut.length === 0 && <p className="text-sm text-slate-400 italic">No outgoing invites.</p>}
                 {pendingOut.map((link) => (
                   <div key={link._id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm border-l-4 border-l-slate-300">
                     <p className="font-bold text-slate-700">{link.inviteeName}</p>
                     <p className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">Awaiting Client Response {link.inviteeEmail ? `(${link.inviteeEmail})` : ""}</p>
                   </div>
                 ))}
               </div>
             </section>
          </div>
        </div>
      )}

      {showInviteModal && (
        <Portal>
          <div 
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300"
            onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
          >
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative mt-20 animate-in zoom-in-95 slide-in-from-top-4 duration-300 border border-slate-200">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Connect New Buyer</h2>
            <p className="text-sm text-slate-500 mb-8 font-medium">Invite a client to establish a secure multi-party transaction hub.</p>

            <form onSubmit={submitInvite} className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Business Name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] font-medium"
                  placeholder="Legal Entity Name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Business GSTIN (Optional)</label>
                <input
                  type="text"
                  value={inviteForm.gstin}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, gstin: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] font-mono uppercase"
                  placeholder="27AABCN1234Q1Z8"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Finance Email (Optional)</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] font-medium"
                  placeholder="accounts@business.com"
                />
              </div>
              <button
                type="submit"
                disabled={inviteSaving}
                className="w-full rounded-2xl bg-[#0f1b2d] py-4 text-sm font-black text-white shadow-xl hover:bg-[#142338] mt-4 disabled:opacity-60 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {inviteSaving ? "Sending Invitation..." : "Send Secure Invitation"}
              </button>
            </form>
          </div>
        </div>
      </Portal>
    )}

      <CSVBulkOnboarder 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
        linkType="buyer"
        onSuccess={(count) => {
          fetchLinks();
          alert(`Successfully onboarded ${count} counterparties!`);
        }}
      />
    </div>
  );
}
