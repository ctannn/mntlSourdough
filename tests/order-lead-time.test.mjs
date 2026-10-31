import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calgaryToday,calgaryHour,earliestCustomerBakeDate,isCustomerBakeDateAllowed,CUSTOMER_BAKE_CUTOFF_HOUR} from '../src/lib/scheduling.mjs';

const time=iso=>new Date(iso);
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('same-day requests are always disallowed; tomorrow works before cutoff',()=>{
 const now=time('2026-10-31T12:00:00Z'); // 06:00 Calgary
 assert.equal(calgaryToday(now),'2026-10-31');
 assert.equal(earliestCustomerBakeDate(now),'2026-11-01');
 assert.equal(isCustomerBakeDateAllowed('2026-10-31',now),false);
 assert.equal(isCustomerBakeDateAllowed('2026-11-01',now),true);
 assert.equal(isCustomerBakeDateAllowed('2026-11-02',now),true);
});
test('tomorrow is allowed at 5:59 PM but not at 6:00 PM Calgary time',()=>{
 const before=time('2026-10-31T23:59:59Z');
 const after=time('2026-11-01T00:00:00Z');
 assert.equal(CUSTOMER_BAKE_CUTOFF_HOUR,18);
 assert.equal(calgaryHour(before),17);
 assert.equal(calgaryHour(after),18);
 assert.equal(earliestCustomerBakeDate(before),'2026-11-01');
 assert.equal(earliestCustomerBakeDate(after),'2026-11-02');
 assert.equal(isCustomerBakeDateAllowed('2026-11-01',before),true);
 assert.equal(isCustomerBakeDateAllowed('2026-11-01',after),false);
 assert.equal(isCustomerBakeDateAllowed('2026-11-02',after),true);
});
test('local midnight does not accidentally allow a same-day order',()=>{
 const before=time('2026-11-01T05:59:59Z');
 const after=time('2026-11-01T06:00:00Z');
 assert.equal(earliestCustomerBakeDate(before),'2026-11-02');
 assert.equal(earliestCustomerBakeDate(after),'2026-11-02');
 assert.equal(isCustomerBakeDateAllowed('2026-11-01',after),false);
});
test('permanent Alberta UTC-6 cutoff still applies in December',()=>{
 const before=time('2026-12-16T23:59:59Z');
 const after=time('2026-12-17T00:00:00Z');
 assert.equal(earliestCustomerBakeDate(before),'2026-12-17');
 assert.equal(earliestCustomerBakeDate(after),'2026-12-18');
});
test('reject malformed dates instead of accidentally approving them',()=>{
 const now=time('2026-10-31T12:00:00Z');
 for(const date of ['',null,undefined,'2026-02-29','2026-11-1','2026-13-01','2026/11/01']){
   assert.equal(isCustomerBakeDateAllowed(date,now),false);
 }
});
test('storefront, checkout form, and public APIs all enforce shared lead time',()=>{
 const planner=source('src/components/FulfillmentPlanner.jsx');
 const contact=source('src/components/CheckoutContact.jsx');
 const main=source('src/main.jsx');
 const checkout=source('api/checkout.js');
 const avail=source('api/availability.js');
 assert.match(planner,/firstSelectable = earliestCustomerBakeDate\(now\)/);
 assert.match(planner,/disabled = date < firstSelectable/);
 assert.match(contact,/isCustomerBakeDateAllowed\(preference\.date,new Date\(\)\)/);
 assert.match(contact,/const canSend=cart\.length>0&&hasDate&&dateAllowed/);
 assert.match(main,/const request=\(customer=\{\}\)=>\{if\(!isCustomerBakeDateAllowed\(preference\.date,new Date\(\)\)/);
 assert.match(checkout,/if\(!isCustomerBakeDateAllowed\(date,new Date\(\)\)\)/);
 assert.match(avail,/const after=earliestCustomerBakeDate\(now\)/);
});
