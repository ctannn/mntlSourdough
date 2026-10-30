import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../src/components/FulfillmentPlanner.jsx',import.meta.url),'utf8');

test('delivery address field only calls initialized state setters',()=>{
  assert.doesNotMatch(source,/\bsetMapAddress\s*\(/,'No undeclared address-map setter may be called');
  assert.match(source,/onChange=\{e=>\{set\(\{address:e\.target\.value,location:null\}\);setSearchText\(e\.target\.value\);setSearchError\(''\);\}\}/);
});

test('delivery address edits invalidate previous map pin and stale validation',()=>{
  assert.match(source,/set\(\{address:e\.target\.value,location:null\}\)/);
  assert.match(source,/setSearchError\(''\)/);
});
