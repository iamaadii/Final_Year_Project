import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { extractInvoiceDetailsFromPdfBuffer } from "@/lib/pdfInvoiceExtract";

export const runtime = "nodejs";

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

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can upload invoice PDFs" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "PDF file is required" }, { status: 400 });
    }

    const fileName = String(file.name || "").toLowerCase();
    const contentType = String(file.type || "");
    if (contentType !== "application/pdf" && !fileName.endsWith(".pdf")) {
      return NextResponse.json({ message: "Only PDF files are supported" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const { extracted, rawTextPreview, isInvoiceLike } = await extractInvoiceDetailsFromPdfBuffer(
      Buffer.from(bytes),
    );
    if (!isInvoiceLike) {
      return NextResponse.json(
        { message: "Please upload an invoice based file." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "PDF parsed. Review extracted details before approval request.",
        extracted,
        rawTextPreview,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Please select a valid invoice file",
        error: error?.message || "Unknown parser error",
      },
      { status: 400 },
    );
  }
}
