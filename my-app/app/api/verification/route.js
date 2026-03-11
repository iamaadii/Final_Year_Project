import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  isValidGst,
  isValidPan,
  isValidPhone,
  isValidUdyam,
  normalizeGst,
  normalizePan,
  normalizePhone,
  normalizeUdyam,
} from "@/lib/validators";

function resolveRedirectPath(userType) {
  if (userType === "Seller") return "/seller/dashboard";
  if (userType === "Financier") return "/financier/dashboard";
  return "/buyer/dashboard";
}

export async function POST(req) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      );
    }

    const { gstNumber, panNumber, contactNumber, udhyamNumber } = await req.json();

    if (!gstNumber || !panNumber || !contactNumber) {
      return NextResponse.json(
        { message: "GST number, PAN number and contact number are required" },
        { status: 400 }
      );
    }

    const sanitizedGst = normalizeGst(gstNumber);
    const sanitizedPan = normalizePan(panNumber);
    const sanitizedContact = normalizePhone(contactNumber);

    if (!isValidGst(sanitizedGst)) {
      return NextResponse.json(
        { message: "Please enter a valid GST number" },
        { status: 400 }
      );
    }

    if (!isValidPhone(sanitizedContact)) {
      return NextResponse.json(
        { message: "Please enter a valid contact number" },
        { status: 400 }
      );
    }
    if (!isValidPan(sanitizedPan)) {
      return NextResponse.json(
        { message: "Please enter a valid PAN number (example: ABCDE1234F)" },
        { status: 400 }
      );
    }

    const existingUser = await User.findById(payload.id);
    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const updates = {
      $set: {
        gstNumber: sanitizedGst,
        panNumber: sanitizedPan,
        contactNumber: sanitizedContact,
        isVerified: true,
      },
    };

    if (existingUser.userType === "Seller") {
      const sanitizedUdhyam = normalizeUdyam(udhyamNumber || "");
      if (!sanitizedUdhyam) {
        return NextResponse.json(
          { message: "Udhyam number is required for sellers" },
          { status: 400 }
        );
      }
      if (!isValidUdyam(sanitizedUdhyam)) {
        return NextResponse.json(
          { message: "Please enter a valid Udyam number (example: UDYAM-MH-12-1234567)" },
          { status: 400 }
        );
      }
      updates.$set.udhyamNumber = sanitizedUdhyam;
    } else {
      updates.$unset = { udhyamNumber: 1 };
    }

    await User.collection.updateOne({ _id: existingUser._id }, updates);
    const updatedUser = await User.findById(payload.id);

    return NextResponse.json(
      {
        message: "Verification details saved successfully",
        redirectTo: resolveRedirectPath(updatedUser?.userType),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("VERIFICATION ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
