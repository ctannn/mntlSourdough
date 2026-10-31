-- Anonymous readers receive published editorial content, never staff UUIDs or internal edit timestamps.
revoke select on public.blog_posts from anon;
grant select (id,slug,title,excerpt,body,category,cover_image_url,status,published_at) on public.blog_posts to anon;
