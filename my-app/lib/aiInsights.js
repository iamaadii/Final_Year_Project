/**
 * Gemini Working Capital Intelligence
 * Supervision: Self-supervised (pre-trained LLM) + RLHF
 * Learning: Batch (frozen — no incremental updates)
 * Approach: Model-based (learned financial language representations)
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-1.5-flash";

/**
 * Generate plain-English working capital insights from KPI data.
 * @param {object} kpis - financial metrics object from /api/accounting/summary
 * @param {"Buyer"|"Seller"} role
 * @returns {Promise<{insight: string, alerts: string[], recommendations: string[]}>}
 */
export async function generateWorkingCapitalInsights(kpis, role) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    return getFallbackInsights(kpis, role);
  }

  const prompt = buildPrompt(kpis, role);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Try to parse JSON, fallback to raw text
    try {
      const jsonStr = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      return JSON.parse(jsonStr);
    } catch {
      return { insight: text, alerts: [], recommendations: [] };
    }
  } catch (err) {
    console.error("[AI Insights] Gemini failed:", err?.message);
    return getFallbackInsights(kpis, role);
  }
}

function buildPrompt(kpis, role) {
  const {
    totalReceivables = 0, totalPayables = 0, overdueAmount = 0, overdueCount = 0,
    paidThisMonth = 0, dso = 0, dpo = 0, netWorkingCapital = 0,
    outstandingCount = 0, totalYieldEarned = 0, matchEfficiency = 0,
  } = kpis;

  const context = role === "Seller"
    ? `You are a financial advisor for an Indian MSME supplier. The supplier has:
- Total receivables: ₹${totalReceivables.toLocaleString("en-IN")}
- Overdue invoices: ${overdueCount} totaling ₹${overdueAmount.toLocaleString("en-IN")}
- Collections this month: ₹${paidThisMonth.toLocaleString("en-IN")}
- Days Sales Outstanding (DSO): ${dso} days
- Net working capital: ₹${netWorkingCapital.toLocaleString("en-IN")}
- Outstanding invoices: ${outstandingCount}
- Match efficiency: ${matchEfficiency}%`
    : `You are a financial advisor for an Indian enterprise buyer. The buyer has:
- Total payables: ₹${totalPayables.toLocaleString("en-IN")}
- Overdue invoices (past MSMED deadline): ${overdueCount} — ₹${overdueAmount.toLocaleString("en-IN")} (tax deduction risk!)
- Payments settled this month: ₹${paidThisMonth.toLocaleString("en-IN")}
- Days Payable Outstanding (DPO): ${dpo} days
- Yield earned from early payments: ₹${totalYieldEarned.toLocaleString("en-IN")}
- Match efficiency: ${matchEfficiency}%`;

  return `${context}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "insight": "2-3 sentence executive summary of the financial position",
  "alerts": ["array of up to 3 critical alert strings (use ₹ amounts, be specific)"],
  "recommendations": ["array of up to 3 actionable recommendations with specific amounts or timelines"]
}`;
}

/**
 * Rule-based fallback when Gemini API key is not available.
 */
function getFallbackInsights(kpis, role) {
  const alerts = [];
  const recommendations = [];
  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (role === "Seller") {
    if (kpis.overdueCount > 0) alerts.push(`${kpis.overdueCount} invoices overdue — ${fmt(kpis.overdueAmount)} at risk. MSMED penalty interest is accruing.`);
    if (kpis.dso > 45) alerts.push(`DSO of ${kpis.dso} days exceeds MSMED 45-day limit. You are legally entitled to compound interest.`);
    if (kpis.outstandingCount > 5) recommendations.push(`Follow up on ${kpis.outstandingCount} outstanding invoices. Send reminders to buyers approaching deadlines.`);
    recommendations.push(`Consider offering early payment discounts (1.5-2%) to accelerate ${fmt(kpis.totalReceivables)} in cash.`);

    return {
      insight: `You have ${fmt(kpis.totalReceivables)} in total receivables with ${kpis.overdueCount} overdue invoices. ${kpis.paidThisMonth > 0 ? `You collected ${fmt(kpis.paidThisMonth)} this month.` : "No collections this month — consider escalation."}`,
      alerts,
      recommendations,
    };
  } else {
    if (kpis.overdueCount > 0) alerts.push(`${kpis.overdueCount} invoices past MSMED deadline — ${fmt(kpis.overdueAmount)} could be disallowed under 43B(h) if not paid.`);
    if (kpis.dpo > 45) alerts.push(`DPO of ${kpis.dpo} days exceeds MSMED limit. Immediate tax exposure risk.`);
    if (kpis.totalYieldEarned > 0) recommendations.push(`Early payment strategy earned ${fmt(kpis.totalYieldEarned)} in yield. Consider increasing treasury deployment.`);
    recommendations.push(`Clear all 43B(h)-breached invoices before financial year end to protect tax deductions.`);

    return {
      insight: `You have ${fmt(kpis.totalPayables)} in outstanding payables. ${kpis.overdueCount} invoices are past their MSMED deadline, creating Section 43B(h) tax exposure.`,
      alerts,
      recommendations,
    };
  }
}
