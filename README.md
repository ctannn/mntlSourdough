> **Current status (Oct 29, 2026):** The old demo notes below are historical. The admin now uses live Supabase data with an owner login, bake calendar, recipe totals, customer directory and baker-updated public batch status. Paid checkout and subscriptions are not live. See [the current operations/launch runbook](docs/OPERATIONS-LAUNCH-RUNBOOK.md) for accurate architecture, permissions and launch blockers.

# MNTL Sourdough

Premium sourdough storefront built with React + Vite. Optimized for Vercel.

## Development

```bash
npm install
npm run dev
npm run build
```

## Current ordering model

This is a **pre-commerce inquiry MVP**. Customers can add products, choose one-time or Bread Club interest, select pickup/delivery, and send a pre-filled order inquiry using their email client. There is **no live payment collection, inventory reservation, subscription billing, delivery quote, or customer database** yet. The newsletter is also an email request, not a persisted mailing list.

Before commercial launch, connect a checkout/payment provider, configure taxes, delivery zones, bakery production capacity, actual product photos, legal pages, refund policy, and confirmed email address. Prices and descriptions are editable placeholders and must be approved by the bakery owner.

## Domain

Intended primary domain: runmntl.com. Secondary: runmntl.ca. Configure in Vercel only after verifying ownership and DNS routing.

## Images

Currently uses remote Unsplash reference images. Replace with owned product photography before launch.

## Admin implementation status (October 2026)

Supabase project: `dfyzpflempgtokyhvtlo` (Canada Central). Eleven bakery operations tables have been created with RLS enabled and default-deny permissions. The `/admin.html` UI is currently **sample-data-only** and has no authenticated login. Do not enter real customer or allergy data until staff RLS policies, Supabase Auth, and verified live database queries are implemented. Stripe test mode is connected to the user's account but not integrated with the storefront. A production implementation must use server-side Stripe Checkout and signature-verified webhooks; never expose secret keys in Vite browser bundles. Owner email intended for onboarding: `tancollinn@gmail.com`. Create a fresh password through a private invitation or reset link; never commit or reuse a password shared in chat.

Planned secure wiring: Supabase Auth user -> staff membership -> RLS-protected tables -> orders and customer dashboard -> calendar aggregation -> Stripe webhook-driven subscription state. Vercel hosts the multipage Vite site, with public Supabase URL/publishable key in browser configuration and Stripe secret/webhook keys in server-only configuration.

## Admin sign-in implementation

`admin/main.jsx` now renders `AdminGate` before the operations demo. It authenticates against Supabase Auth password grant and then checks for an active row in `public.staff` for the authenticated user. The Supabase URL and publishable key in browser code are public identifiers, not privileged secrets. **No owner account or staff policies have been provisioned yet**; login will deny access until these are configured. The prototype data remains synthetic and must not be mistaken for live orders. The login currently keeps its session only in React state and does not implement token refresh, persistence, or sign-out; these must be completed before operational use.

Owner onboarding email: `tancollinn@gmail.com`. Never commit passwords or create accounts using a password exposed in chat. Provision a Supabase Auth user with a new private password, insert their UUID into `public.staff` with role `owner`, then create and test restrictive RLS policies before enabling real data access.
