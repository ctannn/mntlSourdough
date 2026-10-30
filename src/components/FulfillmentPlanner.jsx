import React, {useEffect, useMemo, useState} from 'react';
import {CalendarDays, ChevronLeft, ChevronRight, Home, MapPin, Search, Check, Truck} from 'lucide-react';
import {addDateDays, addDateMonths, calgaryToday, monthCells, occurrences, readableDate} from '../lib/scheduling.mjs';
import './FulfillmentPlanner.css';

// Customer requests are preferences only. Availability, capacity and delivery zones
// must be checked on the server before charging or confirming an order.
const SEARCH_BASE = 'https://nominatim.openstreetmap.org/search';
const CALGARY = {lat:51.0447, lon:-114.0719};
function mapURL(location) {
  const lat = Number(location?.lat ?? CALGARY.lat);
  const lon = Number(location?.lon ?? CALGARY.lon);
  const delta = location ? .006 : .16;
  const params = new URLSearchParams({
    bbox:[lon-delta,lat-delta,lon+delta,lat+delta].join(','),
    layer:'mapnik',
    marker:lat+','+lon
  });
  return 'https://www.openstreetmap.org/export/embed.html?'+params;
}
export function FulfillmentPlanner({mode, fulfillment, onFulfillmentChange, preference, onPreferenceChange}) {
  const today = calgaryToday();
  const firstSelectable = addDateDays(today, 2);
  const lastSelectable = addDateDays(today, 90);
  const [month, setMonth] = useState(preference.date ? preference.date.slice(0,7) : firstSelectable.slice(0,7));
  const [searchText, setSearchText] = useState(preference.address || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [location, setLocation] = useState(preference.location || null);
  const [showMap, setShowMap] = useState(false);
  const [requests, setRequests] = useState(0);
  const set = patch => onPreferenceChange(previous => ({...previous,...patch}));
  const frequency = mode === 'one-time' ? 'once' : preference.frequency;
  const scheduled = useMemo(() => occurrences(preference.date, frequency, 4),[preference.date, frequency]);
  const dayCells = useMemo(() => monthCells(month),[month]);
  const monthLabel = new Intl.DateTimeFormat('en-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
  useEffect(() => { if (fulfillment !== 'delivery') {setResults([]); setSearchError('');} },[fulfillment]);

  async function findAddress(event) {
    event.preventDefault();
    const query = searchText.trim();
    if(query.length < 6){setSearchError('Please enter a full street address.');return;}
    if(searching)return;
    setSearchError('');setResults([]);setSearching(true);
    try {
      // Explicit search only: no keystroke-based geocoding or automatic background requests.
      // Replace with a contracted address provider before paid launch or high traffic.
      const params = new URLSearchParams({
        q: query+', Calgary, Alberta, Canada',
        format:'jsonv2', addressdetails:'1', limit:'5', countrycodes:'ca'
      });
      const response = await fetch(SEARCH_BASE+'?'+params,{headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Address search is temporarily unavailable');
      const json = await response.json();
      const matches = Array.isArray(json) ? json.filter(r => {
        const state = r.address?.state || '';
        const city = r.address?.city || r.address?.town || r.address?.municipality || '';
        return /Alberta/i.test(state) && /Calgary/i.test(city+' '+r.display_name);
      }):[];
      if(!matches.length)setSearchError('No Calgary matches found. Check the spelling or enter the address manually below.');
      setResults(matches);
      setRequests(n=>n+1);
    } catch {setSearchError('Map lookup is unavailable. You can still enter your address for an inquiry.');}
    finally {setSearching(false);}
  }
  function chooseAddress(result) {
    const next={lat:Number(result.lat),lon:Number(result.lon)};
    setLocation(next);
    setSearchText(result.display_name);
    set({address:result.display_name,location:next});
    setResults([]);setShowMap(true);setSearchError('');
  }
  function calendarDay(date) {
    const outside = !date.startsWith(month);
    const disabled = date < firstSelectable || date > lastSelectable;
    return <button type="button" key={date} disabled={disabled} aria-pressed={preference.date===date}
      aria-label={readableDate(date,{weekday:'long', month:'long',day:'numeric', year:'numeric'}) + (disabled?' unavailable':'')}
      onClick={()=>set({date})} className={'mntl-day'+(outside?' is-outside':'')+(preference.date===date?' is-selected':'')}>
      {Number(date.slice(-2))}
    </button>;
  }
  return <div className="mntl-planner">
    {mode === 'subscription' && <div className="mntl-planner-block">
      <div className="mntl-planner-label"><span>04 — YOUR BREAD RHYTHM</span><CalendarDays size={17}/></div>
      <div className="mntl-segment" role="group" aria-label="Subscription frequency">
        <button type="button" aria-pressed={preference.frequency==='weekly'} className={preference.frequency==='weekly'?'is-selected':''} onClick={()=>set({frequency:'weekly'})}>Every week</button>
        <button type="button" aria-pressed={preference.frequency==='biweekly'} className={preference.frequency==='biweekly'?'is-selected':''} onClick={()=>set({frequency:'biweekly'})}>Every 2 weeks</button>
      </div>
      <p className="mntl-hint">Choose when your first bake should be. Future dates follow the same weekday.</p>
    </div>}
    <div className="mntl-planner-block">
      <div className="mntl-planner-label"><span>{mode === 'subscription' ? '05' : '04'} — PREFERRED FIRST BAKE DATE</span><CalendarDays size={17}/></div>
      <div className="mntl-calendar">
        <div className="mntl-calendar-head">
          <button type="button" aria-label="Previous month" disabled={month <= firstSelectable.slice(0,7)} onClick={()=>setMonth(old=>addDateMonths(old,-1))}><ChevronLeft size={18}/></button>
          <strong>{monthLabel}</strong>
          <button type="button" aria-label="Next month" disabled={month >= lastSelectable.slice(0,7)} onClick={()=>setMonth(old=>addDateMonths(old,1))}><ChevronRight size={18}/></button>
        </div>
        <div className="mntl-calendar-grid mntl-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span key={d}>{d}</span>)}</div>
        <div className="mntl-calendar-grid">{dayCells.map(calendarDay)}</div>
      </div>
      <p className="mntl-hint">Dates are requests, not confirmed availability. We will verify bake capacity and cutoff before accepting payment.</p>
      {preference.date && <div className="mntl-confirm"><Check size={17}/><span>Requested: <strong>{readableDate(preference.date,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</strong></span></div>}
      {scheduled.length>0 && <div className="mntl-upcoming"><span>YOUR NEXT FOUR REQUESTED DATES</span><div>{scheduled.map(d=><span key={d}>{readableDate(d)}</span>)}</div></div>}
    </div>
    <div className="mntl-planner-block">
      <div className="mntl-planner-label"><span>{mode === 'subscription' ? '06' : '05'} — YOUR {fulfillment==='delivery'?'DELIVERY LOCATION':'PICKUP LOCATION'}</span>{fulfillment==='delivery'?<Truck size={17}/>:<MapPin size={17}/>}</div>
      {fulfillment==='delivery' ? <>
        <p className="mntl-hint">Search for your home or enter your address directly. Your location stays in this browser until you choose to send an email inquiry.</p>
        <form className="mntl-address-search" onSubmit={findAddress}>
          <label className="mntl-sr" htmlFor="mntl-address-query">Calgary street address</label>
          <input id="mntl-address-query" value={searchText} onChange={e=>{setSearchText(e.target.value);setLocation(null);set({address:e.target.value,location:null});setResults([]);}} placeholder="Street address, Calgary" autoComplete="street-address"/>
          <button type="submit" disabled={searching} aria-label="Find address on map"><Search size={17}/><span>{searching?'Searching…':'Find home'}</span></button>
        </form>
        {searchError && <p className="mntl-error" role="status">{searchError}</p>}
        {results.length>0 && <div className="mntl-address-results" role="group" aria-label="Matching addresses">{results.map(r=><button type="button" key={r.place_id} onClick={()=>chooseAddress(r)}><Home size={17}/><span>{r.display_name}</span><Check size={15}/></button>)}</div>}
        <div className="mntl-map">
          <iframe title="Your requested Calgary delivery location" loading="lazy" src={mapURL(location)} referrerPolicy="no-referrer-when-downgrade" />
          <span className="mntl-map-credit">© OpenStreetMap contributors</span>
        </div>
        {location && <a className="mntl-map-open" href={'https://www.openstreetmap.org/?mlat='+location.lat+'&mlon='+location.lon+'#map=17/'+location.lat+'/'+location.lon} target="_blank" rel="noopener noreferrer">View chosen location on map ↗</a>}
        <label className="mntl-field"><span>Delivery address (edit if needed)</span><input value={preference.address || ''} onChange={e=>{set({address:e.target.value,location:null});setLocation(null);setSearchText(e.target.value);}} placeholder="Street, city, postal code" autoComplete="street-address"/></label>
        <label className="mntl-field"><span>Apartment, unit or delivery instructions <small>(optional)</small></span><input value={preference.instructions||''} onChange={e=>set({instructions:e.target.value})} placeholder="Unit number, buzzer, entrance..." /></label>
        <p className="mntl-hint">Delivery area and fees are not yet confirmed. Map results are approximate and do not verify deliverability.</p>
      </> : <div className="mntl-pickup-note"><MapPin size={19}/><p><strong>Pickup in Calgary</strong><br/>Exact pickup address, hours and directions will be provided before your order is confirmed.</p></div>}
    </div>
  </div>;
}
