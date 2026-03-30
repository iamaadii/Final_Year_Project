import JournalEntry from "@/models/JournalEntry";
import ChartOfAccount from "@/models/ChartOfAccount";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const companyId = req.nextUrl.searchParams.get("companyId") || auth.companyId;
  const asOfDate = req.nextUrl.searchParams.get("asOfDate");

  const filter = { companyId };
  if (asOfDate) {
    filter.entryDate = { $lte: new Date(asOfDate) };
  }

  const entries = await JournalEntry.find(filter).lean();
  const accountMap = new Map();

  for (const entry of entries) {
    for (const line of entry.lines || []) {
      const code = String(line.accountCode || "");
      const current = accountMap.get(code) || { accountCode: code, debit: 0, credit: 0 };
      current.debit += Number(line.debitAmount || 0);
      current.credit += Number(line.creditAmount || 0);
      accountMap.set(code, current);
    }
  }

  const codes = [...accountMap.keys()];
  const accounts = await ChartOfAccount.find({ companyId, accountCode: { $in: codes } }).lean();
  const detailsMap = new Map(accounts.map((a) => [a.accountCode, a]));

  const grouped = {
    asset: [],
    liability: [],
    income: [],
    expense: [],
    equity: [],
  };

  for (const [code, value] of accountMap.entries()) {
    const meta = detailsMap.get(code) || {};
    const accountType = meta.accountType || "expense";
    const balance = Number(value.debit || 0) - Number(value.credit || 0);
    grouped[accountType].push({
      accountCode: code,
      accountName: meta.accountName || "",
      accountType,
      debit: value.debit,
      credit: value.credit,
      balance,
    });
  }

  const totals = Object.fromEntries(
    Object.entries(grouped).map(([k, rows]) => [
      k,
      rows.reduce((acc, row) => ({
        debit: acc.debit + Number(row.debit || 0),
        credit: acc.credit + Number(row.credit || 0),
        balance: acc.balance + Number(row.balance || 0),
      }), { debit: 0, credit: 0, balance: 0 }),
    ]),
  );

  const grandDebit = Object.values(totals).reduce((s, t) => s + Number(t.debit || 0), 0);
  const grandCredit = Object.values(totals).reduce((s, t) => s + Number(t.credit || 0), 0);

  if (Math.abs(grandDebit - grandCredit) > 0.01) {
    return errorResponse("TRIAL_BALANCE_MISMATCH", "Trial balance mismatch detected", 409, auth.requestId, {
      grandDebit,
      grandCredit,
      difference: grandDebit - grandCredit,
    });
  }

  return successResponse({ grouped, totals, grandDebit, grandCredit }, 200, auth.requestId);
}
