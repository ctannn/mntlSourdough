# Customer order notice and bakery cutoff

**No same-day orders or inquiries.** The earliest possible bake date is **tomorrow before 6:00 PM Calgary/Alberta time**. At 6:00 PM or later, the earliest becomes **the day after tomorrow**.

This applies to one-time orders, Bread Club inquiries, pickup and delivery. A requested day must still be published/open, have remaining capacity and meet its own bake-day cutoff. Being the earliest allowed date does **not** guarantee that MNTL can fulfill an order.

| Time a customer requests (Calgary) | Earliest possible bake |
| --- | --- |
| Oct 31, 2026 at 10:00 AM | Nov 1 |
| Oct 31 at 5:59 PM | Nov 1 |
| Oct 31 at 6:00 PM | Nov 2 |
| Oct 31 at 11:30 PM | Nov 2 |
| Nov 1 at 5:00 PM | Nov 2 |
| Nov 1 at 6:00 PM | Nov 3 |

This is a **calendar-day notice rule with a 6 PM previous-day cutoff**, not a strict rolling 24-hour lead. If operational requirements change to a full 24+ hours, update the policy and UI copy together.

## Implementation

- `src/lib/scheduling.mjs`: `earliestCustomerBakeDate(now)`, `isCustomerBakeDateAllowed(date,now)` and `CUSTOMER_BAKE_CUTOFF_HOUR=18` define the authoritative JavaScript rule shared by storefront and API.
- `src/components/FulfillmentPlanner.jsx`: calendar blocks too-soon dates, and explains one-day lead time. A 30-second tick refreshes the policy for customers whose tabs remain open across the cutoff.
- `src/components/CheckoutContact.jsx`: both inquiry and payment submission are disabled for stale dates; the current time is checked again when submitting.
- `src/main.jsx`: checks the rule before opening the mailto order inquiry.
- `api/availability.js`: excludes early dates from online availability even when an old bake-day cutoff allows them.
- `api/checkout.js`: rejects too-soon dates (HTTP 422) before capacity reservation or Stripe; additionally checks the published bake-day cutoff.
- `supabase/migrations/20261031104018_customer_bake_notice.sql`: a database trigger on `checkout_holds` rejects same-day holds and after-6-PM next-day holds, independently of the UI or API. The database uses post-2026 permanent Alberta UTC−6, consistent with the app.
- Bakery staff retain separately authorized manual-order functionality for exceptional situations; this customer-facing rule does not silently override staff authority.

## QA

`tests/order-lead-time.test.mjs` verifies morning eligibility, 5:59 PM versus exactly 6 PM, midnight, December UTC−6, invalid dates and that all relevant frontend/backend paths use the same rule. It runs in `npm run build` through the GitHub Actions workflow.

Verify the database trigger after applying the migration using `pg_trigger` and a rollback-only insert test, without introducing any fake customer or checkout records.

**Email inquiry limitation:** A customer can still send an unrelated email outside the website. The storefront will not generate a same-day inquiry. Only secure checkout, when enabled, is subject to the database reservation guard.

**No Stripe live payments or recurring billing are enabled by this change.**
