-- Cover the editor-update attribution foreign key for analytics joins.
create index if not exists blog_posts_updated_by_idx on public.blog_posts (updated_by);
