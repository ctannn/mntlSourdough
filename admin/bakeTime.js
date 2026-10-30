/**
 * Date/time helpers for the bakery operations team.
 *
 * Always interpret a staff-entered oven-ready time as Calgary/Mountain wall
 * time, even when an owner is travelling. ISO timestamps are stored in UTC.
 * This uses native Intl rather than trusting the staff device's timezone.
 */
const ZONE = 'America/Edmonton';

function dateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA',{
    timeZone: ZONE, year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part=>[part.type,part.value]));
}

function offsetMinutes(utcMs) {
  const name = new Intl.DateTimeFormat('en-US',{
    timeZone:ZONE,timeZoneName:'shortOffset'
  }).formatToParts(new Date(utcMs)).find(x=>x.type==='timeZoneName')?.value;
  const match = name?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if(!match)throw new Error('Cannot determine Calgary timezone offset.');
  const sign=match[1]==='-'?-1:1;
  return sign*(Number(match[2])*60+Number(match[3]||0));
}

export function toCalgaryDatetimeInput(iso) {
  if(!iso)return '';
  const d=new Date(iso);
  if(!Number.isFinite(d.getTime()))return '';
  const p=dateParts(d);
  return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute;
}

export function fromCalgaryDatetimeInput(wallTime) {
  const match=String(wallTime||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if(!match)throw new Error('Please enter a valid date and time in Calgary.');
  const [,year,month,day,hour,minute]=match.map((x,i)=>i===0?x:Number(x));
  const naiveUtc=Date.UTC(year,month-1,day,hour,minute);
  let actual=naiveUtc-offsetMinutes(naiveUtc)*60000;
  actual=naiveUtc-offsetMinutes(actual)*60000;
  if(toCalgaryDatetimeInput(new Date(actual).toISOString())!==wallTime) {
    throw new Error('That Calgary time does not exist because of the daylight saving change.');
  }
  return new Date(actual).toISOString();
}
