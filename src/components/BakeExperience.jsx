import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {ArrowRight, Clock3, Flame} from 'lucide-react';
import {calgaryDate, calgaryClock, formatRemaining, resolveFreshness} from './batchStatus.js';
import './BakeExperience.css';

/**
 * One *real* freshness clock across the website.
 *
 * Public visitors see only baker-published Supabase records. The timer is NOT a
 * visitor play/pause widget, and we never auto-generate a countdown from a
 * guessed baking cadence. Each time shown is an estimated oven-ready timestamp
 * explicitly entered by MNTL staff in the private operations dashboard.
 */
const SUPABASE_URL = 'https://dfyzpflempgtokyhvtlo.supabase.co';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_Q0akOPZNikRT46IMxE4ddg_V59iZ90C';
const REFRESH_MS = 60_000;
const BakeContext = createContext(null);

async function loadPublishedBatches() {
  const date = calgaryDate(Date.now());
  const url = SUPABASE_URL +
    '/rest/v1/bake_updates?select=bake_date,stage,public_note,estimated_ready_at,published,updated_at' +
    '&published=eq.true&bake_date=gte.' + encodeURIComponent(date) +
    '&order=bake_date.asc&limit=30';
  const response = await fetch(url, {
    cache: 'no-store', headers: {apikey: SUPABASE_PUBLIC_KEY}
  });
  if (!response.ok) throw new Error('Public bakery updates are temporarily unavailable.');
  return response.json();
}

export function BakeExperienceProvider({children}) {
  const [rows, setRows] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [connection, setConnection] = useState('loading');

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const data = await loadPublishedBatches();
        if (active) { setRows(Array.isArray(data) ? data : []); setConnection('ready'); }
      } catch {
        // Do not display an old clock if its freshness cannot be verified.
        if (active) {setRows([]); setConnection('unavailable');}
      }
    }
    refresh();
    const poll = window.setInterval(refresh, REFRESH_MS);
    const ticker = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {active = false; window.clearInterval(poll); window.clearInterval(ticker);};
  }, []);

  const freshness = useMemo(() => resolveFreshness(rows, now), [rows, now]);
  return <BakeContext.Provider value={{freshness, connection}}>
    {children}
  </BakeContext.Provider>;
}

function useBakeryClock() {
  const context = useContext(BakeContext);
  if (!context) throw new Error('BakeExperienceProvider is required');
  return context;
}

function FreshnessText({freshness, compact = false}) {
  switch (freshness.kind) {
    case 'countdown':
      return <>
        <span className="bake-ribbon-message">Next loaf coming out of the oven in</span>
        <strong className="bake-ribbon-time" aria-label={'Estimated ' + formatRemaining(freshness.remainingMs) + ' remaining'}>
          {formatRemaining(freshness.remainingMs)}
        </strong>
      </>;
    case 'scheduled':
      return <>
        <span className="bake-ribbon-message">Next bakery batch expected</span>
        <strong className="bake-ribbon-time">{calgaryClock(freshness.batch.estimated_ready_at)}</strong>
      </>;
    case 'fresh':
      return <strong className="bake-ribbon-message">Fresh loaves are out of the oven</strong>;
    case 'progress':
      return <><span className="bake-ribbon-message">Our bakers are</span><strong className="bake-ribbon-time">{freshness.batch.stage}</strong></>;
    default:
      return <span className="bake-ribbon-message">
        {compact ? 'Small-batch sourdough, baked in Calgary' : 'The next bake time will appear here when our bakers post it'}
      </span>;
  }
}

export function StickyBakeBar() {
  const {freshness} = useBakeryClock();
  const active = freshness.kind === 'countdown';
  return <div className={'bake-ribbon' + (active ? ' is-counting' : '')} aria-label="MNTL bakery oven update">
    <div className="bake-ribbon-inner">
      <span className="bake-ribbon-kicker"><Flame size={15} aria-hidden="true"/> MNTL / THE OVEN</span>
      <span className="bake-ribbon-separator" aria-hidden="true"/>
      <span className="bake-ribbon-content" role="status" aria-live="off">
        <FreshnessText freshness={freshness} compact/>
      </span>
      <span className="bake-ribbon-note">{active ? 'BAKER-UPDATED ESTIMATE' : 'FRESH BAKES, NO SHORTCUTS'}</span>
      <a className="bake-ribbon-link" href="#oven" aria-label="Read more about our bakery freshness updates">
        <ArrowRight size={16}/>
      </a>
    </div>
  </div>;
}

export function BakePulse() {
  const {freshness, connection} = useBakeryClock();
  const hasEstimate = ['countdown', 'scheduled'].includes(freshness.kind);
  const isActive = freshness.kind !== 'idle';
  return <section className="oven-feature" id="oven" aria-labelledby="oven-title">
    <div className="oven-feature-copy">
      <span className="oven-feature-eyebrow">FROM OUR OVEN / CALGARY, AB</span>
      <h2 id="oven-title">REAL BREAD.<br/><span>REAL BAKE TIMES.</span></h2>
      <p>Freshness isn't a marketing countdown. When we're baking, the MNTL team posts the next estimated oven time. You'll see it at the top of the site.</p>
    </div>
    <div className="oven-feature-status">
      <div className="oven-feature-status-top"><Clock3 size={16}/><span>THE NEXT OVEN UPDATE</span><span className={'oven-status-dot'+(isActive?' active':'')}/></div>
      {freshness.kind === 'countdown'
        ? <strong className="oven-feature-number">{formatRemaining(freshness.remainingMs)}</strong>
        : hasEstimate
          ? <strong className="oven-feature-number oven-feature-date">{calgaryClock(freshness.batch.estimated_ready_at)}</strong>
          : <strong className="oven-feature-number oven-feature-idle">{freshness.kind==='fresh'?'Fresh out':freshness.kind==='progress'?freshness.batch.stage:'Next bake TBA'}</strong>}
      <p className="oven-feature-note">{hasEstimate
        ? 'Estimated next oven-ready time · Mountain Time'
        : freshness.kind === 'fresh' ? 'Our bakers have marked today’s loaves ready.'
        : freshness.kind === 'progress' ? 'Our bakers have updated the current dough stage.'
        : connection==='unavailable' ? 'Live bakery updates unavailable. Check again soon.'
        : 'No published bake time yet. We never display a pretend countdown.'}</p>
      {freshness.batch?.public_note && <p className="oven-feature-baker-note">{freshness.batch.public_note}</p>}
    </div>
  </section>;
}
