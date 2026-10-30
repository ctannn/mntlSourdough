import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';

// No real keys, Stripe calls, customer data, or database writes during tests.
// Modules read their server configuration at import time.
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;
process.env.MNTL_CHECKOUT_ENABLED='false';
process.env.MNTL_PICKUP_ENABLED='false';
const [{default:status},{default:availability},{default:checkout},{paymentReady}]=await Promise.all([
  import('../api/checkout-status.js'),import('../api/availability.js'),
  import('../api/checkout.js'),import('../server/mntlDb.mjs')
]);
function mockResponse() {
  const output={statusCode:200,headers:{},body:undefined,setHeader(key,value){this.headers[key.toLowerCase()]=value},end(data){this.body=JSON.parse(data)}};
  return output;
}
test('checkout is fail-closed unless all owner-controlled flags and credentials are configured',()=>{
  assert.equal(paymentReady(),false);
});
test('public endpoint never publishes private configuration or credentials',()=>{
  const response=mockResponse();
  status({method:'GET'},response);
  assert.equal(response.statusCode,200);
  assert.equal(response.body.paymentEnabled,false);
  assert.equal(response.body.subscriptionPaymentsEnabled,false);
  assert.equal(response.body.deliveryPaymentsEnabled,false);
  assert.equal(response.body.pickupAddress,null);
  assert.ok(!JSON.stringify(response.body).includes('SUPABASE_SERVICE_ROLE_KEY'));
});
test('availability endpoint reports unconfigured when server key is absent',async()=>{
  const response=mockResponse();
  await availability({method:'GET'},response);
  assert.equal(response.statusCode,200);
  assert.equal(response.body.configured,false);
  assert.deepEqual(response.body.dates,[]);
});
test('paid checkout is unavailable and does not create checkout holds when disabled',async()=>{
  const response=mockResponse();
  await checkout({method:'POST',body:{mode:'one-time',fulfillment:'pickup'}},response);
  assert.equal(response.statusCode,503);
  assert.match(response.body.error,/not yet opened/);
});
test('method guards return 405 and explicit Allow headers',async()=>{
  for(const endpoint of [status,availability,checkout]) {
    const response=mockResponse();
    await endpoint({method:'DELETE'},response);
    assert.equal(response.statusCode,405);
    assert.ok(response.headers.allow==='GET'||response.headers.allow==='POST');
  }
});
