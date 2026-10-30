import React,{useEffect,useRef} from 'react';
import {ArrowLeft,ArrowRight,CalendarDays,ClipboardList,Mail,MapPin,Phone,Repeat2,ShoppingBag,UserRound,ShieldCheck,Truck,X,Clock3} from 'lucide-react';
import './recordInspector.css';

function displayName(c) {
  return [c?.first_name,c?.last_name].filter(Boolean).join(' ') || c?.full_name || 'Unknown customer';
}
function money(cents) {
  return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format((cents||0)/100);
}
function dayLabel(value) {
  if(!value)return 'No date';
  return new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})
    .format(new Date(value.slice(0,10)+'T12:00:00Z'));
}
function addressFor(customer,orders) {
  const preferred=[
    customer?.address_line1,customer?.address_line2,customer?.city,
    customer?.province,customer?.postal_code
  ].filter(Boolean).join(', ');
  if(preferred)return {text:preferred,label:'Saved customer address'};
  const lastDelivery=orders.filter(o=>o.fulfillment_type==='delivery'&&o.delivery_address)
    .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0];
  return lastDelivery
    ? {text:lastDelivery.delivery_address,label:'Last delivery address on an order'}
    : {text:'No delivery address on file',label:'No saved address'};
}

function Section({heading,children}) {
  return <section className="inspector-section"><h3>{heading}</h3>{children}</section>;
}

function DetailLine({label,children}) {
  return <div className="inspector-detail"><span>{label}</span><strong>{children||'—'}</strong></div>;
}

function CustomerView({customer,orders,products,subscriptions,subscriptionItems,dietaryNote,canSeeDietary,onOpenOrder,onViewOrders,onEdit}) {
  const related=orders.filter(o=>o.customer_id===customer.id)
    .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  const confirmed=related.filter(o=>o.payment_status==='paid'&&o.status!=='cancelled');
  const customerSubscriptions=subscriptions.filter(s=>s.customer_id===customer.id);
  const active=customerSubscriptions.filter(s=>s.status==='active');
  const address=addressFor(customer,related);
  const initials=[customer.first_name?.[0],customer.last_name?.[0]].filter(Boolean).join('').toUpperCase()||'M';

  return <>
    <div className="inspector-identity"><div className="inspector-avatar">{initials}</div><div><div className="inspector-overline">CUSTOMER PROFILE</div><h2>{displayName(customer)}</h2><p>Joined {dayLabel(customer.created_at)}</p></div></div>
    <div className="inspector-tags"><span className={'inspector-tag '+(active.length?'positive':'neutral')}><Repeat2 size={13}/>{active.length?'Bread Club member':'No active subscription'}</span><span className={'inspector-tag '+(customer.marketing_opt_in?'positive':'neutral')}>{customer.marketing_opt_in?'Marketing opted in':'Marketing not opted in'}</span></div>
    <div className="inspector-stats"><div><strong>{related.length}</strong><small>ALL ORDERS</small></div><div><strong>{money(confirmed.reduce((sum,o)=>sum+o.total_cents,0))}</strong><small>PAID ORDERS TOTAL</small></div></div>
    <Section heading="Contact information">
      <div className="inspector-icon-row"><Mail size={17}/>{customer.email?<a href={'mailto:'+customer.email}>{customer.email}</a>:<span>No email on file</span>}</div>
      <div className="inspector-icon-row"><Phone size={17}/>{customer.phone?<a href={'tel:'+customer.phone}>{customer.phone}</a>:<span>No phone on file</span>}</div>
      <div className="inspector-icon-row align-top"><MapPin size={17}/><div><strong>{address.text}</strong><small>{address.label}</small></div></div>
      <DetailLine label="Marketing emails">{customer.marketing_opt_in?'Consented':'Not consented'}</DetailLine>
    </Section>
    <Section heading="Bread Club">
      {!customerSubscriptions.length&&<p className="inspector-empty">This customer has no subscription.</p>}
      {customerSubscriptions.map(s=><div className="inspector-sub" key={s.id}>
        <div><strong>{s.cadence==='biweekly'?'Every two weeks':'Every week'} · {s.fulfillment_type}</strong><span className={'inspector-tag '+(s.status==='active'?'positive':'neutral')}>{s.status}</span></div>
        <p>{subscriptionItems.filter(i=>i.subscription_id===s.id).map(i=>i.quantity+'× '+(products[i.product_id]?.name||'Loaf')).join(', ')||'No loaf selection'}</p>
        <small>Next scheduled: {dayLabel(s.next_delivery_date)}</small>
      </div>)}
    </Section>
    {canSeeDietary&&<Section heading="Dietary & allergen notes — restricted">
      {dietaryNote?<div className="inspector-sensitive">
        <DetailLine label="Allergies">{dietaryNote.allergies||'None reported'}</DetailLine>
        <DetailLine label="Preferences">{dietaryNote.dietary_preferences||'Not specified'}</DetailLine>
        <p>{dietaryNote.handling_notes||'Confirm directly before baking.'}</p>
        <small>Always re-confirm ingredients and cross-contact. These notes are not an allergy guarantee.</small>
      </div>:<p className="inspector-empty">No dietary notes on file. Confirm directly with the customer if needed.</p>}
    </Section>}
    <Section heading={'Order history · '+related.length}>
      {!related.length&&<p className="inspector-empty">No orders yet.</p>}
      {related.slice(0,6).map(o=><button className="inspector-order" key={o.id} type="button" onClick={()=>onOpenOrder(o.id)}>
        <span><strong>{dayLabel(o.day)}</strong><small>{o.items?.map(i=>i.quantity+'× '+(products[i.product_id]?.name||'Loaf')).join(', ')||'No items'}</small></span>
        <span className="inspector-order-right"><b>{money(o.total_cents)}</b><small>{o.payment_status} · {o.status}</small></span><ArrowRight size={16}/>
      </button>)}
      {related.length>0&&<button className="inspector-secondary full" type="button" onClick={()=>onViewOrders(displayName(customer))}>View all customer orders <ArrowRight size={16}/></button>}
    </Section>
    {onEdit&&<div className="inspector-footer"><button className="inspector-primary" type="button" onClick={()=>onEdit(customer)}>Edit customer details <ArrowRight size={16}/></button></div>}
    <div className="inspector-id">Customer ID · {customer.id}</div>
  </>;
}

