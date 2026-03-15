import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GRN from "@/models/GRN";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = params;
  await dbConnect();

  const companyId = user.effectiveCompanyId;
  const grn = await GRN.findOne({ _id: id, companyId }).lean();
  
  if (!grn) {
    return NextResponse.json({ message: "GRN not found or unauthorized access" }, { status: 404 });
  }

  return NextResponse.json({ grn });
}

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can create GRNs" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { grnNumber, poId, sellerId, lineItems = [], qualityCheckPassed = true, notes = "" } = body;

    if (!grnNumber || !poId || !sellerId) {
      return NextResponse.json({ message: "grnNumber, poId, and sellerId required" }, { status: 400 });
    }

    await dbConnect();
    const seller = await User.findById(sellerId);
    if (!seller) return NextResponse.json({ message: "Seller not found" }, { status: 404 });

    const companyId = user.effectiveCompanyId;

    const grn = await GRN.create({
      grnNumber: String(grnNumber).trim(),
      poId,
      buyerId: user._id,
      sellerId: seller._id,
      companyId, // Forced isolation link
      buyerName: user.name,
      sellerName: seller.name,
      lineItems,
      qualityCheckPassed,
      notes,
    });

    return NextResponse.json({ message: "GRN created", grn }, { status: 201 });
  } catch (error) {
    const dup = error?.code === 11000;
    return NextResponse.json(
      { message: dup ? "GRN number already exists" : "Server error" },
      { status: dup ? 409 : 500 },
    );
  }
}
