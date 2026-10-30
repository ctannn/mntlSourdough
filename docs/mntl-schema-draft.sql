-- MNTL draft schema. Apply to dedicated project only after project creation.
create extension if not exists pgcrypto;
create table public.staff (user_id uuid primary key references auth.users(id), role text not null check(role in ('owner','baker','dispatcher','support')), active boolean not null default true);
create table public.customers (id uuid primary key default gen_random_uuid(), full_name text not null, email text, phone text, created_at timestamptz not null default now());
create table public.customer_dietary_notes (customer_id uuid primary key references public.customers(id) on delete cascade, allergies text, dietary_preferences text, handling_notes text, last_confirmed_at timestamptz, updated_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), name text not null, price_cents integer not null check(price_cents>=0), active boolean not null default true, allergen_statement text);
create table public.bake_days (id uuid primary key default gen_random_uuid(), bake_date date not null unique, cutoff_at timestamptz not null, capacity_loaves integer not null check(capacity_loaves>=0), status text not null default 'open' check(status in ('open','closed','baking','completed')));
create table public.subscriptions (id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id), stripe_subscription_id text unique, cadence text not null check(cadence in ('weekly','biweekly')), weekday integer not null check(weekday between 0 and 6), next_delivery_date date, fulfillment_type text not null check(fulfillment_type in ('pickup','delivery')), status text not null default 'draft' check(status in ('draft','active','paused','past_due','cancelled')), created_at timestamptz not null default now());
create table public.subscription_items (id uuid primary key default gen_random_uuid(), subscription_id uuid not null references public.subscriptions(id) on delete cascade, product_id uuid not null references public.products(id), quantity integer not null check(quantity>0));
create table public.subscription_skips (subscription_id uuid not null references public.subscriptions(id) on delete cascade, bake_date date not null, reason text, primary key(subscription_id,bake_date));
create table public.orders (id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id), subscription_id uuid references public.subscriptions(id), bake_day_id uuid references public.bake_days(id), status text not null default 'new' check(status in ('new','baking','ready','completed','cancelled')), fulfillment_type text not null check(fulfillment_type in ('pickup','delivery')), payment_status text not null default 'unpaid' check(payment_status in ('unpaid','paid','refunded','failed')), stripe_checkout_session_id text unique, delivery_address text, delivery_notes text, total_cents integer not null default 0 check(total_cents>=0), created_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid not null references public.products(id), quantity integer not null check(quantity>0), unit_price_cents integer not null check(unit_price_cents>=0));
create table public.audit_events (id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, occurred_at timestamptz not null default now());
-- Closed by default until carefully reviewed staff role policies and server-side Stripe handlers are deployed.
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.customer_dietary_notes enable row level security;
alter table public.products enable row level security;
alter table public.bake_days enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_items enable row level security;
alter table public.subscription_skips enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_events enable row level security;
revoke all on all tables in schema public from anon, authenticated;
