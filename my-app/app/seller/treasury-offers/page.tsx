"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type DiscountOffer = {
  status?: "offered" | "accepted" | "declined" | "none";
  discountRate?: number;
  earlyPaymentAmount?: number;
  discountAmount?: number;
  offeredAt?: string;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  buyerName?: string;
  totalAmount?: number;
  dueDate?: string;
  discountOffer?: DiscountOffer;
};

type Offer = {
  id: string;
  buyerName: string;
  invoiceNumber: string;
  invoiceValue: number;
  daysEarly: number;
  discountRate: number;
  netSettlement: number;
  discountAmount: number;
};

export default function TreasuryOffersPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "evaluate">("pipeline");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [sliderAPR, setSliderAPR] = useState(0);

  useEffect(() => {
    apiFetch<ApiListResponse<Invoice>>("/invoices")
      .then((data) => {
        const now = new Date();
        const mapped = (data.data || [])
          .filter((inv) => inv.discountOffer?.status === "offered")
          .map((inv) => {
            const due = inv.dueDate ? new Date(inv.dueDate) : now;
            const daysEarly = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const discountRate = Number(inv.discountOffer?.discountRate || 0);
            const discountAmount = Number(inv.discountOffer?.discountAmount || 0);
            const netSettlement = Number(inv.discountOffer?.earlyPaymentAmount || (inv.totalAmount || 0) - discountAmount);
            return {
              id: inv._id,
              buyerName: inv.buyerName || "Buyer",
              invoiceNumber: inv.invoiceNumber,
              invoiceValue: Number(inv.totalAmount || 0),
              daysEarly,
              discountRate,
              netSettlement,
              discountAmount,
            } as Offer;
          });
        setOffers(mapped);
        setLoading(false);
        if (mapped.length > 0 && !selectedOfferId) {
          setSelectedOfferId(mapped[0].id);
          setSliderAPR(mapped[0].discountRate || 0);
        }
      })
      .catch(() => setLoading(false));
  }, [selectedOfferId]);

  const selectedOffer = useMemo(() => offers.find((o) => o.id === selectedOfferId) || null, [offers, selectedOfferId]);

  const invoiceAmount = selectedOffer?.invoiceValue || 0;
  const daysEarly = selectedOffer?.daysEarly || 0;
  const discountAmount = Math.round((sliderAPR / 36500) * daysEarly * invoiceAmount);
  const netSettlement = invoiceAmount - discountAmount;

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

  const acceptOffer = async () => {
    if (!selectedOffer) return;
    try {
      await apiFetch(`/invoices/${selectedOffer.id}/discount-accept`, {
        method: "POST",
      });
      alert("Offer accepted. Payment will be processed when backend is connected.");
    } catch {
      alert("Failed to accept offer. Connect backend to persist response.");
    }
  };

  const counterOffer = async () => {
    if (!selectedOffer) return;
    try {
      await apiFetch(`/invoices/${selectedOffer.id}/discount-counter`, {
        method: "POST",
        body: JSON.stringify({ discountRate: sliderAPR }),
      });
      alert("Counter-offer submitted. Await buyer response.");
    } catch {
      alert("Failed to submit counter-offer. Connect backend to persist response.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b5b6a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pipeline" ? "bg-white text-[#1b5b6a] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
          Liquidity Pipeline (Available Offers)
        </button>
        <button
          onClick={() => setActiveTab("evaluate")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "evaluate" ? "bg-white text-[#1b5b6a] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
          Discount Proposal Engine
        </button>
      </div>

      {activeTab === "pipeline" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Available Early Payment Bids</h2>
            <div className="flex gap-2">
              <span className="rounded-full bg-[#e0f2f1]/60 text-[#0f1b2d] px-3 py-1 font-semibold text-xs">{offers.length} Active Bids</span>
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
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">No active early payment bids.</td>
                  </tr>
                )}
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-base">{offer.buyerName}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">{offer.invoiceNumber}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{fmt(offer.invoiceValue)}</td>
                    <td className="p-4 font-semibold text-slate-700">{offer.daysEarly} Days</td>
                    <td className="p-4 bg-emerald-50/30">
                      <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold whitespace-nowrap">{offer.discountRate.toFixed(1)}% APR</span>
                    </td>
                    <td className="p-4 bg-emerald-50/30 font-bold text-emerald-700 text-base">
                      {fmt(offer.netSettlement)}
                      <p className="font-normal text-[10px] text-slate-500 mt-0.5">Implied cost: {fmt(offer.discountAmount)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelectedOfferId(offer.id); setActiveTab("evaluate"); setSliderAPR(offer.discountRate); }} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Evaluate</button>
                    </td>
                  </tr>
                ))}
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
              <span className="rounded bg-slate-200 text-slate-800 px-2 py-1 text-[10px] font-bold tracking-widest uppercase">{selectedOffer?.invoiceNumber || "-"}</span>
            </div>
            <div className="p-6 space-y-6">
              {!selectedOffer && (
                <p className="text-sm text-slate-400">Select an offer from the pipeline to evaluate terms.</p>
              )}
              {selectedOffer && (
                <>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Enterprise Buyer</span>
                    <span className="font-bold text-slate-900">{selectedOffer.buyerName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Maturity Date (Due)</span>
                    <span className="font-bold text-slate-900">{selectedOffer.daysEarly} days early</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Base Invoice Value</span>
                    <span className="font-bold text-slate-900">{fmt(selectedOffer.invoiceValue)}</span>
                  </div>

                  <div className="bg-emerald-50 border justify-between flex items-center border-emerald-100 rounded-xl p-4">
                    <div>
                      <span className="block text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Buyer Target Offer</span>
                      <span className="text-2xl font-black text-emerald-900">{selectedOffer.discountRate.toFixed(1)}% <span className="text-sm font-bold opacity-75">APR</span></span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Est. Net Clearing</span>
                      <span className="text-xl font-black text-emerald-700">{fmt(selectedOffer.netSettlement)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-[#cfe8e6] bg-[#e0f2f1]/60/50 p-4 shrink-0">
              <h2 className="font-bold text-[#0f1b2d]">Discount Proposal Engine</h2>
              <p className="text-xs text-[#0f1b2d] mt-1">Accept the buyer target, or slide to counter-offer your desired rate.</p>
            </div>
            <div className="p-6 space-y-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700 text-sm">Your Proposal APR</span>
                  <span className="font-bold text-2xl text-[#1b5b6a]">{sliderAPR.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="0.1"
                  value={sliderAPR}
                  onChange={(e) => setSliderAPR(Number(e.target.value))}
                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                  <span>0.0%</span>
                  <span>18.0%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-600">Implied Discount Cost</span>
                  <span className="font-bold text-rose-600">- {fmt(discountAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-slate-800">Final Settlement Delivery</span>
                  <span className="font-black text-emerald-700">{fmt(netSettlement)}</span>
                </div>
              </div>

              {selectedOffer && sliderAPR === selectedOffer.discountRate ? (
                <button onClick={acceptOffer} className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-sm hover:bg-emerald-700 text-lg transition-colors">
                  Accept Buyer Offer (Immediate Clearing)
                </button>
              ) : (
                <button onClick={counterOffer} className="w-full rounded-xl bg-[#0f1b2d] py-4 font-bold text-white shadow-sm hover:bg-[#142338] text-lg transition-colors">
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
