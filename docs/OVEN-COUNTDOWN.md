# MNTL Oven Countdown — baker-facing status, not a visitor timer

## Purpose

The small bar at the top of [runmntl.com](https://runmntl.com) represents **actual MNTL freshness**.

When the baker publishes the estimated time a loaf is next coming out of the oven, the bar shows:

**NEXT LOAF COMING OUT OF THE OVEN IN 28:14**

The clock counts down to the *baker's estimated ready timestamp* in real seconds. Customers cannot start, pause, reset, or influence it. This is not a simulated oven or a marketing scarcity timer.

If no estimate is published, or if it has expired, the site displays a neutral small-batch message with **no countdown**. An estimate is never represented as guaranteed pickup readiness.

## Baker instructions

1. Sign into **/admin** with an authorized owner/baker staff account.
2. Choose **Oven countdown** in the sidebar. Select the bake date you want to update.
3. Choose the truthful current dough stage (mixing, fermenting, shaping, proofing, baking, cooling or ready).
4. Enter **Next loaves out of the oven (Calgary time)** using the local date/time picker. This is interpreted as *Alberta Time*, not the staff device's timezone.
5. Optionally enter a short baker note; avoid promises about customer order pickup.
6. Turn on **Publish this batch on the website**. Until published, nothing from this record should appear publicly.
7. Click **Save bakery oven update**.
8. Check the live top bar in a normal visitor browser; it refreshes from Supabase within 60 seconds.

**Demo Mode** is completely isolated: editing its batch data has no effect on the customer website.

An owner/baker may publish a \`ready\` or \`cooling\` stage without a future ETA; this displays a freshness status, not a running countdown. For other stages, the admin requires a *future* ETA to publish a countdown.

## Technical ownership

- \`admin/main.jsx\` owns the staff form and uses \`admin/bakeTime.js\` for local time conversion.
- \`src/components/BakeExperience.jsx\` owns the published-only REST read and top ribbon.
- \`src/components/batchStatus.js\` owns the pure display decisions and countdown formatting.
- \`src/components/BakeExperience.css\` owns the slim persistent bar and compact Oven explainer.
- \`public.bake_updates\`: **one record per date** with \`bake_date\` as its primary key, \`stage\`, \`estimated_ready_at\`, \`published\`, \`public_note\`, and \`updated_at\`.
- Public access is granted only when \`published=true\` through Supabase RLS.

The source rows are fetched with \`published=eq.true\` and \`bake_date>=today\`, sorted and limited. The client chooses the earliest future ETA among published rows. Already-ready or cooling rows cannot pretend to be a future oven exit. Supabase is read-only for anonymous visitors.

The countdown recalculates against \`Date.now()\` each second and refetches published updates every 60 seconds. This avoids timer drift during an inactive browser tab and never depends on a customer pressing Start. The bar uses CSS sticky positioning independent of the customer's scroll.

## Alberta permanent time (critical, 2026)

Effective **November 1, 2026**, Alberta no longer changes clocks in autumn; **Alberta Time (ABT) stays UTC−6 all year**. A number of older browser time-zone databases still believe \`America/Edmonton\` should become UTC−7 in winter.

From the start of summer time on March 8, 2026, through all dates in the new permanent-time regime, MNTL calculates Calgary wall time explicitly at UTC−6. Before that date, historic IANA offsets still apply. This keeps owner operations and customer countdown dates consistent even if the owner's device is outside Calgary.

References:
- https://www.alberta.ca/albertas-new-time-system-abt
- https://www.ualberta.ca/en/information-services-and-technology/news/2026/alberta-time-technology-impacts.html

## Current scope limits

- **One baker update per calendar date.** The current primary key is a date, not a batch ID. If several batches leave the oven on one day, introduce normalized \`bakery_batches(id UUID PK, bake_date DATE, estimated_ready_at TIMESTAMPTZ, stage, published, public_note, ...)\`, restrictive staff-write and published-only anonymous-read RLS, and an explicit migration. Do not overload one daily row or fabricate sequential future batches.
- This is an ETA, **not** stock availability, a paid order, a pickup reservation, or a guaranteed time. Real capacity and checkout must be validated separately.
- An unresponsive Supabase API causes a neutral message, never a stale countdown.

## Testing

Run \`npm run test\`. The oven-specific tests cover no publication/no timer, earliest future ETA, countdown HH:MM:SS, expired estimates, ready/cooling behavior, and Calgary date calculations across the permanent UTC−6 transition. Verify a real staff-published test ETA separately in a browser before using it in a customer launch.
