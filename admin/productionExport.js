/**
 * MNTL baker production CSV.
 *
 * Grain: one row per (bake_date, product_id). Suitable for spreadsheet review
 * and future warehouse reconciliation without disclosing customer PII.
 *
 * Confirmed, unpaid, and subscription-projected quantities are separate.
 * Forecasts are NOT paid orders. No claims about net revenue/refunds.
 */
export const PRODUCTION_COLUMNS = Object.freeze([
  'bake_date',
  'product_id',
  'product_name',
  'confirmed_paid_loaves',
  'unpaid_loaves',
  'subscription_forecast_loaves',
  'bake_day_scheduled',
  'capacity_loaves',
  'bake_day_status',
  'data_source'
]);

function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value).replace(/\r\n?/g, '\n');
  // Block CSV/Excel formula injection through product names or metadata.
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function integerUnits(value) {
  const n = Number(value ?? 0);
  if (!Number.isInteger(n) || n < 0) throw Error('Production units must be nonnegative integers');
  return n;
}

export function productionRows(days, products, {demo = false} = {}) {
  if (!Array.isArray(days) || !Array.isArray(products)) throw Error('Invalid production input');
  const seen = new Set();
  const output = [];

  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) throw Error('Invalid production date');
    for (const product of [...products].sort((a, b) => a.name.localeCompare(b.name))) {
      if (typeof product.id !== 'string' || !product.id || typeof product.name !== 'string') {
        throw Error('Invalid product');
      }
      const pk = day.date + '|' + product.id;
      if (seen.has(pk)) throw Error('Duplicate date/product grain');
      seen.add(pk);
      output.push({
        bake_date: day.date,
        product_id: product.id,
        product_name: product.name,
        confirmed_paid_loaves: integerUnits(day.paidUnits?.[product.id]),
        unpaid_loaves: integerUnits(day.unpaidUnits?.[product.id]),
        subscription_forecast_loaves: integerUnits(day.projectedUnits?.[product.id]),
        bake_day_scheduled: Boolean(day.scheduled),
        capacity_loaves: day.scheduled ? integerUnits(day.scheduled.capacity_loaves) : null,
        bake_day_status: day.scheduled?.status ?? 'unscheduled',
        data_source: demo ? 'DEMO_ONLY' : 'LIVE'
      });
    }
  }
  return output;
}

export function productionCsv(days, products, options) {
  const rows = productionRows(days, products, options);
  return '\uFEFF' + [
    PRODUCTION_COLUMNS.join(','),
    ...rows.map(row => PRODUCTION_COLUMNS.map(column => csvCell(row[column])).join(','))
  ].join('\r\n') + '\r\n';
}

export function filenameForProduction(days, {demo = false} = {}) {
  if (!days.length) throw Error('No dates selected for export');
  const sorted = [...days].map(d => d.date).sort();
  const prefix = demo ? 'mntl-DEMO-production-' : 'mntl-production-';
  return prefix + sorted[0] + '-to-' + sorted[sorted.length - 1] + '.csv';
}
