import React,{useEffect,useState} from 'react';
import {CheckCircle2,Clock3,Info,X} from 'lucide-react';
import './CheckoutReturn.css';
export function CheckoutReturn() {
  const [result,setResult]=useState(null);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const flow=params.get('checkout');
    if(!flow)return;
    const id=params.get('session_id');
    // Remove the opaque Stripe ID from the address bar after reading it.
    window.history.replaceState({},'',window.location.pathname+window.location.hash);
    if(flow==='cancelled'){setResult({state:'cancelled'});return;}
    if(flow!=='success'||!id){setResult({state:'unknown'});return;}
    let active=true;
    setResult({state:'loading'});
    fetch('/api/checkout-result?session_id='+encodeURIComponent(id),{cache:'no-store'})
      .then(async r=>{const data=await r.json();if(!r.ok&&data.state!=='unavailable')throw new Error('Unable to verify');return data})
      .then(data=>{if(active)setResult(data)})
      .catch(()=>{if(active)setResult({state:'unavailable'})});
    return()=>{active=false};
  },[]);
  if(!result)return null;
  const status=result.state;
  const success=status==='confirmed';
  const content={
    loading:['Checking your payment…','We are verifying the checkout result.'],
    confirmed:['Your order is confirmed','Payment and bakery order have been verified. Look out for the fulfillment confirmation.'],
    processing:['Payment received — confirming your bake','Your payment provider reports a paid checkout. We are finalizing the bakery order; please keep your payment receipt.'],
    not_paid:['Payment is not complete','Your checkout has not been marked paid. Please contact us if you believe this is incorrect.'],
    cancelled:['Checkout not completed','Your bag is still here if you would like to try again.'],
    unavailable:['Verification temporarily unavailable','Please check your Stripe receipt and contact the bakery before attempting a second payment.'],
    unknown:['We could not identify that checkout','Please return to your bag or contact the bakery.'],
    invalid:['Checkout reference unavailable','Please contact the bakery if you require help.']
  }[status]||['Checkout update','Please contact the bakery if you require help.'];
  return <section className="mntl-checkout-return" role="status" aria-live="polite">
    <div className="mntl-return-icon">{success?<CheckCircle2/>:status==='processing'||status==='loading'?<Clock3/>:<Info/>}</div>
    <div><strong>{content[0]}</strong><p>{content[1]}</p></div>
    <button type="button" onClick={()=>setResult(null)} aria-label="Dismiss checkout notice"><X size={18}/></button>
  </section>;
}
