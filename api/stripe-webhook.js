import Stripe from 'stripe';
import {database,reply} from '../server/mntlDb.mjs';
// Preserve raw bytes: JSON.parse/stringify breaks Stripe signature verification.
export const config={api:{bodyParser:false}};
async function rawRequestBody(req) {
  if(Buffer.isBuffer(req.body))return req.body;
  if(typeof req.body==='string')return Buffer.from(req.body);
  const chunks=[];let size=0;
  for await(const chunk of req) {
    const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=buffer.length;
    if(size>1024*1024)throw new Error('Webhook payload too large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
export default async function handler(req,res) {
  if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
  if(!process.env.STRIPE_WEBHOOK_SECRET||!process.env.STRIPE_SECRET_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return reply(res,503,{error:'Webhook not configured'});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try{
    const payload=await rawRequestBody(req);
    event=stripe.webhooks.constructEvent(payload,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);
  }catch{
    return reply(res,400,{error:'Invalid Stripe webhook signature'});
  }
  if(event.livemode!==process.env.STRIPE_SECRET_KEY.startsWith('sk_live_'))
    return reply(res,400,{error:'Payment environment mismatch'});
  if(event.type!=='checkout.session.completed')return reply(res,200,{received:true,ignored:true});
  const session=event.data.object;
  if(session.mode!=='payment'||session.payment_status!=='paid'||session.currency!=='cad')return reply(res,200,{received:true,ignored:true});
  const holdId=session.metadata?.hold_id;
  if(!holdId||!/^[-a-f0-9]{36}$/i.test(holdId)||session.client_reference_id!==holdId)
    return reply(res,400,{error:'Invalid checkout reference'});
  if(!Number.isInteger(session.amount_total)||session.amount_total<100)
    return reply(res,400,{error:'Invalid checkout amount'});
  try{
    const result=await database('/rest/v1/rpc/fulfill_checkout',{
      method:'POST',
      body:{
        p_hold_id:holdId,
        p_session_id:session.id,
        p_payment_intent:typeof session.payment_intent==='string'?session.payment_intent:'',
        p_paid_cents:session.amount_total,
        p_event_id:event.id
      }
    });
    return reply(res,200,{received:true,orderRecorded:Boolean(result)});
  }catch(error){
    // Non-2xx lets Stripe retry. Do not mark invoice/order paid from the browser.
    console.error('MNTL webhook reconciliation requires retry:',event.id,error?.status||'database');
    return reply(res,500,{error:'Could not reconcile the paid session'});
  }
}
