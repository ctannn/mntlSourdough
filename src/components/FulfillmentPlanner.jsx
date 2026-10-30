import React, {useMemo, useState} from 'react';
import {CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, Check, Truck} from 'lucide-react';
import {addDateDays, addDateMonths, calgaryToday, monthCells, occurrences, readableDate} from '../lib/scheduling.mjs';
import './FulfillmentPlanner.css';

// Customer requests are preferences only. Availability, capacity and delivery zones
// must be checked on the server before charging or confirming an order.
const MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || '';
const CALGARY_MAP = 'https://www.openstreetmap.org/export/embed.html?bbox=-114.23%2C50.94%2C-113.91%2C51.16&layer=mapnik';
function mapPreview(address) {
  return MAPS_EMBED_KEY && address
    ? 'https://www.google.com/maps/embed/v1/place?key='+encodeURIComponent(MAPS_EMBED_KEY)+'&q='+encodeURIComponent(address+', Calgary, Alberta, Canada')
    : CALGARY_MAP;
}
function mapSearch(address) {
  return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address+', Calgary, Alberta, Canada');
}
export function FulfillmentPlanner({mode, fulfillment, onFulfillmentChange, preference, onPreferenceChange}) {
  const today = calgaryToday();
  const firstSelectable = addDateDays(today, 2);
  const lastSelectable = addDateDays(today, 90);
  const [month, setMonth] = useState(preference.date ? preference.date.slice(0,7) : firstSelectable.slice(0,7));
  const [searchText, setSearchText] = useState(preference.address || '');
  const [mapAddress, setMapAddress] = useState('');
  const [searchError, setSearchError] = useState('');
  const set = patch => onPreferenceChange(previous => ({...previous,...patch}));
  const frequency = mode === 'one-time' ? 'once' : preference.frequency;
  const scheduled = useMemo(() => occurrences(preference.date, frequency, 4),[preference.date, frequency]);
  const dayCells = useMemo(() => monthCells(month),[month]);
  const monthLabel = new Intl.DateTimeFormat('en-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
  function findAddress(event) {
    event.preventDefault();
    const query = searchText.trim();
    if(query.length < 6){setSearchError('Please enter a full street address.');return;}
    setSearchError('');
    setMapAddress(query);
    set({address:query});
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
        <p className="mntl-hint">Enter your Calgary street address, then preview it on a map. Your requested location will be confirmed before delivery.</p>
        <form className="mntl-address-search" onSubmit={findAddress}>
          <label className="mntl-sr" htmlFor="mntl-address-query">Calgary street address</label>
          <input id="mntl-address-query" value={searchText} onChange={e=>{setSearchText(e.target.value);set({address:e.target.value,location:null});setMapAddress('');}} placeholder="Street address, Calgary" autoComplete="street-address"/>
          <button type="submit" aria-label="Preview address on map"><Search size={17}/><span>Preview address</span></button>
        </form>
        {searchError && <p className="mntl-error" role="status">{searchError}</p>}
        <div className="mntl-map">
          <iframe title="Map of Calgary and your requested delivery address" loading="lazy" src={mapPreview(mapAddress)} referrerPolicy="strict-origin-when-cross-origin" />
          {!MAPS_EMBED_KEY&&<span className="mntl-map-credit">© OpenStreetMap contributors · Calgary area preview</span>}
        </div>
        {mapAddress && <a className="mntl-map-open" href={mapSearch(mapAddress)} target="_blank" rel="noopener noreferrer">{MAPS_EMBED_KEY?'Open this location in Google Maps ↗':'Find this address on Google Maps ↗'}</a>}
        {!MAPS_EMBED_KEY && <p className="mntl-hint">Interactive home pin preview requires a configured Google Maps API key. The map above shows Calgary until then; use the link to look up your home externally.</p>}
        <label className="mntl-field"><span>Delivery address (edit if needed)</span><input value={preference.address || ''} onChange={e=>{set({address:e.target.value,location:null});setSearchText(e.target.value);setMapAddress('');}} placeholder="Street, city, postal code" autoComplete="street-address"/></label>
        <label className="mntl-field"><span>Apartment, unit or delivery instructions <small>(optional)</small></span><input value={preference.instructions||''} onChange={e=>set({instructions:e.target.value})} placeholder="Unit number, buzzer, entrance..." /></label>
        <p className="mntl-hint">Delivery area and fees are not yet confirmed. Map previews do not verify deliverability.</p>
      </> : <div className="mntl-pickup-note"><MapPin size={19}/><p><strong>Pickup in Calgary</strong><br/>Exact pickup address, hours and directions will be provided before your order is confirmed.</p></div>}
    </div>
  </div>;
}
