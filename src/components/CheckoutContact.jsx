import React,{useState} from 'react';
import {ArrowUpRight,LockKeyhole,Mail,ShieldCheck} from 'lucide-react';
import './CheckoutContact.css';
import {validCadence} from '../lib/scheduling.mjs';
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function CheckoutContact({cart,mode,fulfillment,preference,availability,checkoutStatus,onInquiry}) {
  const [details,setDetails]=useState({firstName:'',lastName:'',email:'',phone:''});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const set=(key,val)=>setDetails(p=>({...p,[key]:val}));
  const bakeDate=availability?.dates?.find(x=>x.date===preference.date);
  const canPay=Boolean(checkoutStatus?.paymentEnabled &&
    mode==='one-time' && fulfillment==='pickup' &&
    bakeDate?.bookable && cart.length>0 && cart.every(item=>item.frequency==='one-time'));
  const hasDate=Boolean(preference.date);
  const hasAddress=fulfillment!=='delivery'||(preference.address||'').trim().length>=6;
  const validRhythm=mode!=='subscription'||validCadence(preference.frequency,{interval:Number(preference.customInterval||0),unit:preference.customUnit||'days'});
  const canSend=cart.length>0&&hasDate&&hasAddress&&validRhythm;
  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if(!canSend){setMessage(!validRhythm?'Choose a valid custom Bread Club interval.':'Choose your first bake date and add a loaf'+(fulfillment==='delivery'?' and delivery address':'')+'.');return;}
    if(!details.firstName.trim()||!details.lastName.trim()||!validEmail(details.email.trim())) {
      setMessage('Enter your name and valid email address.');return;
    }
    if(!canPay){onInquiry(details);return;}
    setBusy(true);
    try{
      const response=await fetch('/api/checkout',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          mode:'one-time',fulfillment:'pickup',date:preference.date,
          firstName:details.firstName,lastName:details.lastName,
          email:details.email,phone:details.phone,
          items:cart.map(item=>({id:item.id,qty:item.qty}))
        })
      });
      const result=await response.json();
      if(!response.ok||!result.checkoutUrl)throw new Error(result.error||'Checkout is temporarily unavailable.');
      const next=new URL(result.checkoutUrl);
      if(next.protocol!=='https:'||!(next.hostname==='checkout.stripe.com'||next.hostname.endsWith('.checkout.stripe.com')))
        throw new Error('Unexpected payment destination.');
      window.location.assign(next.href);
    }catch(e){setMessage(e.message||'Checkout unavailable. No order was placed.');setBusy(false);}
  }
  return <form className="mntl-contact" onSubmit={submit}>
    <div className="mntl-contact-heading"><span>FINAL STEP — YOUR DETAILS</span>{canPay?<LockKeyhole size={16}/>:<Mail size={16}/>}</div>
    <div className="mntl-contact-fields">
      <label><span>First name</span><input name="given-name" autoComplete="given-name" value={details.firstName} onChange={e=>set('firstName',e.target.value)} maxLength={120} required placeholder="First name"/></label>
      <label><span>Last name</span><input name="family-name" autoComplete="family-name" value={details.lastName} onChange={e=>set('lastName',e.target.value)} maxLength={120} required placeholder="Last name"/></label>
      <label className="mntl-contact-wide"><span>Email address</span><input name="email" type="email" autoComplete="email" value={details.email} onChange={e=>set('email',e.target.value)} maxLength={320} required placeholder="you@example.com"/></label>
      <label className="mntl-contact-wide"><span>Phone <small>(optional)</small></span><input name="tel" autoComplete="tel" type="tel" value={details.phone} onChange={e=>set('phone',e.target.value)} maxLength={60} placeholder="(403) 555-0123"/></label>
    </div>
    {message&&<div className="mntl-contact-message" role="alert">{message}</div>}
    {!hasDate&&<p className="mntl-contact-helper">Select a preferred bake date in the planner first.</p>}
    {!validRhythm&&<p className="mntl-contact-helper">Choose a valid Bread Club rhythm before sending your inquiry.</p>}
    {fulfillment==='delivery'&&!hasAddress&&<p className="mntl-contact-helper">Enter your delivery address in the planner first.</p>}
    <button className="btn dark full" type="submit" disabled={!canSend||busy}>
      {busy?'OPENING SECURE CHECKOUT…':canPay?'CONTINUE TO SECURE CHECKOUT':'EMAIL ORDER INQUIRY'} <ArrowUpRight size={17}/>
    </button>
    <p className="mntl-contact-assurance"><ShieldCheck size={16}/> {canPay?
      'Secure payment powered by Stripe. Orders are confirmed only after successful payment and webhook processing.':
      'Your inquiry opens in your email app. No payment or subscription will begin.'}</p>
    {mode==='subscription'&&<p className="mntl-contact-helper">Bread Club recurring billing is not active yet. We will confirm your requested schedule before starting a subscription.</p>}
    {fulfillment==='delivery'&&<p className="mntl-contact-helper">Delivery zones, charges and dates must be confirmed before purchase.</p>}
  </form>;
}
