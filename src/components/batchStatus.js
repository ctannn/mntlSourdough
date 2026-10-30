/**
 * Public bakery freshness clock.
 *
 * All times are real ISO timestamps explicitly saved and published by MNTL staff.
 * This module has no browser APIs or network access and can be tested with
 * stable timestamps. Never manufacture a countdown for an unpublished batch.
 */

export const STAGES = Object.freeze([
  'mixing', 'fermenting', 'shaping', 'proofing', 'baking', 'cooling', 'ready'
]);
const DAY_MS = 24 * 60 * 60 * 1000;
const UTC6_START=Date.parse('2026-03-08T09:00:00Z');
const ALBERTA_OFFSET_MS=6*60*60*1000; // Permanent Alberta Time from Nov 2026; already UTC-6 since Mar 8.

export function calgaryDate(nowMs) {
  if(nowMs>=UTC6_START){
    // Avoid obsolete client tzdata reverting Alberta to MST after Nov 1 2026.
    return new Date(nowMs-ALBERTA_OFFSET_MS).toISOString().slice(0,10);
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'America/Edmonton',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date(nowMs));
  const p=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return p.year+'-'+p.month+'-'+p.day;
}

export function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const digits = value => String(value).padStart(2, '0');
  return hours > 0
    ? digits(hours) + ':' + digits(minutes) + ':' + digits(seconds)
    : digits(minutes) + ':' + digits(seconds);
}

export function calgaryClock(iso) {
  if(!iso||!Number.isFinite(Date.parse(iso)))return null;
  const ms=Date.parse(iso);
  const fixed=ms>=UTC6_START;
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:fixed?'UTC':'America/Edmonton',
    month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true
  }).format(new Date(fixed?ms-ALBERTA_OFFSET_MS:ms));
}

export function resolveFreshness(rows, nowMs) {
  const today = calgaryDate(nowMs);
  const published = (Array.isArray(rows) ? rows : []).filter(row =>
    row && row.published === true &&
    typeof row.bake_date === 'string' && row.bake_date >= today &&
    STAGES.includes(row.stage)
  );
  const future = published
    .filter(row => row.estimated_ready_at && !['ready','cooling'].includes(row.stage)
      && Number.isFinite(Date.parse(row.estimated_ready_at))
      && Date.parse(row.estimated_ready_at) > nowMs)
    .sort((a,b) => Date.parse(a.estimated_ready_at)-Date.parse(b.estimated_ready_at));

  if (future.length) {
    const batch = future[0];
    const remainingMs = Date.parse(batch.estimated_ready_at) - nowMs;
    return remainingMs <= DAY_MS
      ? {kind:'countdown',batch,remainingMs}
      : {kind:'scheduled',batch,remainingMs};
  }

  // Only a baker-published current-day stage is allowed on the website.
  const current = published.find(row=>row.bake_date===today);
  if (current?.stage === 'ready' || current?.stage === 'cooling') {
    return {kind:'fresh',batch:current,remainingMs:null};
  }
  if (current && !current.estimated_ready_at) {
    return {kind:'progress',batch:current,remainingMs:null};
  }
  // Expired estimates are not evidence that a fresh loaf is available.
  return {kind:'idle',batch:null,remainingMs:null};
}
