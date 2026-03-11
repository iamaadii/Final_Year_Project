import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

async function getUserFromToken(req) {
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.id) return null;
    await dbConnect();
    return await User.findById(payload.id);
  } catch {
    return null;
  }
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can list buyers" }, { status: 403 });
  }

  const buyers = await User.find({ userType: "Buyer" })
    .select("_id name email")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ buyers }, { status: 200 });
}
