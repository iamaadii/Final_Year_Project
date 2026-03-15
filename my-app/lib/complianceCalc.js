/**
 * MSMED Act Compliance Calculator
 * Penalty interest: compound interest with monthly rests at 3 × RBI Bank Rate
 */

const DEFAULT_RBI_BANK_RATE = 0.065; // 6.5%

export function calculatePenalty(principal, overdueDays, rbiBankRate = DEFAULT_RBI_BANK_RATE) {
  if (overdueDays <= 0 || principal <= 0) {
    return { principal, interest: 0, totalPayable: principal, overdueDays: 0, appliedRateAnnual: 0 };
  }

  const annualRate = rbiBankRate * 3;
  const monthlyRate = annualRate / 12;
  const fullMonths = Math.floor(overdueDays / 30);
  const remainingDays = overdueDays % 30;

  // Compound for full months
  let amount = principal * Math.pow(1 + monthlyRate, fullMonths);

  // Simple interest for remaining days
  amount += amount * (annualRate * remainingDays / 365);

  const interest = amount - principal;

  return {
    principal: Math.round(principal * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    totalPayable: Math.round(amount * 100) / 100,
    overdueDays,
    appliedRateAnnual: `${(annualRate * 100).toFixed(1)}%`,
    rbiBaseRate: `${(rbiBankRate * 100).toFixed(1)}%`,
  };
}

/**
 * Determine MSMED payment deadline from invoice date.
 * No written agreement → 15 days; with agreement → up to 45 days.
 */
export function getMsmedDeadline(invoiceDate, paymentTermsDays = 45) {
  const d = new Date(invoiceDate);
  const terms = Math.min(Math.max(paymentTermsDays, 1), 45); // Cap at 45 days per MSMED Act
  d.setDate(d.getDate() + terms);
  return d;
}

/**
 * Get overdue days for an invoice
 */
export function getOverdueDays(msmedDeadline, paymentReceivedAt = null) {
  const now = paymentReceivedAt ? new Date(paymentReceivedAt) : new Date();
  const deadline = new Date(msmedDeadline);
  const diff = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Classify an invoice into a 43B(h) risk bucket.
 * Returns: "safe" | "approaching" | "at_risk" | "breached"
 */
export function get43BhBucket(daysSinceApproval) {
  if (daysSinceApproval < 30) return "safe";
  if (daysSinceApproval < 39) return "approaching";
  if (daysSinceApproval < 45) return "at_risk";
  return "breached";
}
