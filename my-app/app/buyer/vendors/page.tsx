"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";

type Vendor = {
  id: string;
  name: string;
  email?: string;
  status?: "invited" | "in_review" | "verified" | string;
  gstin?: string;
  industry?: string;
  disputeRate?: number;
  reliabilityScore?: number;
  lastInviteAt?: string;
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", gstin: "", email: "" });
  const [inviteSaving, setInviteSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ sellers?: SellerApi[] }>("/sellers")
      .then((data) => {
        const mapped = (data.sellers || []).map((seller) => {
          const total = seller.breakdown?.total || 0;
          const disputed = seller.breakdown?.disputed || 0;
          const disputeRate = total > 0 ? Math.round((disputed / total) * 100) : 0;
          return {
            id: seller._id,
            name: seller.name,
            email: seller.email,
            gstin: seller.gstNumber,
            reliabilityScore: seller.reliabilityScore,
            disputeRate,
            status: seller.udhyamNumber ? "verified" : "in_review",
            lastInviteAt: seller.createdAt,
          } as Vendor;
        });
        setVendors(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const invited = vendors.filter((v) => v.status === "invited");
  const review = vendors.filter((v) => v.status === "in_review");
  const verified = vendors.filter((v) => v.status === "verified");

  const leaderboard = [...vendors]
    .filter((v) => typeof v.reliabilityScore === "number")
    .sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0))
    .slice(0, 8);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSaving(true);
    try {
      const draft: Vendor = {
        id: `draft-${Date.now()}`,
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        gstin: inviteForm.gstin.trim().toUpperCase(),
        status: "invited",
        lastInviteAt: new Date().toISOString(),
      };
      setVendors((prev) => [draft, ...prev]);
      setInviteForm({ name: "", gstin: "", email: "" });
      setShowInviteModal(false);
    } catch {
      alert("Failed to send invite. Connect backend to persist vendor onboarding.");
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
              Vendor Management System
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Onboarding pipeline, compliance vetting, and performance tracking.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-[#cfe8e6] bg-[#e0f2f1]/50 px-4 py-2 text-sm font-semibold text-[#1b5b6a] shadow-sm hover:bg-[#e0f2f1]">
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
      ) : vendors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No vendors connected"
            description="Add your first vendor to start the 3-way matching workflow."
            primaryCTA={{ label: "Add Vendor", onClick: () => setShowInviteModal(true) }}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Onboarding Pipeline</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Invited ({invited.length})</h3>
                <div className="space-y-3">
                  {invited.length === 0 && (
                    <p className="text-xs text-slate-400">No invites sent yet.</p>
                  )}
                  {invited.map((vendor) => (
                    <div key={vendor.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <p className="font-semibold text-slate-800">{vendor.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{vendor.lastInviteAt ? `Invited ${new Date(vendor.lastInviteAt).toLocaleDateString("en-IN")}` : "Invite pending"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/30 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#1b5b6a] uppercase tracking-widest mb-4">Under Review ({review.length})</h3>
                <div className="space-y-3">
                  {review.length === 0 && (
                    <p className="text-xs text-slate-400">No vendors under review.</p>
                  )}
                  {review.map((vendor) => (
                    <div key={vendor.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                      <p className="font-semibold text-slate-800">{vendor.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Awaiting compliance checks</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4">Verified ({verified.length})</h3>
                <div className="space-y-3">
                  {verified.length === 0 && (
                    <p className="text-xs text-slate-400">No verified vendors yet.</p>
                  )}
                  {verified.map((vendor) => (
                    <div key={vendor.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-800">{vendor.name}</p>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mt-1.5"></span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">GSTIN {vendor.gstin ? "Linked" : "Pending"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0">
              <h2 className="font-bold text-slate-800">Performance Leaderboard</h2>
              <p className="text-xs text-slate-500">Ranked by reliability score and dispute rate.</p>
            </div>
            <div className="p-0 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-sm text-slate-400">No performance data available yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {leaderboard.map((vendor, idx) => (
                    <li key={vendor.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{idx + 1}. {vendor.name}</p>
                        <p className="text-xs text-slate-500">Dispute rate: {vendor.disputeRate ?? 0}%</p>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
                        {vendor.reliabilityScore ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vendor Name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vendor GSTIN</label>
                <input
                  type="text"
                  value={inviteForm.gstin}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, gstin: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a] font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Finance Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
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
      )}
    </div>
  );
}
