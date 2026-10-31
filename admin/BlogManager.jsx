import React,{useEffect,useState} from 'react';
import {ArrowRight,BookOpen,CheckCircle2,Eye,ImagePlus,Plus,RefreshCw,Save,Trash2,X} from 'lucide-react';
import {StoryBody} from '../src/components/StoryBody.jsx';
import {blogPayload,normalizeSlug,validateBlogPost,safeHttpsImageUrl,BLOG_ALLOWED_IMAGES,BLOG_MAX_IMAGE_BYTES,OVEN_BUCKET,OVEN_PUBLIC_ASSETS,OVEN_PUBLIC_KEY,OVEN_PUBLIC_REST,readableBlogDate} from '../src/lib/ovenJournal.mjs';
import './BlogManager.css';

const SB='https://dfyzpflempgtokyhvtlo.supabase.co';
const blankPost=()=>({id:null,title:'',slug:'',category:'Journal',excerpt:'',body:'',cover_image_url:'',status:'draft',published_at:null});
async function parseResponse(response) {
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw Error(data?.message||data?.error||'The Oven could not save this request.');
  return data;
}
function Status({status}) {return <span className={'oven-admin-status '+(status==='published'?'is-published':'is-draft')}>{status==='published'?'PUBLISHED':'DRAFT'}</span>}
export function BlogManager({session,role,demoEnabled,demoPosts,setDemoPosts}) {
  const canWrite=role==='owner'||role==='baker';
  const [livePosts,setLivePosts]=useState([]);
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false);
  const [message,setMessage]=useState(''),[error,setError]=useState('');
  const [draft,setDraft]=useState(blankPost);
  const [preview,setPreview]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const posts=demoEnabled?demoPosts:livePosts;
  async function refresh() {
    if(demoEnabled) {setLoaded(true);return;}
    setLoading(true);setError('');
    try {
      const query=new URLSearchParams({select:'id,title,slug,excerpt,body,category,status,cover_image_url,published_at,created_at,updated_at',order:'updated_at.desc',limit:'200'});
      const response=await fetch(OVEN_PUBLIC_REST+'?'+query,{
        headers:{apikey:OVEN_PUBLIC_KEY,Authorization:'Bearer '+session.access_token,Accept:'application/json'},cache:'no-store'
      });
      const list=await parseResponse(response);
      if(!Array.isArray(list)||list.length>=200)throw Error('Blog listing may be incomplete. Ask an engineer to enable pagination before editing posts.');
      setLivePosts(list);
      setLoaded(true);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{refresh()},[session.access_token,demoEnabled]);
  function choose(post) {setDraft({...post,cover_image_url:post.cover_image_url||''});setPreview(false);setMessage('');setError('')}
  function update(key,value) {setDraft(d=>({...d,[key]:value}));setMessage('');setError('')}
  function createNew() {setDraft(blankPost());setPreview(false);setMessage('');setError('')}
  function applyDemo(record) {
    setDemoPosts(old=>{
      const exists=old.some(p=>p.id===record.id);
      return exists?old.map(p=>p.id===record.id?record:p):[record,...old];
    });
  }
  async function save(status) {
    if(!canWrite)return;
    setBusy(true);setError('');setMessage('');
    try {
      const body=blogPayload(draft,status);
      if(demoEnabled) {
        const now=new Date().toISOString();
        const record={...draft,...body,id:draft.id||crypto.randomUUID(),
          created_at:draft.created_at||now,updated_at:now,
          published_at:status==='published'?(draft.status==='published'?draft.published_at:now):null};
        const existing=demoPosts.some(post=>post.slug===body.slug&&post.id!==record.id);
        if(existing)throw Error('That URL slug is already used by a sample post.');
        applyDemo(record);setDraft({...record,cover_image_url:record.cover_image_url||''});
        setMessage('Saved to sample data only. The public website was not changed.');
      } else {
        const path=draft.id?'?id=eq.'+encodeURIComponent(draft.id):'';
        const response=await fetch(OVEN_PUBLIC_REST+path,{
          method:draft.id?'PATCH':'POST',
          headers:{apikey:OVEN_PUBLIC_KEY,Authorization:'Bearer '+session.access_token,
            'Content-Type':'application/json',Prefer:'return=representation'},
          body:JSON.stringify(body)
        });
        const saved=await parseResponse(response);
        if(!Array.isArray(saved)||saved.length!==1)throw Error('Save did not return exactly one post. Refresh and check before retrying.');
        setDraft({...saved[0],cover_image_url:saved[0].cover_image_url||''});
        setMessage(status==='published'?'Published. Your story is visible at /oven/'+saved[0].slug:'Draft saved privately.');
        await refresh();
      }
    }catch(e){setError(e.message||'Unable to save the article.')}finally{setBusy(false)}
  }
  async function removeDraft() {
    if(!canWrite||role!=='owner'||!draft.id||draft.status!=='draft')return;
    if(!window.confirm('Permanently delete this unpublished draft? This cannot be undone.'))return;
    setBusy(true);setError('');
    try {
      if(demoEnabled){
        setDemoPosts(old=>old.filter(p=>p.id!==draft.id));
      } else {
        const removed=await parseResponse(await fetch(OVEN_PUBLIC_REST+'?id=eq.'+encodeURIComponent(draft.id),{
          method:'DELETE',headers:{apikey:OVEN_PUBLIC_KEY,Authorization:'Bearer '+session.access_token,
            Prefer:'return=representation'}
        }));
        if(!Array.isArray(removed)||removed.length!==1)throw Error('Draft was not deleted. You may lack owner permission.');
        await refresh();
      }
      createNew();setMessage('Unpublished draft deleted.');
    }catch(e){setError(e.message||'Unable to delete draft.')}finally{setBusy(false)}
  }
  async function uploadImage(event) {
    const file=event.target.files?.[0];
    if(!file)return;
    event.target.value='';
    if(demoEnabled){setError('Image uploads are disabled in demo mode to protect live storage. You can still test a cover URL.');return;}
    if(!canWrite)return;
    const ext=BLOG_ALLOWED_IMAGES[file.type];
    if(!ext||file.size>BLOG_MAX_IMAGE_BYTES||file.size===0){
      setError('Upload a JPG, PNG or WebP image smaller than 5 MB. SVG and HTML are not allowed.');return;
    }
    setUploading(true);setError('');
    try{
      const name='covers/'+crypto.randomUUID()+'.'+ext;
      const response=await fetch(SB+'/storage/v1/object/'+OVEN_BUCKET+'/'+name,{
        method:'POST',headers:{apikey:OVEN_PUBLIC_KEY,Authorization:'Bearer '+session.access_token,
          'Content-Type':file.type,'x-upsert':'false','cache-control':'3600'},
        body:file
      });
      await parseResponse(response);
      update('cover_image_url',OVEN_PUBLIC_ASSETS+name);
      setMessage('Image uploaded. Save your post to link it to this story.');
    }catch(e){setError(e.message||'Image upload failed.')}finally{setUploading(false)}
  }
  const validation=validateBlogPost(draft,'published');
  const sorted=[...posts].sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  return <section className="panel oven-admin">
    <div className="oven-admin-head">
      <div><span className="eyebrow">THE OVEN / EDITORIAL</span><h2>Stories worth sharing.</h2><p>Write a journal post, save it privately, or publish when it's ready. Everything appears at <a href="/oven" target="_blank" rel="noreferrer">runmntl.com/oven ↗</a></p></div>
      {canWrite&&<button type="button" className="btn-main" onClick={createNew}><Plus size={17}/> New story</button>}
    </div>
    {demoEnabled&&<div className="oven-admin-banner">DEMO MODE — Practice editing and publishing fictional posts. Nothing here is sent to Supabase or the public blog.</div>}
    {error&&<div className="oven-admin-error" role="alert">{error}</div>}
    {message&&<div className="oven-admin-message" role="status">{message}</div>}
    <div className="oven-admin-layout">
      <div className="oven-admin-list">
        <div className="oven-admin-list-title"><strong>YOUR STORIES <span>{posts.length}</span></strong><button type="button" disabled={loading||demoEnabled} aria-label="Refresh stories" onClick={refresh}><RefreshCw size={16}/></button></div>
        {!loaded&&!demoEnabled&&<p className="oven-admin-hint">Loading stories…</p>}
        {loaded&&!posts.length&&<p className="oven-admin-hint">No stories yet. Start with your first kitchen note.</p>}
        {sorted.map(post=><button type="button" className={'oven-admin-list-item'+(draft.id===post.id?' is-active':'')} key={post.id} onClick={()=>choose(post)}>
          <Status status={post.status}/><strong>{post.title}</strong>
          <small>{post.slug} · {post.status==='published'?readableBlogDate(post.published_at):'Private draft'}</small>
        </button>)}
        <a className="oven-admin-public-link" href="/oven" target="_blank" rel="noopener noreferrer"><BookOpen size={16}/> Open public journal <ArrowRight size={14}/></a>
      </div>
      <div className="oven-admin-editor">
        <div className="oven-admin-editor-title"><div><span className="eyebrow">{draft.id?'EDIT STORY':'NEW STORY'}</span><h3>{draft.title||'Untitled story'}</h3></div><Status status={draft.status}/></div>
        <div className="oven-admin-editor-tabs">
          <button type="button" className={!preview?'is-active':''} onClick={()=>setPreview(false)}>EDIT</button>
          <button type="button" className={preview?'is-active':''} onClick={()=>setPreview(true)}><Eye size={15}/> PREVIEW</button>
        </div>
        {preview?<div className="oven-admin-preview"><span>{draft.category||'Journal'} · {draft.status==='published'?'Published':'Private preview'}</span>
          {draft.cover_image_url&&safeHttpsImageUrl(draft.cover_image_url)&&<img src={draft.cover_image_url} alt="Story preview" onError={e=>{e.currentTarget.style.display='none'}}/>}
          <h2>{draft.title||'Story title'}</h2><p className="oven-admin-preview-excerpt">{draft.excerpt||'Your short introduction will appear here.'}</p><StoryBody body={draft.body||'Start writing to see a preview.'}/></div>:
        <div className="oven-admin-form">
          <div className="oven-admin-row"><label>Title <input type="text" maxLength={150} value={draft.title} disabled={!canWrite} placeholder="Why we bake slowly" onChange={e=>{
            const value=e.target.value;
            setDraft(prev=>({...prev,title:value,slug:!prev.id&&(!prev.slug||prev.slug===normalizeSlug(prev.title))?normalizeSlug(value):prev.slug}));
          }}/></label>
          <label>Category <select value={draft.category} disabled={!canWrite} onChange={e=>update('category',e.target.value)}>
            {['Journal','Behind the bake','Bread notes','Recipes','Community','Studio notes'].concat(
              draft.category&&!['Journal','Behind the bake','Bread notes','Recipes','Community','Studio notes'].includes(draft.category)?[draft.category]:[]
            ).map(x=><option key={x} value={x}>{x}</option>)}
          </select></label></div>
          <label>Article URL <div className="oven-admin-slug"><span>runmntl.com/oven/</span><input type="text" value={draft.slug} maxLength={90} disabled={!canWrite} placeholder="why-we-bake-slowly" onChange={e=>update('slug',normalizeSlug(e.target.value))}/></div></label>
          <label>Short excerpt <textarea rows={3} maxLength={350} disabled={!canWrite} placeholder="A short introduction for the blog cards and search results…" value={draft.excerpt} onChange={e=>update('excerpt',e.target.value)}/></label>
          <label>Story body <span className="oven-admin-field-note">Use blank lines between paragraphs, # for headings, - for bullet lists, **bold** and [label](https://example.com) for links. HTML is not rendered.</span>
            <textarea className="oven-admin-body" rows={15} maxLength={60000} disabled={!canWrite} placeholder={'Good bread takes time.\n\n## The first batch\n\nTell the story behind the loaf…'} value={draft.body} onChange={e=>update('body',e.target.value)}/>
          </label>
          <label>Cover image URL <input type="url" disabled={!canWrite} placeholder="https://…" value={draft.cover_image_url} onChange={e=>update('cover_image_url',e.target.value)}/></label>
          {canWrite&&<label className="oven-admin-upload"><ImagePlus size={18}/> {uploading?'UPLOADING IMAGE…':'OR UPLOAD A COVER PHOTO (JPG, PNG, WEBP · MAX 5 MB)'}
            <input type="file" disabled={busy||uploading} accept="image/jpeg,image/png,image/webp" onChange={uploadImage}/>
          </label>}
          <p className="oven-admin-hint">If no cover is provided, your post uses MNTL's locally hosted sourdough photo. Images uploaded to the real blog are public assets.</p>
        </div>}
        {canWrite&&<div className="oven-admin-actions">
          <button type="button" className="btn-outline" disabled={busy||uploading} onClick={()=>save('draft')}><Save size={16}/> Save draft</button>
          <button type="button" className="btn-main" disabled={busy||uploading||validation.length>0} title={validation.length?validation.join(' '):'Publish to the website'} onClick={()=>save('published')}><CheckCircle2 size={16}/> {draft.status==='published'?'Update live story':'Publish story'}</button>
          {draft.status==='published'&&<button type="button" className="btn-outline" disabled={busy||uploading} onClick={()=>save('draft')}>Unpublish</button>}
          {role==='owner'&&draft.id&&draft.status==='draft'&&<button type="button" className="oven-admin-delete" disabled={busy||uploading} onClick={removeDraft}><Trash2 size={16}/> Delete draft</button>}
        </div>}
        {!canWrite&&<p className="oven-admin-hint">You can review articles, but only owners and bakers can edit or publish them.</p>}
        {draft.status==='published'&&draft.slug&&<a className="oven-admin-public-link" href={'/oven/'+draft.slug} rel="noopener noreferrer" target="_blank">VIEW LIVE POST <ArrowRight size={14}/></a>}
      </div>
    </div>
  </section>;
}
