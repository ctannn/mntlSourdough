# MNTL Sourdough

> **Admin preview (Oct 2026):** After staff login, use **Try demo mode** in the sidebar to explore 16 fictional customers, connected sample orders, subscriptions, marketing preferences and delivery addresses. No sample changes are written to Supabase. Customer names and order IDs open linked detail drawers. See [demo QA](docs/DEMO-QA.md), [data model / primary keys](docs/ANALYTICS-DATA-MODEL.md), and [fixture tests](tests/demo-data.test.mjs). The build now runs tests before Vite compilation.


Small-batch sourdough in Calgary. This repository contains the public **MNTL** storefront and a staff-only bakery operations app.

**Current production URLs:** [Storefront](https://runmntl.com) · [Staff dashboard](https://runmntl.com/admin) · **Pending release:** [The Oven journal](https://runmntl.com/oven) · [Operations guide](docs/OPERATIONS-LAUNCH-RUNBOOK.md)

> **Commerce status:** the storefront currently collects **email inquiries**, not payments. Guarded Stripe pickup Checkout and webhook code exist, but payment environment flags and production credentials are deliberately disabled. Recurring billing, delivery charges, end-to-end payment tests and customer notifications remain launch blockers. Do not imply an inquiry is a paid order.

## Stack

- **React 18 + Vite** — static storefront and staff build (`index.html`, `admin.html`), with blog routes rewritten to the storefront SPA.
- **Vercel** — GitHub-connected deployment; `runmntl.com` primary, `runmntl.ca` redirects.
- **Supabase** — staff authentication, RLS-protected operations and blog posts, restricted blog media uploads, and baker-published freshness updates.
- **lucide-react** — interface icons.
- **Stripe test account** — connected externally but **not integrated into the storefront**.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev
npm run build
npm run preview
```

Vite serves the storefront at `/` and the operations page at `/admin.html`. Vercel rewrites `/admin` to `/admin.html` and `/oven` / `/oven/:slug` to the storefront entrypoint. Run `npm run test` and `npm run build` before merging.

No private API credentials are required to run the informational storefront locally. **Never commit Stripe secret keys or Supabase service-role credentials.** The `sb_publishable_…` value used in the public browser is intentionally a publishable key; RLS protects its data access.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/main.jsx` | Storefront composition: catalog, inquiry cart, story sections and shared page state |
| `src/components/Hero.jsx` | Independent editorial hero, artwork/copy and primary conversion CTAs |
| `src/components/BakeExperience.jsx` | Baker-published oven ETA polling, one sticky freshness bar and compact public status panel |
| `src/components/BakeExperience.css` | Sticky ribbon and Oven styles, including mobile |
| `src/components/OvenJournal.jsx`, `OvenJournal.css` | Public blog index, individual articles, responsive reading experience and empty state |
| `src/components/StoryBody.jsx`, `src/lib/ovenJournal.mjs` | Safe article renderer, publishing validation, slugs and public visibility |
| `src/style.css` | Existing storefront structural styles |
| `src/editorial.css` | Current **v3 product-first MNTL design tokens** and responsive CSS; loaded after structural styles |
| `public/images/original.webp` | Archived compact concept image (too low-res for current hero; not in use) |
| `public/images/original-product.webp` | Archived small concept crop; no longer used |
| `public/images/mntl-hero.webp`, `mntl-original.webp` | Locally hosted high-resolution sourdough concept photos; no fragile external hero URL |
| `admin/main.jsx` | Operations, authenticated demo toggle, customer drill-down and baker-controlled oven ETA |
| `admin/BlogManager.jsx`, `admin/BlogManager.css`, `admin/demoOvenPosts.js` | Authenticated blog drafts, publishing, restricted cover uploads and isolated sample posts |
| `src/lib/scheduling.mjs` | Validated Bread Club recurrence calculations, including custom daily/weekly and monthly dates |
| `supabase/migrations/20261031_*` | Tracked blog schema/RLS and author-attribution index migrations |
| `admin/demoData.js` | Deterministic fake customers, linked orders/subscriptions, safe local-only demo mutations |
| `admin/productionMetrics.js` | Pure, tested recipe/order/calendar aggregation for live and demo views |
| `admin/bakeTime.js`, `src/components/batchStatus.js` | Calgary ABT oven timestamps, public selection/formatting (both unit-tested) |
| `admin/RecordInspector.jsx` | Customer and order drill-down panels and cross-links |
| `admin/recordInspector.css` | Detail drawer, demo controls and accessible responsive presentation |
| `tests/*.test.mjs` | Validates synthetic PK/FK graph, uniqueness and production counts on every build |
| `docs/ANALYTICS-DATA-MODEL.md` | Live relational schema/keys, KPI definitions and warehouse design |
| `docs/DEMO-QA.md` | Exact click-by-click staff acceptance walkthrough |
| `docs/sql/analytics_indexes.sql` | Versioned reporting indexes already applied to production |
| `admin/operations.css` | Admin page responsive and print styling |
| `docs/OPERATIONS-LAUNCH-RUNBOOK.md` | Detailed baker instructions, data definitions, RLS, launch blockers and review steps |
| `docs/mntl-schema-draft.sql` | Historical initial database blueprint, **not** a full snapshot of applied changes |
| `index.html`, `admin.html`, `vite.config.js`, `vercel.json` | Application entrypoints, build and routing |

## Design direction and photography

**Visual v3:** MNTL is a bold, product-led Calgary bakery with a little running-club attitude—not a generic serif/terracotta lifestyle advertisement and not a neon supermarket promotion. \`src/editorial.css\` defines a clean ink/off-white palette, restrained wheat accent, compact shop/navigation components and a full-height **split hero**: bold sans-serif copy on the left, a sharp full-size bread photograph on the right. The hero itself lives in \`src/components/Hero.jsx\`.

The previous tiny thumbnails and an external Unsplash URL caused a broken/empty hero. **The hero and Original now use locally hosted full-resolution WebP images** in \`public/images/mntl-hero.webp\` and \`mntl-original.webp\`, with a fallback in the hero. They are generated concept photos, **not verified photos of finished MNTL inventory**. Replace them with real product photography before paid launch. Other variant images still use remote placeholders with local fallbacks. See [the design handoff](docs/BRAND-DESIGN.md).

## The Oven journal and Bread Rhythm

**The Oven** in the customer navigation now leads to the dedicated MNTL blog at `/oven`; each published post has a permanent `/oven/:slug` URL. Staff edit drafts and publish articles in the new **The Oven — Posts** area of `/admin`. Images can be uploaded through a restricted Supabase Storage bucket. Every public article is protected by published-only RLS; no sample posts are visible on the website. Details and QA: [The Oven journal guide](docs/OVEN-JOURNAL.md).

**Bread Club** supports weekly, every 2 weeks, every 3 weeks, monthly, and **custom 1–90 day or 1–12 week rhythms**. Dates are previews and inquiries only; recurring billing is **not active**. All custom choices carry through the contact inquiry, summary and recurrence preview. The database's current paid subscription schema still models weekly/biweekly; persistent custom billing needs separate future engineering.

## Real bakery oven countdown

The slim \`StickyBakeBar\` remains at the **top of the page while scrolling**. It is a **real bakery freshness clock**, not a customer timer.

- Bakers sign in at \`/admin\`, choose **Oven countdown**, select a bake date and stage, set **Next loaves out of the oven (Calgary time)**, and explicitly publish.
- The public client requests \`bake_updates\` with \`published=true\` (RLS) every **60 seconds**. It selects the **next future estimated oven-ready timestamp** from published upcoming records and counts down every second.
- A future estimate within 24 hours reads **"Next loaf coming out of the oven in MM:SS / HH:MM:SS"**. Further-out dates show their scheduled Calgary bake time. A current published \`ready\` stage can display a freshly-ready status.
- Without a valid published future estimate, the bar displays a neutral bakery message. **No fake countdown, no play/pause/reset, and no automatically invented loaf availability.** Once an estimate has passed, the countdown disappears rather than claiming fresh bread is ready.
- The expanded Oven information below the catalog is deliberately compact—not a giant mock oven counter.
- The current \`bake_updates\` table is **one update per bake date** (primary key \`bake_date\`). If the business wants multiple batches on the same calendar date, add a separate normalized \`bakery_batches\` table with UUID PK and per-batch timestamps before relying on this as a multi-batch schedule.
- All public fields are manually maintained and **estimated**, not a sensor or pickup-time guarantee. Demo Mode edits never publish to the storefront.

**Critical timezone rule:** Alberta adopts permanent Alberta Time (ABT), **UTC−6 beginning November 1, 2026**. Both \`admin/bakeTime.js\` and \`src/components/batchStatus.js\` explicitly support this transition instead of depending on outdated browser IANA timezone data. Production order cutoffs use the same bakery local-time interpretation.

Unit coverage includes \`tests/batch-status.test.mjs\` and \`tests/bake-time.test.mjs\`; builds run all Node tests before Vite compilation. More detail: [Oven Countdown engineering notes](docs/OVEN-COUNTDOWN.md).

## Data and security

Database: Supabase project `dfyzpflempgtokyhvtlo` (Canada Central). Data tables include `staff`, `customers`, `customer_dietary_notes`, `products`, `bake_days`, `orders`, `order_items`, `subscriptions`, `subscription_items`, `subscription_skips` and `bake_updates`. Other server-only tables support future checkout reservation/event idempotency.

The initial owner account has been provisioned in Supabase. Staff rows/roles and RLS policies govern access. Do not put allergy/dietary notes into public customer records; their restricted table has separate access rules. Do not display private addresses on public pages.

Baker math separates **paid confirmed** quantities from **unpaid orders** and **subscription forecasts**, by bake day and recipe. That prevents forecasts from being treated as a verified payment. See the [runbook](docs/OPERATIONS-LAUNCH-RUNBOOK.md) for definitions and operational procedures.

## Next launch milestones

1. Finish server-only Stripe Checkout and idempotent signed webhooks; test holds, concurrency, refunds, replay protection.
2. Implement recurring billing and renewals that create paid bake-day orders only after successful invoice payment.
3. Configure real pickup address/hours, delivery zones/fees, bake calendar, cancellation policy and approved prices/weights/allergens.
4. Replace conceptual imagery with photos of actual bakery products and add an optimized responsive asset pipeline.
5. Validate real-browser desktop/mobile layout, accessibility, performance, email confirmations and end-to-end ordering.
6. Complete Calgary/Alberta business, food-handling, privacy and tax requirements.

**Contribution guideline:** keep payment and customer operations secure by default, centralize shared behavior in reusable components, preserve RLS and fail-closed logic, and update this README and the runbook with every substantial feature change.
