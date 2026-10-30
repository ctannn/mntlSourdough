# MNTL — visual system & storefront handoff

_Last revised 2026-10-29. Built for the MNTL Sourdough project, `runmntl.com`._

## Design decision

The original version had an oversized uppercase headline, a near-empty dark-green right half, high-saturation lime accents and grocery-store promotional styling. The user requested **a filled hero, a batch timer that follows scrolling, and a more premium, less supermarket-like identity**.

The revised direction is **an independent neighbourhood bakery with a restrained editorial voice**: tactile parchment backgrounds, deep espresso, terracotta-brown accents, warm bread photography and elegant serif display text. The outcome should feel like a beautiful coffee-table food magazine that also happens to sell sourdough.

## Design tokens

Located at the top of `src/editorial.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--mntl-parchment` | `#f5efe7` | Main page background |
| `--mntl-paper` | `#fbf8f2` | Light card surfaces |
| `--mntl-ink` | `#29211d` | Body text |
| `--mntl-coffee` | `#241b17` | Footer, sticky timer, hero base |
| `--mntl-rust` | `#ad7655` | Quiet accent / selected controls |
| `--mntl-wheat` | `#e8c6a3` | Primary CTA / selected highlights |
| `--mntl-border` | `#d9c9bb` | Dividers |
| `--mntl-serif` | Cormorant Garamond | Editorial display titles |
| `--mntl-sans` | DM Sans | Product descriptions / commerce controls |

Avoid fluorescent green, generic rounded supermarket offer cards, overly aggressive sale language, artificial countdown scarcity and oversized sticker/badge art.

## Source structure

- `src/style.css` contains the original site's layout primitives, sections and responsive rules.
- `src/editorial.css` is deliberately loaded **after** `style.css`; it overrides the existing look and provides the current design tokens. Keep new design decisions in the editorial file while the storefront is being modernized. A future cleanup may fold proven overrides into component-scoped CSS to reduce specificity.
- `src/components/BakeExperience.jsx` and `BakeExperience.css` own all public oven/bake-timer UI. Do not duplicate Supabase polling in the storefront component.
- `public/images/original.webp` is a **local, compact image variant**, generated from an AI-created sourdough photo; the same source is used as the hero and Original product image. The source image is a **visual concept**, not evidence of actual produced stock.

## Hero specification

- Full-bleed photographic background with the crusty loaf occupying the **right** half. Text starts on the left with a soft black/espresso gradient for contrast. Never leave the right side plain green.
- Display: `It's just bread. / Until it isn't.` in sentence-case serif, with an italic warm-beige final phrase.
- Primary CTA: `Meet your next loaf` scrolls to the product catalog. Secondary link: `Our story`.
- Below the copy: a restrained three-value list. Removed the large neon green circle and exaggerated ALL-CAPS headline.
- At narrower viewports, keep the loaf visible behind the text and strengthen the legibility gradient. Avoid horizontal scroll.

## Persistent oven ribbon

- Sticky horizontal strip at **top: 0**, ahead of the regular navigation.
- Shows today's published stage and an optional estimated finish time **only if** the staff system has published one for the current Calgary date.
- If no batch is published, the ribbon explicitly labels a **35-minute personal bread-break timer**. Visitors can Start/Pause in the ribbon and Reset in the expanded Oven section.
- `BakeExperienceProvider` holds one shared state for both UI surfaces. The update fetch is polled every 90 seconds and requires no private keys. The elapsed timer is not tied to staff production or checkout.
- Mobile collapses text to the crucial stage/countdown and keeps the action accessible.
- A baker's estimated-ready time must be framed as an **estimate**, never a pickup promise.

## Product image handoff

`The Original` uses the generated/local photo `/images/original.webp`. The image is already committed to GitHub and deployed by Vercel. It is intentionally a small optimized concept variant to make local rendering reliable even when third-party networks fail. **Before paid launch, obtain real photographs of the produced loaf** and replace this image with responsive high-resolution `original-640.webp`, `original-1200.webp`, etc. Then point `photos.classic` and `photos.hero` in `src/main.jsx` to the new assets. Preserve intrinsic image dimensions, alt text and lazy loading below the fold.

Other loaf images and the photo-break currently use third-party Unsplash references and must be replaced with brand-owned images. Until then, existing image fallback handling remains enabled.

## Engineering and QA

- Build: `npm run build` should emit both index and admin entries.
- Vercel: check deployment commit SHA and state READY before claiming the change is live.
- Desktop: inspect 1440-1920 px (hero balance, photo crop, typography, header).
- Tablet: inspect 768-1024 px (navigation spacing, intro, cards).
- Mobile: inspect 360, 390, 430 px (sticky bar, menu, hero crop, CTAs and cart).
- Accessibility: keyboard navigation, visible focus, sufficient contrast on photo, semantic headings, descriptive alternative text, no automatic motion when prefers-reduced-motion.
- Performance: local/owned hero image, WebP responsive sources, caching headers, do not poll bakery data more often than necessary.
- Truthfulness: no manufactured sales urgency, fake live oven telemetry, fake buyer reviews or subscriptions marketed as active before billing is integrated.

This is a **design handoff**, not a claim that checkout has launched. See `docs/OPERATIONS-LAUNCH-RUNBOOK.md` for backend and legal launch requirements.
