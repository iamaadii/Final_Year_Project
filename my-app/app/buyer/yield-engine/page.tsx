"use client";

import { useEffect, useState } from "react";
import { Zap, Send, DollarSign, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

type DiscountOffer = {
  status?: "offered" | "accepted" | "declined" | "none";
  discountRate?: number;
  discountAmount?: number;
  offeredAt?: string;
  respondedAt?: string;
  earlyPaymentAmount?: number;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  sellerName?: string;
  totalAmount: number;
  dueDate: string;
  status?: string;
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

function getInvoices(payload: InvoiceListResponse): Invoice[] {
  if (Array.isArray(payload.invoices)) return payload.invoices;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function YieldEnginePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountRate, setDiscountRate] = useState(1.5);
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [treasuryPool, setTreasuryPool] = useState(0);
  const [paused, setPaused] = useState(false);

  const loadInvoices = async () => {
    const payload = await apiFetch<InvoiceListResponse>("/invoices");
    setInvoices(getInvoices(payload));
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadInvoices();
      } finally {
        setLoading(false);
      }

      try {
        const configPayload = await apiFetch<TreasuryConfigResponse | ApiEnvelope<TreasuryConfigResponse>>("/treasury/config");
        const config = (configPayload as ApiEnvelope<TreasuryConfigResponse>)?.data || (configPayload as TreasuryConfigResponse);
        const poolCr = Number(config?.poolCr || 0);
        setTreasuryPool(Math.max(0, poolCr) * 10000000);
        setPaused(Boolean(config?.paused || false));
      } catch {
        setTreasuryPool(0);
        setPaused(false);
      }
    };

    load();
  }, []);

  const now = new Date();
  const approvedInvoices = invoices.filter((i) => i.status === "Approved" && (!i.discountOffer || i.discountOffer.status === "none"));
  const activeOffers = invoices.filter((i) => i.discountOffer?.status === "offered");
  const acceptedOffers = invoices.filter((i) => i.discountOffer?.status === "accepted");

  const totalYield = acceptedOffers.reduce((s, i) => s + (i.discountOffer?.discountAmount || 0), 0);
  const totalDeployed = acceptedOffers.reduce((s, i) => s + (i.discountOffer?.earlyPaymentAmount || 0), 0);
  const avgYieldPct = acceptedOffers.length > 0
    ? acceptedOffers.reduce((s, i) => s + (i.discountOffer?.discountRate || 0), 0) / acceptedOffers.length
    : 0;

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const sendOffer = async (invoiceId: string) => {
    if (paused) {
      alert("Treasury programs are paused. Resume programs to continue.");
      return;
    }
    setOfferingId(invoiceId);
    try {
      await apiFetch(`/invoices/${invoiceId}/discount`, {
        method: "POST",
        body: JSON.stringify({ discountRate }),
      });
      await loadInvoices();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send offer";
      alert(message);
    } finally {
      setOfferingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <header className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <Zap className="text-amber-500 w-8 h-8" />
          Treasury Yield Engine
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Deploy surplus treasury to offer early payments. Earn yield while strengthening supplier relationships.
        </p>
      </header>

      {paused && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Treasury programs are currently paused. New discount offers are disabled.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-[#0f1b2d] to-[#0b1422] p-6 text-white shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Treasury Pool</p>
          <p className="mt-3 text-3xl font-black">{fmt(treasuryPool)}</p>
          <p className="text-xs text-slate-400 mt-2">Available for early payments</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={12} /> Yield Earned
          </p>
          <p className="mt-3 text-3xl font-black text-emerald-900">{fmt(totalYield)}</p>
          <p className="text-xs text-slate-500 mt-2">{acceptedOffers.length} offers accepted</p>
        </div>
        <div className="rounded-3xl border border-[#cfe8e6] bg-gradient-to-br from-white to-[#e0f2f1]/40 p-6 shadow-sm">
          <p className="text-xs font-bold text-[#1b5b6a] uppercase tracking-widest">Deployed Capital</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{fmt(totalDeployed)}</p>
          <p className="text-xs text-slate-500 mt-2">In early payments</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/50 p-6 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Avg Yield Rate</p>
          <p className="mt-3 text-3xl font-black text-amber-900">
            {avgYieldPct.toFixed(1)}<span className="text-lg">%</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Discount rate on early payments</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-4">Configure Discount Rate</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Discount Rate (%)</label>
            <input
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(Math.max(0.01, Math.min(10, Number(e.target.value))))}
              step="0.1" min="0.01" max="10"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold w-32 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1">
            <p className="text-xs text-slate-500 font-medium">
              At <span className="font-bold text-slate-800">{discountRate}%</span> discount, a INR 1,00,000 invoice paid 30 days early yields{" "}
              <span className="font-bold text-emerald-700">INR {(1000 * discountRate).toFixed(0)}</span> for your treasury
              (approx <span className="font-bold text-amber-700">{(discountRate / 100 * 365 / 30 * 100).toFixed(1)}%</span> annualized).
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <DollarSign size={16} /> Eligible Invoices ({approvedInvoices.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1">Approved invoices that can receive early payment offers.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {approvedInvoices.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 font-medium">
              No eligible invoices. Invoices must be in the Approved status to receive discount offers.
            </div>
          )}
          {approvedInvoices.map((inv) => {
            const daysTodue = Math.max(0, Math.ceil((new Date(inv.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const discountAmt = Math.round(inv.totalAmount * (discountRate / 100) * 100) / 100;
            const earlyPay = inv.totalAmount - discountAmt;
            return (
              <div key={inv._id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-xs text-slate-500">{inv.sellerName}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {fmt(inv.totalAmount)}  Due in <span className="font-bold">{daysTodue} days</span>
                  </p>
                </div>
                <div className="text-right bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-medium">Pay {fmt(earlyPay)} now</p>
                  <p className="text-xs text-emerald-600 font-bold">Save {fmt(discountAmt)}</p>
                </div>
                <button
                  onClick={() => sendOffer(inv._id)}
                  disabled={offeringId === inv._id || paused}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-amber-500/20"
                >
                  {offeringId === inv._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={14} />
                  )}
                  Send Offer
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {(activeOffers.length > 0 || acceptedOffers.length > 0) && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 p-5">
            <h2 className="font-bold text-slate-800">Offer History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activeOffers.map((inv) => (
              <div key={inv._id} className="px-6 py-4 flex items-center gap-4 bg-amber-50/30">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-800">Pending</span>
                <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                <span className="text-sm text-slate-500">{inv.sellerName}</span>
                <span className="ml-auto font-bold text-slate-800">{fmt(inv.discountOffer?.earlyPaymentAmount || 0)} <span className="text-xs text-slate-400">(-{fmt(inv.discountOffer?.discountAmount || 0)})</span></span>
              </div>
            ))}
            {acceptedOffers.map((inv) => (
              <div key={inv._id} className="px-6 py-4 flex items-center gap-4 bg-emerald-50/30">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200 text-emerald-800">Accepted</span>
                <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                <span className="text-sm text-slate-500">{inv.sellerName}</span>
                <span className="ml-auto font-bold text-emerald-800">Yield: {fmt(inv.discountOffer?.discountAmount || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
