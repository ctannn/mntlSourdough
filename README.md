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
| `src/components/BakeExperience.jsx` | **Shared** batch data polling, sticky oven ribbon, interactive visitor timer, expanded Oven experience |
| `src/components/BakeExperience.css` | Sticky ribbon and Oven styles, including mobile |
| `src/style.css` | Existing storefront structural styles |
| `src/editorial.css` | Current **editorial bakery design system** and its central CSS tokens; loaded after the structural styles |
| `public/images/original.webp` | Locally hosted AI-generated Original **hero** image |
| `public/images/original-product.webp` | Locally hosted AI-generated cropped Original **product card** image |
| `admin/main.jsx` | Operations dashboard, staff auth, live/demo toggle and customer navigation |
| `admin/demoData.js` | Deterministic fake customers, linked orders/subscriptions, safe local-only demo mutations |
| `admin/productionMetrics.js` | Pure, tested recipe/order/calendar aggregation for both live and demo views |
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

## Visual design

**Direction:** upscale independent bakery, not supermarket. The CSS tokens in `src/editorial.css` use parchment, espresso, wheat and muted terracotta; serif editorial headlines provide contrast to DM Sans UI controls.

The home hero deliberately pairs copy on the left with a visible sourdough loaf to the right, so there is no blank right-hand field. Its image is a generated **brand concept photograph**, not a photo of a verified physical MNTL product. Replace it with professionally photographed actual inventory before public paid launch. A complementary crop of the same generated loaf is used for The Original product card. Later, replace any remaining third-party Unsplash image URLs for the Seeded, Weekend and crumb sections with owned imagery.

The new image is checked into `public/images/`, rather than fetched from a third-party service, so it can load reliably. The high-resolution generated PNG is available as a conversation working asset, but is not committed as the served website asset; two compact WebP derivatives are versioned in GitHub. For sharper desktop display, a future image optimization pass should replace the current compact WebP with responsive `srcset` assets.

For the full design evolution, see [docs/BRAND-DESIGN.md](docs/BRAND-DESIGN.md).

## Sticky batch ribbon / timer

`BakeExperienceProvider` is mounted once around the storefront. Both `StickyBakeBar` (top, follows scroll) and `BakePulse` (the full Oven section) read the **same** context, so the fun 35-minute timer does not restart when the visitor scrolls.

1. Every 90 seconds the client requests **published-only** `bake_updates` for today's **Calgary date**. Public RLS ensures private batch records remain inaccessible.
2. If a public batch exists, the sticky ribbon displays its stage and optional estimated remaining time. All timings are estimates manually published by a baker, never automated sensor readings.
3. Without an active published batch, the ribbon shows a **clearly labelled, just-for-fun visitor timer** with Start/Pause and an Oven shortcut. The expanded Oven section also has Reset.
4. The visitor timer is in-memory only; it resets on full page reload. The top bar uses CSS `position: sticky; top: 0` and has compact responsive controls.

The admin's **Live bake timer** tab updates the record in Supabase. No order confirmation, payment status or exact pickup time is exposed by this public tracker.

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
