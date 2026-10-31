# MNTL — coordinated production release (October 30, 2026)

Source baseline: `main` at `6ffe327818064127910e09dfba7b7dbf69c7326d`.

This file records the deliberately triggered production build after multiple ordinary
commits were intentionally skipped by the Vercel Ignored Build Step.

## Included changes

- Customer fulfillment planner: date selection, subscription inquiry cadence, map/address entry and pickup preferences
- Secure server-side one-time pickup Stripe Checkout groundwork, guarded by environment flags
- Signed Stripe webhook infrastructure and payment verification (not enabled until secrets are configured and E2E verified)
- Customer contact form and payment return status messaging
- Staff admin demo mode, clickable customer profiles, order details, baker calendar and subscription forecasts
- Baker production CSV export, with confirmed-paid, unpaid and forecast units separate
- Fixed delivery address entry crash
- Real baker-published oven ETA countdown and sharper bakery image requests
- Production data schema documentation and relational-fixture/production-export tests
- Coordinated-development rules and GitHub CI testing

## Release verification

- Production project: `mntl-sourdough` (Vercel)
- Primary domain: `https://runmntl.com`
- Admin: `https://runmntl.com/admin`
- CI: `npm run build` executes Node tests before Vite compilation
- Stripe payment is fail-closed by default; live customer charges must stay disabled
  until secrets, baking capacity, callback/webhook and refund testing are completed.
- On deployment completion, verify build status READY, exact commit SHA/domain aliases
  and website/API responses. A successful compile is not full browser checkout QA.

This is one coordinated release marker, not a new customer-facing feature.
