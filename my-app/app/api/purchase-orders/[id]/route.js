import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { getUserFromToken } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = params;
  await dbConnect();

  const companyId = user.effectiveCompanyId;
  const po = await PurchaseOrder.findOne({ _id: id, companyId }).lean();
  if (!po) {
    return NextResponse.json({ message: "PO not found or unauthorized" }, { status: 404 });
  }

  // Attach linked GRNs
  const grns = await GRN.find({ poId: po._id, companyId }).lean();
  return NextResponse.json({ purchaseOrder: { ...po, grns } }, { status: 200 });
}

export async function PATCH(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can update purchase orders" }, { status: 403 });
  }

  const { id } = await params;
  await dbConnect();

  const po = await PurchaseOrder.findById(id);
  if (!po) return NextResponse.json({ message: "Purchase Order not found" }, { status: 404 });
  if (String(po.buyerId) !== String(user._id)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { status, notes } = await req.json();
    const validStatuses = ["Open", "Partially Received", "Fully Received", "Closed", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ message: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }
    if (status) po.status = status;
    if (typeof notes === "string") po.notes = notes;
    await po.save();
    return NextResponse.json({ message: "Purchase Order updated", po }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
