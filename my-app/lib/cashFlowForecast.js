/**
 * Cash Flow Forecast — Exponential Weighted Moving Average (EWMA)
 * Supervision: Unsupervised (no labels) | Batch | Model-based (statistical)
 * No external dependencies — runs entirely from MongoDB invoice data.
 */

/**
 * Build a monthly time-series from a list of invoice payments.
 * @param {Array} settlements - invoices with paymentReceivedAt and totalAmount
 * @returns {Array<{month: string, amount: number}>} sorted ascending
 */
export function buildMonthlySeries(settlements) {
  const map = {};
  for (const inv of settlements) {
    if (!inv.paymentReceivedAt) continue;
    const d = new Date(inv.paymentReceivedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + (inv.totalAmount || 0);
  }
  return Object.entries(map)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Apply EWMA smoothing.
 * alpha: smoothing factor 0 < alpha <= 1 (higher = more reactive to recent)
 */
export function ewma(series, alpha = 0.3) {
  if (!series.length) return [];
  const result = [];
  let prev = series[0].amount;
  for (const point of series) {
    const smoothed = alpha * point.amount + (1 - alpha) * prev;
    result.push({ month: point.month, actual: Math.round(point.amount), smoothed: Math.round(smoothed) });
    prev = smoothed;
  }
  return result;
}

/**
 * Project N months forward using the last smoothed value as baseline,
 * with trend derived from the last 3 months.
 */
export function forecastNext(smoothedSeries, months = 3) {
  if (!smoothedSeries.length) return [];

  const last = smoothedSeries[smoothedSeries.length - 1];
  const lookback = smoothedSeries.slice(-3);
  const trend = lookback.length >= 2
    ? (lookback[lookback.length - 1].smoothed - lookback[0].smoothed) / (lookback.length - 1)
    : 0;

  const [lastYear, lastMonth] = last.month.split("-").map(Number);
  const forecasts = [];
  for (let i = 1; i <= months; i++) {
    const totalMonth = lastMonth + i;
    const year = lastYear + Math.floor((totalMonth - 1) / 12);
    const month = ((totalMonth - 1) % 12) + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const projected = Math.max(0, Math.round(last.smoothed + trend * i));
    forecasts.push({ month: key, projected, isForecast: true });
  }
  return forecasts;
}

/**
 * Full pipeline: raw invoice list → EWMA time-series + 3-month forecast.
 */
export function runCashFlowForecast(invoices, alpha = 0.3, forecastMonths = 3) {
  const series = buildMonthlySeries(invoices);
  const smoothed = ewma(series, alpha);
  const forecast = forecastNext(smoothed, forecastMonths);
  const totalActual = series.reduce((s, p) => s + p.amount, 0);
  const avgMonthly = series.length > 0 ? Math.round(totalActual / series.length) : 0;
  return { history: smoothed, forecast, avgMonthly, totalActual: Math.round(totalActual) };
}
