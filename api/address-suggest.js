import {createHash} from 'node:crypto';
import {isAddressQueryValid,MAX_ADDRESS_QUERY,normalizeAddressQuery,photonAddressSuggestions} from '../server/addressSearch.mjs';

// Small, replaceable proxy for Photon's public demonstration endpoint.
// Never use the OSMF Nominatim API for autocomplete; it explicitly prohibits it.
// Photon offers no SLA and restricts excessive usage. Migrate to a contracted
// provider / own geocoder before scaling beyond a low-volume local bakery.
const cache=new Map(),callers=new Map();
const TTL=5*60_000,WINDOW=60_000,MAX_PER_MINUTE=24;
function json(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(payload));
}
function withinRateLimit(req,now){
  const ip=String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'anonymous').split(',')[0].trim();
  const id=createHash('sha256').update(ip).digest('hex').slice(0,24);
  const state=callers.get(id);
  if(!state||now-state.since>WINDOW){callers.set(id,{since:now,count:1});return true;}
  if(state.count>=MAX_PER_MINUTE)return false;
  state.count++;return true;
}
function trimMemory(now){
  if(cache.size>160){
    for(const [key,value] of cache)if(value.expires<now)cache.delete(key);
    while(cache.size>160)cache.delete(cache.keys().next().value);
  }
  if(callers.size>1200){
    for(const [key,value] of callers)if(now-value.since>WINDOW)callers.delete(key);
  }
}
export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return json(res,405,{suggestions:[],message:'Method not allowed'});
  }
  const raw=req.query?.q;
  if(typeof raw!=='string'||raw.length>MAX_ADDRESS_QUERY+30)
    return json(res,400,{suggestions:[],message:'Enter a valid Calgary street address.'});
  const query=normalizeAddressQuery(raw);
  if(query.length<4)return json(res,200,{suggestions:[]});
  if(!isAddressQueryValid(query))return json(res,400,{suggestions:[],message:'Address search is too long.'});
  const now=Date.now();
  const key=query.toLocaleLowerCase('en-CA');
  const cached=cache.get(key);
  if(cached&&cached.expires>now)return json(res,200,{suggestions:cached.suggestions});
  if(!withinRateLimit(req,now)){
    res.setHeader('Retry-After','30');
    return json(res,429,{suggestions:[],message:'Too many searches. Please try again shortly or type your address manually.'});
  }
  trimMemory(now);
  const url=new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q',query);
  url.searchParams.set('bbox','-114.35,50.82,-113.75,51.25');
  url.searchParams.set('countrycode','CA');
  url.searchParams.set('lat','51.0447');
  url.searchParams.set('lon','-114.0719');
  url.searchParams.set('lang','en');
  url.searchParams.set('limit','15');
  try{
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(4200)});
    if(!response.ok)throw Error('Photon unavailable');
    const data=await response.json();
    const suggestions=photonAddressSuggestions(data,query,5);
    cache.set(key,{suggestions,expires:now+TTL});
    return json(res,200,{suggestions});
  }catch{
    return json(res,503,{suggestions:[],message:'Address suggestions are temporarily unavailable. Enter your address manually or adjust the pin on the map.'});
  }
}
