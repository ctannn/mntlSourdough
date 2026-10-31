import test from 'node:test';
import assert from 'node:assert/strict';
import {occurrences,validCadence,cadenceLabel} from '../src/lib/scheduling.mjs';

test('new Bread Club presets stay aligned to original start date',()=>{
  assert.deepEqual(occurrences('2026-11-07','weekly',3),['2026-11-07','2026-11-14','2026-11-21']);
  assert.deepEqual(occurrences('2026-11-07','biweekly',3),['2026-11-07','2026-11-21','2026-12-05']);
  assert.deepEqual(occurrences('2026-11-07','triweekly',3),['2026-11-07','2026-11-28','2026-12-19']);
  assert.equal(cadenceLabel('triweekly'),'Every 3 weeks');
});

test('monthly plans clamp short months but restore the original date',()=>{
  assert.deepEqual(occurrences('2027-01-31','monthly',4),['2027-01-31','2027-02-28','2027-03-31','2027-04-30']);
  assert.deepEqual(occurrences('2028-01-31','monthly',3),['2028-01-31','2028-02-29','2028-03-31']);
  assert.equal(cadenceLabel('monthly'),'Every month');
});

test('custom daily cadence supports more or less frequent deliveries',()=>{
  assert.deepEqual(occurrences('2026-10-30','custom',4,{interval:10,unit:'days'}),['2026-10-30','2026-11-09','2026-11-19','2026-11-29']);
  assert.deepEqual(occurrences('2026-11-02','custom',3,{interval:1,unit:'days'}),['2026-11-02','2026-11-03','2026-11-04']);
  assert.equal(cadenceLabel('custom',{interval:10,unit:'days'}),'Every 10 days');
  assert.equal(cadenceLabel('custom',{interval:1,unit:'days'}),'Every 1 day');
});

test('custom weekly cadence respects the chosen interval and label',()=>{
  assert.deepEqual(occurrences('2026-11-02','custom',3,{interval:5,unit:'weeks'}),['2026-11-02','2026-12-07','2027-01-11']);
  assert.equal(cadenceLabel('custom',{interval:5,unit:'weeks'}),'Every 5 weeks');
});

test('invalid / extreme custom cadence is rejected, no misleading preview dates',()=>{
  for(const options of [
    {interval:0,unit:'days'}, {interval:91,unit:'days'},
    {interval:13,unit:'weeks'},{interval:1.5,unit:'days'},
    {interval:7,unit:'hours'},{interval:NaN,unit:'weeks'}
  ]){
    assert.equal(validCadence('custom',options),false);
    assert.deepEqual(occurrences('2026-11-02','custom',4,options),[]);
  }
  assert.deepEqual(occurrences('2026-11-02','once',4),[]);
  assert.deepEqual(occurrences('2026-02-29','custom',4,{interval:2,unit:'weeks'}),[]);
  assert.equal(validCadence('custom',{interval:90,unit:'days'}),true);
  assert.equal(validCadence('custom',{interval:12,unit:'weeks'}),true);
});
