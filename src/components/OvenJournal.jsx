import React,{useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,Clock3,Instagram,Menu} from 'lucide-react';
import {StoryBody} from './StoryBody.jsx';
import {StickyBakeBar} from './BakeExperience.jsx';
import {OVEN_PUBLIC_REST,OVEN_PUBLIC_KEY,publishedBlogPosts,readableBlogDate,safeHttpsImageUrl} from '../lib/ovenJournal.mjs';
import './OvenJournal.css';

const PLACEHOLDER='/images/mntl-hero.webp';
function Cover({post,detail=false}) {
  const url=safeHttpsImageUrl(post?.cover_image_url)||PLACEHOLDER;
  return <div className={'oven-cover'+(detail?' is-detail':'')}>
    <img src={url} alt={post?.title?'Cover photograph for '+post.title:'MNTL artisan sourdough'}
      loading={detail?'eager':'lazy'} onError={e=>{if(e.currentTarget.src!==new URL(PLACEHOLDER,window.location.origin).href){e.currentTarget.src=PLACEHOLDER;e.currentTarget.onerror=null}}}/>
  </div>;
}
function NavBar() {
  const [menu,setMenu]=useState(false);
  return <header className="oven-top-nav">
    <a href="/" className="oven-wordmark" aria-label="MNTL home">mntl<span>✳</span></a>
    <button type="button" className="oven-nav-toggle" onClick={()=>setMenu(v=>!v)} aria-expanded={menu} aria-label="Toggle navigation"><Menu size={20}/></button>
    <nav className={menu?'is-expanded':''} aria-label="Main navigation">
      <a href="/#shop">SHOP</a><a href="/#subscription">BREAD CLUB</a><a href="/#story">ABOUT</a>
      <a href="/oven" aria-current="page">THE OVEN <span className="oven-current-dot" aria-hidden="true">●</span></a>
    </nav>
    <a href="/#order" className="oven-shop-button">ORDER BREAD <ArrowUpRight size={15}/></a>
  </header>;
}
function PostCard({post}) {
  return <article className="oven-post-card">
    <a href={'/oven/'+post.slug} className="oven-post-card-cover"><Cover post={post}/></a>
    <div className="oven-post-meta"><span>{post.category}</span><span>{readableBlogDate(post.published_at)}</span></div>
    <h3><a href={'/oven/'+post.slug}>{post.title}</a></h3>
    <p>{post.excerpt||post.body?.slice(0,155)+'…'}</p>
    <a href={'/oven/'+post.slug} className="oven-read-link">READ THE STORY <ArrowUpRight size={17}/></a>
  </article>;
}
async function fetchPublished(slug) {
  const search=new URLSearchParams({
    select:'id,slug,title,excerpt,body,category,cover_image_url,status,published_at',
    status:'eq.published',
    order:'published_at.desc',
    limit:slug?'1':'40'
  });
  if(slug)search.set('slug','eq.'+slug);
  const response=await fetch(OVEN_PUBLIC_REST+'?'+search,{
    headers:{apikey:OVEN_PUBLIC_KEY,Accept:'application/json'},cache:'no-store'
  });
  if(!response.ok)throw Error('Unable to load our stories right now.');
  const rows=await response.json();
  return publishedBlogPosts(rows);
}
function JournalHome({posts}) {
  const featured=posts[0];
  return <>
    <section className="oven-journal-hero">
      <div className="oven-journal-kicker"><span>THE MNTL JOURNAL</span><span>CALGARY / EST. WITH INTENTION</span></div>
      <div className="oven-journal-heading"><div><h1>The<br/><em>Oven.</em></h1><p>Stories from the kitchen. Good bread, better rituals, and all the things we're learning along the way.</p></div><div className="oven-journal-hero-mark" aria-hidden="true">✳</div></div>
      <div className="oven-journal-bottom"><span>THE LATEST FROM MNTL</span><span>SCROLL TO READ ↓</span></div>
    </section>
    {featured?<section className="oven-featured-post" aria-labelledby="oven-featured-heading">
      <div className="oven-featured-image"><a href={'/oven/'+featured.slug}><Cover post={featured} detail/></a></div>
      <div className="oven-featured-copy"><span className="oven-post-label">FRESHLY PUBLISHED / {featured.category.toUpperCase()}</span>
        <h2 id="oven-featured-heading"><a href={'/oven/'+featured.slug}>{featured.title}</a></h2>
        <p>{featured.excerpt||featured.body?.slice(0,210)+'…'}</p>
        <small>{readableBlogDate(featured.published_at)}</small>
        <a href={'/oven/'+featured.slug} className="oven-primary-link">READ THE STORY <ArrowUpRight size={18}/></a>
      </div>
    </section>:<section className="oven-quiet-state">
      <BookOpen size={31}/><span>NO STORIES PUBLISHED YET</span>
      <h2>Something good<br/>is in the works.</h2>
      <p>Recipes, bake-day notes, and the thoughts behind the loaf will be here once our team publishes them.</p>
      <a href="/#shop" className="oven-primary-link">MEANWHILE, MEET THE BREAD <ArrowUpRight size={16}/></a>
    </section>}
    {posts.length>1&&<section className="oven-posts-section"><div className="oven-posts-heading"><div><span className="oven-post-label">MORE FROM MNTL</span><h2>Still warm.</h2></div><span>{String(posts.length-1).padStart(2,'0')} STORIES</span></div>
      <div className="oven-post-grid">{posts.slice(1).map(post=><PostCard key={post.id} post={post}/>)}</div>
    </section>}
  </>;
}
function JournalArticle({post}) {
  useEffect(()=>{
    document.title=post.title+' — The Oven | MNTL Sourdough';
    const canonical=document.querySelector('link[rel="canonical"]');
    if(canonical)canonical.href='https://runmntl.com/oven/'+post.slug;
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.setAttribute('content',post.excerpt||'MNTL journal — stories from the oven in Calgary.');
  },[post.slug]);
  return <article className="oven-article">
    <div className="oven-article-head">
      <a className="oven-article-back" href="/oven"><ArrowLeft size={17}/> ALL STORIES</a>
      <div className="oven-post-meta"><span>{post.category}</span><span>{readableBlogDate(post.published_at)}</span></div>
      <h1>{post.title}</h1>
      {post.excerpt&&<p className="oven-article-excerpt">{post.excerpt}</p>}
      <span className="oven-article-byline"><Clock3 size={15}/> MNTL SOURDOUGH / CALGARY</span>
    </div>
    <div className="oven-article-cover"><Cover post={post} detail/></div>
    <div className="oven-article-content"><StoryBody body={post.body}/></div>
    <div className="oven-article-tail"><span>GOOD BREAD. QUESTIONABLE OBSESSION.</span><a href="/oven">BACK TO THE OVEN <ArrowRight size={17}/></a></div>
  </article>;
}
export function OvenJournal() {
  const match=window.location.pathname.match(/^\/oven(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?\/?$/);
  const slug=match?.[1]||null,invalidPath=!match;
  const [state,setState]=useState({loading:!invalidPath,posts:[],error:''});
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    document.title='The Oven — Stories from MNTL Sourdough';
    const canonical=document.querySelector('link[rel="canonical"]');
    if(canonical)canonical.href='https://runmntl.com'+window.location.pathname;
    const description=document.querySelector('meta[name="description"]');
    if(description)description.setAttribute('content','The Oven: stories, recipes and behind-the-bake notes from MNTL Sourdough in Calgary.');
    if(invalidPath)return;
    let active=true;setState({loading:true,posts:[],error:''});
    fetchPublished(slug).then(posts=>{if(active)setState({loading:false,posts,error:''})})
      .catch(err=>{if(active)setState({loading:false,posts:[],error:err.message||'Unable to load stories.'})});
    return ()=>{active=false};
  },[slug,retry,invalidPath]);
  const post=slug?state.posts.find(p=>p.slug===slug):null;
  return <><StickyBakeBar/><NavBar/><main className="oven-journal-main">
    {invalidPath||(!state.loading&&!state.error&&slug&&!post)
      ? <section className="oven-quiet-state"><BookOpen size={31}/><h1>Story not found.</h1><p>That story might still be a draft, or its link may have changed.</p><a className="oven-primary-link" href="/oven">BACK TO THE OVEN <ArrowRight size={17}/></a></section>
      : state.loading?<section className="oven-loading" role="status">WARMING UP THE OVEN…</section>
      : state.error?<section className="oven-quiet-state" role="alert"><h1>We're having a little oven trouble.</h1><p>{state.error}</p><button className="oven-primary-link" onClick={()=>setRetry(n=>n+1)}>TRY AGAIN <ArrowRight size={17}/></button></section>
      : post?<JournalArticle post={post}/>:<JournalHome posts={state.posts}/>}
    <section className="oven-journal-cta"><div><span>MNTL SOURDOUGH / CALGARY</span><h2>Less scrolling.<br/>More sourdough.</h2></div><a href="/#shop">SHOP THE LOAVES <ArrowUpRight size={18}/></a></section>
  </main><footer className="oven-footer"><a className="oven-wordmark" href="/">mntl<span>✳</span></a><div><a href="/#shop">SHOP</a><a href="/#subscription">BREAD CLUB</a><a href="/#story">OUR STORY</a><a href="mailto:hello@runmntl.com">CONTACT</a></div><p>© {new Date().getFullYear()} MNTL SOURDOUGH · CALGARY, AB</p></footer></>;
}
