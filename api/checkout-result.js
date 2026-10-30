import Stripe from 'stripe';
import {allowMethod,database,databaseConfigured,reply} from '../server/mntlDb.mjs';
export default async function handler(req,res) {
  if(!allowMethod(req,res,'GET'))return;
  const id=typeof req.query?.session_id==='string'?req.query.session_id:'';
  if(!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(id)||id.length>180)
    return reply(res,422,{state:'invalid'});
  if(!process.env.STRIPE_SECRET_KEY||!databaseConfigured())return reply(res,503,{state:'unavailable'});
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const session=await stripe.checkout.sessions.retrieve(id);
    if(session.mode!=='payment'||session.currency!=='cad'||session.metadata?.hold_id!==session.client_reference_id)
      return reply(res,422,{state:'invalid'});
    if(session.payment_status!=='paid')return reply(res,200,{state:'not_paid'});
    const rows=await database('/rest/v1/orders?select=id,payment_status&stripe_checkout_session_id=eq.'+encodeURIComponent(id)+'&limit=1');
    return reply(res,200,{state:rows?.[0]?.payment_status==='paid'?'confirmed':'processing'});
  }catch(error){
    console.error('MNTL checkout status unavailable:',error?.status||error?.type||'unknown');
    return reply(res,503,{state:'unavailable'});
  }
}
