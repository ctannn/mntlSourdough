/**
 * Pure bakery production math.
 *
 * One shared definition for the calendar, bake sheet, overview and deliveries.
 * There is NO Supabase access or state here: both real and demo datasets use
 * exactly the same calculation, which makes all figures independently testable.
 *
 * Metrics are in LOAF UNITS unless the field explicitly says 'orders'.
 * Paid, unpaid and projected recurring units are never silently combined.
 */

function shiftDays(iso,offset) {
  const date=new Date(iso+'T12:00:00Z');
  date.setUTCDate(date.getUTCDate()+offset);
  return date.toISOString().slice(0,10);
}
function dayDistance(a,b) {
  return Math.round((new Date(a+'T12:00:00Z').getTime()-new Date(b+'T12:00:00Z').getTime())/86_400_000);
}

/**
 * @param {string} date YYYY-MM-DD, Calgary bake date
 * @param {string} today YYYY-MM-DD, Calgary current date
 * @param {Array} orders enriched rows with .day and .items
 * @param {Object} data liveRecords or demoRecords (same table shapes)
 */
export function calculateProductionDay(date,today,orders,data) {
  const valid=orders.filter(o=>o.day===date&&o.status!=='cancelled'&&o.payment_status!=='refunded'&&o.payment_status!=='failed');
  const paid=valid.filter(o=>o.payment_status==='paid');
  const unpaid=valid.filter(o=>o.payment_status!=='paid');
  const paidUnits={},unpaidUnits={},projectedUnits={};
  let paidCount=0,unpaidCount=0,projectedCount=0,pickup=0,delivery=0;

  for(const order of paid){
    for(const item of order.items||[]){
      paidUnits[item.product_id]=(paidUnits[item.product_id]||0)+item.quantity;
      paidCount+=item.quantity;
    }
    if(order.fulfillment_type==='delivery')delivery+=1;
    else pickup+=1;
  }
  for(const order of unpaid){
    for(const item of order.items||[]){
      unpaidUnits[item.product_id]=(unpaidUnits[item.product_id]||0)+item.quantity;
      unpaidCount+=item.quantity;
    }
  }

  // Projections only. A paid renewal order takes precedence and suppresses
  // its matching speculative forecast for the same date.
  const skipped=new Set((data.subscription_skips||[]).map(row=>row.subscription_id+'|'+row.bake_date));
  for(const sub of data.subscriptions||[]){
    if(sub.status!=='active'||!sub.next_delivery_date||date<sub.next_delivery_date||date>shiftDays(today,70))continue;
    const diff=dayDistance(date,sub.next_delivery_date);
    const cadence=sub.cadence==='biweekly'?14:7;
    if(diff<0||diff%cadence!==0||skipped.has(sub.id+'|'+date))continue;
    if(paid.some(order=>order.subscription_id===sub.id))continue;
    for(const item of (data.subscription_items||[]).filter(i=>i.subscription_id===sub.id)){
      projectedUnits[item.product_id]=(projectedUnits[item.product_id]||0)+item.quantity;
      projectedCount+=item.quantity;
    }
  }

  return {
    date,paid,unpaid,paidUnits,projectedUnits,unpaidUnits,
    paidCount,unpaidCount,projectedCount,pickup,delivery,
    scheduled:(data.bake_days||[]).find(day=>day.bake_date===date)
  };
}

/** Enrich fact orders with their customer, production day and line records. */
export function joinOrders(data) {
  const customers=new Map(data.customers.map(c=>[c.id,c]));
  const days=new Map(data.bake_days.map(d=>[d.id,d.bake_date]));
  const items=new Map();
  for(const item of data.order_items){
    if(!items.has(item.order_id))items.set(item.order_id,[]);
    items.get(item.order_id).push(item);
  }
  return data.orders.map(o=>({
    ...o,customer:customers.get(o.customer_id),day:days.get(o.bake_day_id)||'',
    items:items.get(o.id)||[]
  })).sort((a,b)=>(a.day||'9999').localeCompare(b.day||'9999'));
}
