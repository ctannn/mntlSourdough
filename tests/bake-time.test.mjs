import test from 'node:test';
import assert from 'node:assert/strict';
import {fromCalgaryDatetimeInput,toCalgaryDatetimeInput} from '../admin/bakeTime.js';

test('bakery oven times are saved in UTC from Calgary wall time',()=>{
  assert.equal(fromCalgaryDatetimeInput('2026-10-30T18:30'),'2026-10-31T00:30:00.000Z');
  assert.equal(fromCalgaryDatetimeInput('2026-12-15T18:30'),'2026-12-16T01:30:00.000Z');
});
test('stored UTC dates are displayed in Calgary regardless of device location',()=>{
  assert.equal(toCalgaryDatetimeInput('2026-10-31T00:30:00.000Z'),'2026-10-30T18:30');
  assert.equal(toCalgaryDatetimeInput('2026-12-16T01:30:00.000Z'),'2026-12-15T18:30');
});
test('spring-forward nonexistent Calgary wall times are rejected',()=>{
  assert.throws(()=>fromCalgaryDatetimeInput('2027-03-14T02:30'),/daylight saving/);
});
test('valid sunset oven time round trips without a locale or browser timezone',()=>{
  for(const stamp of ['2026-11-15T17:15','2027-01-08T06:45','2027-06-01T20:00']){
    assert.equal(toCalgaryDatetimeInput(fromCalgaryDatetimeInput(stamp)),stamp);
  }
});
