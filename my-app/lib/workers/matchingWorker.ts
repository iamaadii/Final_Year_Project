import { Worker } from "bullmq";
import { z } from "zod";
import { connectDB } from "@/lib/db/client";
import { bullConnection, matchQueue } from "@/lib/workers/queue";
import Invoice from "@/models/Invoice";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { runThreeWayMatch } from "@/lib/matchingEngine";
import { log } from "@/lib/monitoring/logger";

const MatchJobSchema = z.object({
  requestId: z.string().min(1),
  companyId: z.string().min(1),
  invoiceId: z.string().min(1),
});

type MatchJob = z.infer<typeof MatchJobSchema>;

async function processMatchJob(data: MatchJob) {
  await connectDB();

  const invoice = await Invoice.findOne({ _id: data.invoiceId, companyId: data.companyId });
  if (!invoice) {
    return { matched: false, reason: "invoice_not_found" };
  }

  if (!invoice.poId || !invoice.grnId) {
    return { matched: false, reason: "missing_po_or_grn" };
  }

  const po = await PurchaseOrder.findOne({ _id: invoice.poId, companyId: data.companyId }).lean();
  const grn = await GRN.findOne({ _id: invoice.grnId, companyId: data.companyId }).lean();

  if (!po || !grn) {
    return { matched: false, reason: "po_or_grn_not_found" };
  }

  const matchResult = runThreeWayMatch(invoice.toObject(), po, grn);

  invoice.matchResult = {
    decision: matchResult.decision,
    confidenceScore: matchResult.confidenceScore,
    varianceFlags: matchResult.varianceFlags,
    maxVariancePct: matchResult.maxVariancePct,
    matchedAt: new Date(),
    overriddenBy: invoice.matchResult?.overriddenBy || null,
    overrideReason: invoice.matchResult?.overrideReason || "",
  };

  await invoice.save();

  return {
    matched: true,
    decision: matchResult.decision,
    confidenceScore: matchResult.confidenceScore,
    varianceCount: matchResult.varianceFlags?.length || 0,
  };
}

const worker = new Worker(
  "q.match",
  async (job) => {
    const parsed = MatchJobSchema.parse(job.data);

    log.info({ requestId: parsed.requestId, companyId: parsed.companyId, jobId: String(job.id) }, "Match job started");

    const result = await processMatchJob(parsed);

    log.info({ requestId: parsed.requestId, companyId: parsed.companyId, jobId: String(job.id), result }, "Match job completed");
    return result;
  },
  {
    connection: bullConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY_MATCH || 5),
  },
);

worker.on("failed", (job, error) => {
  log.error(
    {
      requestId: String(job?.data?.requestId || "unknown"),
      companyId: String(job?.data?.companyId || "unknown"),
      jobId: String(job?.id || "unknown"),
      error,
    },
    "Match job failed",
  );
});

worker.on("ready", () => {
  log.info({ requestId: "system", companyId: "system" }, "Match worker ready");
});

process.on("SIGTERM", async () => {
  await worker.close();
  await matchQueue.close();
  process.exit(0);
});
