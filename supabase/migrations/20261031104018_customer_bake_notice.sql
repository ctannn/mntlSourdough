-- Customer checkout backstop (2026-10-31): no same-day holds.
-- Tomorrow is eligible only BEFORE 18:00 Calgary / permanent Alberta Time.
-- Staff's separately authorized create_manual_order RPC is unaffected.
-- This rule is in addition to each bake_day.cutoff_at and capacity checks.
create or replace function public.mntl_enforce_customer_bake_notice()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_date date;
  v_calgary_now timestamp without time zone;
  v_first_date date;
begin
  select b.bake_date into v_date from public.bake_days b where b.id = new.bake_day_id;
  if v_date is null then
    raise exception 'Invalid bake day' using errcode='22023';
  end if;
  -- Alberta stays UTC-6 year-round from Nov 1, 2026; the site uses
  -- the same explicit offset for this post-Oct-2026 production rule.
  v_calgary_now := (now() at time zone 'UTC') - interval '6 hours';
  v_first_date := v_calgary_now::date
    + case when v_calgary_now::time >= time '18:00' then 2 else 1 end;
  if v_date < v_first_date then
    raise exception
      'Customer checkout requires at least one calendar day notice; tomorrow closes at 6 PM Calgary time'
      using errcode='22023';
  end if;
  return new;
end;
$$;
revoke all on function public.mntl_enforce_customer_bake_notice() from public, anon, authenticated;
drop trigger if exists mntl_customer_bake_notice on public.checkout_holds;
create trigger mntl_customer_bake_notice
  before insert or update of bake_day_id on public.checkout_holds
  for each row execute function public.mntl_enforce_customer_bake_notice();
