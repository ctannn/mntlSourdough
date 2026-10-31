-- Harden exposed privileges without weakening published-only RLS.
-- Legacy grants allowed anonymous TRUNCATE, which PostgreSQL does not
-- constrain with RLS. Public readers need SELECT only.
revoke all privileges on table public.bake_updates from anon;
grant select (bake_date,stage,public_note,estimated_ready_at,updated_at,published)
  on table public.bake_updates to anon;
revoke delete,truncate,references,trigger on table public.bake_updates from authenticated;

-- Order status updates had an RLS policy but no SQL UPDATE grant. Allow
-- staff to update only the status column, never payment fields/amounts/IDs.
grant update (status) on table public.orders to authenticated;

-- Index the remaining two missing FK references for future analytics joins.
create index if not exists idx_orders_subscription_id on public.orders(subscription_id)
  where subscription_id is not null;
create index if not exists idx_audit_events_actor_user_id on public.audit_events(actor_user_id)
  where actor_user_id is not null;
