import crypto from "crypto";
import { generateWorkingCapitalInsights } from "@/lib/aiInsights";
import { extractInvoiceDetailsFromPdfBuffer } from "@/lib/pdfInvoiceExtract";
import { runCashFlowForecast } from "@/lib/cashFlowForecast";
import { get, set } from "@/lib/cache/redis";
import { AppError } from "@/lib/api/errors";
import { log } from "@/lib/monitoring/logger";

type InsightContext = {
  tenantId: string;
  role: "Buyer" | "Seller";
  kpis: Record<string, unknown>;
};

type ForecastInput = {
  tenantId: string;
  invoices: Array<{
    paymentReceivedAt?: string | Date;
    totalAmount?: number;
  }>;
};

export class AIService {
  async generateInsights(context: InsightContext) {
    const cacheKey = this.hashKey("insights", context.tenantId, context.role, context.kpis);

    const cached = await get<Record<string, unknown>>(cacheKey);
    if (cached) {
      log.info({ tenantId: context.tenantId, requestId: "system", event: "ai.cache.hit", feature: "insights" }, "AI insights cache hit");
      return cached;
    }

    try {
      const insights = await generateWorkingCapitalInsights(context.kpis, context.role);
      await set(cacheKey, insights, Number(process.env.AI_INSIGHTS_CACHE_TTL_SECONDS || 3600));

      log.info({ tenantId: context.tenantId, requestId: "system", event: "ai.generate", feature: "insights" }, "AI insights generated");
      return insights;
    } catch (error) {
      log.error({ tenantId: context.tenantId, requestId: "system", event: "ai.error", feature: "insights", error }, "AI insights generation failed");
      return {
        insight: "Unable to generate AI insight right now. Showing rule-based summary.",
        alerts: [],
        recommendations: [],
      };
    }
  }

  async extractOCR(fileBuffer: Buffer) {
    const cacheKey = this.hashKey("ocr", "global", fileBuffer.toString("base64").slice(0, 300));

    const cached = await get<Record<string, unknown>>(cacheKey);
    if (cached) {
      log.info({ tenantId: "global", requestId: "system", event: "ai.cache.hit", feature: "ocr" }, "OCR cache hit");
      return cached;
    }

    try {
      const extracted = await extractInvoiceDetailsFromPdfBuffer(fileBuffer);
      await set(cacheKey, extracted, Number(process.env.AI_OCR_CACHE_TTL_SECONDS || 86400));

      log.info({ tenantId: "global", requestId: "system", event: "ai.generate", feature: "ocr" }, "OCR extraction completed");
      return extracted;
    } catch (error) {
      log.error({ tenantId: "global", requestId: "system", event: "ai.error", feature: "ocr", error }, "OCR extraction failed");
      return {
        isInvoiceLike: false,
        extracted: {
          invoiceNumber: "",
          issueDate: "",
          dueDate: "",
          buyerName: "",
          buyerEmail: "",
          subtotalAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
          lineItems: [],
          notes: "OCR unavailable",
        },
        rawTextPreview: "",
      };
    }
  }

  async forecastCashFlow(input: ForecastInput) {
    if (!input.invoices || input.invoices.length === 0) {
      throw new AppError("No invoice data available for forecasting", 400, "NO_FORECAST_DATA");
    }

    const cacheKey = this.hashKey("forecast", input.tenantId, input.invoices.length);
    const cached = await get<Record<string, unknown>>(cacheKey);
    if (cached) {
      log.info({ tenantId: input.tenantId, requestId: "system", event: "ai.cache.hit", feature: "forecast" }, "Cashflow forecast cache hit");
      return cached;
    }

    try {
      const forecast = runCashFlowForecast(input.invoices as Array<{ paymentReceivedAt?: string | Date; totalAmount?: number }>, 0.35, 3);
      const response = {
        ...forecast,
        confidenceScore: Math.min(0.95, 0.45 + input.invoices.length / 200),
      };

      await set(cacheKey, response, Number(process.env.AI_FORECAST_CACHE_TTL_SECONDS || 3600));
      log.info({ tenantId: input.tenantId, requestId: "system", event: "ai.generate", feature: "forecast" }, "Cashflow forecast generated");

      return response;
    } catch (error) {
      log.error({ tenantId: input.tenantId, requestId: "system", event: "ai.error", feature: "forecast", error }, "Cashflow forecast failed");
      return {
        history: [],
        forecast: [],
        avgMonthly: 0,
        totalActual: 0,
        confidenceScore: 0.1,
      };
    }
  }

  private hashKey(prefix: string, ...parts: unknown[]) {
    const normalized = JSON.stringify(parts);
    const digest = crypto.createHash("sha256").update(normalized).digest("hex");
    return `n3:ai:${prefix}:${digest}`;
  }
}
