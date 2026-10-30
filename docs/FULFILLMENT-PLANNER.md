# Fulfillment planner and payment architecture

**Owner handoff — Oct 30, 2026.** Implemented on `feat/customer-fulfillment-planner`. Keep as a preview until the production checklist below is completed and the active MNTL engineer reviews it.

## Delivered customer experience

- Responsive bake calendar with first requested date, weekly or biweekly recurrence and upcoming-date preview. Date-only calculations use Calgary's timezone and are DST-safe.
- Public availability display fetched from `GET /api/availability` when server-side Supabase credentials are configured. Only dates with positive remaining capacity before the cutoff are shown as bookable.
- Customer pickup or delivery selection. Delivery map is interactive **without a Google key** using Leaflet and OpenStreetMap tiles. Tap to place the home entrance pin, drag to fine-tune, or manually enter an address.
- Optional Google Places autocomplete and a draggable Google Maps pin when `VITE_GOOGLE_MAPS_JS_KEY` is configured. The user can also change the street address manually.
- Contact form in the scrolling shopping bag, email inquiries for unavailable configurations, and a server-gated Stripe Checkout redirect for **one-time pickup only**.
- Payment return screen: queries `GET /api/checkout-result` and only says an order is confirmed after a paid order is found in Supabase. Query string alone cannot confirm payment.

**Important:** A calendar date is a preference until a successful server-side hold and verified payment. Address coordinates are a drop-off hint, NOT proof of a valid delivery address or service zone. Email inquiry is not an order.

## Endpoint responsibilities

| Endpoint | Security and intent |
| --- | --- |
| `GET /api/checkout-status` | Public, safe capability/configuration flags; no secrets |
| `GET /api/availability` | Read-only, sanitized bake dates and remaining capacity, no customer fields; uses Supabase service key only on server |
| `POST /api/checkout` | Explicitly gated one-time **pickup** only. Validates buyer and items, resolves current products/prices from DB, calls existing atomic `reserve_checkout` RPC, creates hosted Stripe Checkout, attaches session ID to hold |
| `POST /api/stripe-webhook` | Validates Stripe HMAC signature from raw bytes, live/test mode, paid status, currency, hold ID, amount, then calls existing idempotent `fulfill_checkout` RPC |
| `GET /api/checkout-result` | Fetches Stripe session server-side and checks the matching **paid** order before reporting confirmed |

`server/mntlDb.mjs` is server-only. Never import it from `src/`. Do not expose privileged keys as `VITE_*` variables.

## Required Vercel configuration

**Backend** (Vercel encrypted server environment; never public):

- `SUPABASE_URL`: `https://dfyzpflempgtokyhvtlo.supabase.co` (optional; default is this project).
- `SUPABASE_SERVICE_ROLE_KEY`: securely configured server-side database key; RLS still governs browser usage.
- `STRIPE_SECRET_KEY`: start with test account `sk_test_...`.
- `STRIPE_WEBHOOK_SECRET`: Stripe signing secret for `https://runmntl.com/api/stripe-webhook`; preview/test account needs its own secret as appropriate.
- `MNTL_SITE_URL`: return origin (e.g. `https://runmntl.com`, or a dedicated preview origin).
- `MNTL_PICKUP_ADDRESS`: real, confirmed pickup address provided by bakery owner.
- `MNTL_PICKUP_INSTRUCTIONS`: confirmed pickup hours/instructions (optional).
- `MNTL_PICKUP_ENABLED=true`: owner-controlled confirmation that pickup logistics are approved.
- `MNTL_CHECKOUT_ENABLED=true`: **last activation step**, only after comprehensive test and approval.
- `MNTL_LIVE_PAYMENTS_ENABLED=true`: additional explicit opt-in for a live Stripe secret; keep false/unset in test.

**Maps** (public, restricted browser credentials; optional):

- `VITE_GOOGLE_MAPS_JS_KEY`: Google Maps JavaScript API and Places API (New). Restrict the key to exact MNTL domains (and preview domains), approved APIs, usage budget and alerts. Vite embeds `VITE_*` values in the public JS bundle; never use a secret key.
- Without this key Leaflet/OpenStreetMap provides the draggable map pin; manual address entry remains available.

**No environment variables were set during this work.** Do not paste keys in a chat or code file.

## Bake days & database

Actual production tables: `customers`, `products`, `bake_days`, `orders`, `order_items`, `subscriptions`, `subscription_items`, `subscription_skips`, `checkout_holds`, `stripe_events`.

The existing `reserve_checkout` RPC checks open status, cutoff, current product prices, per-day paid units and unexpired holds with a row lock. It currently rejects delivery, so the new paid checkout also rejects delivery. It returns a hold ID and trusted subtotal. Checkout is limited to supported products and quantities; product prices are never read from user-submitted amounts.

The existing `fulfill_checkout` RPC creates a **paid** order only after Stripe's webhook confirms payment and the database checks the expected hold and total. It prevents duplicate orders by session ID.

Plan baked inventory in `bake_days` before enabling checkout. A successful preview build is **not** a complete payment integration test. Test competing holds, expiry, late/replayed webhooks, delayed network errors, failed payments and refund reconciliation.

## Deliberately unfinished / blocked

1. **Recurring paid subscriptions**: the customer can request a weekly or biweekly schedule, but Stripe Billing renewals, invoice-to-bake-date assignment, skip/pause portal, failed-payment recovery and cancellation reconciliation must be designed and tested before activating recurring charges. The paid backend explicitly rejects subscriptions.
2. **Paid delivery**: delivery zones, fee rules, windows, address validation and capacity must be configured; backend rejects delivery payment rather than making an unpriced promise.
3. **Pickup logistics**: the owner must provide real address/hours; no fake address is seeded.
4. **No actual Stripe/Supabase secrets in Vercel** as of this handoff, so all purchases remain inquiry-only.
5. **Customer emails and refund ledger**: confirmation mail and refund lifecycle still require integration and QA.
6. **Calgary/Alberta licensing, food labeling/allergen, privacy policy and tax determination** remain owner approvals.
7. **Maps pricing/privacy**: Google Places optional; OpenStreetMap tile use must respect its usage policy, and high traffic should use a commercial tile provider with an appropriate agreement.

## Review and tests

Run `npm run test` and `npm run build` (build runs tests first). Tests cover DST and date boundaries, as well as API fail-closed conditions.

Test on Chrome/Safari/Firefox and real mobile devices:
- date navigation and recurring cadence across DST,
- published bake dates vs preferred inquiry-only dates,
- pickup and delivery switches,
- touch map pin placement/drag without Google, and Google Places selection when configured,
- address editable and no default/fake home,
- cart quantity limits and mixed one-time/subscription cart fallback,
- contact fields, request email formatting, and mobile drawer scrolling,
- webhook idempotency, Stripe test cards and order reconciliation,
- no regression to admin, RLS, batch timer, typography and accessibility.

**Release rule:** deploy a preview and verify; merge only after active developer review. Never enable live payment flags just because a Vercel build says READY.
