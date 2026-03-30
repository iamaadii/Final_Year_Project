import { z } from "zod";
import ChartOfAccount from "@/models/ChartOfAccount";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
} from "@/lib/api/routeUtils";

const CoaSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  accountType: z.enum(["asset", "liability", "income", "expense", "equity"]),
  parentCode: z.string().nullable().optional(),
  hsnCodes: z.array(z.string()).optional(),
});

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const companyId = req.nextUrl.searchParams.get("companyId") || auth.companyId;
  const accounts = await ChartOfAccount.find({ companyId }).sort({ accountCode: 1 }).lean();
  return successResponse({ items: accounts }, 200, auth.requestId);
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, CoaSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const account = await ChartOfAccount.create({
      companyId: auth.companyId,
      accountCode: parsed.data.accountCode,
      accountName: parsed.data.accountName,
      accountType: parsed.data.accountType,
      parentCode: parsed.data.parentCode || null,
      hsnCodes: parsed.data.hsnCodes || [],
      isActive: true,
    });

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "coa_account_created",
      resource: "ChartOfAccount",
      resourceId: account._id,
      details: { accountCode: account.accountCode },
      req,
    });

    return successResponse(account, 201, auth.requestId);
  } catch (error) {
    if (error?.code === 11000) {
      return errorResponse("DUPLICATE_ACCOUNT_CODE", "Account code already exists", 409, auth.requestId);
    }
    return errorResponse("SERVER_ERROR", "Failed to create account", 500, auth.requestId, { message: error?.message || "Unknown error" });
  }
}
