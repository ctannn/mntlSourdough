-- MNTL: The Oven editorial journal. Blog entries are not baking-time updates.
-- Authorised staff create drafts and publish; anonymous visitors see published posts only.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint blog_posts_slug_format check (length(slug) between 3 and 90 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null constraint blog_posts_title_length check (length(trim(title)) between 1 and 150),
  excerpt text not null default '' constraint blog_posts_excerpt_length check (length(excerpt) <= 350),
  body text not null default '' constraint blog_posts_body_length check (length(body) <= 60000),
  category text not null default 'Journal' constraint blog_posts_category_length check (length(trim(category)) between 2 and 40),
  cover_image_url text constraint blog_posts_cover_url check (
    cover_image_url is null or (length(cover_image_url) <= 1200 and cover_image_url ~ '^https://')
  ),
  status text not null default 'draft' constraint blog_posts_status_valid check (status in ('draft','published')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_publication_consistency check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null and length(trim(body)) >= 40)
  )
);
create index if not exists blog_posts_public_order_idx on public.blog_posts (published_at desc, id) where status = 'published';
create index if not exists blog_posts_created_by_idx on public.blog_posts (created_by);
create index if not exists blog_posts_admin_updated_idx on public.blog_posts (updated_at desc);

-- Stamp timestamps and author identity in the database; editors cannot forge
-- historical publication dates, creator IDs or activity timestamps.
create or replace function public.mntl_stamp_blog_post()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
    new.created_at := now();
  else
    new.id := old.id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status <> 'published' then
      new.published_at := now();
    else
      new.published_at := old.published_at;
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;
revoke all on function public.mntl_stamp_blog_post() from public, anon, authenticated;
drop trigger if exists mntl_stamp_blog_post_trigger on public.blog_posts;
create trigger mntl_stamp_blog_post_trigger
  before insert or update on public.blog_posts
  for each row execute function public.mntl_stamp_blog_post();

alter table public.blog_posts enable row level security;
revoke all on table public.blog_posts from public, anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

create policy blog_posts_read_public
on public.blog_posts for select to anon
using (status = 'published' and published_at <= now());

create policy blog_posts_read_staff_and_published
on public.blog_posts for select to authenticated
using (
  (status = 'published' and published_at <= now())
  or exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active
  )
);

create policy blog_posts_insert_editor
on public.blog_posts for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active
      and s.role in ('owner', 'baker')
  )
);

create policy blog_posts_update_editor
on public.blog_posts for update to authenticated
using (
  exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active
      and s.role in ('owner', 'baker')
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active
      and s.role in ('owner', 'baker')
  )
);

-- Only an owner can permanently delete a DRAFT. Published posts can be
-- unpublished first, preserving intentional editorial workflow.
create policy blog_posts_delete_draft_owner
on public.blog_posts for delete to authenticated
using (
  status = 'draft'
  and exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active and s.role = 'owner'
  )
);

-- Images are stored separately from the blog data so links remain stable.
-- No user-supplied SVG or HTML uploads; max 5 MiB.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('mntl-oven','mntl-oven',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy mntl_oven_editor_upload
on storage.objects for insert to authenticated
with check (
  bucket_id='mntl-oven'
  and lower(split_part(name,'.',array_length(string_to_array(name,'.'),1))) in ('jpg','jpeg','png','webp')
  and exists (
    select 1 from public.staff s
    where s.user_id=(select auth.uid()) and s.active
      and s.role in ('owner','baker')
  )
);
