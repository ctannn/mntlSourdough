# MNTL coordinated release audit — October 31, 2026

**Scope:** public storefront, freshness ribbon, blog, staff operations, customer schedule/checkout, Stripe scaffolding, Supabase tables/RLS, migration inventory and deployment gating.

This is an engineering review, **not certification that real-money checkout or live customer fulfillment is ready**.

## Verified fixes included in this release

| Area | Finding / resolution |
| --- | --- |
| Customer bake date | No same-day checkout or inquiry; before 6 PM Calgary, tomorrow can be requested; at/after 6 PM, earliest is day after tomorrow; shared frontend/server validator and database checkout-hold trigger |
| Anonymous bakery updates | Removed legacy public privileges including `TRUNCATE`, which is not governed by RLS; public readers get only the six published-update fields needed by the ribbon |
| Staff order status | Fixed missing database privilege: authenticated staff may update **only** `orders.status`; `payment_status`, `total_cents` and Stripe IDs remain immutable to staff REST updates |
| Reporting completeness | Staff dashboard now fails clearly when any 1,000-row dataset hits its fetch limit, rather than silently reporting incomplete totals. Pagination remains a future enhancement |
| Mutation feedback | Admin save actions require a nonempty PostgREST `return=representation` result, avoiding a false success on 0-row RLS/no-op updates |
| Blog completeness | Admin journal refuses to silently truncate a 200-row post listing. Pagination is required before scaling beyond this point |
| Freshness link | The ribbon points to `/#oven` when read from blog routes; on the storefront it scrolls to `#oven`. Oven timing label says Alberta Time |
| Foreign keys | Added covering indexes for `orders.subscription_id` and `audit_events.actor_user_id` |

### Database checks run

- Anonymous role cannot `INSERT` or `TRUNCATE` `bake_updates`, and cannot SELECT the internal `started_at` column. Published update read remains permitted.
- `authenticated` has `UPDATE(orders.status)` but cannot update `payment_status` or totals.
- A rolled-back transaction impersonating the active owner successfully updated an unpaid order's operational status, then confirmed a payment-status UPDATE fails. All test records were rolled back.
- The customer checkout-hold trigger was previously tested in a rolled-back transaction: same-day hold rejected, future-dated hold accepted. No sample checkout holds or bakery dates remain in production.
- All public tables have RLS enabled. Server-only `checkout_holds`, `stripe_events`, and `audit_events` deliberately have no anonymous/authenticated policies.
- Permanent post-2026 Alberta UTC−6 date handling is covered by unit tests.

## Release gates

- GitHub PR CI must pass `npm run build`, which includes the full Node test suite and builds storefront + admin.
- GitHub `main` must be compared with the intended reviewed PR head before merging.
- Merging without `[deploy]` should not trigger a production build; a separate documented `[deploy]` marker triggers **one production release**.
- The final release must match the requested commit SHA, reach Vercel `READY`, carry the production domain aliases and have clean or explained runtime logs.
- Public HTTP smoke coverage: `/`, `/oven`, `/oven/:slug`, `/admin`, local `.webp` assets, `/api/checkout-status`, `/api/availability`. Test mobile/desktop JS behavior when browser automation is available.

## Explicit launch limitations (not silently passed)

1. **Live payments disabled.** Current production `/api/checkout-status` reports `paymentEnabled:false` and `pickupConfigured:false`. No checkout or recurring billing goes live in this release. Stripe integration has code but lacks a fully validated end-to-end paid transaction, refunds, replay handling and production credentials. Do not enable live charges without a separate launch review.
2. **No published bake calendar:** Availability endpoint reports `configured:false` and no selectable paid checkout dates. Customers can still make qualified email inquiries; bakery must confirm capacity, pickup address and delivery fees.
3. **No actual blog posts:** The Oven journal deliberately displays its empty state until staff publish an article; demo posts remain isolated.
4. **Concept imagery:** the sharp locally served hero and Original are generated reference photos, not real verified product photos. Other variants still use remote image placeholders and local fallback.
5. **Newsletter/marketing:** newsletter uses a `mailto:` request; this is not a stored marketing subscription or double opt-in integration.
6. **Future data scale:** dashboard limits of 1,000 rows/table and journal limit of 200 now fail visibly, but complete pagination is outstanding before major volume.
7. **Search previews:** the Oven is React SPA content; server-rendered post-specific social OG tags and full SEO prerendering are future work.
8. **Supabase Auth advisory:** leaked-password protection is disabled (Supabase security advisor WARN). An owner must enable this in **Supabase Dashboard → Authentication → Settings → Password Security** before scaling staff access. This cannot be safely enabled using the current connected database actions.
9. **UI acceptance:** automated CI and HTTP checks are not substitutes for authenticated staff walkthrough, mobile browser visual QA, map click/drag validation or a real Stripe test-mode purchase. Document manual outcomes separately.

## Operations rule of thumb

Operate the storefront as **inquiry-first** until prices, dates, production throughput, fulfillment policies, real product imagery and payment operations are separately certified. Do not call custom Bread Club inquiry cadence a charged subscription.
