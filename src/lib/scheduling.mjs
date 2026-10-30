// Date-only scheduling helpers. Never parse local-midnight dates: browser and Calgary timezones can differ.
const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
export function isISODate(value) {
  if (typeof value !== 'string' || !isoPattern.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function calgaryToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Edmonton', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return date.year + '-' + date.month + '-' + date.day;
}
export function addDateDays(value, days) {
  if (!isISODate(value) || !Number.isInteger(days)) throw new Error('Invalid date');
  const date = new Date(value + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function addDateMonths(month, count) {
  if (!/^\d{4}-\d{2}$/.test(month) || !Number.isInteger(count)) throw new Error('Invalid month');
  const date = new Date(month + '-01T12:00:00Z');
  if (Number.isNaN(date.getTime())) throw new Error('Invalid month');
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 7);
}
export function monthCells(month) {
  const first = month + '-01';
  if (!isISODate(first)) throw new Error('Invalid month');
  const offset = new Date(first + 'T12:00:00Z').getUTCDay();
  return Array.from({length: 42}, (_, i) => addDateDays(first, i - offset));
}
export function occurrences(first, frequency, count = 4) {
  if (!isISODate(first) || !['weekly', 'biweekly'].includes(frequency) || !Number.isInteger(count) || count < 0 || count > 52) return [];
  const interval = frequency === 'weekly' ? 7 : 14;
  return Array.from({length: count}, (_, i) => addDateDays(first, i * interval));
}
export function readableDate(value, opts = {weekday:'short', month:'short', day:'numeric'}) {
  if (!isISODate(value)) return '';
  return new Intl.DateTimeFormat('en-CA', {timeZone:'UTC', ...opts}).format(new Date(value + 'T12:00:00Z'));
}
