import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDemoData,applyDemoMutation,createDemoManualOrder,validateDemoGraph} from '../admin/demoData.js';

const anchor='2026-10-29';
const initial=()=>buildDemoData(anchor);

test('demo dataset is deterministic, has unique primary keys and valid foreign keys',()=>{
  const a=initial(),b=initial();
  assert.equal(a.customers.length,16);
  assert.ok(a.orders.length>=25);
  assert.deepEqual(a.customers.map(c=>c.id),b.customers.map(c=>c.id));
  assert.deepEqual(a.orders.map(o=>o.id),b.orders.map(o=>o.id));
  assert.deepEqual(validateDemoGraph(a),[]);
  for(const customer of a.customers){
    assert.ok(customer.email.endsWith('@example.com'));
    assert.match(customer.id,/^[0-9a-f-]{36}$/);
  }
  assert.ok(a.orders.every(o=>a.customers.some(c=>c.id===o.customer_id)));
  assert.ok(a.order_items.every(i=>a.products.some(p=>p.id===i.product_id)));
});

test('demo orders include pickup, delivery, paid, unpaid, refunds, active subscriptions',()=>{
  const data=initial();
  assert.ok(data.orders.some(o=>o.fulfillment_type==='pickup'));
  assert.ok(data.orders.some(o=>o.fulfillment_type==='delivery'&&o.delivery_address));
  assert.ok(data.orders.some(o=>o.payment_status==='paid'));
  assert.ok(data.orders.some(o=>o.payment_status==='unpaid'));
  assert.ok(data.orders.some(o=>o.payment_status==='refunded'));
  assert.ok(data.subscriptions.some(s=>s.status==='active'));
  assert.ok(data.subscriptions.some(s=>s.status==='paused'));
  assert.ok(data.subscription_skips.length>=1);
});

test('sample customer edits are isolated and preserve their primary key',()=>{
  const data=initial(),id=data.customers[0].id;
  const updated=applyDemoMutation(data,'customers?id=eq.'+id,'PATCH',{marketing_opt_in:false,last_name:'Demo Edited'});
  assert.equal(updated.customers[0].id,id);
  assert.equal(updated.customers[0].last_name,'Demo Edited');
  assert.equal(updated.customers[0].marketing_opt_in,false);
  assert.notEqual(data.customers[0].last_name,'Demo Edited');
  assert.deepEqual(validateDemoGraph(updated),[]);
});

test('demo order status changes preserve paid order and item relationships',()=>{
  const data=initial(),orderId=data.orders[10].id;
  const updated=applyDemoMutation(data,'orders?id=eq.'+orderId,'PATCH',{status:'ready'});
  assert.equal(updated.orders[10].status,'ready');
  assert.equal(updated.orders[10].id,orderId);
  assert.equal(updated.order_items.length,data.order_items.length);
  assert.deepEqual(validateDemoGraph(updated),[]);
});

test('new demo customers and bake days receive surrogate IDs',()=>{
  let data=initial();
  data=applyDemoMutation(data,'customers','POST',{
    first_name:'Alex',last_name:'Sample',full_name:'Alex Sample',email:'alex.sample@example.com',
    phone:null,marketing_opt_in:false
  });
  data=applyDemoMutation(data,'bake_days','POST',{
    bake_date:'2027-01-01',status:'open',capacity_loaves:60,cutoff_at:'2026-12-31T18:00:00Z'
  });
  assert.ok(data.customers.at(-1).id);
  assert.ok(data.bake_days.at(-1).id);
  assert.deepEqual(validateDemoGraph(data),[]);
});

test('new demo manual orders are unpaid and have consistent line-item financial snapshots',()=>{
  const data=initial();
  const customer=data.customers[0],day=data.bake_days.find(d=>d.bake_date==='2026-11-02');
  assert.ok(day);
  const product=data.products[0];
  const next=createDemoManualOrder(data,{
    customer_id:customer.id,bake_day_id:day.id,product_id:product.id,quantity:2,
    fulfillment_type:'pickup',fulfillment_window:'9 AM – 11 AM',delivery_address:''
  });
  const order=next.orders.at(-1);
  const item=next.order_items.at(-1);
  assert.equal(order.payment_status,'unpaid');
  assert.equal(order.total_cents,product.price_cents*2);
  assert.equal(item.order_id,order.id);
  assert.equal(item.quantity,2);
  assert.deepEqual(validateDemoGraph(next),[]);
  assert.equal(data.orders.length+1,next.orders.length);
});

test('unsafe demo mutations fail closed',()=>{
  const data=initial();
  assert.throws(()=>applyDemoMutation(data,'orders','DELETE',{}));
  assert.throws(()=>applyDemoMutation(data,'staff','POST',{}));
  assert.throws(()=>applyDemoMutation(data,'orders?id=eq.not-here','PATCH',{status:'ready'}));
  assert.throws(()=>createDemoManualOrder(data,{
    customer_id:data.customers[0].id,bake_day_id:data.bake_days[8].id,
    product_id:data.products[0].id,quantity:100,
    fulfillment_type:'pickup'
  }));
});
