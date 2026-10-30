import test from 'node:test';
import assert from 'node:assert/strict';
import {calgaryDate,formatRemaining,resolveFreshness,calgaryClock} from '../src/components/batchStatus.js';

const NOW=Date.parse('2026-10-30T18:00:00Z');
const base={bake_date:'2026-10-30',stage:'baking',published:true,estimated_ready_at:'2026-10-30T18:29:14Z'};

test('bakery clock never fabricates a timer for empty or unpublished schedules',()=>{
  assert.equal(resolveFreshness([],NOW).kind,'idle');
  assert.equal(resolveFreshness([{...base,published:false}],NOW).kind,'idle');
  assert.equal(resolveFreshness([{...base,estimated_ready_at:null}],NOW).kind,'progress');
  assert.equal(resolveFreshness([{...base,estimated_ready_at:'2026-10-30T17:00:00Z'}],NOW).kind,'idle');
});

test('next published real estimate wins over a later one',()=>{
  const result=resolveFreshness([{...base,estimated_ready_at:'2026-10-30T20:20:00Z'},base],NOW);
  assert.equal(result.kind,'countdown');
  assert.equal(result.remainingMs,29*60*1000+14*1000);
  assert.equal(formatRemaining(result.remainingMs),'29:14');
});

test('hours, minutes, seconds and upcoming-day display are stable',()=>{
  assert.equal(formatRemaining(89*1000),'01:29');
  assert.equal(formatRemaining(2*3600000+35000),'02:00:35');
  assert.equal(formatRemaining(0),'00:00');
  const scheduled=resolveFreshness([{...base,bake_date:'2026-11-01',estimated_ready_at:'2026-11-01T18:00:00Z'}],NOW);
  assert.equal(scheduled.kind,'scheduled');
});

test('ready and cooling states never show a misleading oven-exit countdown',()=>{
  assert.equal(resolveFreshness([{...base,stage:'ready'}],NOW).kind,'fresh');
  assert.equal(resolveFreshness([{...base,stage:'cooling'}],NOW).kind,'fresh');
});

test('Calgary bakery date handles local midnight and daylight saving boundaries',()=>{
  assert.equal(calgaryDate(Date.parse('2026-10-30T05:50:00Z')),'2026-10-29');
  assert.equal(calgaryDate(Date.parse('2026-10-30T06:01:00Z')),'2026-10-30');
  assert.ok(calgaryClock(base.estimated_ready_at).includes('Oct'));
});

test('permanent Alberta Time stays UTC-6 in winter despite old device timezone databases',()=>{
  assert.equal(calgaryDate(Date.parse('2026-12-01T05:59:00Z')),'2026-11-30');
  assert.equal(calgaryDate(Date.parse('2026-12-01T06:01:00Z')),'2026-12-01');
  assert.match(calgaryClock('2026-12-16T00:30:00Z'),/Dec 15/);
});

test('old-day statuses and malformed future estimates never look live',()=>{
  const old={...base,bake_date:'2026-10-29'};
  assert.equal(resolveFreshness([old],NOW).kind,'idle');
  assert.equal(resolveFreshness([{...base,estimated_ready_at:'invalid'}],NOW).kind,'idle');
});