function OrderView({order,customer,products,onOpenCustomer}) {
  return <>
    <div className="inspector-overline">ORDER DETAILS</div>
    <h2>Order #{order.id.slice(0,8).toUpperCase()}</h2>
    <p className="inspector-subhead">Scheduled for {dayLabel(order.day)}</p>
    <div className="inspector-tags"><span className={'inspector-tag '+(order.payment_status==='paid'?'positive':'neutral')}>{order.payment_status}</span><span className="inspector-tag neutral">{order.status}</span></div>
    <div className="inspector-stats"><div><strong>{money(order.total_cents)}</strong><small>ORDER TOTAL</small></div><div><strong>{order.items?.reduce((sum,i)=>sum+i.quantity,0)||0}</strong><small>LOAVES</small></div></div>
    <Section heading="Customer">
      <button className="inspector-person-link" type="button" onClick={()=>onOpenCustomer(order.customer_id)}><UserRound size={18}/><strong>{displayName(customer)}</strong><ArrowRight size={17}/></button>
      {customer?.email&&<div className="inspector-icon-row"><Mail size={17}/><a href={'mailto:'+customer.email}>{customer.email}</a></div>}
      {customer?.phone&&<div className="inspector-icon-row"><Phone size={17}/><span>{customer.phone}</span></div>}
    </Section>
    <Section heading="Fulfillment">
      <div className="inspector-icon-row">{order.fulfillment_type==='delivery'?<Truck size={18}/>:<MapPin size={18}/>}<strong>{order.fulfillment_type==='delivery'?'Delivery':'Pickup'}</strong></div>
      <DetailLine label="Date">{dayLabel(order.day)}</DetailLine>
      <DetailLine label="Window">{order.fulfillment_window||'Not specified'}</DetailLine>
      {order.fulfillment_type==='delivery'&&<>
        <DetailLine label="Delivery address">{order.delivery_address||addressFor(customer,[]).text}</DetailLine>
        <DetailLine label="Delivery instructions">{order.delivery_notes||'None provided'}</DetailLine>
      </>}
    </Section>
    <Section heading="Loaves in this order">
      {order.items?.map(i=><div className="inspector-item" key={i.id}><span>{i.quantity}× {products[i.product_id]?.name||'Unknown loaf'}</span><strong>{money(i.quantity*i.unit_price_cents)}</strong></div>)}
    </Section>
    <div className="inspector-id">Order ID · {order.id}</div>
  </>;
}

export function RecordInspector({record,records,orders,role,onClose,onOpenCustomer,onOpenOrder,onViewOrders,onEditCustomer}) {
  const closeRef=useRef(null);
  const previouslyFocused=useRef(null);
  useEffect(()=>{
    if(!record)return;
    previouslyFocused.current=document.activeElement;
    const onKey=e=>{
      if(e.key==='Escape'){e.preventDefault();onClose();}
      if(e.key==='Tab'){
        const focusables=Array.from(document.querySelectorAll('.inspector-panel button:not([disabled]), .inspector-panel a[href], .inspector-panel input:not([disabled])'));
        if(!focusables.length)return;
        const first=focusables[0],last=focusables[focusables.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',onKey);
    closeRef.current?.focus();
    document.body.style.overflow='hidden';
    return ()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow='';previouslyFocused.current?.focus?.();};
  },[record?.type,record?.id]);

  if(!record)return null;
  const customer=record.type==='customer'?records.customers.find(c=>c.id===record.id):null;
  const order=record.type==='order'?orders.find(o=>o.id===record.id):null;
  const products=Object.fromEntries(records.products.map(p=>[p.id,p]));
  const customerForOrder=order?records.customers.find(c=>c.id===order.customer_id):null;
  const dietary=customer?records.customer_dietary_notes?.find(n=>n.customer_id===customer.id):null;
  const allowedEdit=(role==='owner'||role==='support');
  return <div className="inspector-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <aside className="inspector-panel" role="dialog" aria-modal="true" aria-label={record.type==='customer'?'Customer details':'Order details'}>
      <div className="inspector-toolbar"><span><ShieldCheck size={16}/> PRIVATE STAFF VIEW</span><button ref={closeRef} type="button" className="inspector-close" onClick={onClose} aria-label="Close detail panel"><X size={21}/></button></div>
      <div className="inspector-scroll">{customer?<CustomerView customer={customer} orders={orders} products={products} subscriptions={records.subscriptions} subscriptionItems={records.subscription_items} dietaryNote={dietary} canSeeDietary={role==='owner'||role==='baker'} onOpenOrder={onOpenOrder} onViewOrders={onViewOrders} onEdit={allowedEdit?onEditCustomer:null}/>:order?<OrderView order={order} customer={customerForOrder} products={products} onOpenCustomer={onOpenCustomer}/>:<p className="inspector-empty">This record is no longer available.</p>}</div>
    </aside>
  </div>;
}
