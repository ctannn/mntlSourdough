import Stripe from 'stripe';
import {allowMethod,paymentReady,database,reply} from '../server/mntlDb.mjs';
import {isCustomerBakeDateAllowed} from '../src/lib/scheduling.mjs';
const PRODUCT_NAMES={classic:'The Original',seed:'The Seeded',olive:'The Weekend Loaf'};
const safeEmail=value=>typeof value==='string'&&value.length<=320&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validDate=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;};
const clean=value=>typeof value==='string'?value.trim():'';
const abortHold=async id=>{
  await database('/rest/v1/checkout_holds?id=eq.'+encodeURIComponent(id),{
    method:'PATCH',body:{status:'expired'},headers:{Prefer:'return=minimal'}
  }).catch(()=>{});
};
export default async function handler(req,res) {
  if(!allowMethod(req,res,'POST'))return;
  if(!paymentReady())return reply(res,503,{error:'Online payment has not yet opened. Please send an order inquiry.'});
  const input=typeof req.body==='object'&&req.body?req.body:{};
  const firstName=clean(input.firstName),lastName=clean(input.lastName),email=clean(input.email).toLowerCase();
  const date=input.date,lines=Array.isArray(input.items)?input.items:null;
  if(input.mode!=='one-time'||input.fulfillment!=='pickup')
    return reply(res,422,{error:'Online checkout currently supports one-time pickup only.'});
  if(firstName.length<1||firstName.length>120||lastName.length<1||lastName.length>120||!safeEmail(email)||!validDate(date))
    return reply(res,422,{error:'Enter your name, email and a valid bake date.'});
  if(!isCustomerBakeDateAllowed(date,new Date()))
    return reply(res,422,{error:'Same-day orders are unavailable. Tomorrow closes at 6 PM Calgary time. Choose a later bake date.'});
  if(!lines||!lines.length||lines.length>12||lines.some(x=>!PRODUCT_NAMES[x.id]||!Number.isInteger(x.qty)||x.qty<1||x.qty>20))
    return reply(res,422,{error:'Please check your loaf quantities.'});
  if(lines.reduce((total,x)=>total+x.qty,0)>50)
    return reply(res,422,{error:'Maximum 50 loaves per order.'});
  let holdId, createdSession;
  try{
    const days=await database('/rest/v1/bake_days?select=id,bake_date,cutoff_at&bake_date=eq.'+encodeURIComponent(date)+'&status=eq.open&limit=1');
    if(days?.length!==1||!days[0]?.cutoff_at||Date.parse(days[0].cutoff_at)<=Date.now())return reply(res,409,{error:'That bake date is closed or past its cutoff. Please choose another.'});
    const products=await database('/rest/v1/products?select=id,name,price_cents&active=eq.true&limit=100');
    const byName=new Map((products||[]).map(p=>[p.name,p]));
    const cart=lines.map(x=>({product_id:byName.get(PRODUCT_NAMES[x.id])?.id,quantity:x.qty}));
    if(cart.some(x=>!x.product_id))return reply(res,409,{error:'A selected loaf is currently unavailable.'});
    const holds=await database('/rest/v1/rpc/reserve_checkout',{
      method:'POST',body:{
        p_bake_day_id:days[0].id,p_items:cart,
        p_first_name:firstName,p_last_name:lastName,p_email:email,
        p_phone:clean(input.phone).slice(0,60),
        p_fulfillment_type:'pickup',p_fulfillment_window:null,
        p_delivery_address:null,p_delivery_notes:null
      }
    });
    if(!holds?.[0]?.hold_id)throw new Error('Could not reserve capacity');
    holdId=holds[0].hold_id;
    const actual=await database('/rest/v1/checkout_holds?select=items,total_cents,status&'+'id=eq.'+encodeURIComponent(holdId)+'&limit=1');
    const snap=actual?.[0];
    if(!snap||snap.status!=='pending'||!Number.isInteger(snap.total_cents)||snap.total_cents<100)
      throw new Error('Invalid reservation');
    const itemTotal=snap.items.reduce((sum,x)=>sum+x.quantity*x.unit_price_cents,0);
    if(itemTotal!==snap.total_cents||itemTotal!==holds[0].amount_cents)throw new Error('Reservation total mismatch');
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin=process.env.MNTL_SITE_URL?.startsWith('https://')?process.env.MNTL_SITE_URL.replace(/\/$/,''):'https://runmntl.com';
    const session=await stripe.checkout.sessions.create({
      mode:'payment',payment_method_types:['card'],currency:'cad',
      customer_email:email,client_reference_id:holdId,
      line_items:snap.items.map(x=>({
        price_data:{currency:'cad',unit_amount:x.unit_price_cents,product_data:{name:x.name||'MNTL sourdough'}},
        quantity:x.quantity
      })),
      metadata:{hold_id:holdId,bake_date:date,fulfillment_type:'pickup'},
      success_url:origin+'/?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url:origin+'/?checkout=cancelled',
      expires_at:Math.floor(Date.now()/1000)+30*60
    },{idempotencyKey:'mntl_checkout_'+holdId});
    if(!session?.url||!session.id)throw new Error('Payment provider could not create checkout');
    createdSession=session.id;
    await database('/rest/v1/checkout_holds?id=eq.'+encodeURIComponent(holdId),{
      method:'PATCH',body:{stripe_checkout_session_id:session.id},headers:{Prefer:'return=minimal'}
    });
    return reply(res,200,{checkoutUrl:session.url});
  }catch(error){
    // If a payment session was created but assignment failed, the hold is
    // canceled; Stripe session expiry/reconciliation must still be monitored.
    if(createdSession){try{const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);await stripe.checkout.sessions.expire(createdSession);}catch{console.error('Manual reconciliation may be needed for checkout session',createdSession);}}
    if(holdId)await abortHold(holdId);
    console.error('MNTL checkout could not start:',error?.status||error?.type||'internal');
    if(error?.details?.includes('Not enough loaves')||error?.details?.includes('Bake day unavailable'))
      return reply(res,409,{error:'This bake is full or past its cutoff. Please choose another.'});
    return reply(res,503,{error:'Checkout is temporarily unavailable. No order has been placed.'});
  }
}
