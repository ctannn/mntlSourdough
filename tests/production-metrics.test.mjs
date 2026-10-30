import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDemoData} from '../admin/demoData.js';
import {calculateProductionDay,joinOrders} from '../admin/productionMetrics.js';

const today='2026-10-29';
const next=(offset)=>{
  const day=new Date(today+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+offset);
  return day.toISOString().slice(0,10);
};
function setup(){
  const data=buildDemoData(today);
  const orders=joinOrders(data);
  return {data,orders,forDay:offset=>calculateProductionDay(next(offset),today,orders,data)};
}

test('today: seven paid loaves, four orders, two pickups and two deliveries',()=>{
  const {forDay,data}=setup();
  const d=forDay(0);
  assert.equal(d.paidCount,7);
  assert.equal(d.paid.length,4);
  assert.equal(d.pickup,2);
  assert.equal(d.delivery,2);
  assert.equal(d.paidUnits[data.products[0].id],4);
  assert.equal(d.paidUnits[data.products[1].id],1);
  assert.equal(d.paidUnits[data.products[2].id],2);
  assert.equal(d.projectedCount,0,'paid subscription renewal should suppress speculative forecast');
});

test('tomorrow: nine confirmed loaves by recipe and four handoffs',()=>{
  const {forDay,data}=setup();
  const d=forDay(1);
  assert.equal(d.paidCount,9);
  assert.equal(d.paidUnits[data.products[0].id],5);
  assert.equal(d.paidUnits[data.products[1].id],4);
  assert.equal(d.pickup,2);
  assert.equal(d.delivery,2);
  assert.equal(d.projectedCount,0);
});

test('paid, unpaid and forecast units remain separate',()=>{
  const {forDay,data}=setup();
  const d=forDay(6);
  assert.equal(d.paidCount,0);
  assert.equal(d.unpaidCount,2);
  assert.equal(d.unpaidUnits[data.products[1].id],2);
  const forecast=forDay(7);
  assert.equal(forecast.projectedCount,1,'active weekly plan should forecast next interval without paid renewal');
  assert.equal(forecast.paidCount,1,'non-subscription paid loaf counted separately');
});

test('subscription skip suppresses next-week projected production',()=>{
  const {forDay}=setup();
  assert.equal(forDay(8).projectedCount,0);
  assert.equal(forDay(10).projectedCount,0);
});

test('refunded or cancelled orders are excluded from bake counts',()=>{
  const {forDay}=setup();
  const d=forDay(11);
  assert.equal(d.paidCount,0);
  assert.equal(d.paid.length,0);
  assert.equal(d.unpaidCount,0);
});

test('fulfilled and manual-order status changes update metrics without altering snapshots',()=>{
  const {data,orders}=setup();
  const updatedOrders=orders.map(o=>o.day===today&&o.status==='ready'?{...o,status:'cancelled'}:o);
  const d=calculateProductionDay(today,today,updatedOrders,data);
  assert.equal(d.paidCount,4);
  assert.equal(d.delivery,1);
  assert.equal(d.pickup,2);
});
