# MNTL conversion polish — November 10, 2026

## What the live audit showed

- Production storefront rendered without JS errors or horizontal overflow at desktop 1440×900 and mobile 390×844. Product imagery loaded successfully.
- Before this change the main order section began at approx. **4,293 px desktop / 5,898 px mobile**. Even with the hero CTA jumping directly to \`#order\`, natural browsing through product cards meant passing the Bread Club, freshness experience, brand story and photo break before reaching the order form.
- Shopify/Stripe checkout is not activated. Newsletter signup is a \`mailto:\` request, not a real subscribed list.
- The Original concept photo and stock variant photos are illustrative rather than verified photos of sold MNTL bakery products. Do not manufacture reviews, countdown urgency or proof of live inventory.

## Changes staged in this release candidate

- Move the existing \`Your loaf. Your way.\` ordering form directly after product cards while preserving section ID, anchor navigation, cart, Bread Club, real bakery freshness timer, brand story and blog. No new page or dependency.
- Add a compact **three-step** guide within the order section: choose loaf, pick bake date (one-day notice), and MNTL confirms by email (no payment).
- Add a quiet **illustrative photography** disclosure beneath product cards.
- Make newsletter's email-app behavior and lack of automatic subscription explicit before the person clicks.
- Add regression tests for ordering placement, truthfulness and responsive layout classes.

## Future design backlog (do not fabricate)

1. Replace concept and stock images with real product photographs: whole Original, cut crumb, seeded variant, weekly special, baker hands and oven workflow. Use consistent warm daylight, crumb texture and real packaging; provide proper alt text and WebP/AVIF derivatives.
2. Introduce a real customer inquiry capture with consent and a baker-visible follow-up queue before upgrading to actual Stripe checkout; do not rely on \`mailto:\` forever.
3. Introduce verified pickup address, operating days, capacity, delivery zone and fees before taking payment.
4. Convert newsletter to a proper opted-in mailing list with a clear unsubscribe mechanism and privacy policy.
5. Add genuine user-supplied reviews only after collecting and obtaining permission to publish them.
6. Revisit whether the Bread Club art block is too promotional; prefer a real baker/process photo to a huge badge.

## Acceptance

- \`npm run build\` runs existing + new tests and builds both Vite entries.
- Test desktop and mobile: source products → order is immediate, Shop buttons still jump to \`#order\`, Bread Club CTA selects subscription mode, date/map/cart intact, no horizontal overflow, signup copy honest.
- Keep Vercel production untouched until PR is reviewed and included in a coordinated release.
