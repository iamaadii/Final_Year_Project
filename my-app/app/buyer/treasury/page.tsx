"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiListResponse } from "@/lib/api/client";

type TreasuryOffer = {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceValue: number;
  impliedApr: number;
  netPayout: number;
};

export default function TreasuryPage() {
  const [poolCr, setPoolCr] = useState(0);
  const [targetApr, setTargetApr] = useState(0);
  const [offers, setOffers] = useState<TreasuryOffer[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ poolCr?: number; targetApr?: number }>("/treasury/config")
      .then((data) => {
        setPoolCr(Number(data.poolCr || 0));
        setTargetApr(Number(data.targetApr || 0));
      })
      .catch(() => {
        setPoolCr(0);
        setTargetApr(0);
      });

    apiFetch<ApiListResponse<TreasuryOffer>>("/treasury/offers")
      .then((data) => setOffers(data.data || []))
      .catch(() => setOffers([]));
  }, []);

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

  const saveConfig = async () => {
    setSaving(true);
    try {
      await apiFetch("/treasury/config", {
        method: "PATCH",
        body: JSON.stringify({ poolCr, targetApr }),
      });
    } catch {
      alert("Unable to save treasury config. Connect backend to persist.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Treasury & Yield Generator
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage internal liquidity allocation, dynamic discounting rules, and the early payment ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Pause All Programs
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Dynamic Discounting Program Config</h2>
              <p className="text-xs text-slate-500">Only internal treasury funds are utilized.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase ${poolCr > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
              {poolCr > 0 ? "Active" : "Not Configured"}
            </span>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-700">Total Allocated Liquidity Pool</span>
                <span className="font-bold text-2xl text-slate-900">{poolCr > 0 ? `INR ${poolCr} Cr` : "INR 0"}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={poolCr}
                onChange={(e) => setPoolCr(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1b5b6a]"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>INR 0 Cr</span>
                <span>INR 100 Cr</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-700">Target APR Yield Rule</span>
                <span className="font-bold text-2xl text-[#1b5b6a]">{targetApr.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="18"
                step="0.5"
                value={targetApr}
                onChange={(e) => setTargetApr(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1b5b6a]"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0.0%</span>
                <span>18.0%</span>
              </div>
            </div>

            <div className="bg-[#e0f2f1]/50 border border-[#cfe8e6] p-4 rounded-xl flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1b5b6a] text-white font-bold">i</div>
              <div>
                <p className="font-semibold text-[#0f1b2d]">Auto-Offer Mode</p>
                <p className="text-sm text-[#1b5b6a] mt-1">
                  Auto-offers are enabled when liquidity and target APR are configured.
                </p>
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full rounded-xl bg-[#0f1b2d] py-3 font-semibold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update Liquidity Parameters"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Manual Bid Desk & Settlement Ledger</h2>
              <p className="text-xs text-slate-500">Review requested discounts for immediate clearing.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Invoice Value</th>
                  <th className="p-4 text-center">Implied APR</th>
                  <th className="p-4 text-right">Net Payout</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 italic">
                      No manual bids yet. Offers will appear once vendors respond to early payment proposals.
                    </td>
                  </tr>
                )}
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{offer.vendorName}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{offer.invoiceNumber}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-900">{fmt(offer.invoiceValue)}</td>
                    <td className="p-4 text-center">
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
                        {offer.impliedApr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">{fmt(offer.netPayout)}</td>
                    <td className="p-4 text-right">
                      <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                        Clear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
