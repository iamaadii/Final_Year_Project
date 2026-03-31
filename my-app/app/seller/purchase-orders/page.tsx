"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Eye, FileText, CheckCircle, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Portal } from "@/components/Portal";
import EmptyState from "@/app/_components/ui/EmptyState";

type PoLineItem = {
  description?: string;
  hsnCode?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

type GrnItem = {
  _id?: string;
  grnNumber?: string;
  receivedDate?: string;
  qualityCheckPassed?: boolean;
};

type PurchaseOrder = {
  _id: string;
  poNumber: string;
  buyerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};

type PurchaseOrderDetail = PurchaseOrder & {
  notes?: string;
  lineItems?: PoLineItem[];
  grns?: GrnItem[];
  buyerId?: string;
};

export default function SellerPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [poDetail, setPoDetail] = useState<PurchaseOrderDetail | null>(null);

  const refreshOrders = async () => {
    try {
      const data = await apiFetch<{ purchaseOrders?: PurchaseOrder[] }>("/api/purchase-orders");
      setPurchaseOrders(data.purchaseOrders || []);
    } catch (err) {
      console.error("Failed to fetch POs:", err);
    }
  };

  const loadPoDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await apiFetch<{ purchaseOrder?: PurchaseOrderDetail }>(`/api/purchase-orders/${id}`);
      setPoDetail(data.purchaseOrder || null);
    } catch (err) {
      setPoDetail(null);
      setDetailError(err instanceof Error ? err.message : "Failed to load purchase order details");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  const viewDetail = (id: string) => {
    setSelectedPoId(id);
    setShowDetail(true);
    loadPoDetail(id);
  };

  const fmt = (n?: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

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
              Purchase Orders Received
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              View and manage orders sent by your enterprise buyers.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl bg-white overflow-hidden flex flex-col portal-surface-soft portal-section-enter portal-section-enter-delay-1">
        <div className="border-b border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#1b5b6a]" />
            Order Registry
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Enterprise Buyer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{po.poNumber}</td>
                    <td className="px-6 py-4 font-medium">{po.buyerName || "Unknown Buyer"}</td>
                    <td className="px-6 py-4 font-black text-slate-800">{fmt(po.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        po.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                        po.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {po.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{fmtDate(po.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => viewDetail(po._id)}
                        className="text-[#1b5b6a] hover:text-[#0f1b2d] font-bold inline-flex items-center gap-1"
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20">
                    <EmptyState
                      icon={<ClipboardList className="h-12 w-12" />}
                      title="No orders yet"
                      description="When buyers send you purchase orders, they will appear here for your review and fulfillment."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showDetail && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden relative">
              <button 
                onClick={() => setShowDetail(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
              >
                <CheckCircle size={24} />
              </button>

              {detailLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5b6a]"></div>
                  <p className="text-slate-500 font-bold animate-pulse">Retrieving Order Artifacts...</p>
                </div>
              ) : !poDetail ? (
                <div className="p-12 text-center">
                  <p className="text-rose-500 font-bold">{detailError || "Order not found"}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <p className="text-[10px] font-black text-[#1b5b6a] uppercase tracking-[.2em] mb-1">Purchasing Document</p>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{poDetail.poNumber}</h2>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.2em] mb-1">Order Total</p>
                          <p className="text-4xl font-black text-slate-900">{fmt(poDetail.totalAmount)}</p>
                       </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Enterprise Buyer</p>
                        <p className="font-bold text-slate-800">{poDetail.buyerName || "-"}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Created Date</p>
                        <p className="font-bold text-slate-800">{fmtDate(poDetail.createdAt)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Order Status</p>
                        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-widest ${
                          poDetail.status === "Approved" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                        }`}>
                          {poDetail.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-400" />
                        Line Items Analysis
                      </h3>
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">HSN</th>
                              <th className="px-4 py-3 text-right">Qty</th>
                              <th className="px-4 py-3 text-right">Price</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {poDetail.lineItems && poDetail.lineItems.length > 0 ? (
                              poDetail.lineItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 font-bold text-slate-800">{item.description}</td>
                                  <td className="px-4 py-3 font-medium text-slate-500">{item.hsnCode || "-"}</td>
                                  <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right font-medium">{fmt(item.unitPrice)}</td>
                                  <td className="px-4 py-3 text-right font-black text-slate-900">{fmt(item.total)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">No line items provided.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {poDetail.grns && poDetail.grns.length > 0 && (
                      <div>
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          Goods Receipt Notes (GRN)
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {poDetail.grns.map((grn) => (
                            <div key={grn._id} className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-black text-emerald-900">{grn.grnNumber}</p>
                                <p className="text-xs text-emerald-700/70 font-bold">Received: {fmtDate(grn.receivedDate)}</p>
                              </div>
                              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                QC PASSED
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {poDetail.notes && (
                      <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Clock size={12} /> Fulfillment Notes
                        </p>
                        <p className="text-sm text-amber-900 leading-relaxed font-bold">{poDetail.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 pt-0 flex justify-end">
                    <button 
                      onClick={() => setShowDetail(false)}
                      className="rounded-xl px-6 py-2.5 bg-[#0f1b2d] text-white text-sm font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      Close Order Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
