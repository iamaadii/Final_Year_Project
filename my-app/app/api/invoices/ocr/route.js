import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/apiAuth";
import { extractInvoiceWithAI } from "@/lib/aiInvoiceExtract";

export const runtime = "nodejs";

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
    const result = await extractInvoiceWithAI(Buffer.from(bytes));

    if (!result.isInvoiceLike) {
      return NextResponse.json({ message: "Please upload a valid invoice file." }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: result.aiPowered
          ? "Invoice extracted using AI (Gemini Vision). Review before submitting."
          : "PDF parsed using text extraction. Review before submitting.",
        extracted: result.extracted,
        rawTextPreview: result.rawTextPreview,
        aiPowered: result.aiPowered,
        aiError: result.aiError || null,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Please select a valid invoice file", error: error?.message },
      { status: 400 },
    );
  }
}
