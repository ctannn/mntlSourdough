-- Analytics-friendly secondary indexes for MNTL.
-- All current public tables already have declared PKs; order/subscription FKs
-- are already enforced in PostgreSQL. These indexes accelerate common joins,
-- time-window filtering, customer history, and production aggregation.
--
-- Safe to rerun: no deletes, changes to access grants, or test-data inserts.
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at
  ON public.orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_bake_payment_status
  ON public.orders (bake_day_id, payment_status, status);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_status
  ON public.subscriptions (customer_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_active_next_delivery
  ON public.subscriptions (next_delivery_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription_id
  ON public.subscription_items (subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_items_product_id
  ON public.subscription_items (product_id);

CREATE INDEX IF NOT EXISTS idx_subscription_skips_bake_date
  ON public.subscription_skips (bake_date);

CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON public.customers (created_at DESC);

-- Existing production constraints checked separately:
-- customers.id PK, lower(email) unique partial index
-- products.id PK
-- bake_days.id PK, bake_date UNIQUE
-- orders.id PK; customer_id, bake_day_id, subscription_id FKs
-- order_items.id PK; order_id, product_id FKs
-- subscriptions.id PK; customer_id FK, stripe_subscription_id UNIQUE
-- subscription_items.id PK; subscription_id, product_id FKs
-- subscription_skips(subscription_id,bake_date) composite PK
-- customer_dietary_notes.customer_id PK + FK
-- bake_updates.bake_date natural PK
-- staff.user_id PK + FK to auth.users
-- stripe_events.event_id PK
-- checkout_holds.id PK; bake_day_id FK
-- audit_events.id PK
