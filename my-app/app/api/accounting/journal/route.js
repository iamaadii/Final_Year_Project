import { z } from "zod";
import JournalEntry from "@/models/JournalEntry";
import ChartOfAccount from "@/models/ChartOfAccount";
import { createJournalEntry, isBalanced } from "@/lib/accounting/journal";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
  commonQuerySchema,
} from "@/lib/api/routeUtils";

const CreateJournalSchema = z.object({
  entryDate: z.string().datetime().or(z.string().min(10)),
  narration: z.string().min(1),
  lines: z.array(
    z.object({
      accountCode: z.string().min(1),
      debitAmount: z.number().min(0).default(0),
      creditAmount: z.number().min(0).default(0),
    }),
  ).min(2),
});

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const query = commonQuerySchema.extend({
    companyId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    referenceType: z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));

  if (!query.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid query params", 400, auth.requestId, query.error.flatten());
  }

  const companyId = query.data.companyId || auth.companyId;
  const filter = { companyId };
  if (query.data.referenceType) filter.referenceType = query.data.referenceType;
  if (query.data.startDate || query.data.endDate) {
    filter.entryDate = {};
    if (query.data.startDate) filter.entryDate.$gte = new Date(query.data.startDate);
    if (query.data.endDate) filter.entryDate.$lte = new Date(query.data.endDate);
  }

  const skip = (query.data.page - 1) * query.data.limit;
  const [entries, total] = await Promise.all([
    JournalEntry.find(filter).sort({ entryDate: -1, createdAt: -1 }).skip(skip).limit(query.data.limit).lean(),
    JournalEntry.countDocuments(filter),
  ]);

  const codes = [...new Set(entries.flatMap((e) => e.lines.map((l) => l.accountCode)).filter(Boolean))];
  const coa = await ChartOfAccount.find({ companyId, accountCode: { $in: codes } }).lean();
  const nameMap = new Map(coa.map((a) => [a.accountCode, a.accountName]));

  const resolved = entries.map((entry) => ({
    ...entry,
    lines: entry.lines.map((line) => ({
      ...line,
      accountName: line.accountName || nameMap.get(line.accountCode) || line.accountName || "",
    })),
  }));

  return successResponse({ items: resolved, page: query.data.page, limit: query.data.limit, total }, 200, auth.requestId);
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, CreateJournalSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  if (!isBalanced(parsed.data.lines)) {
    return errorResponse("UNBALANCED_JOURNAL", "Journal entry is not balanced. Debits must equal credits.", 400, auth.requestId);
  }

  const accountCodes = parsed.data.lines.map((l) => l.accountCode);
  const accounts = await ChartOfAccount.find({ companyId: auth.companyId, accountCode: { $in: accountCodes }, isActive: true }).lean();
  const accountNameMap = new Map(accounts.map((a) => [a.accountCode, a.accountName]));

  const entry = await createJournalEntry({
    companyId: auth.companyId,
    entryDate: new Date(parsed.data.entryDate),
    referenceType: "manual",
    narration: parsed.data.narration,
    lines: parsed.data.lines.map((l) => ({
      ...l,
      accountName: accountNameMap.get(l.accountCode) || "",
    })),
    createdBy: auth.user._id,
    createdByName: auth.user.name || auth.user.email,
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "journal_entry_created",
    resource: "JournalEntry",
    resourceId: entry._id,
    details: { narration: entry.narration, lines: entry.lines.length },
    req,
  });

  return successResponse(entry, 201, auth.requestId);
}
