import ChartOfAccount from "@/models/ChartOfAccount";
import { requireAuth, successResponse, writeAudit } from "@/lib/api/routeUtils";

const defaultAccounts = [
  { code: "1000", name: "Current Assets", type: "asset", parent: null },
  { code: "1100", name: "Cash and Bank", type: "asset", parent: "1000" },
  { code: "1200", name: "Accounts Receivable", type: "asset", parent: "1000" },
  { code: "1300", name: "GST Input Credit", type: "asset", parent: "1000" },
  { code: "1400", name: "TDS Receivable", type: "asset", parent: "1000" },
  { code: "2000", name: "Current Liabilities", type: "liability", parent: null },
  { code: "2100", name: "Accounts Payable", type: "liability", parent: "2000" },
  { code: "2200", name: "GST Output Liability", type: "liability", parent: "2000" },
  { code: "2300", name: "TDS Payable", type: "liability", parent: "2000" },
  { code: "4000", name: "Revenue", type: "income", parent: null },
  { code: "4100", name: "Sales Revenue", type: "income", parent: "4000" },
  { code: "4200", name: "Service Revenue", type: "income", parent: "4000" },
  { code: "5000", name: "Operating Expenses", type: "expense", parent: null },
  { code: "5100", name: "Cost of Goods Sold", type: "expense", parent: "5000" },
  { code: "5200", name: "Office Supplies", type: "expense", parent: "5000" },
  { code: "5300", name: "Professional Services", type: "expense", parent: "5000", hsnCodes: ["998313", "998314"] },
  { code: "5400", name: "Freight and Transport", type: "expense", parent: "5000", hsnCodes: ["996511", "996512"] },
  { code: "5500", name: "IT and Software", type: "expense", parent: "5000", hsnCodes: ["998314", "998315"] },
  { code: "3000", name: "Equity", type: "equity", parent: null },
  { code: "3100", name: "Retained Earnings", type: "equity", parent: "3000" },
];

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const ops = defaultAccounts.map((acc) => ({
    updateOne: {
      filter: { companyId: auth.companyId, accountCode: acc.code },
      update: {
        $setOnInsert: {
          companyId: auth.companyId,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type,
          parentCode: acc.parent,
          hsnCodes: acc.hsnCodes || [],
          isActive: true,
        },
      },
      upsert: true,
    },
  }));

  const result = await ChartOfAccount.bulkWrite(ops, { ordered: false });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "coa_seeded",
    resource: "ChartOfAccount",
    details: { inserted: result.upsertedCount || 0, matched: result.matchedCount || 0 },
    req,
  });

  return successResponse({ seeded: true, result }, 200, auth.requestId);
}
