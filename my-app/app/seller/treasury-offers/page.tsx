"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";

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
  status?: string;
  totalAmount?: number;
  dueDate?: string;
  paymentLinkUrl?: string | null;
  discountOffer?: DiscountOffer;
};

type InvoiceListResponse = {
  invoices?: Invoice[];
  data?: Invoice[];
};

type TreasuryConfigResponse = {
  poolCr?: number;
  targetApr?: number;
  paused?: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string } | null;
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
  const [offerMode, setOfferMode] = useState<"incoming" | "outgoing">("incoming");
  const [activeTab, setActiveTab] = useState<"pipeline" | "evaluate">("pipeline");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [sliderAPR, setSliderAPR] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [paused, setPaused] = useState(false);

  const getInvoices = (payload: InvoiceListResponse): Invoice[] => {
    if (Array.isArray(payload.invoices)) return payload.invoices;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    apiFetch<TreasuryConfigResponse | ApiEnvelope<TreasuryConfigResponse>>("/treasury/config")
      .then((configPayload) => {
        const config = (configPayload as ApiEnvelope<TreasuryConfigResponse>)?.data || (configPayload as TreasuryConfigResponse);
        setPaused(Boolean(config?.paused || false));
      })
      .catch(() => setPaused(false));

    setLoading(true);
    apiFetch<InvoiceListResponse>("/invoices")
      .then((data) => {
        const now = new Date();
        const source = getInvoices(data);
        const mapped = (offerMode === "incoming"
          ? source.filter((inv) => inv.discountOffer?.status === "offered")
          : source.filter((inv) => ["Approved", "Pending Approval", "Overdue"].includes(inv.status || "")))
          .map((inv, idx) => {
            const due = inv.dueDate ? new Date(inv.dueDate) : now;
            const daysEarly = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const fallbackRate = offerMode === "outgoing" ? 8 + (idx % 4) : 0;
            const discountRate = Number(inv.discountOffer?.discountRate ?? fallbackRate);
            const baseAmount = Number(inv.totalAmount || 0);
            const discountAmount = Number(inv.discountOffer?.discountAmount || Math.round((discountRate / 36500) * Math.max(daysEarly, 15) * baseAmount));
            const netSettlement = Number(inv.discountOffer?.earlyPaymentAmount || baseAmount - discountAmount);
            return {
              id: inv._id,
              buyerName: inv.buyerName || (offerMode === "incoming" ? "Buyer" : "Supplier"),
              invoiceNumber: inv.invoiceNumber,
              invoiceValue: baseAmount,
              daysEarly,
              discountRate,
              netSettlement,
              discountAmount,
            } as Offer;
          });
        setOffers(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offerMode]);

  useEffect(() => {
    if (!selectedOfferId && offers.length > 0) {
      setSelectedOfferId(offers[0].id);
      setSliderAPR(offers[0].discountRate || 0);
      return;
    }

    if (selectedOfferId && !offers.some((offer) => offer.id === selectedOfferId)) {
      const fallback = offers[0] || null;
      setSelectedOfferId(fallback ? fallback.id : null);
      setSliderAPR(fallback ? fallback.discountRate : 0);
    }
  }, [offers, selectedOfferId]);

  const selectedOffer = useMemo(() => offers.find((o) => o.id === selectedOfferId) || null, [offers, selectedOfferId]);

  const invoiceAmount = selectedOffer?.invoiceValue || 0;
  const daysEarly = selectedOffer?.daysEarly || 0;
  const discountAmount = Math.round((sliderAPR / 36500) * daysEarly * invoiceAmount);
  const netSettlement = invoiceAmount - discountAmount;

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

  const acceptOffer = async () => {
    if (!selectedOffer) return;
    if (paused) {
      alert("Treasury programs are paused. Resume programs to continue.");
      return;
    }
    try {
      setSubmitting(true);
      if (offerMode === "incoming") {
        await apiFetch(`/invoices/${selectedOffer.id}/discount`, {
          method: "PATCH",
          body: JSON.stringify({ action: "accept" }),
        });
        alert("Offer accepted successfully.");
      } else {
        const response = await apiFetch<{ success?: boolean; data?: { paymentLinkUrl?: string | null }; paymentLinkUrl?: string | null }>(
          `/invoices/${selectedOffer.id}/payment-link`,
          {
            method: "POST",
          },
        );
        const url = response?.data?.paymentLinkUrl || response?.paymentLinkUrl || null;
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        alert(url ? "Payment link created and opened." : "Payment link created.");
      }
      const refreshed = await apiFetch<InvoiceListResponse>("/invoices");
      const source = getInvoices(refreshed);
      const now = new Date();
      const mapped = (offerMode === "incoming"
        ? source.filter((inv) => inv.discountOffer?.status === "offered")
        : source.filter((inv) => ["Approved", "Pending Approval", "Overdue"].includes(inv.status || "")))
        .map((inv, idx) => {
          const due = inv.dueDate ? new Date(inv.dueDate) : now;
          const daysEarly = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const fallbackRate = offerMode === "outgoing" ? 8 + (idx % 4) : 0;
          const discountRate = Number(inv.discountOffer?.discountRate ?? fallbackRate);
          const baseAmount = Number(inv.totalAmount || 0);
          const discountAmount = Number(inv.discountOffer?.discountAmount || Math.round((discountRate / 36500) * Math.max(daysEarly, 15) * baseAmount));
          const netSettlement = Number(inv.discountOffer?.earlyPaymentAmount || baseAmount - discountAmount);
          return {
            id: inv._id,
            buyerName: inv.buyerName || (offerMode === "incoming" ? "Buyer" : "Supplier"),
            invoiceNumber: inv.invoiceNumber,
            invoiceValue: baseAmount,
            daysEarly,
            discountRate,
            netSettlement,
            discountAmount,
          } as Offer;
        });
      setOffers(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process action.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const counterOffer = async () => {
    if (!selectedOffer) return;
    if (paused) {
      alert("Treasury programs are paused. Resume programs to continue.");
      return;
    }
    try {
      setSubmitting(true);
      if (offerMode === "incoming") {
        await apiFetch(`/invoices/${selectedOffer.id}/discount`, {
          method: "PATCH",
          body: JSON.stringify({ action: "decline" }),
        });
        alert("Offer declined.");
      } else {
        await apiFetch(`/invoices/${selectedOffer.id}/payment-link`, {
          method: "POST",
        });
        alert("Payment link requested for this invoice.");
      }
      setOffers((prev) => prev.filter((offer) => offer.id !== selectedOffer.id));
      setSelectedOfferId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process action.";
      alert(message);
    } finally {
      setSubmitting(false);
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
    <div className="space-y-6 portal-page portal-module-transition">
      <header className="rounded-2xl p-6 portal-surface portal-section-enter">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The Yield Engine
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {offerMode === "incoming"
                ? "Receive offers from buyers, evaluate terms, and counter for better yield."
                : "Offer early payment terms to suppliers, receive counters, and optimize payable cost."}
            </p>
          </div>
          <div className="flex items-center portal-toggle-shell">
            <button
              onClick={() => setOfferMode("incoming")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${offerMode === "incoming" ? "bg-white text-[#0f1b2d] shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              Buyer Offers
            </button>
            <button
              onClick={() => setOfferMode("outgoing")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${offerMode === "outgoing" ? "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              Supplier Offers
            </button>
          </div>
        </div>
      </header>

      {paused && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Treasury programs are currently paused. Offer and settlement actions are disabled.
        </div>
      )}

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-max portal-section-enter portal-section-enter-delay-1">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pipeline" ? "bg-white text-[#1b5b6a] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
          {offerMode === "incoming" ? "Liquidity Pipeline (Buyer Offers)" : "Liquidity Pipeline (Supplier Opportunities)"}
        </button>
        <button
          onClick={() => setActiveTab("evaluate")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "evaluate" ? "bg-white text-[#1b5b6a] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
          {offerMode === "incoming" ? "Counter-Offer Engine" : "Supplier Offer Engine"}
        </button>
      </div>

      {activeTab === "pipeline" && (
        <section className="rounded-2xl bg-white overflow-hidden portal-surface-soft portal-section-enter portal-section-enter-delay-1">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Available Early Payment Bids</h2>
            <div className="flex gap-2">
              <span className="rounded-full bg-[#e0f2f1]/60 text-[#0f1b2d] px-3 py-1 font-semibold text-xs">{offers.length} Active Bids</span>
            </div>
          </div>
          <div className="sm:hidden p-4 space-y-3">
            {offers.length === 0 ? (
              <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-sm text-slate-500 text-center">
                {offerMode === "incoming" ? "No active early payment bids." : "No supplier discounting opportunities yet."}
              </div>
            ) : (
              offers.map((offer) => (
                <div key={`${offer.id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{offer.buyerName}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">{offer.invoiceNumber}</p>
                    </div>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold whitespace-nowrap">
                      {offer.discountRate.toFixed(1)}% APR
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Original Value</span>
                    <span className="text-right font-semibold text-slate-700">{fmt(offer.invoiceValue)}</span>
                    <span className="text-slate-500">Days Early</span>
                    <span className="text-right font-semibold text-slate-700">{offer.daysEarly} Days</span>
                    <span className="text-slate-500">Net Settlement</span>
                    <span className="text-right font-bold text-emerald-700">{fmt(offer.netSettlement)}</span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 text-right">Implied cost: {fmt(offer.discountAmount)}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => { setSelectedOfferId(offer.id); setActiveTab("evaluate"); setSliderAPR(offer.discountRate); }}
                      disabled={paused}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                    >
                      {offerMode === "incoming" ? "Evaluate" : "Propose"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[980px] w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 p-4">{offerMode === "incoming" ? "Enterprise / Invoice" : "Supplier / Invoice"}</th>
                  <th className="p-4">Original Value</th>
                  <th className="p-4">Days Early</th>
                  <th className="p-4 bg-emerald-50/50">{offerMode === "incoming" ? "Buyer Bid (APR)" : "Target Offer (APR)"}</th>
                  <th className="p-4 bg-emerald-50/50">Net Immediate Settlement</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">{offerMode === "incoming" ? "No active early payment bids." : "No supplier discounting opportunities yet."}</td>
                  </tr>
                )}
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition">
                    <td className="sticky left-0 z-10 bg-white p-4">
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
                      <button
                        onClick={() => { setSelectedOfferId(offer.id); setActiveTab("evaluate"); setSliderAPR(offer.discountRate); }}
                        disabled={paused}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                      >
                        {offerMode === "incoming" ? "Evaluate" : "Propose"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "evaluate" && (
        <div className="grid gap-6 lg:grid-cols-2 portal-section-enter portal-section-enter-delay-1">
          <section className="rounded-2xl bg-white overflow-hidden flex flex-col portal-surface-soft">
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
                    <span className="text-sm font-semibold text-slate-600">{offerMode === "incoming" ? "Enterprise Buyer" : "Supplier"}</span>
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
                      <span className="block text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">{offerMode === "incoming" ? "Buyer Target Offer" : "Supplier Counter / Target"}</span>
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

          <section className="rounded-2xl border border-[#cfe8e6] bg-[#e0f2f1]/50 shadow-sm overflow-hidden flex flex-col portal-kpi-card">
            <div className="border-b border-[#cfe8e6] bg-[#e0f2f1]/60/50 p-4 shrink-0">
              <h2 className="font-bold text-[#0f1b2d]">{offerMode === "incoming" ? "Counter-Offer Engine" : "Supplier Offer Engine"}</h2>
              <p className="text-xs text-[#0f1b2d] mt-1">{offerMode === "incoming" ? "Accept the buyer target, or slide to counter-offer your desired rate." : "Set your early-payment offer to suppliers and negotiate counter terms."}</p>
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
                <button
                  onClick={acceptOffer}
                  disabled={submitting || paused}
                  className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-sm hover:bg-emerald-700 text-lg transition-colors disabled:opacity-60"
                >
                  {offerMode === "incoming" ? "Accept Buyer Offer (Immediate Clearing)" : "Generate Payment Link"}
                </button>
              ) : (
                <button
                  onClick={counterOffer}
                  disabled={submitting || paused}
                  className="w-full rounded-xl bg-[#0f1b2d] py-4 font-bold text-white shadow-sm hover:bg-[#142338] text-lg transition-colors disabled:opacity-60"
                >
                  {offerMode === "incoming" ? "Decline Offer" : "Request Payment Link"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
