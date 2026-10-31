// Date-only scheduling helpers. Never parse local-midnight dates: browser and Calgary timezones can differ.
const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
export function isISODate(value) {
  if (typeof value !== 'string' || !isoPattern.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function calgaryToday(now = new Date()) {
  if (now.getTime() >= Date.parse('2026-03-08T09:00:00Z')) {
    return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
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
export function validCadence(frequency, custom = {}) {
  if (['weekly','biweekly','triweekly','monthly'].includes(frequency)) return true;
  if (frequency !== 'custom') return false;
  const {unit,interval} = custom;
  return Number.isInteger(interval) && interval >= 1
    && ((unit === 'days' && interval <= 90) || (unit === 'weeks' && interval <= 12));
}
export function cadenceLabel(frequency, custom = {}) {
  if (frequency === 'weekly') return 'Every week';
  if (frequency === 'biweekly') return 'Every 2 weeks';
  if (frequency === 'triweekly') return 'Every 3 weeks';
  if (frequency === 'monthly') return 'Every month';
  if (frequency === 'custom' && validCadence(frequency,custom)) {
    return 'Every ' + custom.interval + ' ' + (custom.unit === 'weeks' ? (custom.interval === 1?'week':'weeks') : (custom.interval === 1?'day':'days'));
  }
  return 'Schedule not selected';
}
function addRecurringMonths(first, numberOfMonths) {
  const start = new Date(first + 'T12:00:00Z');
  const anchorDay = start.getUTCDate();
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth()+numberOfMonths,1,12));
  const nextMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth()+1,1,12));
  const lastDay = Math.round((nextMonthStart-monthStart)/86400000);
  monthStart.setUTCDate(Math.min(anchorDay,lastDay));
  return monthStart.toISOString().slice(0,10);
}
export function occurrences(first, frequency, count = 4, custom = {}) {
  if (!isISODate(first) || !validCadence(frequency, custom) ||
      !Number.isInteger(count) || count < 0 || count > 52) return [];
  if (frequency === 'monthly') {
    return Array.from({length:count}, (_,i) => addRecurringMonths(first,i));
  }
  const days = frequency === 'weekly' ? 7
    : frequency === 'biweekly' ? 14
    : frequency === 'triweekly' ? 21
    : custom.interval * (custom.unit === 'weeks' ? 7 : 1);
  return Array.from({length: count}, (_,i) => addDateDays(first,i*days));
}
export function readableDate(value, opts = {weekday:'short', month:'short', day:'numeric'}) {
  if (!isISODate(value)) return '';
  return new Intl.DateTimeFormat('en-CA', {timeZone:'UTC', ...opts}).format(new Date(value + 'T12:00:00Z'));
}
