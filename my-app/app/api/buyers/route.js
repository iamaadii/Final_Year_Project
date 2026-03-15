import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/apiAuth";

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can list buyers" }, { status: 403 });
  }

  await dbConnect();

  const buyers = await User.find({ userType: "Buyer" })
    .select("_id name email")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ buyers }, { status: 200 });
}
