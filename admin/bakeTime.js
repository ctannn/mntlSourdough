/**
 * Bakery timestamps are in Calgary/Alberta official time.
 *
 * Alberta adopted permanent Alberta Time (UTC-6) effective Nov 1, 2026.
 * It was already UTC-6 during summer 2026, starting Mar 8 at 03:00
 * local. We explicitly pin the UTC-6 period so older devices with stale
 * IANA tzdata do not display winter oven times one hour out.
 *
 * Older historic dates still use America/Edmonton for backwards compatibility.
 * No privileged server clock or browser timezone is trusted.
 */
const ZONE = 'America/Edmonton';
const UTC6_START=Date.parse('2026-03-08T09:00:00Z');
const OFFSET_MS=6*60*60*1000;

function dateParts(instant) {
  if(instant.getTime()>=UTC6_START){
    const date=new Date(instant.getTime()-OFFSET_MS);
    return {year:String(date.getUTCFullYear()),month:String(date.getUTCMonth()+1).padStart(2,'0'),day:String(date.getUTCDate()).padStart(2,'0'),hour:String(date.getUTCHours()).padStart(2,'0'),minute:String(date.getUTCMinutes()).padStart(2,'0')};
  }
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(instant);
  return Object.fromEntries(parts.map(part=>[part.type,part.value]));
}
function olderOffsetMinutes(utcMs) {
  const name=new Intl.DateTimeFormat('en-US',{
    timeZone:ZONE,timeZoneName:'shortOffset'
  }).formatToParts(new Date(utcMs)).find(x=>x.type==='timeZoneName')?.value;
  const match=name?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if(!match)throw new Error('Cannot determine historical Calgary offset.');
  const sign=match[1]==='-'?-1:1;
  return sign*(Number(match[2])*60+Number(match[3]||0));
}

export function toCalgaryDatetimeInput(iso) {
  if(!iso)return '';
  const date=new Date(iso);
  if(!Number.isFinite(date.getTime()))return '';
  const p=dateParts(date);
  return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute;
}

export function fromCalgaryDatetimeInput(wallTime) {
  const match=String(wallTime||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if(!match)throw new Error('Enter a valid date and time in Calgary.');
  const [,y,m,d,h,min]=match.map((x,i)=>i===0?x:Number(x));
  const naiveUtc=Date.UTC(y,m-1,d,h,min);
  if(new Date(naiveUtc).toISOString().slice(0,16)!==wallTime)throw new Error('Invalid calendar date/time.');
  let actual;
  if(wallTime>='2026-03-08T03:00'){
    actual=naiveUtc+OFFSET_MS;
  }else{
    actual=naiveUtc-olderOffsetMinutes(naiveUtc)*60000;
    actual=naiveUtc-olderOffsetMinutes(actual)*60000;
  }
  if(toCalgaryDatetimeInput(new Date(actual).toISOString())!==wallTime){
    throw new Error('That Calgary time does not exist due to a historical clock change.');
  }
  return new Date(actual).toISOString();
}
