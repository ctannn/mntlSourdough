import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {ArrowRight, Clock3, Flame, Pause, Play, RotateCcw} from 'lucide-react';
import './BakeExperience.css';

/**
 * Only published bake updates can be read anonymously.
 * This is a manually updated bakery status, not connected oven telemetry.
 */
const SUPABASE_URL = 'https://dfyzpflempgtokyhvtlo.supabase.co';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_Q0akOPZNikRT46IMxE4ddg_V59iZ90C';
const BAKE_BREAK_SECONDS = 35 * 60;
const POLL_INTERVAL_MS = 90_000;
const STAGES = ['mixing', 'fermenting', 'shaping', 'proofing', 'baking', 'cooling', 'ready'];
const BakeContext = createContext(null);

function todayInCalgary() {
  // Construct an ISO date explicitly; locale-formatted date strings are not
  // guaranteed to use YYYY-MM-DD in every browser.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Edmonton',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
  return String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
}

export function BakeExperienceProvider({children}) {
  const [batch, setBatch] = useState(null);
  const [now, setNow] = useState(Date.now());
  // Timer state persists across sections within one page session.
  const [elapsed, setElapsed] = useState(0);
  const [runningSince, setRunningSince] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;
    async function refreshBatch() {
      try {
        const bakeDate = todayInCalgary();
        const url = SUPABASE_URL + '/rest/v1/bake_updates?select=bake_date,stage,public_note,estimated_ready_at,updated_at&published=eq.true&bake_date=eq.' + encodeURIComponent(bakeDate) + '&limit=1';
        const response = await fetch(url, {headers: {apikey: SUPABASE_PUBLIC_KEY}, cache: 'no-store'});
        if (!response.ok) throw new Error('Batch updates unavailable');
        const rows = await response.json();
        if (mounted) {setBatch(rows?.[0] || null); setStatus('ready');}
      } catch {
        if (mounted) {setBatch(null); setStatus('unavailable');}
      }
    }
    refreshBatch();
    const poll = window.setInterval(refreshBatch, POLL_INTERVAL_MS);
    return () => {mounted = false; window.clearInterval(poll);};
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timerRemaining = Math.max(0, BAKE_BREAK_SECONDS - elapsed - (runningSince === null ? 0 : Math.floor((now - runningSince) / 1000)));
  function startOrPause() {
    if (timerRemaining === 0) {setElapsed(0); setRunningSince(Date.now()); return;}
    if (runningSince === null) {setRunningSince(Date.now()); return;}
    setElapsed(old => old + Math.floor((Date.now() - runningSince) / 1000));
    setRunningSince(null);
  }
  function reset() {setElapsed(0); setRunningSince(null);}
  const liveRemaining = batch?.estimated_ready_at
    ? Math.max(0, Math.ceil((new Date(batch.estimated_ready_at).getTime() - now) / 1000))
    : null;
  const context = useMemo(() => ({
    batch, status, timerRemaining, liveRemaining, timerRunning: runningSince !== null, startOrPause, reset
  }), [batch, status, timerRemaining, liveRemaining, runningSince]);
  return <BakeContext.Provider value={context}>{children}</BakeContext.Provider>;
}

function useBakeExperience() {
  const value = useContext(BakeContext);
  if (!value) throw new Error('BakeExperienceProvider missing');
  return value;
}

function ovenSection() {
  document.getElementById('oven')?.scrollIntoView({behavior: 'smooth', block: 'start'});
}

