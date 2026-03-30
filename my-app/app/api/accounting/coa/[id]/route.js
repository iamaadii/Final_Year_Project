import { z } from "zod";
import ChartOfAccount from "@/models/ChartOfAccount";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
} from "@/lib/api/routeUtils";

const UpdateSchema = z.object({
  accountName: z.string().min(1).optional(),
  accountType: z.enum(["asset", "liability", "income", "expense", "equity"]).optional(),
  parentCode: z.string().nullable().optional(),
  hsnCodes: z.array(z.string()).optional(),
});

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, UpdateSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const account = await ChartOfAccount.findOneAndUpdate({ _id: id, companyId: auth.companyId }, { $set: parsed.data }, { new: true });
  if (!account) return errorResponse("NOT_FOUND", "Account not found", 404, auth.requestId);

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "coa_account_updated",
    resource: "ChartOfAccount",
    resourceId: account._id,
    details: parsed.data,
    req,
  });

  return successResponse(account, 200, auth.requestId);
}

export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const account = await ChartOfAccount.findOneAndUpdate(
    { _id: id, companyId: auth.companyId },
    { $set: { isActive: false } },
    { new: true },
  );
  if (!account) return errorResponse("NOT_FOUND", "Account not found", 404, auth.requestId);

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "coa_account_soft_deleted",
    resource: "ChartOfAccount",
    resourceId: account._id,
    details: { accountCode: account.accountCode },
    req,
  });

  return successResponse(account, 200, auth.requestId);
}
