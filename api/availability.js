import {allowMethod,databaseConfigured,database,reply,calgaryDate,plusDays} from '../server/mntlDb.mjs';
const MAX_DATES=90;
const idsParam=ids=>'in.('+ids.map(id=>encodeURIComponent(id)).join(',')+')';
export default async function handler(req,res) {
  if(!allowMethod(req,res,'GET'))return;
  if(!databaseConfigured())return reply(res,200,{configured:false,dates:[],message:'Bake dates have not been published for online checkout.'});
  try{
    const today=calgaryDate();
    const after=plusDays(today,1);
    const before=plusDays(today,MAX_DATES);
    const days=await database('/rest/v1/bake_days?select=id,bake_date,cutoff_at,capacity_loaves,status&bake_date=gte.'+after+'&bake_date=lte.'+before+'&status=eq.open&order=bake_date.asc&limit=100');
    const eligible=(days||[]).filter(x=>x.cutoff_at&&Date.parse(x.cutoff_at)>Date.now()&&Number.isInteger(x.capacity_loaves)&&x.capacity_loaves>0);
    if(!eligible.length)return reply(res,200,{configured:true,dates:[],message:'No online bake dates are currently open.'});
    const dayIds=eligible.map(d=>d.id);
    const orders=await database('/rest/v1/orders?select=id,bake_day_id&bake_day_id='+idsParam(dayIds)+'&payment_status=eq.paid&status=neq.cancelled&limit=2000');
    const paidOrders=orders||[];
    const orderIds=paidOrders.map(o=>o.id);
    const items=orderIds.length?await database('/rest/v1/order_items?select=order_id,quantity&order_id='+idsParam(orderIds)+'&limit=5000'):[];
    const holds=await database('/rest/v1/checkout_holds?select=bake_day_id,quantity&bake_day_id='+idsParam(dayIds)+'&status=eq.pending&expires_at=gt.'+new Date().toISOString()+'&limit=2000');
    // Guard against silently truncated data, which could allow overselling.
    if(paidOrders.length>=2000||items.length>=5000||(holds||[]).length>=2000)throw new Error('Availability calculation exceeded safety limit');
    const paidByDay=new Map(),holdsByDay=new Map();
    const orderDay=new Map(paidOrders.map(o=>[o.id,o.bake_day_id]));
    for(const line of items)paidByDay.set(orderDay.get(line.order_id),(paidByDay.get(orderDay.get(line.order_id))||0)+Number(line.quantity||0));
    for(const h of holds||[])holdsByDay.set(h.bake_day_id,(holdsByDay.get(h.bake_day_id)||0)+Number(h.quantity||0));
    const dates=eligible.map(d=>({
      date:d.bake_date,
      remaining:Math.max(0,d.capacity_loaves-(paidByDay.get(d.id)||0)-(holdsByDay.get(d.id)||0)),
      cutoffAt:d.cutoff_at,
      bookable:true
    })).map(d=>({...d,bookable:d.remaining>0}));
    return reply(res,200,{configured:true,dates,message:'Availability is indicative until checkout reserves capacity.'});
  }catch(error){
    console.error('MNTL availability error:',error?.status||'unknown');
    return reply(res,503,{configured:false,dates:[],message:'Live availability is temporarily unavailable. You can still send an inquiry.'});
  }
}
