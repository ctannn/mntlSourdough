# Customer fulfillment planner — feature branch handoff

Status: **preview / inquiry-only**. Do not promote to production until reviewed with the existing MNTL engineer.

## Intent

This increment extends the existing Vite/React storefront in `src/main.jsx`. It does not replace the editorial theme, sticky batch timer, protected operations dashboard, Supabase schema, or Vercel deployment pipeline.

- `src/components/FulfillmentPlanner.jsx`: React calendar for preferred first bake date, weekly/biweekly rhythm, delivery address entry, map preview and optional delivery instructions.
- `src/components/FulfillmentPlanner.css`: component-scoped responsive styles using current MNTL editorial tokens.
- `src/lib/scheduling.mjs`: Calgary timezone-aware date-only calculations; stable weekly/biweekly recurrence across DST.
- `tests/scheduling.test.mjs`: date validation, recurrence, DST, and month navigation checks.
- `src/main.jsx`: minimal integration at order selection plus cart inquiry summary. Existing email inquiry flow remains the only way to request an order.

## Customer experience

1. Choose one-time or Bread Club, then choose a loaf and pickup/delivery.
2. If Bread Club, choose **Every week** or **Every 2 weeks**.
3. Pick a preferred first bake date from the next 90 days (not earlier than two days from the Calgary local date). Selected dates and next four recurring dates display as requested **preferences**.
4. For delivery, enter a Calgary street address and optionally unit/buzzer details. Select **Preview address**. Without a configured map service, the embedded map shows Calgary and an external Google Maps search link opens the requested address; do not present that as a verified location pin. With `VITE_GOOGLE_MAPS_EMBED_KEY` configured, the Google Maps Embed API shows an address-targeted map.
5. The customer reviews the selected date, cadence and fulfillment mode in the order summary and opens a populated email inquiry. No checkout, order, delivery eligibility, or subscription billing occurs.

## Map/provider setup and limitations

The public OpenStreetMap Nominatim geocoding service **must not** be used as unmetered address autocomplete for a commercial website. The preview does not make requests to that geocoding service. A static OpenStreetMap area map is used when no map provider is configured.

For a real address selection experience, set up Google Maps Platform with an appropriately restricted browser key for Maps Embed API and add `VITE_GOOGLE_MAPS_EMBED_KEY` as a Vercel project environment variable for Preview first. Restrict the key to MNTL domains and to the permitted API. All Vite `VITE_*` variables are exposed in browser bundles. For Places Autocomplete, coordinates, map pin drag/select, and delivery polygon validation, plan a dedicated provider integration with its relevant API key, usage controls and privacy consent; **these features are not implemented**.

The embedded map is a visualization, not an authoritative shipping address validator. Delivery coverage, fees, pickup location, bake availability, cutoffs, and checkout must be validated by a secure backend before accepting money. Do not send arbitrary address text directly into privileged database writes.

## Production follow-up

- Publish actual pickup address/hours and configured delivery zones/rates.
- Expose only public, safe bake-day availability, not private customer/production details.
- Enforce server-side capacity holds and cutoff times at checkout; do not mistake a preferred date for a reservation.
- Add real geocoding/address autocomplete, verified address components, coordinates, and an editable map pin using a licensed provider. Store addresses with consent and privacy controls.
- Wire signed and idempotent Stripe Checkout/webhooks and invoice-paid renewals to existing orders and subscriptions.
- Run browser and accessibility QA at desktop and mobile widths, plus payment/fulfillment end-to-end tests.

## Tests and review

`npm run test` runs all Node built-in test files including `tests/scheduling.test.mjs`; `npm run build` runs tests before Vite build. Vercel builds preview commits automatically.

Review calendar month navigation, disabled past dates, Calgary DST transition, empty-cart safeguards, pickup vs delivery changes, email inquiry details, mobile overflow, map fallback, and existing admin/bake timer regressions. The separate feature branch is the intended review boundary. Do not merge automatically.
