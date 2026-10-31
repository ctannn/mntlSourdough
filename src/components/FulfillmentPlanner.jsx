import React, {useMemo, useState} from 'react';
import {GoogleAddressPicker} from './GoogleAddressPicker.jsx';
import {OpenStreetAddressPicker} from './OpenStreetAddressPicker.jsx';
import {CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, Check, Truck} from 'lucide-react';
import {addDateDays, addDateMonths, calgaryToday, monthCells, occurrences, readableDate, cadenceLabel, validCadence} from '../lib/scheduling.mjs';
import './FulfillmentPlanner.css';

// Customer requests are preferences only. Availability, capacity and delivery zones
// must be checked on the server before charging or confirming an order.
const GOOGLE_JS_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_KEY || '';
function mapSearch(address) {
  return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address+', Calgary, Alberta, Canada');
}
export function FulfillmentPlanner({mode, fulfillment, preference, onPreferenceChange, availability, pickupAddress}) {
  const today = calgaryToday();
  const firstSelectable = addDateDays(today, 2);
  const lastSelectable = addDateDays(today, 90);
  const [month, setMonth] = useState(preference.date ? preference.date.slice(0,7) : firstSelectable.slice(0,7));
  const [searchText, setSearchText] = useState(preference.address || '');
  const [searchError, setSearchError] = useState('');
  const availableByDate=useMemo(()=>new Map((availability?.dates||[]).map(x=>[x.date,x])),[availability]);
  const liveDates=Boolean(availability?.configured && (availability.dates||[]).some(x=>x.bookable));
  const set = patch => onPreferenceChange(previous => ({...previous,...patch}));
  const frequency = mode === 'one-time' ? 'once' : preference.frequency;
  const cadence={interval:Number(preference.customInterval||0),unit:preference.customUnit||'days'};
  const scheduled = useMemo(() => mode==='subscription'?occurrences(preference.date, frequency, 4, cadence):[],[preference.date, frequency,preference.customInterval,preference.customUnit,mode]);
  const dayCells = useMemo(() => monthCells(month),[month]);
  const monthLabel = new Intl.DateTimeFormat('en-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
  function findAddress(event) {
    event.preventDefault();
    const query = searchText.trim();
    if(query.length < 6){setSearchError('Please enter a full street address.');return;}
    setSearchError('');
    set({address:query});
  }
  function calendarDay(date) {
    const outside = !date.startsWith(month);
    const disabled = date < firstSelectable || date > lastSelectable || (liveDates&&!availableByDate.get(date)?.bookable);
    return <button type="button" key={date} disabled={disabled} aria-pressed={preference.date===date}
      aria-label={readableDate(date,{weekday:'long', month:'long',day:'numeric', year:'numeric'}) + (disabled?' unavailable':'')}
      onClick={()=>set({date})} className={'mntl-day'+(outside?' is-outside':'')+(preference.date===date?' is-selected':'')+(availableByDate.get(date)?.bookable?' is-bookable':'')}>
      {Number(date.slice(-2))}
    </button>;
  }
  return <div className="mntl-planner">
    {mode === 'subscription' && <div className="mntl-planner-block">
      <div className="mntl-planner-label"><span>04 — YOUR BREAD RHYTHM</span><CalendarDays size={17}/></div>
      <div className="mntl-segment mntl-rhythm-options" role="group" aria-label="Subscription frequency">
        {[
          ['weekly','Every week'],['biweekly','Every 2 weeks'],
          ['triweekly','Every 3 weeks'],['monthly','Monthly'],
          ['custom','Custom cadence']
        ].map(([value,label])=><button key={value} type="button"
          aria-pressed={preference.frequency===value}
          className={preference.frequency===value?'is-selected':''}
          onClick={()=>set({frequency:value})}>{label}</button>)}
      </div>
      {preference.frequency==='custom'&&<div className="mntl-custom-rhythm">
        <label htmlFor="mntl-custom-interval">Repeat every</label>
        <input id="mntl-custom-interval" type="number" min="1"
          max={preference.customUnit==='weeks'?12:90} step="1"
          value={preference.customInterval??10}
          onChange={e=>set({customInterval:e.target.value===''?'':Number(e.target.value)})}/>
        <label className="mntl-sr" htmlFor="mntl-custom-unit">Custom interval unit</label>
        <select id="mntl-custom-unit" value={preference.customUnit||'days'}
          onChange={e=>set({customUnit:e.target.value,customInterval:Math.min(Number(preference.customInterval)||1,e.target.value==='weeks'?12:90)})}>
          <option value="days">Days</option><option value="weeks">Weeks</option>
        </select>
      </div>}
      {preference.frequency==='custom'&&!validCadence(preference.frequency,cadence)
        &&<p className="mntl-error" role="alert">Choose 1–90 days or 1–12 weeks for your custom interval.</p>}
      <p className="mntl-hint">Your requested rhythm: <strong>{cadenceLabel(preference.frequency,cadence)}</strong>. Choose the first bake below to preview your next four requests. All dates remain subject to the bakery's actual schedule and confirmation.</p>
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
      <p className="mntl-hint" role="status">{liveDates?'Only dates marked with a dot are currently open for requests. Capacity is held only during real checkout.':(availability?.message||'Select a preferred date. Bakery availability will be confirmed before any payment.')}</p>
      {preference.date && <div className="mntl-confirm"><Check size={17}/><span>Requested: <strong>{readableDate(preference.date,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</strong></span></div>}
      {scheduled.length>0 && <div className="mntl-upcoming"><span>YOUR NEXT FOUR REQUESTED DATES</span><div>{scheduled.map(d=><span key={d}>{readableDate(d)}</span>)}</div></div>}
    </div>
    <div className="mntl-planner-block">
      <div className="mntl-planner-label"><span>{mode === 'subscription' ? '06' : '05'} — YOUR {fulfillment==='delivery'?'DELIVERY LOCATION':'PICKUP LOCATION'}</span>{fulfillment==='delivery'?<Truck size={17}/>:<MapPin size={17}/>}</div>
      {fulfillment==='delivery' ? <>
        <p className="mntl-hint">Choose your home on the map or enter your address. We will confirm delivery eligibility and fees before payment.</p>
        {GOOGLE_JS_KEY ? <GoogleAddressPicker value={preference} onChange={patch=>{set(patch);if(patch.address){setSearchText(patch.address)}}}/> : <>
          <form className="mntl-address-search" onSubmit={findAddress}>
            <label className="mntl-sr" htmlFor="mntl-address-query">Calgary street address</label>
            <input id="mntl-address-query" value={searchText} onChange={e=>{setSearchText(e.target.value);set({address:e.target.value,location:null});}} placeholder="Street address, Calgary" autoComplete="street-address"/>
            <button type="submit" aria-label="Preview address on map"><Search size={17}/><span>Preview address</span></button>
          </form>
          {searchError && <p className="mntl-error" role="status">{searchError}</p>}
          <OpenStreetAddressPicker value={preference} onChange={patch=>set(patch)}/>
          {searchText.trim()&&<a className="mntl-map-open" href={mapSearch(searchText)} target="_blank" rel="noopener noreferrer">Find this street address on Google Maps ↗</a>}
          <p className="mntl-hint">Tap the map to choose your entrance pin. For automatic address suggestions, the bakery can enable Google Places. Map pins are not delivery eligibility checks.</p>
        </>}
        <label className="mntl-field"><span>Delivery address (edit if needed)</span><input value={preference.address || ''} onChange={e=>{set({address:e.target.value,location:null});setSearchText(e.target.value);setSearchError('');}} placeholder="Street, city, postal code" autoComplete="street-address"/></label>
        <label className="mntl-field"><span>Apartment, unit or delivery instructions <small>(optional)</small></span><input value={preference.instructions||''} onChange={e=>set({instructions:e.target.value})} placeholder="Unit number, buzzer, entrance..." /></label>
        <p className="mntl-hint">Delivery area and fees are not yet confirmed. Map previews do not verify deliverability.</p>
      </> : <div className="mntl-pickup-note"><MapPin size={19}/><p><strong>Pickup in Calgary</strong><br/>{pickupAddress?pickupAddress:'Exact pickup address, hours and directions will be provided before your order is confirmed.'}</p></div>}
    </div>
  </div>;
}
