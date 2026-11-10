import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('browse-to-order path is short while preserving club and editorial sections',()=>{
  const app=read('src/main.jsx');
  const positions=['className="products wrap"','className="order wrap" id="order"','className="club" id="subscription"','className="manifesto wrap" id="story"','className="faq wrap" id="faq"'].map(x=>app.indexOf(x));
  assert.ok(positions.every((x,i)=>x>=0&&(i===0||x>positions[i-1])),JSON.stringify(positions));
  assert.equal(app.split('className="order wrap" id="order"').length-1,1);
  assert.equal(app.split('className="order-grid"').length-1,1);
});
test('ordering is described accurately and no payment is implied',()=>{
  const app=read('src/main.jsx');
  assert.match(app,/className="order-steps"/);
  assert.match(app,/CHOOSE YOUR LOAF/);
  assert.match(app,/PICK A BAKE DATE/);
  assert.match(app,/At least one day of notice/);
  assert.match(app,/WE CONFIRM BY EMAIL/);
  assert.match(app,/No payment collected yet/);
  assert.match(app,/No payment is collected on this website yet/);
});
test('illustrative product imagery and email-only newsletter signup are transparent',()=>{
  const app=read('src/main.jsx');
  const css=read('src/editorial.css');
  assert.match(app,/Photography is illustrative\. Each fresh-baked loaf will naturally vary\./);
  assert.match(app,/Opens your email app\. This does not subscribe you automatically\./);
  assert.match(app,/we will confirm before adding you/);
  assert.match(css,/\.product-photo-note/);
  assert.match(css,/\.newsletter-clarity/);
});
test('three-step instructions remain simple responsive editorial UI',()=>{
  const app=read('src/main.jsx'),css=read('src/editorial.css');
  assert.match(app,/<ol className="order-steps"/);
  assert.match(css,/\.order-steps\{/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.doesNotMatch(app,/new customer review|1000 happy customers|limited spots today/i);
});
