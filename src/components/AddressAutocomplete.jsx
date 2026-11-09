import React,{useEffect,useId,useRef,useState} from 'react';
import {MapPin,Search} from 'lucide-react';
import './AddressAutocomplete.css';

// Controlled address value: choosing a Photon suggestion also sets the
// delivery location, so the existing Leaflet marker follows automatically.
// Manual edits clear stale coordinates, never silently retaining the old pin.
export function AddressAutocomplete({value='',onChange,onSelect}){
  const id=useId(),inputRef=useRef(null),abortRef=useRef(null),selectedRef=useRef('');
  const [focused,setFocused]=useState(false);
  const [suggestions,setSuggestions]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [error,setError]=useState('');
  const [active,setActive]=useState(-1);
  const text=String(value||''),query=text.trim();
  useEffect(()=>{
    if(!focused||query.length<4||text===selectedRef.current){
      abortRef.current?.abort();
      setSuggestions([]);setLoading(false);setSearched(false);setError('');setActive(-1);
      return;
    }
    const controller=new AbortController();
    abortRef.current?.abort();
    abortRef.current=controller;
    setSuggestions([]);setActive(-1);setSearched(false);setError('');
    setLoading(false);
    const timer=window.setTimeout(async()=>{
      setLoading(true);
      try{
        const response=await fetch('/api/address-suggest?q='+encodeURIComponent(query),{
          signal:controller.signal,headers:{Accept:'application/json'},cache:'no-store'
        });
        const data=await response.json();
        if(!response.ok)throw Error(data?.message||'Address suggestions are unavailable.');
        if(controller.signal.aborted)return;
        setSuggestions(Array.isArray(data.suggestions)?data.suggestions:[]);
        setSearched(true);setError('');
      }catch(e){
        if(controller.signal.aborted)return;
        setSuggestions([]);setSearched(false);
        setError('Suggestions unavailable. You can still enter your address manually.');
      }finally{
        if(!controller.signal.aborted)setLoading(false);
      }
    },475);
    return()=>{window.clearTimeout(timer);controller.abort()};
  },[text,focused]);
  function choose(suggestion){
    abortRef.current?.abort();
    selectedRef.current=suggestion.label;
    setFocused(false);setSuggestions([]);setLoading(false);setError('');setSearched(false);
    onSelect(suggestion);
    inputRef.current?.focus({preventScroll:true});
  }
  const visible=focused&&query.length>=4&&text!==selectedRef.current
    &&(suggestions.length>0||loading||error||searched);
  function keyDown(event){
    if(event.key==='Escape'){setFocused(false);setActive(-1);return;}
    if(!suggestions.length||!visible)return;
    if(event.key==='ArrowDown'){event.preventDefault();setActive(n=>(n+1)%suggestions.length);}
    if(event.key==='ArrowUp'){event.preventDefault();setActive(n=>n<=0?suggestions.length-1:n-1);}
    if(event.key==='Enter'&&active>=0){event.preventDefault();choose(suggestions[active]);}
  }
  return <div className="mntl-address-autocomplete">
    <label className="mntl-address-label" htmlFor={id}>Delivery street address</label>
    <div className="mntl-address-input-shell">
      <Search size={17} aria-hidden="true"/>
      <input ref={inputRef} id={id} type="text" value={text}
        placeholder="Start typing your Calgary street address"
        autoComplete="off" autoCorrect="off" spellCheck={false}
        role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
        aria-expanded={visible} aria-controls={visible?id+'-results':undefined}
        aria-activedescendant={visible&&active>=0?id+'-option-'+active:undefined}
        onFocus={()=>setFocused(true)}
        onBlur={()=>window.setTimeout(()=>setFocused(false),150)}
        onKeyDown={keyDown}
        onChange={e=>{
          selectedRef.current='';
          abortRef.current?.abort();
          setActive(-1);setFocused(true);
          onChange(e.target.value);
        }}/>
      {loading&&<span className="mntl-address-loading" role="status">Searching…</span>}
    </div>
    {visible&&<div id={id+'-results'} role="listbox" className="mntl-address-suggestions"
      aria-label="Suggested Calgary street addresses">
      {suggestions.map((item,index)=><button key={item.id} id={id+'-option-'+index}
        type="button" role="option" aria-selected={index===active}
        className={index===active?'is-active':''}
        onMouseDown={e=>e.preventDefault()}
        onClick={()=>choose(item)}><MapPin size={16} aria-hidden="true"/><span>{item.label}</span></button>)}
      {!suggestions.length&&(loading?<div className="mntl-address-feedback">Looking up Calgary addresses…</div>
        :error?<div className="mntl-address-feedback" role="status">{error}</div>
        :searched?<div className="mntl-address-feedback">No exact addresses found. Try a street number and road name, or enter the address yourself.</div>
        :null)}
    </div>}
    <p className="mntl-address-guidance">Choose a suggested address to position the map pin, or enter it manually. Verify your building and unit number.</p>
    <p className="mntl-address-attribution">Address suggestions © OpenStreetMap contributors · Powered by Photon. Search text is sent to the lookup provider.</p>
  </div>;
}
