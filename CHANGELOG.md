# Changelog

Changes that affect the customer storefront, baker operations or project architecture are recorded here.

## 2026-10-29 — Editorial storefront and Original photography

**Design**
- Replaced the grocery-store lime-green look with parchment, espresso, wheat and warm terracotta, plus Cormorant Garamond editorial headlines.
- Rebuilt the hero as a photo-filled section with sourdough on the right, a clear left-aligned message, a primary loaf CTA and quieter supporting details.
- Added a locally hosted AI-generated Original loaf image and a separate product crop. The images are brand *concepts*, not yet photography of actual bakery production.
- Replaced neon-looking photo-failure fallbacks with a warm, branded illustration.

**Visitor oven experience**
- Introduced the sticky top `StickyBakeBar` that remains in view while scrolling and shares one data/timer source with the full `BakePulse` section.
- When today's public bakery update is available: display staff-published stage and optional estimated ready countdown. Otherwise: show a clearly labelled personal 35-minute timer with Start/Pause/Reset.
- Moved the oven logic and styling into `src/components/BakeExperience.jsx` and `BakeExperience.css`. Removed the obsolete `src/oven.css`.

**Engineering**
- Extracted the hero into `src/components/Hero.jsx` to make future revisions smaller and readable.
- Created `src/editorial.css` with named brand tokens and layered it after structural styles.
- Updated `README.md`, `CONTRIBUTING.md`, and `docs/BRAND-DESIGN.md` with architecture, asset sources, design rationale, release controls and contributor guidance.

**Not included:** Stripe production checkout, recurring billing, fulfillment notifications and legal launch sign-offs. The storefront remains inquiry-only.

## 2026-10-29 — Bakery operations foundation

- Supabase project with staff auth, row-level security, customer/contact records, product tables, order records and bake-day capacity.
- Baker dashboard with day/week counts, grouped loaf quantities, pickup/delivery queue, monthly calendar, customer directory, subscription forecasts, printable bake list and manually published batch stages.
- Owner can create manual unpaid orders with capacity checks.
- Vercel GitHub-connected deployments and primary/secondary domain configuration.
- See `docs/OPERATIONS-LAUNCH-RUNBOOK.md` for verified implementation boundaries and launch blockers.
