# MNTL Sourdough

> **Admin preview (Oct 2026):** After staff login, use **Try demo mode** in the sidebar to explore 16 fictional customers, connected sample orders, subscriptions, marketing preferences and delivery addresses. No sample changes are written to Supabase. Customer names and order IDs open linked detail drawers. See [demo QA](docs/DEMO-QA.md), [data model / primary keys](docs/ANALYTICS-DATA-MODEL.md), and [fixture tests](tests/demo-data.test.mjs). The build now runs tests before Vite compilation.


Small-batch sourdough in Calgary. This repository contains the public **MNTL** storefront and a staff-only bakery operations app.

**Live URLs:** [Storefront](https://runmntl.com) · [Staff dashboard](https://runmntl.com/admin) · [Operations & launch guide](docs/OPERATIONS-LAUNCH-RUNBOOK.md)

> **Commerce status:** the storefront currently collects **email inquiries**, not payments. Stripe checkout, recurring billing, verified webhooks, email notifications, taxes, delivery zones and refund logic still require implementation/testing before launch. Do not imply a purchase is complete.

## Stack

- **React 18 + Vite** — static multipage build: `index.html` and `admin.html`.
- **Vercel** — GitHub-connected deployment; `runmntl.com` primary, `runmntl.ca` redirects.
- **Supabase** — staff authentication, RLS-protected operations tables, and explicitly published public batch updates.
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

Vite serves the storefront at `/` and the operations page at `/admin.html`. Vercel `vercel.json` additionally rewrites `/admin` to `/admin.html`.

No private API credentials are required to run the informational storefront locally. **Never commit Stripe secret keys or Supabase service-role credentials.** The `sb_publishable_…` value used in the public browser is intentionally a publishable key; RLS protects its data access.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/main.jsx` | Storefront composition: catalog, inquiry cart, story sections and shared page state |
| `src/components/Hero.jsx` | Independent editorial hero, artwork/copy and primary conversion CTAs |
| `src/components/BakeExperience.jsx` | Baker-published oven ETA polling, one sticky freshness bar and compact public status panel |
| `src/components/BakeExperience.css` | Sticky ribbon and Oven styles, including mobile |
| `src/style.css` | Existing storefront structural styles |
| `src/editorial.css` | Current **v3 product-first MNTL design tokens** and responsive CSS; loaded after structural styles |
| `public/images/original.webp` | Archived compact concept image (too low-res for current hero; not in use) |
| `public/images/original-product.webp` | Archived small concept crop; current photos are high-resolution stand-ins |
| `admin/main.jsx` | Operations, authenticated demo toggle, customer drill-down and baker-controlled oven ETA |
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

The original local \`public/images/original*.webp\` thumbnails were too small and visibly blurry when stretched. They are **legacy assets only**; the current storefront uses high-resolution Unsplash photography with \`w=1400–2400&q=90\` for hero, product and crumb imagery, preconnecting and preloading the hero URL. This is a **temporary licensed image stand-in**, not verified photography of an actual MNTL loaf. The bakery should replace it with first-party high-resolution product photos before accepting paid orders. Do not imply stock images are photos of the actual product. See [the design handoff](docs/BRAND-DESIGN.md).

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
