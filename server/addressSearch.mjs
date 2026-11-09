// Converts Photon GeoJSON into distinct, Calgary-only *street addresses*.
// Place/POI names are not treated as confirmed customer residences.
export const CALGARY_BOUNDS = Object.freeze({minLat:50.82,maxLat:51.25,minLon:-114.35,maxLon:-113.75});
export const MIN_ADDRESS_QUERY = 4;
export const MAX_ADDRESS_QUERY = 100;
export function normalizeAddressQuery(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
}
export function isAddressQueryValid(value) {
  const query=normalizeAddressQuery(value);
  return query.length>=MIN_ADDRESS_QUERY && query.length<=MAX_ADDRESS_QUERY;
}
export function photonAddressSuggestions(geojson,query='',limit=5){
  const features=Array.isArray(geojson?.features)?geojson.features:[];
  const leadingNumber=normalizeAddressQuery(query).match(/^(\d+[a-z]?)\b/i)?.[1]?.toLowerCase()||null;
  const found=[],seen=new Set();
  for(const feature of features){
    const p=feature?.properties,coords=feature?.geometry?.coordinates;
    if(!p||!Array.isArray(coords)||coords.length<2)continue;
    const lon=Number(coords[0]),lat=Number(coords[1]);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<CALGARY_BOUNDS.minLat||lat>CALGARY_BOUNDS.maxLat||lon<CALGARY_BOUNDS.minLon||lon>CALGARY_BOUNDS.maxLon)continue;
    if(String(p.countrycode||'').toUpperCase()!=='CA'||String(p.city||'').toLowerCase()!=='calgary')continue;
    const number=String(p.housenumber||'').trim(),street=String(p.street||'').trim();
    // A street or business name alone isn't a deliverable entrance.
    if(!number||!street||number.length>15||street.length>120)continue;
    if(leadingNumber&&number.toLowerCase()!==leadingNumber)continue;
    const postcode=String(p.postcode||'').trim().toUpperCase();
    const key=(number+'|'+street).toLocaleLowerCase('en-CA');
    if(seen.has(key))continue;
    seen.add(key);
    const label=number+' '+street+', Calgary, AB'+(postcode?' '+postcode:'')+', Canada';
    found.push({id:key,label,lat:Number(lat.toFixed(6)),lon:Number(lon.toFixed(6)),postcode});
    if(found.length>=limit)break;
  }
  return found;
}
