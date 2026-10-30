/**
 * Demo fixtures for the authenticated operations portal.
 *
 * IMPORTANT: This module is client-side only. It NEVER writes to Supabase.
 * All IDs mimic the production UUID PK/FK graph and all example contact details
 * use the reserved example.com domain and invented street addresses.
 *
 * Collections match the normalized public tables so screens, totals and joins
 * run on exactly the same shape as live operations.
 */

export const DEMO_COLLECTIONS = Object.freeze([
  'customers', 'products', 'bake_days', 'orders', 'order_items',
  'subscriptions', 'subscription_items', 'subscription_skips',
  'bake_updates', 'customer_dietary_notes'
]);

const id = number => '00000000-0000-4000-8000-' + String(number).padStart(12, '0');

function dateOffset(iso, days) {
  const date = new Date(iso + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateISO(iso) {
  return new Date(iso + 'T12:00:00Z').toISOString();
}

const people = [
  ['Amara', 'Chen', '403-555-0101', true, '101 Example Lane SW', 'Unit 12'],
  ['Lucas', 'Moreau', '403-555-0102', false, '22 Fictional Road NW', null],
  ['Maya', 'Patel', '403-555-0103', true, '83 Placeholder Crescent SE', null],
  ['Noah', 'Williams', '403-555-0104', false, null, null],
  ['Sofia', 'Nguyen', '403-555-0105', true, '64 Sample Street NE', 'Suite 3'],
  ['Ethan', 'Brooks', '403-555-0106', true, null, null],
  ['Isla', 'Thompson', '403-555-0107', false, '11 Fictional Trail SW', null],
  ['Oliver', 'Singh', '403-555-0108', true, '17 Example Drive NW', null],
  ['Ava', 'Martin', '403-555-0109', false, null, null],
  ['Leo', 'Park', '403-555-0110', true, '108 Placeholder Way SE', null],
  ['Zara', 'Khan', '403-555-0111', true, '82 Demo Place SW', 'Unit 6'],
  ['Felix', 'Rivera', '403-555-0112', false, null, null],
  ['Chloe', 'Bennett', '403-555-0113', true, '52 Sample Avenue NW', null],
  ['Daniel', 'Kim', '403-555-0114', false, '9 Fictional Court SE', null],
  ['Priya', 'Shah', '403-555-0115', true, '44 Demo Rise SW', null],
  ['Owen', 'Foster', '403-555-0116', false, null, null]
];

const productFixtures = [
  {id:id(2001),name:'The Original',price_cents:1200,active:true,allergen_statement:'Contains wheat/gluten.'},
  {id:id(2002),name:'The Seeded',price_cents:1400,active:true,allergen_statement:'Contains wheat/gluten and mixed seeds.'},
  {id:id(2003),name:'The Weekend Loaf',price_cents:1500,active:true,allergen_statement:'Contains wheat/gluten; ingredients vary by bake.'}
];

export function buildDemoData(today) {
  const products = productFixtures.map(p => ({...p}));
  const customers = people.map(([first,last,phone,marketing,address,unit], index) => ({
    id: id(1001 + index),
    first_name: first,
    last_name: last,
    full_name: first + ' ' + last,
    email: (first + '.' + last).toLowerCase() + '@example.com',
    phone,
    marketing_opt_in: marketing,
    address_line1: address,
    address_line2: unit,
    city: address ? 'Calgary' : null,
    province: address ? 'AB' : null,
    postal_code: address ? 'T0T 0T0' : null,
    created_at: dateISO(dateOffset(today, -65 + index * 3))
  }));

  const bakeOffsets = [-14,-11,-8,-5,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,18,21,23,25,28];
  const bake_days = bakeOffsets.map((offset,index) => ({
    id:id(3001 + index),
    bake_date:dateOffset(today,offset),
    capacity_loaves: offset%3===0 ? 45 : offset%3===1 ? 65 : 50,
    status:offset < -1 ? 'completed' : offset===-1 ? 'baking':'open',
    cutoff_at:dateOffset(today,offset-1)+'T18:00:00-06:00'
  }));
  const byDay = Object.fromEntries(bake_days.map(d => [d.bake_date,d]));
  const itemById = Object.fromEntries(products.map(p => [p.id,p]));
  const orders = [];
  const order_items = [];
  function makeOrder(customerIdx, offset, recipes, paymentStatus='paid', status='new', method='pickup', subscriptionId=null) {
    const day = byDay[dateOffset(today,offset)];
    if (!day) throw new Error('Demo fixture references missing bake day');
    const customer=customers[customerIdx];
    const orderIndex=orders.length;
    const orderId=id(5001+orderIndex);
    const lines=recipes.map(([recipe,qty],line)=>{
      const product=products[recipe];
      const item={id:id(6001+order_items.length+line),order_id:orderId,product_id:product.id,quantity:qty,unit_price_cents:product.price_cents};
      return item;
    });
    order_items.push(...lines);
    const total=lines.reduce((sum,i)=>sum+i.quantity*i.unit_price_cents,0);
    orders.push({
      id:orderId,customer_id:customer.id,subscription_id:subscriptionId,
      bake_day_id:day.id,fulfillment_type:method,payment_status:paymentStatus,
      status,fulfillment_window:method==='pickup'?'10 AM – noon':'12 PM – 3 PM',
      delivery_address:method==='delivery'?[customer.address_line1,customer.address_line2,customer.city,customer.province,customer.postal_code].filter(Boolean).join(', '):null,
      delivery_notes:method==='delivery'?'Synthetic delivery instruction: leave at front entrance.':null,
      total_cents:total,created_at:dateISO(dateOffset(today,offset-3)),
      stripe_checkout_session_id:null,stripe_payment_intent_id:null
    });
    return orderId;
  }

  const subscriptions = [
    {id:id(4001),customer_id:customers[0].id,status:'active',cadence:'weekly',weekday:0,next_delivery_date:dateOffset(today,1),fulfillment_type:'delivery'},
    {id:id(4002),customer_id:customers[2].id,status:'active',cadence:'biweekly',weekday:0,next_delivery_date:dateOffset(today,2),fulfillment_type:'pickup'},
    {id:id(4003),customer_id:customers[4].id,status:'active',cadence:'weekly',weekday:0,next_delivery_date:dateOffset(today,3),fulfillment_type:'delivery'},
    {id:id(4004),customer_id:customers[7].id,status:'paused',cadence:'weekly',weekday:0,next_delivery_date:dateOffset(today,6),fulfillment_type:'pickup'},
    {id:id(4005),customer_id:customers[10].id,status:'active',cadence:'weekly',weekday:0,next_delivery_date:dateOffset(today,0),fulfillment_type:'delivery'},
    {id:id(4006),customer_id:customers[12].id,status:'cancelled',cadence:'biweekly',weekday:0,next_delivery_date:dateOffset(today,7),fulfillment_type:'pickup'}
  ];
  for (const sub of subscriptions) {
    sub.weekday = new Date(sub.next_delivery_date+'T12:00:00Z').getUTCDay();
    sub.created_at=dateISO(dateOffset(today,-42));
    sub.stripe_subscription_id=null;
  }

  const subscription_items=[
    {id:id(7001),subscription_id:id(4001),product_id:id(2001),quantity:2},
    {id:id(7002),subscription_id:id(4002),product_id:id(2002),quantity:1},
    {id:id(7003),subscription_id:id(4003),product_id:id(2001),quantity:1},
    {id:id(7004),subscription_id:id(4003),product_id:id(2003),quantity:1},
    {id:id(7005),subscription_id:id(4004),product_id:id(2002),quantity:2},
    {id:id(7006),subscription_id:id(4005),product_id:id(2001),quantity:1},
    {id:id(7007),subscription_id:id(4006),product_id:id(2003),quantity:1}
  ];
  const subscription_skips=[
    {subscription_id:id(4001),bake_date:dateOffset(today,8),reason:'Travelling – demo skip'},
    {subscription_id:id(4003),bake_date:dateOffset(today,10),reason:'Requested skip – demo'}
  ];

  // Old, current, upcoming, unpaid, refunded and subscription-backed orders.
  [
    [0,-14,[[0,2]],'paid','completed','delivery'],
    [1,-11,[[1,1]],'paid','completed','pickup'],
    [2,-8,[[0,1],[1,2]],'paid','completed','pickup'],
    [3,-5,[[0,2]],'paid','completed','pickup'],
    [4,-3,[[2,1]],'paid','completed','delivery'],
    [5,-2,[[0,1],[1,1]],'paid','completed','pickup'],
    [6,-1,[[1,2]],'paid','completed','delivery'],
    [7,0,[[0,1]],'paid','baking','pickup'],
    [8,0,[[2,2]],'paid','new','pickup'],
    [9,0,[[0,2],[1,1]],'paid','ready','delivery'],
    [10,0,[[0,1]],'paid','baking','delivery',id(4005)],
    [11,1,[[0,1],[1,2]],'paid','new','pickup'],
    [12,1,[[1,2]],'paid','new','delivery'],
    [13,1,[[0,2]],'paid','new','pickup'],
    [0,1,[[0,2]],'paid','new','delivery',id(4001)],
    [14,2,[[0,1],[2,1]],'paid','new','delivery'],
    [15,2,[[1,1]],'paid','new','pickup'],
    [2,2,[[1,1]],'paid','new','pickup',id(4002)],
    [3,3,[[0,3]],'paid','new','pickup'],
    [4,3,[[0,1],[2,1]],'paid','new','delivery',id(4003)],
    [5,4,[[2,2]],'paid','new','pickup'],
    [6,5,[[0,1]],'paid','new','delivery'],
    [7,6,[[1,2]],'unpaid','new','pickup'],
    [8,7,[[0,1]],'paid','new','pickup'],
    [9,8,[[0,2]],'unpaid','new','delivery'],
    [10,9,[[0,1],[2,1]],'paid','new','delivery'],
    [11,10,[[1,1]],'paid','new','pickup'],
    [12,11,[[0,2]],'refunded','cancelled','delivery'],
    [13,12,[[1,2],[2,1]],'paid','new','pickup'],
    [14,13,[[0,1]],'unpaid','new','pickup'],
    [15,14,[[0,2]],'paid','new','delivery']
  ].forEach(([customer,offset,recipes,payment,status,fulfillment,sub]) => makeOrder(customer,offset,recipes,payment,status,fulfillment,sub||null));

  const bake_updates=[
    {bake_date:today,stage:'baking',published:true,public_note:'Demo batch: the oven is doing its thing.',started_at:new Date().toISOString(),estimated_ready_at:new Date(Date.now()+55*60_000).toISOString(),updated_at:new Date().toISOString()}
  ];
  const customer_dietary_notes=[
    {customer_id:customers[1].id,allergies:'Demo only: sesame',dietary_preferences:null,handling_notes:'Demo note – confirm ingredients with customer before baking.',last_confirmed_at:null},
    {customer_id:customers[9].id,allergies:null,dietary_preferences:'Demo only: prefers no additional toppings',handling_notes:'Demo note, not real medical information.',last_confirmed_at:null}
  ];

  return {customers,products,bake_days,orders,order_items,subscriptions,subscription_items,subscription_skips,bake_updates,customer_dietary_notes};
}

/**
 * Local sandbox mutation adapter. Supports exactly the existing admin forms.
 * A demo action never fetches, inserts, updates or deletes production records.
 */
export function applyDemoMutation(dataset,path,method,body) {
  const [collection,filter] = path.split('?');
  if(!DEMO_COLLECTIONS.includes(collection))throw Error('Unsupported demo operation: '+collection);
  if (!['POST','PATCH'].includes(method)) throw Error('Unsupported demo method: '+method);
  const next={...dataset,[collection]:[...dataset[collection]]};
  // Match critical production uniqueness rules during client-only practice.
  const filterParts=filter?.match(/^([a-z_]+)=eq\\.(.+)$/);
  const targetField=filterParts?.[1],targetValue=filterParts?.[2];
  if(collection==='customers'&&body.email){
    const duplicate=dataset.customers.some(row=>row.email?.trim().toLowerCase()===body.email.trim().toLowerCase()&&(method==='POST'||String(row[targetField])!==targetValue));
    if(duplicate)throw Error('A demo customer with this email already exists.');
  }
  if(collection==='bake_days'&&body.bake_date){
    const duplicate=dataset.bake_days.some(row=>row.bake_date===body.bake_date&&(method==='POST'||String(row[targetField])!==targetValue));
    if(duplicate)throw Error('That demo bake date is already scheduled.');
  }
  if(collection==='bake_updates'&&body.bake_date){
    const duplicate=dataset.bake_updates.some(row=>row.bake_date===body.bake_date&&(method==='POST'||String(row[targetField])!==targetValue));
    if(duplicate)throw Error('That demo batch update already exists for this date.');
  }
  if(method==='POST'){
    const record={...body,id:body.id||crypto.randomUUID()};
    // Key shapes that don't have an id column in the real schema.
    if(collection==='bake_updates')delete record.id;
    next[collection].push(record);
    return next;
  }
  const match=filter?.match(/^([a-z_]+)=eq\.(.+)$/);
  if(!match)throw Error('Demo update requires a primary-key filter');
  const [,column,value]=match;
  let updated=false;
  next[collection]=next[collection].map(item=>{
    if(String(item[column])!==value)return item;
    updated=true;
    return {...item,...body};
  });
  if(!updated)throw Error('Demo row not found');
  return next;
}

export function createDemoManualOrder(dataset,draft) {
  const customer=dataset.customers.find(c=>c.id===draft.customer_id);
  const day=dataset.bake_days.find(b=>b.id===draft.bake_day_id);
  const product=dataset.products.find(p=>p.id===draft.product_id&&p.active);
  const quantity=Number(draft.quantity);
  if(!customer||!day||!product||!Number.isInteger(quantity)||quantity<1||quantity>20)throw Error('Select a customer, bake date and valid loaf quantity.');
  if(day.status==='closed'||day.status==='completed')throw Error('Bake day is closed.');
  if(!['pickup','delivery'].includes(draft.fulfillment_type))throw Error('Choose pickup or delivery.');
  const used=dataset.orders.filter(o=>o.bake_day_id===day.id&&o.status!=='cancelled').reduce((n,o)=>n+dataset.order_items.filter(i=>i.order_id===o.id).reduce((sum,i)=>sum+i.quantity,0),0);
  if(used+quantity>day.capacity_loaves)throw Error('Not enough loaves remain on this demo date.');
  const orderId=crypto.randomUUID();
  return {
    ...dataset,
    orders:[...dataset.orders,{
      id:orderId,customer_id:customer.id,bake_day_id:day.id,subscription_id:null,
      fulfillment_type:draft.fulfillment_type,fulfillment_window:draft.fulfillment_window||null,
      delivery_address:draft.fulfillment_type==='delivery'?draft.delivery_address:null,
      delivery_notes:null,payment_status:'unpaid',status:'new',
      total_cents:quantity*product.price_cents,
      created_at:new Date().toISOString(),stripe_checkout_session_id:null,stripe_payment_intent_id:null
    }],
    order_items:[...dataset.order_items,{id:crypto.randomUUID(),order_id:orderId,product_id:product.id,quantity,unit_price_cents:product.price_cents}]
  };
}

/** For fixture QA and future ETL/analytics tests: enforce PK/FK-like relationships. */
export function validateDemoGraph(dataset) {
  const errors=[];
  const pk={
    customers:'id',products:'id',bake_days:'id',orders:'id',
    order_items:'id',subscriptions:'id',subscription_items:'id',
    bake_updates:'bake_date',customer_dietary_notes:'customer_id'
  };
  for(const [table,key] of Object.entries(pk)){
    const ids=dataset[table].map(row=>row[key]);
    if(ids.some(v=>!v)||new Set(ids).size!==ids.length)errors.push(table+' has missing or duplicate '+key);
  }
  const has=(table,foreign)=>dataset[table].some(row=>row.id===foreign);
  for(const order of dataset.orders){
    if(!has('customers',order.customer_id)||!has('bake_days',order.bake_day_id))errors.push('orders FK mismatch: '+order.id);
  }
  for(const item of dataset.order_items){
    if(!dataset.orders.some(row=>row.id===item.order_id)||!has('products',item.product_id))errors.push('order_items FK mismatch: '+item.id);
  }
  for(const subscription of dataset.subscriptions){
    if(!has('customers',subscription.customer_id))errors.push('subscriptions FK mismatch: '+subscription.id);
  }
  for(const item of dataset.subscription_items){
    if(!dataset.subscriptions.some(row=>row.id===item.subscription_id)||!has('products',item.product_id))errors.push('subscription_items FK mismatch: '+item.id);
  }
  if(new Set(dataset.subscription_skips.map(row=>row.subscription_id+'|'+row.bake_date)).size!==dataset.subscription_skips.length)errors.push('duplicate composite PK in subscription_skips');
  for(const skip of dataset.subscription_skips){
    if(!dataset.subscriptions.some(s=>s.id===skip.subscription_id))errors.push('subscription_skips FK mismatch: '+skip.subscription_id);
  }
  for(const note of dataset.customer_dietary_notes){
    if(!has('customers',note.customer_id))errors.push('customer_dietary_notes FK mismatch: '+note.customer_id);
  }
  for(const order of dataset.orders){
    const lines=dataset.order_items.filter(i=>i.order_id===order.id);
    if(lines.some(i=>!Number.isInteger(i.quantity)||i.quantity<1||!Number.isInteger(i.unit_price_cents)||i.unit_price_cents<0))errors.push('invalid order item quantity/price: '+order.id);
    if(lines.reduce((sum,i)=>sum+i.quantity*i.unit_price_cents,0)!==order.total_cents)errors.push('order total mismatch: '+order.id);
    if(order.subscription_id&&!dataset.subscriptions.some(sub=>sub.id===order.subscription_id))errors.push('orders subscription FK mismatch: '+order.id);
  }
  return errors;
}
