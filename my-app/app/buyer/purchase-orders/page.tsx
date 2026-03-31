"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Eye, Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import EmptyState from "@/app/_components/ui/EmptyState";

type LineItem = {
  id: string;
  description: string;
  hsnCode: string;
  quantity: string;
  unitPrice: string;
};

type PurchaseOrder = {
  _id: string;
  poNumber: string;
  sellerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};

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

type PurchaseOrderDetail = PurchaseOrder & {
  notes?: string;
  lineItems?: PoLineItem[];
  grns?: GrnItem[];
};

type SellerOption = {
  _id: string;
  name?: string;
  email?: string;
};

export default function BuyerPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [poDetail, setPoDetail] = useState<PurchaseOrderDetail | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [poNumber, setPoNumber] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", hsnCode: "", quantity: "", unitPrice: "" },
  ]);

  const totalFromLines = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
      return sum + qty * price;
    }, 0);
  }, [lineItems]);

  const computedTotal = totalFromLines > 0 ? totalFromLines : Number(totalAmount || 0);

  const refreshOrders = async () => {
    const data = await apiFetch<{ purchaseOrders?: PurchaseOrder[] }>("/api/purchase-orders");
    setPurchaseOrders(data.purchaseOrders || []);
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

  useEffect(() => {
    apiFetch<{ sellers?: SellerOption[] }>("/api/sellers")
      .then((data) => setSellers(data.sellers || []))
      .catch(() => setSellers([]));
  }, []);

  const resetForm = () => {
    setPoNumber("");
    setSellerId("");
    setNotes("");
    setTotalAmount("");
    setLineItems([{ id: crypto.randomUUID(), description: "", hsnCode: "", quantity: "", unitPrice: "" }]);
    setError(null);
  };

  const addLineItem = () => {
    setLineItems((current) => [
      ...current,
      { id: crypto.randomUUID(), description: "", hsnCode: "", quantity: "", unitPrice: "" },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((current) => current.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const submitPo = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!poNumber.trim()) {
      setError("PO number is required.");
      return;
    }
    if (!sellerId) {
      setError("Please select a seller.");
      return;
    }

    const payloadLineItems = lineItems
      .map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        if (!item.description.trim()) return null;
        if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return null;
        return {
          description: item.description.trim(),
          hsnCode: item.hsnCode.trim(),
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      })
      .filter(Boolean);

    const payload = {
      poNumber: poNumber.trim(),
      sellerId,
      lineItems: payloadLineItems.length > 0 ? payloadLineItems : undefined,
      totalAmount: Number.isFinite(computedTotal) ? computedTotal : 0,
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      await apiFetch("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await refreshOrders();
      setShowCreate(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;

  const openDetail = (id: string) => {
    setSelectedPoId(id);
    setShowDetail(true);
    void loadPoDetail(id);
  };

  const updateStatus = async (status: string) => {
    if (!selectedPoId) return;
    setStatusUpdating(true);
    setDetailError(null);
    try {
      await apiFetch(`/api/purchase-orders/${selectedPoId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshOrders();
      await loadPoDetail(selectedPoId);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusUpdating(false);
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
              Purchase Orders
            </h1>
            <p className="mt-2 text-sm text-slate-500">Draft, send, and track POs issued to MSME suppliers.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f1b2d] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142338]"
          >
            <Plus className="h-4 w-4" />
            New PO
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Latest Purchase Orders</h2>
          <span className="text-xs font-semibold text-slate-500">{purchaseOrders.length} total</span>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" />}
              title="No purchase orders yet"
              description="Create a PO to start the buyer-supplier flow."
              primaryCTA={{ label: "Create PO", onClick: () => setShowCreate(true) }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="p-4">PO Number</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{po.poNumber}</td>
                    <td className="p-4">{po.sellerName || "Supplier"}</td>
                    <td className="p-4 font-semibold text-slate-900">{fmt(Number(po.totalAmount || 0))}</td>
                    <td className="p-4">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {po.status || "Open"}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN") : "--"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(po._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:items-center">
          <form onSubmit={submitPo} className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create Purchase Order</h2>
                <p className="mt-1 text-sm text-slate-500">Issue a PO to an MSME supplier.</p>
              </div>
              <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">PO Number</label>
                <input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                  required
                  placeholder="PO-ENT-101"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Supplier</label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1b5b6a]"
                >
                  <option value="">Select supplier</option>
                  {sellers.map((seller) => (
                    <option key={seller._id} value={seller._id}>
                      {seller.name || seller.email || "Supplier"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
                <button type="button" onClick={addLineItem} className="text-xs font-semibold text-[#1b5b6a]">+ Add line</button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                      <input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">HSN</label>
                      <input
                        value={item.hsnCode}
                        onChange={(e) => updateLineItem(item.id, "hsnCode", e.target.value.toUpperCase())}
                        placeholder="HSN"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Qty</label>
                      <input
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", e.target.value.replace(/\D/g, ""))}
                        placeholder="0"
                        inputMode="numeric"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Unit Price</label>
                      <input
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, "unitPrice", e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Amount (INR)</label>
                <input
                  value={totalFromLines > 0 ? totalFromLines.toFixed(2) : totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]"
                  disabled={totalFromLines > 0}
                />
                {totalFromLines > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">Calculated from line items.</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="rounded-xl border border-slate-300 px-4 py-2">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-white disabled:opacity-60">
                {saving ? "Creating..." : "Create PO"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:items-center">
          <div className="w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Purchase Order Details</h2>
                <p className="mt-1 text-sm text-slate-500">Track PO status and linked GRNs.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowDetail(false); setPoDetail(null); setSelectedPoId(null); setDetailError(null); }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="text-sm text-slate-500">Loading purchase order details...</div>
            ) : poDetail ? (
              <>
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">PO Number</p>
                    <p className="mt-1 font-semibold text-slate-900">{poDetail.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Supplier</p>
                    <p className="mt-1 font-semibold text-slate-900">{poDetail.sellerName || "Supplier"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total</p>
                    <p className="mt-1 font-semibold text-slate-900">{fmt(Number(poDetail.totalAmount || 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{poDetail.status || "Open"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Created</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {poDetail.createdAt ? new Date(poDetail.createdAt).toLocaleDateString("en-IN") : "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Notes</p>
                    <p className="mt-1 text-sm text-slate-600">{poDetail.notes || "No notes"}</p>
                  </div>
                </div>

                {detailError ? <p className="text-sm font-semibold text-rose-600">{detailError}</p> : null}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Open",
                      "Partially Received",
                      "Fully Received",
                      "Closed",
                      "Cancelled",
                    ].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus(status)}
                        disabled={statusUpdating || poDetail.status === status}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {statusUpdating && poDetail.status !== status ? "Updating..." : status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
                  {poDetail.lineItems && poDetail.lineItems.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-[640px] w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Description</th>
                            <th className="p-3">HSN</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Unit Price</th>
                            <th className="p-3">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {poDetail.lineItems.map((item, idx) => (
                            <tr key={`${poDetail._id}-line-${idx}`}>
                              <td className="p-3 font-medium text-slate-800">{item.description || "-"}</td>
                              <td className="p-3">{item.hsnCode || "-"}</td>
                              <td className="p-3">{item.quantity ?? "-"}</td>
                              <td className="p-3">{item.unitPrice ?? "-"}</td>
                              <td className="p-3 font-semibold text-slate-800">{item.total ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No line items captured.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Linked GRNs</h3>
                  {poDetail.grns && poDetail.grns.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {poDetail.grns.map((grn, idx) => (
                        <div key={`${grn.grnNumber || "grn"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase">GRN</p>
                          <p className="mt-1 font-semibold text-slate-800">{grn.grnNumber || "--"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Received: {grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString("en-IN") : "--"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            QC: {grn.qualityCheckPassed ? "Passed" : "Pending/Failed"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No GRNs linked yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No purchase order selected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
