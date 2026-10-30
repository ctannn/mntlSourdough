import React,{useEffect,useRef,useState} from 'react';
import {MapPin} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './OpenStreetAddressPicker.css';
// A map-pin fallback that needs no geocoding API. Address text is separately
// entered by the customer; map coordinates are NOT proof of deliverability.
export function OpenStreetAddressPicker({value,onChange}) {
  const element=useRef(null),map=useRef(null),marker=useRef(null),notify=useRef(onChange);
  const [message,setMessage]=useState('Tap the map or drag the pin to mark your delivery entrance.');
  useEffect(()=>{notify.current=onChange},[onChange]);
  useEffect(()=>{
    let active=true,intersection;
    async function initialize(){
      if(map.current||!element.current)return;
      const {default:L}=await import('leaflet');
      if(!active||!element.current)return;
      const start=value?.location ? [value.location.lat,value.location.lon] : [51.0447,-114.0719];
      const instance=L.map(element.current,{scrollWheelZoom:false,zoomControl:true}).setView(start,value?.location?16:11);
      map.current=instance;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
      }).addTo(instance);
      const customIcon=L.divIcon({className:'mntl-openstreet-pin',html:'<span aria-hidden="true">⌂</span>',iconSize:[34,40],iconAnchor:[17,37]});
      const pin=L.marker(start,{draggable:true,title:'Delivery entrance pin',icon:customIcon}).addTo(instance);
      marker.current=pin;
      function update(coords){
        const lat=Number(coords.lat),lon=Number(coords.lng);
        if(!Number.isFinite(lat)||!Number.isFinite(lon))return;
        if(lat<50.82||lat>51.25||lon<-114.35||lon>-113.75){
          setMessage('This preview is for Calgary addresses. Move the pin back into Calgary.');
          return;
        }
        pin.setLatLng([lat,lon]);
        notify.current({location:{lat:Number(lat.toFixed(6)),lon:Number(lon.toFixed(6))},pinAdjusted:true});
        setMessage('Entrance pin saved. Please type the matching street address below.');
      }
      instance.on('click',event=>update(event.latlng));
      pin.on('dragend',()=>update(pin.getLatLng()));
      requestAnimationFrame(()=>instance.invalidateSize());
    }
    // Avoid downloading map tiles until the selector approaches the viewport.
    if(typeof IntersectionObserver!=='undefined'){
      intersection=new IntersectionObserver(entries=>{
        if(entries.some(e=>e.isIntersecting)){intersection?.disconnect();initialize().catch(()=>setMessage('Map unavailable; please enter your address manually.'))}
      },{rootMargin:'280px'});
      if(element.current)intersection.observe(element.current);
    } else initialize().catch(()=>setMessage('Map unavailable; please enter your address manually.'));
    return()=>{active=false;intersection?.disconnect();map.current?.remove();map.current=null;marker.current=null};
  },[]);
  useEffect(()=>{
    const p=value?.location;if(!p||!map.current||!marker.current)return;
    const next=[p.lat,p.lon];marker.current.setLatLng(next);
    map.current.panTo(next);
  },[value?.location?.lat,value?.location?.lon]);
  return <div className="mntl-openstreet-wrap">
    <div className="mntl-openstreet-map" ref={element} aria-label="Calgary map. Click to select or drag the entrance pin."/>
    <p role="status" className="mntl-openstreet-helper"><MapPin size={15}/>{message}</p>
  </div>;
}
