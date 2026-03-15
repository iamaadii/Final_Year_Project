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
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ gstin: "", email: "" });
  const [inviteSaving, setInviteSaving] = useState(false);

  useEffect(() => {
    apiFetch<ApiListResponse<Buyer>>("/buyers")
      .then((data) => {
        setBuyers(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSaving(true);
    try {
      await apiFetch("/buyers/invite", {
        method: "POST",
        body: JSON.stringify({
          gstin: inviteForm.gstin.trim().toUpperCase(),
          email: inviteForm.email.trim(),
        }),
      });
      setInviteForm({ gstin: "", email: "" });
      setShowInviteModal(false);
      const refreshed = await apiFetch<ApiListResponse<Buyer>>("/buyers");
      setBuyers(refreshed.data || []);
    } catch {
      alert("Failed to send invite. Connect backend to persist buyer links.");
    } finally {
      setInviteSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Counterparty Book
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your linked enterprise buyers, track their payment performance, and invite new partners.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142338]">
            + Link New Enterprise
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Linked Enterprise Network</h2>
            <div className="text-sm font-semibold text-slate-500">
              Showing {buyers.length} Active Links
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
                {buyers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">No enterprise buyers linked yet.</td>
                  </tr>
                )}
                {buyers.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
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
                      <button className="text-sm font-semibold text-[#1b5b6a] hover:text-[#0f1b2d]">View Ledgers</button>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Enterprise</h2>
            <p className="text-sm text-slate-500 mb-6">Enter the buyer GSTIN or portal invitation code to establish a B2B pairing.</p>

            <form onSubmit={submitInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Enterprise GSTIN</label>
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
                {inviteSaving ? "Sending..." : "Send Invitation Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
