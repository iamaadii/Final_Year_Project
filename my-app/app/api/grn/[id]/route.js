import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GRN from "@/models/GRN";
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

  return NextResponse.json({ grn }, { status: 200 });
}
