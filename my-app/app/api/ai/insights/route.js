import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";
import { generateWorkingCapitalInsights } from "@/lib/aiInsights";

function buildDefaultInsightPrompt(role, kpis) {
  const mode = role === "Buyer" ? "accounts payable" : "accounts receivable";
  return `You are a senior working-capital advisor for Indian ${mode} teams.\n\nKPIs: ${JSON.stringify(kpis)}\n\nProvide a concise 3-point action summary for the next 30 days in plain text (no markdown).`;
}

/**
 * GET /api/ai/insights
 * Returns Gemini-powered (or rule-based fallback) working capital advisory.
 * Model: Gemini 1.5 Flash | Self-supervised + RLHF | Batch | Model-based
 */
export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  await dbConnect();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const isBuyer = user.userType === "Buyer";
  const roleFilter = isBuyer ? { buyerId: user._id } : { sellerId: user._id };
  const allInvoices = await Invoice.find({ ...roleFilter, isDeleted: false }).lean();

  const unpaidStatuses = ["Pending Approval", "Approved", "Partially Settled", "Under Review", "Overdue", "Disputed"];
  const paidStatuses = ["Settled", "Paid", "paid"];
  const unpaid = allInvoices.filter((i) => unpaidStatuses.includes(i.status));
  const paid = allInvoices.filter((i) => paidStatuses.includes(i.status));
  const overdue = unpaid.filter((i) => new Date(i.dueDate) < now);

  const totalAmount = (arr) => arr.reduce((s, i) => s + i.totalAmount, 0);
  const dsoValues = paid
    .filter((i) => i.paymentReceivedAt)
    .map((i) => Math.max(0, Math.floor((new Date(i.paymentReceivedAt) - new Date(i.issueDate)) / (1000 * 60 * 60 * 24))));
  const avgDays = dsoValues.length > 0 ? Math.round(dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length) : 0;

  const matched = allInvoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");
  const acceptedOffers = allInvoices.filter((i) => i.discountOffer?.status === "accepted");

  const kpis = {
    totalReceivables: isBuyer ? 0 : totalAmount(unpaid),
    totalPayables: isBuyer ? totalAmount(unpaid) : 0,
    overdueAmount: totalAmount(overdue),
    overdueCount: overdue.length,
    paidThisMonth: totalAmount(paid.filter((i) => i.paymentReceivedAt && new Date(i.paymentReceivedAt) >= thirtyDaysAgo)),
    outstandingCount: unpaid.length,
    dso: isBuyer ? 0 : avgDays,
    dpo: isBuyer ? avgDays : 0,
    matchEfficiency: matched.length > 0 ? Math.round((autoApproved.length / matched.length) * 100) : 0,
    totalYieldEarned: acceptedOffers.reduce((s, i) => s + (i.discountOffer?.discountAmount || 0), 0),
  };

  const stream = req.nextUrl.searchParams.get("stream") === "true";
  if (stream) {
    const prompt = req.nextUrl.searchParams.get("prompt") || buildDefaultInsightPrompt(user.userType, kpis);
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        if (apiKey) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContentStream(prompt);

            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (!text) continue;
              controller.enqueue(encoder.encode(text));
            }

            controller.close();
            return;
          } catch {
            // Fall through to deterministic fallback stream.
          }
        }

        const fallback = await generateWorkingCapitalInsights(kpis, user.userType);
        const fallbackText = [
          fallback.insight,
          ...(fallback.alerts || []),
          ...(fallback.recommendations || []),
        ]
          .filter(Boolean)
          .join(" ");

        controller.enqueue(encoder.encode(fallbackText));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Request-ID": auth.requestId,
      },
    });
  }

  const insights = await generateWorkingCapitalInsights(kpis, user.userType);
  const aiPowered = !!process.env.GOOGLE_GEMINI_API_KEY;

  return successResponse({ ...insights, aiPowered, role: user.userType }, 200, auth.requestId);
}
