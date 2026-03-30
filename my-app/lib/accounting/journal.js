import JournalEntry from "@/models/JournalEntry";

export async function createJournalEntry({
  companyId,
  entryDate = new Date(),
  referenceType,
  referenceId = null,
  narration,
  lines,
  createdBy,
  createdByName = "",
}) {
  return JournalEntry.create({
    companyId: String(companyId),
    entryDate,
    referenceType,
    referenceId: referenceId ? String(referenceId) : null,
    narration,
    lines: Array.isArray(lines) ? lines : [],
    createdBy: String(createdBy),
    createdByName,
  });
}

export function isBalanced(lines = []) {
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.creditAmount || 0), 0);
  return Number(totalDebit.toFixed(2)) === Number(totalCredit.toFixed(2));
}
