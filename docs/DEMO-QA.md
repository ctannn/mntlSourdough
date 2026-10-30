# MNTL admin demo — click-through QA guide

This is a **safe practice environment** for authorized staff. The fake orders, payments and customers do not exist in the production database or customer storefront.

## Getting into demo

1. Visit https://runmntl.com/admin and sign in with a permitted staff account.
2. Click **Try demo mode** in the left sidebar. The sidebar changes to **SAMPLE DATA** and an amber banner appears at the top.
3. You should see 16 fictional customers, 31 sample orders, recurring subscriptions and several current/upcoming bake dates.
4. Click **Return to live data** when finished. The live dataset is the real Supabase environment and may currently contain no orders. Click **Reset demo** if you want to discard sample changes while staying in Demo Mode.

Demo data is stored **only in your current browser tab's React state**. Reloading the page resets sample changes. Signed-in users alone can access it. No sample record is written into Supabase.

## Hands-on walkthrough

| Screen | What to click | What should happen |
| --- | --- | --- |
| Overview | Today card | Opens today's grouped Bake list |
| Overview | Tomorrow card | Opens tomorrow's grouped Bake list |
| Bake calendar | Any day with a green production count | Opens that date's Bake list |
| Bake list | A customer name in the pick list | Opens their linked customer profile |
| Bake list | The short order number | Opens order detail drawer |
| Orders | The customer name | Opens customer profile with subscriptions and history |
| Orders | The short order number | Opens itemized order info, status, payment and fulfillment |
| Orders | Status dropdown | Updates **demo-only** order status; the dashboard recalculates |
| Customers | First or last name, or **View profile** | Opens the profile drawer |
| Customers | **Edit** | Opens customer edit form |
| Customer profile | Email or phone | Opens email app or dialer if available |
| Customer profile | An order in order history | Opens its order detail drawer |
| Customer profile | **View all customer orders** | Opens the Orders page with customer name already searched |
| Order profile | Customer name | Navigates back to the customer profile |
| Subscriptions | Customer name | Opens customer profile including active or paused plans and next date |
| Deliveries | Date picker, then name | Shows delivery/pickup queue and opens customer profile |
| Live bake timer | Change stage and Save | Updates **only** the demo batch record; does **not** publish to the actual customer website |
| Customers | Add customer | Creates a fictional entry in browser memory |
| Orders | Add manual order | Creates an **unpaid** sample order, linked to a customer and bake day |
| Sidebar | Return to live data | Removes all sample records from view without inserting them into the database |

### Known fixture reference counts

On the date you open Demo Mode, before any edits:

- **Today:** 7 confirmed paid loaves across 4 paid orders (4 Original, 1 Seeded, 2 Weekend); 2 pickup and 2 delivery orders.
- **Tomorrow:** 9 confirmed paid loaves across 4 paid orders (5 Original, 4 Seeded); 2 pickup and 2 delivery orders.
- **Next 7 days:** confirmed totals exclude unpaid orders and separate recurring forecasts.
- **Customers:** 16; **orders:** 31; **subscriptions:** 6, with active, paused and cancelled examples.
- All sample emails end in `@example.com`, and addresses contain deliberately fictional street names and postal codes.

### Example customer profiles

- **Amara Chen:** fictional saved Calgary delivery address, marketing opted in, active weekly Bread Club, past and future order history.
- **Maya Patel:** opted into marketing, active biweekly pickup subscription, order history and saved address.
- **Noah Williams:** no saved delivery address, no marketing permission, no active Bread Club.
- **Lucas Moreau:** a clearly labelled example dietary note, visible only with owner/baker access.

### QA scenarios worth trying

- Create a customer with an existing sample email (even with different letter case): should be rejected as duplicate.
- Try scheduling a bake date that already exists: should be rejected.
- Create a new manual order and confirm its quantity appears under **unpaid**, not the confirmed bake totals.
- Change an order's status to **ready**, then inspect the order and switch between profile/history.
- Edit a customer to withdraw marketing consent; the profile and table must both reflect the change.
- Go back to live data: no fictional customer should appear, no sample batch should appear on the public website.
- Sign out and sign back in: normal Supabase staff access remains required.

## Underlying data guarantees

The fixture generator `admin/demoData.js` reproduces the same entity shapes and join keys as the real relational tables. See [analytics data model](ANALYTICS-DATA-MODEL.md) for actual database constraints and [source tests](../tests/demo-data.test.mjs) for graph validation. The Vercel build runs `npm run test` before compiling.

There is currently no automated browser test of every click, only unit checks and successful Vercel production builds. Use this walkthrough for live UI acceptance testing. Nothing in Demo Mode validates Stripe production payments.

**Never use sample addresses or contacts as real delivery instructions.**
