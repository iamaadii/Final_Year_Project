import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { runThreeWayMatch } from "@/lib/matchingEngine";
import { getUserFromToken } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  const companyId = user.effectiveCompanyId;
  const po = invoice.poId ? await PurchaseOrder.findOne({ _id: invoice.poId, companyId }).lean() : null;
  const grn = invoice.grnId ? await GRN.findOne({ _id: invoice.grnId, companyId }).lean() : null;

  if (!po || !grn) {
    return NextResponse.json({ message: "Linked PO or GRN not found or unauthorized" }, { status: 404 });
  }

  const matchResults = runThreeWayMatch(invoice, po, grn);
  return NextResponse.json({ matchResults });
}
