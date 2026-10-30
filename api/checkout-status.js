import {allowMethod,paymentReady,reply} from '../server/mntlDb.mjs';
export default function handler(req,res){
  if(!allowMethod(req,res,'GET'))return;
  const pickupConfigured=Boolean(process.env.MNTL_PICKUP_ENABLED==='true' && process.env.MNTL_PICKUP_ADDRESS?.trim());
  reply(res,200,{
    paymentEnabled:paymentReady(),
    subscriptionPaymentsEnabled:false,
    deliveryPaymentsEnabled:false,
    pickupConfigured,
    pickupAddress:pickupConfigured?process.env.MNTL_PICKUP_ADDRESS:null,
    pickupInstructions:pickupConfigured?(process.env.MNTL_PICKUP_INSTRUCTIONS||''):null,
    currency:'CAD',
    message:paymentReady()?'One-time pickup checkout is available; verify selected bake dates.':'Orders remain inquiries until payment and bakery operations are configured.'
  });
}
