"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type Buyer = {
  id: string;
  name: string;
  industry?: string;
  gstin?: string;
  status?: "active" | "pending" | "invited" | string;
  avgPaymentDays?: number;
  totalVolume?: number;
};

export default function BuyersPage() {
  const [counterpartyView, setCounterpartyView] = useState<"buyers" | "vendors">("buyers");
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ gstin: "", email: "" });
  const [inviteSaving, setInviteSaving] = useState(false);

  useEffect(() => {
    const endpoint = counterpartyView === "buyers" ? "/buyers" : "/vendors";
    setLoading(true);
    apiFetch<ApiListResponse<Record<string, unknown>>>(endpoint)
      .then((data) => {
        const mapped = (data.data || []).map((item, idx) => ({
          id: String(item.id || item._id || `row-${idx}`),
          name: String(item.name || item.vendorName || item.buyerName || "Unnamed"),
          industry: String(item.industry || item.category || ""),
          gstin: String(item.gstin || item.gst || ""),
          status: String(item.status || "pending"),
          avgPaymentDays: Number(item.avgPaymentDays || item.avgSettlementDays || 0),
          totalVolume: Number(item.totalVolume || item.totalSpend || 0),
        })) as Buyer[];
        setBuyers(mapped);
        setLoading(false);
      })
      .catch(() => {
        setBuyers([]);
        setLoading(false);
      });
  }, [counterpartyView]);

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSaving(true);
    try {
      await apiFetch(counterpartyView === "buyers" ? "/buyers/invite" : "/vendors", {
        method: "POST",
        body: JSON.stringify({
          gstin: inviteForm.gstin.trim().toUpperCase(),
          email: inviteForm.email.trim(),
        }),
      });
      setInviteForm({ gstin: "", email: "" });
      setShowInviteModal(false);
      const endpoint = counterpartyView === "buyers" ? "/buyers" : "/vendors";
      const refreshed = await apiFetch<ApiListResponse<Record<string, unknown>>>(endpoint);
      const mapped = (refreshed.data || []).map((item, idx) => ({
        id: String(item.id || item._id || `row-${idx}`),
        name: String(item.name || item.vendorName || item.buyerName || "Unnamed"),
        industry: String(item.industry || item.category || ""),
        gstin: String(item.gstin || item.gst || ""),
        status: String(item.status || "pending"),
        avgPaymentDays: Number(item.avgPaymentDays || item.avgSettlementDays || 0),
        totalVolume: Number(item.totalVolume || item.totalSpend || 0),
      })) as Buyer[];
      setBuyers(mapped);
    } catch {
      alert(counterpartyView === "buyers" ? "Failed to send invite. Connect backend to persist buyer links." : "Failed to save vendor. Connect backend to persist vendor records.");
    } finally {
      setInviteSaving(false);
    }
  };

  return (
    <div className="space-y-6 portal-page portal-module-transition">
      <header className="rounded-2xl p-6 portal-surface portal-section-enter">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Counterparty Book
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {counterpartyView === "buyers"
                ? "Manage your linked enterprise counterparties (buyers), track their payment performance, and invite new partners."
                : "Manage supplier/vendor counterparties, payable behavior, and procurement relationships."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center portal-toggle-shell">
              <button
                onClick={() => setCounterpartyView("buyers")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${counterpartyView === "buyers" ? "bg-white text-[#0f1b2d] shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                Buyers
              </button>
              <button
                onClick={() => setCounterpartyView("vendors")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${counterpartyView === "vendors" ? "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                Vendors
              </button>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142338]">
              {counterpartyView === "buyers" ? "+ Link New Enterprise" : "+ Add Vendor"}
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
        </div>
      ) : (
        <section className="rounded-2xl bg-white overflow-hidden portal-surface-soft portal-section-enter portal-section-enter-delay-1">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">{counterpartyView === "buyers" ? "Linked Enterprise Network" : "Vendor Network"}</h2>
            <div className="text-sm font-semibold text-slate-500">
              Showing {buyers.length} Active Links
            </div>
          </div>
          <div className="sm:hidden space-y-3 p-4">
            {buyers.length === 0 ? (
              <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-sm text-slate-500 text-center">
                No {counterpartyView === "buyers" ? "enterprise counterparties" : "vendors"} linked yet.
              </div>
            ) : (
              buyers.map((buyer) => (
                <div key={`${buyer.id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-[var(--brand-ink)]">{buyer.name}</p>
                      <p className="text-sm text-[var(--brand-ocean)]">{buyer.industry || "-"}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${buyer.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-[#e0f2f1]/60 text-[#1b5b6a]"}`}>
                      {buyer.status === "active" ? "Active" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-[var(--chart-muted-2)]">Avg {buyer.avgPaymentDays ?? "--"} days</span>
                    <span className="font-semibold text-[var(--brand-ink)]">{fmt(buyer.totalVolume || 0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[640px] w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 p-4">{counterpartyView === "buyers" ? "Enterprise Counterparty" : "Vendor"}</th>
                  <th className="p-4">Linkage Status</th>
                  <th className="p-4">Payment Performance</th>
                  <th className="p-4">{counterpartyView === "buyers" ? "Total Volumes (YTD)" : "Total Spend (YTD)"}</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buyers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">No {counterpartyView === "buyers" ? "enterprise counterparties" : "vendors"} linked yet.</td>
                  </tr>
                )}
                {buyers.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-slate-50 transition">
                    <td className="sticky left-0 z-10 bg-[var(--brand-sand)] p-4">
                      <p className="font-bold text-slate-800 text-base">{buyer.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{buyer.industry || "-"}</p>
                      {buyer.gstin && (
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">GST: {buyer.gstin}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`rounded px-2.5 py-1 text-xs font-bold leading-5 ${buyer.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-[#e0f2f1]/60 text-[#1b5b6a]"}`}>
                        {buyer.status === "active" ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-slate-700">Avg: {buyer.avgPaymentDays ?? "--"} Days</p>
                        <div className="w-full max-w-[120px] bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: buyer.avgPaymentDays ? "70%" : "0%" }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">Payment trend</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{fmt(buyer.totalVolume || 0)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d]">{counterpartyView === "buyers" ? "View Ledgers" : "View Payables"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{counterpartyView === "buyers" ? "Link Enterprise" : "Add Vendor"}</h2>
            <p className="text-sm text-slate-500 mb-6">{counterpartyView === "buyers" ? "Enter the buyer GSTIN or portal invitation code to establish a B2B pairing." : "Enter vendor GSTIN and contact details to onboard supplier counterparties."}</p>

            <form onSubmit={submitInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{counterpartyView === "buyers" ? "Enterprise GSTIN" : "Vendor GSTIN"}</label>
                <input
                  type="text"
                  value={inviteForm.gstin}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, gstin: e.target.value }))}
                  placeholder="e.g. 29ABCDE1234F2Z5"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Finance/AP Email (Optional)</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ap@enterprisename.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={inviteSaving}
                className="w-full rounded-xl bg-[#0f1b2d] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#142338] mt-2 disabled:opacity-60">
                {inviteSaving ? "Sending..." : counterpartyView === "buyers" ? "Send Invitation Link" : "Save Vendor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
