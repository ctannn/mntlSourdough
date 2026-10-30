# MNTL Commerce & Operations Blueprint

Status: architecture proposal, not production checkout. Do not collect payments until regulatory and operational approval.

## Positioning
Premium Calgary sourdough micro-bakery: one-time preorders, weekly/biweekly Bread Club, limited drops. Test CAD $12 Original, $14 Seeded, $16 limited edition, subject to real costs and capacity. Do not imply scarcity unless production quantity is actually limited.

## Suggested stack
- Existing React/Vite storefront on Vercel
- Separate admin app under /admin with protected server-side routes
- Dedicated Supabase project: Postgres, Auth, row-level security
- Stripe Checkout for one-time purchases; Stripe Billing for subscriptions
- Stripe webhooks as authoritative source for paid/refunded statuses
- Resend for transactional notifications
- PostHog analytics with consent controls
- Delivery zones and batch route planning

## Core entities
customers(id, email, name, phone, created_at)
products(id, sku, name, description, active, allergen_info)
product_prices(id, product_id, amount_cents, currency, active)
bake_slots(id, starts_at, cutoff_at, capacity_loaves, status)
inventory_allocations(id, bake_slot_id, product_id, allocated_qty)
orders(id, customer_id, status, fulfillment_type, bake_slot_id, subtotal_cents, delivery_cents, tax_cents, total_cents, stripe_checkout_session_id, created_at)
order_items(id, order_id, product_id, unit_price_cents, quantity)
payments(id, order_id, provider, provider_payment_id, status, amount_cents)
subscriptions(id, customer_id, provider_subscription_id, status, cadence, next_bake_slot_id)
subscription_items(id, subscription_id, product_id, quantity)
delivery_addresses(id, customer_id, postal_code, street, city, province, instructions)
deliveries(id, order_id, address_id, status, route_id, delivered_at)
routes(id, bake_slot_id, driver_id, status)
ingredients(id, name, unit, allergen_info)
recipes(id, product_id, ingredient_id, quantity_per_loaf)
inventory_movements(id, ingredient_id, delta, reason, created_at)
admin_users(user_id, role, active)
audit_events(id, actor_user_id, action, entity_type, entity_id, created_at)

## Operational state machine
draft -> awaiting_payment -> paid -> scheduled -> baking -> ready -> fulfilled
Separate terminal statuses: cancelled, refunded. Never mark paid from client request; only verified Stripe webhook.
Capacity reservation must be atomic and expire if checkout is abandoned. Refund and subscription cancellation are audited.

## Admin permissions
owner: full access; baker: production only; dispatcher: deliveries only; support: order/customer support with limited refund rights.
Never expose service-role keys to the browser. Enable RLS on every public table. Use trusted server functions for all privileged mutations. Log admin changes.

## Customer flow
Browse -> select loaf and bake slot -> choose pickup/delivery -> checkout -> payment webhook -> order confirmation -> production sheet -> pickup code or delivery status -> completion.

## Prelaunch gates
Confirm actual bakery address, legal business licensing/location approvals, ingredient/allergen labels, capacity, pickup and delivery radius, taxes, refund policy, Stripe account, notification domain, privacy policy, and owned product photography.

## Market references (reviewed October 2026)
- Alforno: sourdough loaf $7 (https://alforno.ca/order/)
- Begonia Bakehouse: sourdough $6.75 (https://begoniabakehouse.com/pages/menu)
- Wren Bakehouse: Calgary sourdough $8.99 (https://www.wrenbakehouse.com/bakery)
- Richie and Mia's: classic sourdough $10 (https://www.rmbakeshop.com/)
- BREAD artisan bakery: subscription sourdough campagne batard $6/week (https://www.breadab.com/subscriptions)
- Alberta low-risk home-prepared food guidance: https://www.alberta.ca/low-risk-home-prepared-foods
- Calgary home-based food business licence/location approval: https://www.calgary.ca/for-business/licences/home-based-food-business.html
