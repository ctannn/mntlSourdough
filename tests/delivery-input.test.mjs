import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const planner=readFileSync(new URL('../src/components/FulfillmentPlanner.jsx',import.meta.url),'utf8');
const autocomplete=readFileSync(new URL('../src/components/AddressAutocomplete.jsx',import.meta.url),'utf8');

test('delivery entry uses the initialized autocomplete without undefined state setters',()=>{
  assert.doesNotMatch(planner,/\bsetMapAddress\s*\(/);
  assert.doesNotMatch(planner,/\bsetSearchText\s*\(/);
  assert.doesNotMatch(planner,/\bsetSearchError\s*\(/);
  assert.match(planner,/<AddressAutocomplete/);
  assert.match(planner,/value=\{preference\.address\|\|''\}/);
});

test('editing a selected address clears stale map pins and provider place IDs',()=>{
  assert.match(planner,/onChange=\{address=>set\(\{address,location:null,placeId:null,pinAdjusted:false\}\)\}/);
  assert.match(autocomplete,/onChange\(e\.target\.value\)/);
  assert.match(autocomplete,/abortRef\.current\?\.abort\(\)/);
});

test('selecting an address restores coordinates for map positioning',()=>{
  assert.match(planner,/onSelect=\{suggestion=>set\(\{/);
  assert.match(planner,/address:suggestion\.label/);
  assert.match(planner,/location:\{lat:suggestion\.lat,lon:suggestion\.lon\}/);
  assert.match(planner,/<OpenStreetAddressPicker value=\{preference\}/);
});
