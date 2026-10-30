import React, {useEffect, useRef, useState} from 'react';
import {MapPin, AlertCircle} from 'lucide-react';
import './GoogleAddressPicker.css';

// This is a PUBLIC browser key. Restrict it in Google Cloud by exact HTTPS
// referrers and Maps JavaScript API / Places API (New). Never use a server secret.
const KEY=import.meta.env.VITE_GOOGLE_MAPS_JS_KEY;
let loader;
function loadGoogle() {
  if (typeof window==='undefined'||!KEY) return Promise.reject(new Error('Google Maps is not configured'));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google);
  if (loader) return loader;
  loader = new Promise((resolve,reject)=>{
    const callback='__mntlMapsReady';
    let timeout;
    window[callback]=()=>{clearTimeout(timeout);delete window[callback];resolve(window.google)};
    const script=document.createElement('script');
    script.async=true;
    script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(KEY)+'&v=weekly&loading=async&callback='+callback;
    script.onerror=()=>{clearTimeout(timeout);delete window[callback];loader=null;reject(new Error('Could not load the map'))};
    timeout=window.setTimeout(()=>{delete window[callback];loader=null;reject(new Error('Map request timed out'))},15000);
    document.head.appendChild(script);
  });
  return loader;
}
const insideCalgary=(lat,lng)=>lat>=50.82&&lat<=51.25&&lng>=-114.35&&lng<=-113.75;
export function GoogleAddressPicker({value, onChange}) {
  const searchRef=useRef(null), mapRef=useRef(null), mapObj=useRef(null), markerObj=useRef(null);
  const changeRef=useRef(onChange);
  const [status,setStatus]=useState('loading'),[message,setMessage]=useState('');
  useEffect(()=>{changeRef.current=onChange},[onChange]);
  useEffect(()=>{
    let active=true;
    let autocomplete,selectListener,clickListener,dragListener;
    async function init() {
      try {
        const google=await loadGoogle();
        const [{PlaceAutocompleteElement}]=await Promise.all([google.maps.importLibrary('places'),google.maps.importLibrary('maps'),google.maps.importLibrary('marker')]);
        if(!active||!searchRef.current||!mapRef.current)return;
        const map=new google.maps.Map(mapRef.current,{
          center:{lat:51.0447,lng:-114.0719},zoom:11,mapTypeControl:false,
          streetViewControl:false,fullscreenControl:false,gestureHandling:'cooperative',
          restriction:{latLngBounds:{north:51.30,south:50.76,west:-114.45,east:-113.66},strictBounds:false}
        });
        mapObj.current=map;
        // Classic marker remains supported, and doesn't require a Cloud map ID.
        const marker=new google.maps.Marker({map,draggable:true,title:'Delivery entrance pin — drag to adjust'});
        marker.setVisible(false);
        markerObj.current=marker;
        autocomplete=new PlaceAutocompleteElement();
        autocomplete.placeholder='Search for your Calgary home';
        autocomplete.setAttribute('aria-label','Search Calgary home address');
        searchRef.current.appendChild(autocomplete);
        async function selected(event) {
          try{
            setMessage('');
            const place=event.placePrediction?.toPlace();
            if(!place) return;
            await place.fetchFields({fields:['formattedAddress','location','id']});
            if(!active||!place.location)return;
            const point=place.location.toJSON();
            if(!insideCalgary(point.lat,point.lng)||!/(Calgary|Tsuut)/i.test(place.formattedAddress||'')){
              setMessage('Choose a Calgary address. We will confirm the delivery zone before payment.');
              return;
            }
            map.panTo(point);map.setZoom(17);marker.setPosition(point);marker.setVisible(true);
            changeRef.current({address:place.formattedAddress,location:{lat:point.lat,lon:point.lng},placeId:place.id||null,pinAdjusted:false});
          }catch{if(active)setMessage('Could not read that address. Try another suggestion.')}
        }
        selectListener=selected;autocomplete.addEventListener('gmp-select',selected);
        clickListener=map.addListener('click',event=>{
          if(!event.latLng)return;
          const p=event.latLng.toJSON();
          if(!insideCalgary(p.lat,p.lng)){setMessage('That pin is outside the Calgary preview area.');return;}
          marker.setPosition(p);marker.setVisible(true);
          changeRef.current({location:{lat:p.lat,lon:p.lng},pinAdjusted:true});
          setMessage('Pin adjusted. Please verify your street address and delivery entrance.');
        });
        dragListener=marker.addListener('dragend',()=>{
          const p=marker.getPosition()?.toJSON();if(!p)return;
          if(!insideCalgary(p.lat,p.lng)){setMessage('Please keep your pin within Calgary.');return;}
          changeRef.current({location:{lat:p.lat,lon:p.lng},pinAdjusted:true});
          setMessage('Pin adjusted. Please verify your street address and delivery entrance.');
        });
        setStatus('ready');
      }catch(e){if(active){setStatus('error');setMessage(e.message||'Map unavailable');}}
    }
    init();
    return ()=>{
      active=false;
      if(autocomplete&&selectListener)autocomplete.removeEventListener('gmp-select',selectListener);
      clickListener?.remove();dragListener?.remove();
      if(autocomplete?.parentNode)autocomplete.parentNode.removeChild(autocomplete);
      markerObj.current?.setMap(null);
      markerObj.current=null;mapObj.current=null;
    };
  },[]);
  useEffect(()=>{
    const p=value?.location;
    if(!p||!mapObj.current||!markerObj.current||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return;
    const point={lat:p.lat,lng:p.lon};
    markerObj.current.setPosition(point);markerObj.current.setVisible(true);
    mapObj.current.panTo(point);mapObj.current.setZoom(16);
  },[value?.location?.lat,value?.location?.lon]);
  return <div className="mntl-places">
    <div className="mntl-places-search" ref={searchRef}>{status==='loading'&&<p>Loading address search…</p>}</div>
    <div className="mntl-places-canvas" ref={mapRef} aria-label="Interactive Calgary map, click or drag pin to mark delivery entrance" role="application"/>
    {message&&<p className="mntl-places-alert" role="status"><AlertCircle size={16}/> {message}</p>}
    {status==='ready'&&<p className="mntl-places-help"><MapPin size={15}/> Select an address above, then drag the pin or click the map to choose the entrance.</p>}
    {status==='error'&&<p className="mntl-places-help">The map is unavailable. Enter your address in the field below instead.</p>}
  </div>;
}
