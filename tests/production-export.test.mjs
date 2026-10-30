import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDemoData} from '../admin/demoData.js';
import {calculateProductionDay, joinOrders} from '../admin/productionMetrics.js';
import {productionCsv, productionRows, filenameForProduction, PRODUCTION_COLUMNS} from '../admin/productionExport.js';

const today = '2026-10-29';
const data = buildDemoData(today);
const orders = joinOrders(data);
const nextDate = offset => {
  const d = new Date(today + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const days = Array.from({length:14}, (_,i) =>
  calculateProductionDay(nextDate(i), today, orders, data)
);

test('one unique row per bake date and product, stable chronological order', () => {
  const rows = productionRows(days, data.products);
  assert.equal(rows.length, 14*data.products.length);
  const keys = rows.map(row => row.bake_date + '|' + row.product_id);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(rows[0].bake_date, today);
  assert.equal(rows.at(-1).bake_date, nextDate(13));
  assert.ok(rows.every(row => row.data_source === 'LIVE'));
});

test('export never conflates paid, unpaid and projected loaves', () => {
  const rows = productionRows(days, data.products, {demo:true});
  const sum = (date,key) => rows.filter(row=>row.bake_date===date).reduce((n,row)=>n+row[key],0);
  assert.equal(sum(today,'confirmed_paid_loaves'),7);
  assert.equal(sum(nextDate(1),'confirmed_paid_loaves'),9);
  assert.equal(sum(nextDate(6),'confirmed_paid_loaves'),0);
  assert.equal(sum(nextDate(6),'unpaid_loaves'),2);
  assert.equal(sum(nextDate(7),'subscription_forecast_loaves'),1);
  assert.ok(rows.every(row => row.data_source === 'DEMO_ONLY'));
});

test('exports are labelled and do not contain names, emails or addresses', () => {
  const csv = productionCsv(days,data.products,{demo:true});
  assert.ok(csv.startsWith('\uFEFF'+PRODUCTION_COLUMNS.join(',')));
  assert.ok(csv.includes('"DEMO_ONLY"'));
  assert.ok(!csv.includes('amara.chen@example.com'));
  assert.ok(!csv.includes('Example Lane'));
  assert.equal(filenameForProduction(days,{demo:true}), 'mntl-DEMO-production-2026-10-29-to-2026-11-11.csv');
});

test('untrusted product labels are quoted and Excel formula-safe', () => {
  const row = {...data.products[0], name:'=HYPERLINK("https://malicious.example","x")'};
  const csv = productionCsv(days.slice(0,1),[row]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes('""https://malicious.example""'));
});

test('invalid quantities or duplicate date-product combinations are rejected', () => {
  const day = days[0];
  assert.throws(()=>productionRows([day,day],data.products),/Duplicate/);
  assert.throws(()=>productionRows([{...day,paidUnits:{[data.products[0].id]:-2}}],data.products),/nonnegative/);
  assert.throws(()=>filenameForProduction([]),/No dates/);
});
