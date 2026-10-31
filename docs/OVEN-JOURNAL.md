# The Oven — MNTL Journal and Staff Publishing

## What "The Oven" means

**The Oven is MNTL's blog and journal**, not the small bakery countdown at the top of the website. It has a dedicated landing page and permanent individual post URLs:

- Public index: [runmntl.com/oven](https://runmntl.com/oven)
- A post: \`/oven/:slug\` (for example, \`/oven/how-we-bake-slowly\`)
- Admin editor: [runmntl.com/admin](https://runmntl.com/admin) → **The Oven — Posts**

**The baking freshness bar remains separate**, managed in Admin → **Oven countdown**. The ribbon is labeled **MNTL / FRESHNESS** and displays only baker-published oven ETAs. The public site does not fabricate countdowns or publish demo data.

## Staff publishing workflow

1. Sign in to the admin as an active **owner** or **baker**.
2. Open **The Oven — Posts**. Readable drafts and published stories appear in the left list.
3. Click **New story**. Enter a title and URL slug, category, teaser/excerpt, and story body.
4. Use simple lightweight formatting: blank lines for paragraphs, \`#\` for a heading, \`##\`/ \`###\` for subheadings, \`- \` for a list, \`**bold**\`, and \`[text](https://example.com)\` for links. Unsafe HTML/scripts are not rendered.
5. Optionally paste a **HTTPS cover image URL** or **Upload cover photo** (JPG, PNG or WebP up to 5 MiB). Uploaded files are public images, but only authorized staff can upload to this bucket.
6. Select **Preview** to review the article layout without publishing.
7. Choose **Save draft** (not public) or **Publish story** (public). The database, not the client, stamps the author, edit time and publication time.
8. Public URLs become accessible via \`/oven/:slug\` as soon as their publication is saved.
9. To withdraw a story, select **Unpublish**. Only an owner can permanently delete an already-unpublished **draft**, with confirmation. Keep published stories by unpublishing before deletion if required.

When no article has been published, visitors see a designed "Something good is in the works" page rather than dummy blog content.

**Demo Mode:** the editor displays fictional example posts kept in React state and the public journal receives no demo data. Saving a demo article cannot write to \`blog_posts\`; uploaded images are disabled in demo so training does not create real public media.

## Underlying data model

Supabase project \`dfyzpflempgtokyhvtlo\`. The two SQL migrations are tracked in:

- [create_oven_journal.sql](../supabase/migrations/20261031031520_create_oven_journal.sql)
- [blog_author_analytics_index.sql](../supabase/migrations/20261031032111_blog_author_analytics_index.sql)

The \`public.blog_posts\` table includes:

| Column | Reason |
| --- | --- |
| \`id UUID PK\` | Stable surrogate/warehouse key |
| \`slug TEXT UNIQUE\` | Stable SEO-friendly URL and collision guard |
| \`title, excerpt, body, category\` | Structured editorial content |
| \`cover_image_url\` | HTTPS image URL or NULL |
| \`status\` | \`draft\` or \`published\` only |
| \`published_at\` | Database-stamped visibility and analytics time |
| \`created_by, updated_by\` | Foreign keys to \`auth.users\`; nullable only if a staff account is deleted |
| \`created_at, updated_at\` | Database-maintained auditing timestamps |

No user-controlled or public-submitted authorship claims are trusted. In a publication transition, the trigger sets \`published_at\`; moving back to draft clears it. The database protects immutable \`id\`, \`created_by\` and \`created_at\` on edits.

### Row-level security

- Anonymous visitors: **SELECT published content only**, dated no later than the current time. No anonymous INSERT, UPDATE, or DELETE grants.
- Authenticated staff: published content plus private drafts **only when \`public.staff.active\` is true**.
- Active owner or baker: create/update and publish. Authorization is based on the trusted \`public.staff\` table, **never user-editable metadata**.
- Owner: delete a draft. Published posts must be unpublished first.
- Images: \`storage.buckets.id = 'mntl-oven'\` is a public-read bucket; only active owner/baker may upload supported image types (max 5 MiB). Uploads use randomly generated paths and do not upsert existing objects.

Verification was performed in a **rolled-back DB transaction**: \`anon\` saw one test published row and zero test draft rows. After rollback, the real table contained **zero posts**. Publishing is entirely in the hands of MNTL staff.

### Related analytics

Use \`id\` for joins and \`published_at\` for content cohorts. \`created_by\` and \`updated_by\` allow editorial attribution in restricted analytics. The current schema records current state and timestamps, **not a full revision/change history**. For edit-history analytics, add an append-only post-revision table rather than trying to infer revisions from \`updated_at\`.

## Release and SEO limitations

This is a React/Vite SPA. Vercel rewrites \`/oven\` and \`/oven/:slug\` to \`index.html\`, then React renders public journal content from Supabase REST. React updates the page title, description and canonical URL after loading.

**Limitation:** social previews and some search crawlers may not execute JavaScript. For advanced search traffic or social sharing of individual posts, add server-rendered/prerendered per-article HTML and unique OG tags before running a major content campaign. This release prioritizes working article pages and authenticated publishing.

No posts are automatically seeded into production. Do not pretend demo articles are real bakery announcements.

## QA before the one production deployment

- Confirm \`npm run build\` passes **all tests** and builds both storefront and admin entries.
- Confirm \`/oven\` renders with zero published posts.
- In staff demo, create a sample story, preview, edit, publish, unpublish and delete a draft; confirm nothing appears on the live blog.
- In a real owner account, publish one short post and view \`/oven/slug\` anonymously. Unpublish; refresh and confirm the public post is no longer accessible.
- Upload one authorized WebP cover and ensure it renders. Try unsupported SVG and verify rejection.
- Check keyboard navigation, mobile menu, 360px width, and post typography.
- Confirm the storefront bread photos load from **local files**, and the top freshness bar continues to work separately.
- Keep Stripe live-payment flags disabled until full checkout testing.
- Verify production READY status, commit SHA and real domain aliases after **one coordinated release**.

## Bread Club rhythm relationship

The public Bread Club planner now supports weekly, biweekly, every three weeks, monthly (calendar-month anchored), or custom 1–90 days / 1–12 weeks. These are **inquiry preferences**, not activated paid subscriptions. The admin's live subscription billing/forecast currently uses the existing weekly/biweekly data model; do not treat a customer's custom inquiry as a recurring Stripe charge. Future persistent custom billing requires extending \`public.subscriptions\` and its forecasting pipeline in a separate reviewed migration.
