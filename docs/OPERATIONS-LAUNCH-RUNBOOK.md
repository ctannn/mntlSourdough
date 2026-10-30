# MNTL Bakery Operations — Staff Guide and Launch Runbook

Last updated: 2026-10-29. Project: [runmntl.com](https://runmntl.com) / [admin.html](https://runmntl.com/admin.html).

## Staff quick start

1. Open the private [operations dashboard](https://runmntl.com/admin.html) and sign in with your Supabase Auth staff account. The first verified owner account is configured.
2. **Overview**: the top three cards show today's, tomorrow's, and the following day's confirmed paid loaf counts plus the number of pickup and delivery orders. The next seven days, unpaid queue, and major actions are below.
3. **Bake calendar**: switch months, select a date, and inspect that date's actual orders. Green values are confirmed paid loaves, blue are subscription projections, and amber are unpaid loaves. They are **not combined**.
4. **Bake list**: select a date; the large recipe cards aggregate each variety **across all paid orders**. Check counts before mixing, use the print button, then follow the paid order pick list below.
5. **Orders**: search by customer/date/order ID and move authorized orders through new, baking, ready, completed, or cancelled. A status change does not automatically issue a refund or email customers.
6. **Customers**: first name, last name, email, phone, number of orders, and marketing consent; authorized users can add/edit. Marketing consent defaults to **off**. Do not put health or allergy notes in general contact fields.
7. **Subscriptions**: displays billing records and potential production quantities from active subscription schedules. Forecasts are **not guaranteed paid inventory** until a paid order exists. The recurring purchase/billing workflow is not activated yet.
8. **Deliveries**: select a date to see a pickup list and delivery queue based only on paid orders.
9. **Live bake timer**: staff can publish a batch stage and optional estimated readiness time. The storefront's **The Oven** section shows the last published batch. This is manually updated by bakers; it is not a camera or automated oven telemetry system.

### Scheduling bake days

From **Bake calendar** or **Bake list**, select a day and choose **Schedule date** or **Bake settings**. Enter maximum capacity and status (open/closed/baking/completed). The prototype calculates a default order cutoff at **6:00 PM device-local time one day before** the bake. Treat this as a default that must be reviewed for Calgary-time staff who work remotely. Production days are **not** automatically generated. An unscheduled date does not accept online checkout.

### Understanding the counts

- **Confirmed loaves** = sum of order items for orders with payment_status = paid, assigned to the selected bake day, excluding cancelled, refunded, or failed orders.
- **Pickup/delivery** = counts of paid orders, not counts of individual loaves.
- **Unpaid** = separate line items; manually created unpaid orders are excluded from confirmed totals.
- **Subscription forecast** = projected active subscription quantities on their next delivery date and subsequent 7/14-day cadence, excluding skipped dates and dates with already generated paid subscription orders. Forecasts only extend through the next 70 days.
- A bake calendar slot and capacity do not by themselves guarantee future payment acceptance. Any online checkout must enforce a server-side, transactional capacity hold.

## Database and authorization

Supabase: project \`dfyzpflempgtokyhvtlo\`, Canada Central. Main domain: \`https://runmntl.com\`.

Tables:
- \`staff\`: role and active membership; each authenticated staff member can read their own membership, not other accounts.
- \`customers\`: first and last names, email, phone, marketing consent; original \`full_name\` maintained for older integrations.
- \`customer_dietary_notes\`: restricted dietary/allergen notes, readable only by authorized owner/baker roles.
- \`products\`: named products and price cents (Original 1200, Seeded 1400, Weekend 1500 — initial **placeholder prices**).
- \`bake_days\`: calendar date, cutoff, capacity, status.
- \`orders\`, \`order_items\`: customer, bake day, item breakdown, payment status, fulfillment status, price.
- \`subscriptions\`, \`subscription_items\`, \`subscription_skips\`: recurring projections, items, skips.
- \`bake_updates\`: separately published public-facing stage/status updates with RLS.
- \`checkout_holds\`, \`stripe_events\`: server-only groundwork for transactional checkout reservation and event idempotency. **No production checkout endpoint is active.**
- \`audit_events\`: server-only audit groundwork.

Supabase Row Level Security policies restrict staff privileges, and the sensitive server-only tables remain inaccessible to anonymous and normal authenticated clients. Never put the Supabase service-role/secret key into Vite source, GitHub, or browser variables. The Supabase publishable key in browser source is intentionally public. Use only secure Vercel server-side environment variables for future Stripe/Supabase secrets.

### Staff roles

| Role | Main purpose |
| --- | --- |
| owner | Owner operations, customer/contact management, bake calendar and public updates |
| baker | Production dates, batch stage, order status and permitted allergy information |
| dispatcher | Read orders and deliveries; update order status |
| support | Read customers/orders and edit customer contacts |

All roles require an explicit active record in \`staff\`, keyed to a confirmed Supabase Auth user. Removing staff membership must revoke staff access; use Supabase Auth session termination when immediate token revocation is required.

## Storefront

The existing one-time cart and Bread Club interest flow still open an **email inquiry** rather than collecting payment. The public \`BakePulse\` section shows either a manually published batch from Supabase or a clearly labelled **just-for-fun, browser-only 35-minute timer**. There is no fake live oven signal.

Product and hero images currently point to external Unsplash URLs; a new brand hero photo has been generated separately but has **not** yet been committed into this repository as a site asset. Production images must be hosted as first-party licensed assets and verified on mobile, desktop and slow networks. Current live site imagery has not been independently verified in a rendered browser.

## Stripe setup — not yet launched

Stripe connection exists in **test mode**, but **there are no Vercel checkout environment variables** and no production webhook/checkout server functions. The database includes server-only reservation and fulfillment function groundwork but is not a complete payment integration.

Required to complete before collecting payments:
1. Implement server-side, signed, idempotent hosted Stripe Checkout for one-time orders, with pickup date, product, quantity, customer contact and capacity/cutoff checks. Make fulfillment transactional with Stripe's verified checkout webhook; test delayed events, refunds, webhook retries, order duplication and concurrency.
2. Build recurring Billing checkout, renewal invoice.paid -> correct bake date orders, skips, cancellations and failed payments. Avoid projecting an unpaid renewal as confirmed production.
3. Set Vercel **server-only** encrypted variables for Stripe secret, Stripe signing secret and Supabase privileged database access. Obtain keys privately in the provider dashboards. Never paste private keys into chat or GitHub.
4. Confirm legal business identity, payment tax handling, receipts, contact/address, refunds and delivery charges; confirm Stripe business/KYC/live-mode eligibility.
5. Run test cards, refund/replay tests and a small soft launch, then flip to live mode deliberately.

## Customer launch blockers / owner decisions

- Exact Calgary pickup location, pickup hours and whether pickup contact info is published.
- Delivery service area (postal codes/radius), price, delivery days and windows.
- Which dates to bake, per-date capacity and order cutoff.
- Final product weights, prices, ingredient/allergen statements and rotating special availability.
- Cancellation/refund/late pickup policy and confirmed marketing-consent/privacy policy.
- Food permits/licensing and any municipal/Alberta food-handling obligations, insurance and final tax determination.
- Customer email confirmations and delivery notifications.
- A real-browser QA run across desktop/mobile, image loading, accessibility, and end-to-end Stripe tests.
- Enable Supabase Auth leaked-password protection if your plan supports it (security advisor currently warns it is disabled).

**Launch status: operations foundation usable for secure staff planning, customer storefront informational/inquiry-only, not ready for paid order launch.** Avoid marketing any date as available for purchase until the payment and capacity system is fully tested.

## Calgary/Alberta legal references to verify before launch

- City of Calgary home-based food business guidance: https://www.calgary.ca/for-business/licences/home-based-food-business.html — bakery operators may need a Food Service - Premises business licence and location approval; location and inspection requirements depend on setup and customer pickup frequency. Verify directly with the City for your kitchen and pickup model.
- Government of Alberta low-risk home-prepared food guidance: https://www.alberta.ca/low-risk-home-prepared-foods — low-risk foods can be sold directly to consumers and online subject to restrictions, food handling and labelling. Confirm sourdough flavours/add-ins meet the applicable category.
- CRA GST/HST place-of-supply guidance: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-place-supply.html — basic groceries may be zero-rated; confirm treatment of your specific loaves, delivery fees and registration obligations with a qualified advisor.

Do not infer that the low-risk provincial food exemption removes municipal licence/location approval requirements. Customer pickup at a residence may affect zoning and approvals.
