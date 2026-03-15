import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PurchaseOrder from "@/models/PurchaseOrder";
import { getUserFromToken } from "@/lib/apiAuth";

/**
 * GET: List POs for the authenticated company
 */
export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const companyId = user.effectiveCompanyId;
  const pos = await PurchaseOrder.find({ companyId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
    
  return NextResponse.json({ purchaseOrders: pos });
}

/**
 * POST: Create a new PO (Buyer only)
 */
export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can create POs" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { poNumber, sellerId, lineItems = [], totalAmount, notes = "" } = body;

    if (!poNumber || !sellerId) {
      return NextResponse.json({ message: "poNumber and sellerId required" }, { status: 400 });
    }

    await dbConnect();
    const seller = await User.findById(sellerId);
    if (!seller) return NextResponse.json({ message: "Seller not found" }, { status: 404 });

    const companyId = user.effectiveCompanyId;

    const po = await PurchaseOrder.create({
      poNumber: String(poNumber).trim(),
      buyerId: user._id,
      sellerId: seller._id,
      companyId, // Forced isolation link
      buyerName: user.name,
      sellerName: seller.name,
      lineItems,
      totalAmount: Number(totalAmount) || 0,
      notes,
    });

    return NextResponse.json({ message: "PO created", purchaseOrder: po }, { status: 201 });
  } catch (error) {
    const dup = error?.code === 11000;
    return NextResponse.json(
      { message: dup ? "PO number already exists" : "Server error" },
      { status: dup ? 409 : 500 },
    );
  }
}
