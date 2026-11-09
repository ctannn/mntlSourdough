import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAddressQuery,isAddressQueryValid,photonAddressSuggestions} from '../server/addressSearch.mjs';
import handler from '../api/address-suggest.js';
const feature=(house,street,lon=-114.07,lat=51.04,props={})=>({
  type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},
  properties:{housenumber:house,street,city:'Calgary',countrycode:'CA',postcode:'T2P 0J9',osm_type:'W',osm_id:11,...props}
});
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function res(){
  let headers={},body=null;
  return {statusCode:200,setHeader:(k,v)=>{headers[k.toLowerCase()]=v;},end(text){body=JSON.parse(text)},
  get result(){return {status:this.statusCode,headers,body}}};
}
test('normalize and validate search input',()=>{
  assert.equal(normalizeAddressQuery('  500  \n 4 Ave SW '),'500 4 Ave SW');
  assert.equal(isAddressQueryValid('abc'),false);
  assert.equal(isAddressQueryValid('500 4 Ave SW'),true);
  assert.equal(isAddressQueryValid('x'.repeat(101)),false);
});
test('deduplicate real Calgary street addresses and reject outside places',()=>{
  const data={features:[feature('500','4 Avenue SW'),feature('500','4 Avenue SW',-114.0701,51.0401,{osm_id:12}),
    feature('501','4 Avenue SW'),feature('500','4 Avenue SW',-114.5,51.04),
    feature('500','4 Avenue SW',-114.08,51.02,{city:'Airdrie'}),
    feature(null,null,-114.08,51.02,{name:'4 Avenue SW'})]};
  const items=photonAddressSuggestions(data,'500 4 Avenue SW');
  assert.equal(items.length,1);
  assert.equal(items[0].label,'500 4 Avenue SW, Calgary, AB T2P 0J9, Canada');
  assert.deepEqual([items[0].lat,items[0].lon],[51.04,-114.07]);
  assert.equal(photonAddressSuggestions(data,'501 4 Avenue SW').length,1);
});
test('endpoint handles short requests and rejects invalid verbs',async()=>{
  const orig=globalThis.fetch;globalThis.fetch=()=>{throw Error('unexpected external fetch')};
  try{
    const r=res();await handler({method:'GET',query:{q:'abc'},headers:{}},r);
    assert.deepEqual(r.result.body,{suggestions:[]});
    const post=res();await handler({method:'POST',query:{q:'500 4 Ave'},headers:{}},post);
    assert.equal(post.result.status,405);
    assert.equal(post.result.headers.allow,'GET');
  }finally{globalThis.fetch=orig}
});
test('endpoint bounds Photon request and caches duplicate searches',async()=>{
  const orig=globalThis.fetch;
  let count=0,requested='';
  globalThis.fetch=async url=>{
    count++;requested=String(url);
    return {ok:true,json:async()=>({features:[feature('500','4 Avenue SW'),feature('500','4 Avenue SW')]})};
  };
  try{
    const req={method:'GET',query:{q:'500 4 Ave SW'},headers:{'x-forwarded-for':'203.0.113.51'}};
    const first=res();await handler(req,first);
    assert.equal(first.result.body.suggestions.length,1);
    assert.match(requested,/photon\.komoot\.io\/api/);
    assert.match(requested,/bbox=/);
    assert.equal(first.result.headers['cache-control'],'private, no-store');
    const again=res();await handler(req,again);
    assert.equal(count,1);
  }finally{globalThis.fetch=orig}
});
test('provider downtime degrades gracefully to manual entry',async()=>{
  const orig=globalThis.fetch;globalThis.fetch=async()=>{throw Error('upstream down')};
  try{
    const r=res();await handler({method:'GET',query:{q:'150 9 Avenue SW'},headers:{'x-forwarded-for':'203.0.113.65'}},r);
    assert.equal(r.result.status,503);
    assert.match(r.result.body.message,/manually/);
  }finally{globalThis.fetch=orig}
});
test('accessible dropdown supports keyboard, abortion and map-pin sync',()=>{
  const control=source('src/components/AddressAutocomplete.jsx');
  const planner=source('src/components/FulfillmentPlanner.jsx');
  for(const token of ['role="combobox"','role="listbox"','role="option"','ArrowDown','ArrowUp','Escape','AbortController','},475)'])
    assert.ok(control.includes(token),token);
  assert.match(planner,/onSelect=\{suggestion=>set\(\{/);
  assert.match(planner,/location:\{lat:suggestion\.lat,lon:suggestion\.lon\}/);
  assert.match(planner,/onChange=\{address=>set\(\{address,location:null/);
  assert.doesNotMatch(planner,/setSearchText|setSearchError|findAddress/);
});
