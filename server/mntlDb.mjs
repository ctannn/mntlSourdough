// Server-only Supabase REST client. NEVER import this file from src/ or expose
// service credentials to Vite (VITE_* variables are public).
const BASE=process.env.SUPABASE_URL || 'https://dfyzpflempgtokyhvtlo.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
export const databaseConfigured=()=>Boolean(KEY && /^https:\/\//.test(BASE));
export async function database(path,{method='GET',body,headers={}}={}) {
  if(!databaseConfigured()) throw new Error('Database server access not configured');
  const response=await fetch(BASE+path,{method,headers:{
    apikey:KEY,Authorization:'Bearer '+KEY,Accept:'application/json',
    ...(body===undefined?{}:{'Content-Type':'application/json'}),...headers
  },...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store'});
  if(!response.ok) {
    // Never include internal PostgREST diagnostics in a public API response.
    const message=await response.text().catch(()=>null);
    const err=new Error('Database request failed');
    err.status=response.status;err.details=message?.slice(0,1500);
    throw err;
  }
  const text=await response.text();
  return text?JSON.parse(text):null;
}
export const reply=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
};
export const allowMethod=(req,res,method)=>{
  if(req.method===method)return true;
  res.setHeader('Allow',method);reply(res,405,{error:'Method not allowed'});return false;
};
export function calgaryDate(now=new Date()) {
  const fields=new Intl.DateTimeFormat('en-US',{timeZone:'America/Edmonton',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const parts=Object.fromEntries(fields.map(x=>[x.type,x.value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
}
export function plusDays(date,count) {
  const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);
  return d.toISOString().slice(0,10);
}
export function paymentReady() {
  return process.env.MNTL_CHECKOUT_ENABLED==='true' &&
    process.env.MNTL_PICKUP_ENABLED==='true' &&
    Boolean(process.env.MNTL_PICKUP_ADDRESS?.trim()) &&
    databaseConfigured() &&
    Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) &&
    (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')||process.env.MNTL_LIVE_PAYMENTS_ENABLED==='true');
}
