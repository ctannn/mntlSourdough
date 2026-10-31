import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const text = relative => readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const migration = 'supabase/migrations/20261031222333_secure_public_bake_updates_and_staff_order_status.sql';

test('public freshness data grants never expose anonymous writes or TRUNCATE',()=>{
 const sql=text(migration).toLowerCase();
 assert.match(sql,/revoke all privileges on table public\.bake_updates from anon;/);
 assert.match(sql,/grant select \(bake_date,stage,public_note,estimated_ready_at,updated_at,published\)/);
 assert.doesNotMatch(sql,/grant\s+(truncate|all)\s+on table public\.bake_updates to anon/);
});

test('authorized status editing grants only the order status column, not billing',()=>{
 const sql=text(migration).toLowerCase();
 assert.match(sql,/grant update \(status\) on table public\.orders to authenticated;/);
 assert.doesNotMatch(sql,/grant update on table public\.orders to authenticated/);
 assert.doesNotMatch(sql,/grant update \([^)]*(payment_status|total_cents|stripe_checkout_session_id)[^)]*\)/);
 const admin=text('admin/main.jsx');
 assert.match(admin,/mutate\('orders\?id=eq\.'\+id,'PATCH',\{status\}\)/);
});

test('staff admin never reports an incomplete 1000-row data slice as complete',()=>{
 const admin=text('admin/main.jsx');
 assert.match(admin,/rows\.length>=1000/);
 assert.match(admin,/records may be incomplete/);
 assert.match(admin,/setLiveRecords\(\{customers:\[\],products:\[\]/);
});

test('staff mutations must verify that PostgREST actually returned changed rows',()=>{
 const admin=text('admin/main.jsx');
 assert.match(admin,/saved\.length===0/);
 assert.match(admin,/No record was changed/);
});

test('the Oven journal warns rather than silently truncating article lists',()=>{
 const admin=text('admin/BlogManager.jsx');
 assert.match(admin,/list\.length>=200/);
 assert.match(admin,/listing may be incomplete/);
});

test('freshness ribbon navigates correctly both from blog and storefront',()=>{
 const ribbon=text('src/components/BakeExperience.jsx');
 assert.match(ribbon,/pathname\.startsWith\('\/oven'\)\?'\/#oven':'#oven'/);
 assert.match(ribbon,/Alberta Time/);
});
