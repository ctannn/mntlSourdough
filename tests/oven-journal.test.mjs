import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  normalizeSlug,safeHttpsImageUrl,safeStoryLink,
  blogPayload,validateBlogPost,publishedBlogPosts,OVEN_BUCKET
} from '../src/lib/ovenJournal.mjs';
import {createDemoOvenPosts} from '../admin/demoOvenPosts.js';

const example={
  title:'The Slow Bake',slug:'the-slow-bake',category:'Behind the bake',
  excerpt:'Good bread takes time.',body:'Good bread takes time, patience and a long fermentation.',
  cover_image_url:'',status:'draft'
};
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('friendly URL slugs are deterministic, lowercase and safe',()=>{
  assert.equal(normalizeSlug('  Café & Sourdough: Our Story!  '),'cafe-sourdough-our-story');
  assert.equal(normalizeSlug('Bread / Good Times'),'bread-good-times');
  assert.equal(normalizeSlug('---'),'');
  assert.ok(normalizeSlug('A'.repeat(120)).length<=90);
});

test('published posts require real content, while drafts can be unfinished',()=>{
  assert.deepEqual(validateBlogPost(example,'published'),[]);
  assert.deepEqual(validateBlogPost({...example,body:'draft'},'draft'),[]);
  assert.ok(validateBlogPost({...example,body:'draft'},'published').some(e=>e.includes('40')));
  assert.equal(blogPayload(example,'published').status,'published');
  assert.throws(()=>blogPayload({...example,slug:'../../bad'},'published'));
});

test('reject unsafe cover URLs and article hyperlinks',()=>{
  assert.equal(safeHttpsImageUrl('javascript:alert(1)'),'');
  assert.equal(safeHttpsImageUrl('data:text/html,evil'),'');
  assert.equal(safeHttpsImageUrl('http://example.com/loaf.png'),'');
  assert.equal(safeHttpsImageUrl('https://example.com/bread.webp'),'https://example.com/bread.webp');
  assert.equal(safeStoryLink('javascript:alert(1)'),'');
  assert.equal(safeStoryLink('https://example.com/story'),'https://example.com/story');
});

test('unpublished or future-dated posts are never visible publicly',()=>{
  const rows=[
    {slug:'published',status:'published',published_at:'2026-10-29T12:00:00Z'},
    {slug:'draft',status:'draft',published_at:'2026-10-29T12:00:00Z'},
    {slug:'future',status:'published',published_at:'2027-01-01T12:00:00Z'},
    {slug:'older',status:'published',published_at:'2026-10-20T12:00:00Z'}
  ];
  assert.deepEqual(publishedBlogPosts(rows,Date.parse('2026-10-30T00:00:00Z')).map(p=>p.slug),['published','older']);
});

test('blog samples never appear on the real public website by default',()=>{
  const samples=createDemoOvenPosts();
  assert.equal(samples.length,2);
  assert.ok(samples.some(post=>post.status==='draft'));
  assert.ok(samples.some(post=>post.status==='published'));
  assert.ok(samples.every(post=>post.id.startsWith('00000000-')));
  assert.equal(OVEN_BUCKET,'mntl-oven');
  const admin=source('admin/main.jsx');
  const mgr=source('admin/BlogManager.jsx');
  assert.match(admin,/demoBlogPosts/);
  assert.match(mgr,/if\(demoEnabled\)/);
  assert.match(mgr,/Image uploads are disabled in demo mode/);
});

test('public Oven is a real route, not a link to the bake countdown section',()=>{
  const vercel=JSON.parse(source('vercel.json'));
  assert.ok(vercel.rewrites.some(x=>x.source==='/oven'&&x.destination==='/index.html'));
  assert.ok(vercel.rewrites.some(x=>x.source==='/oven/:slug'&&x.destination==='/index.html'));
  const main=source('src/main.jsx');
  assert.match(main,/<a href="\/oven">THE OVEN<\/a>/);
  assert.match(main,/window\.location\.pathname\.startsWith\('\/oven'\)/);
  const publicPage=source('src/components/OvenJournal.jsx');
  assert.match(publicPage,/status:'eq\.published'/);
  assert.doesNotMatch(publicPage,/dangerouslySetInnerHTML/);
  assert.doesNotMatch(source('src/components/StoryBody.jsx'),/dangerouslySetInnerHTML/);
});

test('locally hosted bakery images are substantial valid WebP files',()=>{
  for(const filename of ['public/images/mntl-hero.webp','public/images/mntl-original.webp']){
    const data=readFileSync(new URL('../'+filename,import.meta.url));
    assert.ok(data.length>80000,filename+' should not be a blown-up thumbnail');
    assert.equal(data.toString('ascii',0,4),'RIFF');
    assert.equal(data.toString('ascii',8,12),'WEBP');
  }
  const main=source('src/main.jsx');
  assert.match(main,/hero:'\/images\/mntl-hero\.webp'/);
  assert.match(main,/classic:'\/images\/mntl-original\.webp'/);
});