export function StickyBakeBar() {
  const {batch, timerRemaining, liveRemaining, timerRunning, startOrPause} = useBakeExperience();
  return <div className="bake-ribbon" aria-label="Bakery batch tracker">
    <div className="bake-ribbon-inner">
      <span className="bake-ribbon-kicker"><span className={'bake-live-dot' + (batch ? ' is-live' : '')} /> MNTL / THE OVEN</span>
      <span className="bake-ribbon-divider" aria-hidden="true" />
      {batch
        ? <span className="bake-ribbon-status">Today’s batch: <strong>{batch.stage}</strong>{liveRemaining !== null && <span className="bake-ribbon-clock">{formatClock(liveRemaining)} <small>estimated</small></span>}</span>
        : <span className="bake-ribbon-status">A little bread break <strong>— your 35-minute timer</strong> <span className="bake-ribbon-clock">{formatClock(timerRemaining)}</span></span>}
      {!batch && <button className="bake-ribbon-action" type="button" onClick={startOrPause} aria-label={timerRunning ? 'Pause fun timer' : 'Start fun timer'}>{timerRunning ? <Pause size={13}/> : <Play size={13}/>} {timerRunning ? 'Pause' : timerRemaining === 0 ? 'Restart' : 'Start'}</button>}
      <button type="button" className="bake-ribbon-link" onClick={ovenSection}>Explore the oven <ArrowRight size={14}/></button>
    </div>
  </div>;
}

export function BakePulse() {
  const {batch, timerRemaining, liveRemaining, timerRunning, startOrPause, reset, status} = useBakeExperience();
  return <section className="oven-section" id="oven" aria-labelledby="oven-title">
    <div className="oven-wrap">
      <div className="oven-intro">
        <p className="overline">BEHIND THE CRUST / 03</p>
        <h2 id="oven-title">Good things<br/>take <em>time.</em></h2>
        <p>Real sourdough, real patience. Follow our bakery’s latest published batch update—or take a little time for yourself with a just-for-fun timer.</p>
      </div>
      <div className="oven-canvas">
        <div className="oven-monitor">
          <div className="oven-monitor-top"><span className="oven-dot"/> {batch ? 'TODAY IN THE BAKERY' : 'A LITTLE BREATHING ROOM'} <Flame size={17}/></div>
          <p className="oven-display-label">{batch ? 'CURRENT BATCH STAGE' : 'YOUR PERSONAL BAKE BREAK'}</p>
          <strong className="oven-display-stage">{batch ? batch.stage : 'Slow down.'}</strong>
          {batch && <div className="oven-stage-row">{STAGES.map((stage, index) => <span key={stage} className={index <= STAGES.indexOf(batch.stage) ? 'active' : ''}>{stage}</span>)}</div>}
          <p className="oven-description">{batch ? (batch.public_note || 'Good bread is in the works.') : '35 minutes to read, reset, make coffee—or do absolutely nothing. This timer is yours, not the bakery’s oven.'}</p>
          <div className="oven-digits" aria-live="off">
            <span>{formatClock(batch && liveRemaining !== null ? liveRemaining : timerRemaining)}</span>
            <small>{batch && liveRemaining !== null ? 'ESTIMATED UNTIL READY' : batch ? 'PLAYFUL PERSONAL TIMER' : 'YOUR PERSONAL TIMER'}</small>
          </div>
          {!batch && <div className="oven-controls">
            <button onClick={startOrPause} type="button" className="oven-control-primary">{timerRunning ? <Pause size={16}/> : <Play size={16}/>} {timerRunning ? 'Pause timer' : timerRemaining === 0 ? 'Start again' : 'Start the timer'}</button>
            <button onClick={reset} type="button" className="oven-control-secondary"><RotateCcw size={16}/> Reset</button>
          </div>}
          <p className="oven-fineprint">{batch ? 'Updated manually by the MNTL team. Timing is an estimate, not a pickup guarantee.' : status === 'unavailable' ? 'Bakery updates are temporarily unavailable. Your timer still works.' : 'Just for fun. No automatic oven data or customer-order tracking.'}</p>
        </div>
        <div className="oven-aside">
          <span className="oven-aside-asterisk" aria-hidden="true">✳</span>
          <div><p className="overline">THE MNTL METHOD</p><strong>Flour.<br/>Water.<br/>Salt.<br/><em>Obsession.</em></strong><p>Some things are worth waiting for.</p></div>
        </div>
      </div>
    </div>
  </section>;
}
