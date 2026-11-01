import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('all storefront Shop the Loaves actions open the actual ordering form',()=>{
  const app=source('src/main.jsx');
  assert.match(app,/<section className="order wrap" id="order">/);
  assert.match(app,/<Hero\b[^>]*onShop=\{\(\)=>jump\('order'\)\}/);
  assert.match(app,/<button onClick=\{\(\)=>jump\('order'\)\}>SHOP THE LOAVES<\/button>/);
  assert.match(app,/<button onClick=\{\(\)=>jump\('order'\)\}>SHOP<\/button>/);
  assert.match(app, /setOpen\(false\);jump\('order'\)/);
  assert.doesNotMatch(app, /jump\('shop'\)/);
});

test('direct links from The Oven reach the order form after React mounts',()=>{
  const app=source('src/main.jsx');
  const journal=source('src/components/OvenJournal.jsx');
  assert.match(app,/window\.location\.hash\.slice\(1\)/);
  assert.match(app,/window\.addEventListener\('hashchange',followHash\)/);
  assert.match(app,/scrollToSiteSection\(id,'auto'\)/);
  assert.match(journal,/<a href="\/#order">SHOP<\/a>/);
  assert.match(journal,/<a href="\/#order">SHOP THE LOAVES/);
  assert.match(journal, /<a href="\/#order" className="oven-shop-button">ORDER BREAD/);
});

test('editorial Meet the Bread link still points to product showcase',()=>{
  const app=source('src/main.jsx');
  const journal=source('src/components/OvenJournal.jsx');
  assert.match(app,/<section className="intro wrap" id="shop">/);
  assert.match(journal,/<a href="\/#shop" className="oven-primary-link">MEANWHILE, MEET THE BREAD/);
  assert.match(app,/target=id==='order'\?section\?\.querySelector\('\.order-heading'\):section/);
  const css=source('src/editorial.css');
  assert.match(css,/#order \.order-heading \{scroll-margin-top: 55px;\}/);
});
