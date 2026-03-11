export function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function normalizeDate(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function shouldSendReminder(invoice, now = new Date()) {
  if (!invoice?.reminderPolicy?.enabled) return false;
  if (invoice.paymentReceivedAt) return false;
  if (invoice.isDeleted) return false;
  if (invoice.status === "Settled") return false;

  const deliveryDate = normalizeDate(invoice.deliveryDate);
  if (!deliveryDate) return false;

  const startAfterDays = Number(invoice.reminderPolicy?.startAfterDays || 45);
  const nextReminderAt = invoice.reminderPolicy?.nextReminderAt
    ? normalizeDate(invoice.reminderPolicy.nextReminderAt)
    : addDays(deliveryDate, startAfterDays);

  if (!nextReminderAt) return false;
  return now >= nextReminderAt;
}

export function computeNextReminderAt(now, intervalDays) {
  return addDays(now, Number(intervalDays || 2));
}
