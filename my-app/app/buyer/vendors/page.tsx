"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";
import { CSVBulkOnboarder } from "@/components/CSVBulkOnboarder";
import { Portal } from "@/components/Portal";

type CounterpartyLink = {
  _id: string;
  inviteeName: string;
  inviteeEmail?: string;
  inviteeGstin?: string;
  inviteeId?: string;
  inviteeCompanyId?: string;
  status: "pending" | "active" | "rejected";
  linkType: "buyer" | "vendor";
  inviterId?: { _id: string; name: string; email: string; companyName: string };
  isFinancingVisible?: boolean;
  createdAt: string;
};

type SellerApi = {
  _id: string;
  name: string;
  email?: string;
  gstNumber?: string;
  udhyamNumber?: string;
  createdAt?: string;
  reliabilityScore?: number;
  breakdown?: { disputed?: number; total?: number } | null;
};

export default function VendorsPage() {
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<CounterpartyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", gstin: "", email: "" });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sellers, setSellers] = useState<SellerApi[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setSellersLoading(true);
      try {
        const [linksData, sellersData] = await Promise.all([
          apiFetch<{ links?: CounterpartyLink[] }>("/api/counterparties/invite"),
          apiFetch<{ sellers?: SellerApi[] }>("/api/sellers")
        ]);
        setLinks(linksData.links || []);
        setSellers(sellersData.sellers || []);
      } catch (err) {
        console.error("Failed to load vendor data:", err);
      } finally {
        setLoading(false);
        setSellersLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "invite") {
      setShowInviteModal(true);
    }
  }, [searchParams]);

  const pendingOut = links.filter((l) => l.status === "pending" && l.linkType === "vendor");
  const activeVendors = links.filter((l) => l.status === "active" && (l.linkType === "vendor" || l.linkType === "buyer"));
  const pendingIn = links.filter((l) => l.status === "pending" && l.linkType === "buyer");

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
          linkType: "vendor",
        }),
      });
      setInviteForm({ name: "", gstin: "", email: "" });
      setShowInviteModal(false);
      
      const data = await apiFetch<{ links?: CounterpartyLink[] }>("/api/counterparties/invite");
      setLinks(data.links || []);
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
      const data = await apiFetch<{ links?: CounterpartyLink[] }>("/api/counterparties/invite");
      setLinks(data.links || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  const toggleFinancing = async (linkId: string, currentStatus: boolean | undefined) => {
    try {
      await apiFetch("/api/counterparties/toggle-financing", {
        method: "PATCH",
        body: JSON.stringify({ linkId, isFinancingVisible: !currentStatus }),
      });
      // Refresh both to ensure UI is in sync
      const [linksData, sellersData] = await Promise.all([
        apiFetch<{ links?: CounterpartyLink[] }>("/api/counterparties/invite"),
        apiFetch<{ sellers?: SellerApi[] }>("/api/sellers")
      ]);
      setLinks(linksData.links || []);
      setSellers(sellersData.sellers || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  return (
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
            <button 
              onClick={() => setShowBulkModal(true)}
              className="rounded-xl border border-[#cfe8e6] bg-[#e0f2f1]/50 px-4 py-2 text-sm font-semibold text-[#1b5b6a] shadow-sm hover:bg-[#e0f2f1]"
            >
              Upload CSV / ERP Sync
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142338]"
            >
              + Generate Magic Invite Link
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No vendors connected"
            description="Invite your first supplier to start secure invoicing and PO workflows."
            primaryCTA={{ label: "Invite Vendor", onClick: () => setShowInviteModal(true) }}
          />
        </div>
      ) : (
        <div className="grid gap-8">
          {/* Active Vendor Management Table */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Connected Suppliers</h2>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">
                {sellers.length} ACTIVE
              </span>
            </div>
            
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {sellersLoading ? (
                <div className="p-12 text-center text-slate-400 animate-pulse font-medium">Loading vendor metrics...</div>
              ) : sellers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">
                  No active vendors found in the directory.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Supplier Details</th>
                        <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Reliability Score</th>
                        <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Transaction Volume</th>
                        <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Financing Status</th>
                        <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-[10px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sellers.map((seller) => {
                        // Find the corresponding link for the toggle
                        const link = activeVendors.find(l => 
                          String(l.inviteeId) === seller._id || 
                          String((l.inviterId as any)?._id) === seller._id
                        );
                        
                        return (
                          <tr key={seller._id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-[#1b5b6a] group-hover:text-white transition-all">
                                  {seller.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-none mb-1">{seller.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{seller.gstNumber || "NO GSTIN"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${getReliabilityColor(seller.reliabilityScore || 0)}`}>
                                {seller.reliabilityScore || 50}/100
                              </div>
                            </td>
                            <td className="p-5">
                              <p className="font-bold text-slate-900">INR {((seller as any).totalBusiness || 0).toLocaleString("en-IN")}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Across {(seller as any).invoiceCount || 0} Invoices</p>
                            </td>
                            <td className="p-5">
                              <button 
                                onClick={() => link && toggleFinancing(link._id, link.isFinancingVisible)}
                                disabled={!link}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black tracking-wider transition-all duration-300 ${
                                  link?.isFinancingVisible 
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                    : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 grayscale"
                                }`}
                              >
                                {link?.isFinancingVisible ? "ELIGIBLE" : "INELIGIBLE"}
                              </button>
                            </td>
                            <td className="p-5 text-right">
                              <a 
                                href={`/buyer/invoices?vendorId=${seller._id}`}
                                className="text-[10px] font-black uppercase tracking-widest text-[#1b5b6a] hover:text-[#0f1b2d] border-b-2 border-transparent hover:border-[#1b5b6a] transition-all"
                              >
                                View Ledger
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Connection Pipeline */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Connection Pipeline</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Pending Sent ({pendingOut.length})</h3>
                <div className="space-y-3">
                  {pendingOut.length === 0 && <p className="text-xs text-slate-400">No pending invites.</p>}
                  {pendingOut.map((link) => (
                    <div key={link._id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <p className="font-semibold text-slate-800">{link.inviteeName}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">Awaiting Supplier Response</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/30 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#1b5b6a] uppercase tracking-widest mb-4">Incoming Requests ({pendingIn.length})</h3>
                <div className="space-y-3">
                  {pendingIn.length === 0 && <p className="text-xs text-slate-400">No incoming invites.</p>}
                  {pendingIn.map((link) => (
                    <div key={link._id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <p className="font-semibold text-slate-800">{link.inviterId?.companyName || link.inviterId?.name}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleRespond(link._id, "accept")} className="text-[10px] font-bold bg-[#1b5b6a] text-white px-3 py-1 rounded-lg">Accept</button>
                        <button onClick={() => handleRespond(link._id, "reject")} className="text-[10px] font-bold border border-slate-200 px-3 py-1 rounded-lg">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4">Shared Connections ({activeVendors.length})</h3>
                <div className="space-y-3">
                  {activeVendors.length === 0 && <p className="text-xs text-slate-400">No active connections.</p>}
                  {activeVendors.map((link) => (
                    <div key={link._id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800">{link.linkType === "vendor" ? link.inviteeName : (link.inviterId?.companyName || link.inviterId?.name)}</p>
                          <p className="text-[10px] text-emerald-600 mt-1 uppercase font-bold">Securely Linked</p>
                        </div>
                        <button 
                          onClick={() => toggleFinancing(link._id, !!link.isFinancingVisible)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            link.isFinancingVisible 
                              ? "bg-amber-100 text-amber-800 border border-amber-200" 
                              : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
                          }`}
                          title={link.isFinancingVisible ? "Disable Financing Visibility" : "Enable Financing Visibility"}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 100-2h-1a1 1 0 100 2h1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 100-2H4a1 1 0 100 2h1zM8 16v-1a1 1 0 10-2 0v1a1 1 0 102 0zM13.414 14.828a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM16 13a1 1 0 10-2 0v1a1 1 0 102 0v-1z" /></svg>
                          {link.isFinancingVisible ? "Financing: ON" : "Financing: OFF"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invite Vendor</h2>
            <p className="text-sm text-slate-500 mb-6">Send a secure onboarding link to the supplier.</p>

            <form onSubmit={submitInvite} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Supplier Business Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vendor GSTIN <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={inviteForm.gstin}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="27AAAAA0000A1Z5"
                  maxLength={15}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Finance Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="finance@vendor.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                />
              </div>
              <button
                type="submit"
                disabled={inviteSaving}
                className="w-full rounded-xl bg-[#0f1b2d] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#142338] mt-2 disabled:opacity-60"
              >
                {inviteSaving ? "Sending..." : "Send Invitation Link"}
              </button>
            </form>
          </div>
        </div>
      </Portal>
    )}

      <CSVBulkOnboarder 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
        linkType="vendor"
        onSuccess={(count) => {
          apiFetch<{ links?: CounterpartyLink[] }>("/api/counterparties/invite")
            .then((data) => setLinks(data.links || []));
          alert(`Successfully onboarded ${count} vendors!`);
        }}
      />
    </div>
  );
}
