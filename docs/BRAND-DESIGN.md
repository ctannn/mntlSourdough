# MNTL storefront visual system — V3

_Maintained alongside \`src/editorial.css\`. Last updated October 30, 2026._

## The customer's direction

The original page had a large empty hero panel and bright green supermarket styling. The second iteration looked too much like a Claude/AI advertisement: soft serif typography, tan/terracotta blocks and vague lifestyle copy. The preferred direction is a **recognizable independent Calgary sourdough brand**, modern, product-led, a little sporty because of the "run MNTL" identity, but not a generic running shoe store.

## Current design system

| Token | Value | Role |
| --- | --- | --- |
| \`--mntl-paper\` | \`#f7f7f2\` | Near-white store canvas |
| \`--mntl-white\` | \`#fffefa\` | Clean navigation surfaces |
| \`--mntl-ink\` | \`#18211d\` | Headlines, CTAs, body text |
| \`--mntl-deep\` | \`#101a16\` | Footer and Bread Club |
| \`--mntl-accent\` | \`#eabd70\` | Small wheat-coloured action highlights |
| \`--mntl-green\` | \`#53694c\` | Restrained secondary accent |
| \`--mntl-border\` | \`#d5dacd\` | Dividers, forms, cards |
| \`--mntl-display\` | Space Grotesk | Bold modern identity, no editorial serif |
| \`--mntl-sans\` | DM Sans | Body copy and controls |

Keep the font-weight hierarchy and product images doing the work. Avoid giant motivational slogans over empty background, massive soft-serif block titles, oversized neon sticker/badges, repeating unnecessary uppercase promo text, and artificially urgent fake countdowns.

## Hero

\`src/components/Hero.jsx\` is isolated from the application-level storefront composition. It has two balanced panels: left for heading/copy/CTAs; right for a high-resolution photo of a sourdough loaf, without text over the bread. Mobile stacks the copy above the photo, keeping the loaf visible.

The copy uses the existing MNTL line **"IT'S JUST BREAD. UNTIL IT ISN'T."** in direct geometric type. Primary CTA goes to the product grid. Secondary CTA goes to the story. Three small brand facts establish craft without reading like a promotion.

### Image status (release candidate)

The initial generated Original images in \`public/images/original*.webp\` were tiny compressed thumbnails and became blurry when stretched. An external Unsplash hero photo also failed to load, leaving a large empty block.

The replacement **ships with the repository**:

- \`public/images/mntl-hero.webp\`: locally hosted 1080×880 WebP sourdough concept photo
- \`public/images/mntl-original.webp\`: locally hosted 820×920 portrait crop
- \`src/components/Hero.jsx\`: first-party hero photo with a local fallback
- \`index.html\`: local hero image preload and first-party social image
- \`src/main.jsx\`: Original product image and large photo-break use local assets; other variants retain remotely hosted placeholders with local fallback

These photos are **AI-generated concept imagery**, not verified photos of MNTL's actual inventory. Replace with professionally photographed MNTL bread before paid launch, with accurate variant-specific images. Never call conceptual photography a guaranteed representation of the delivered item.

## The Oven journal and Bread Club rhythm

**The Oven** in the navigation is now the journal/blog at \`/oven\`, not the bakery clock. It includes a dark MNTL editorial index, featured story, additional article cards, and dedicated reading pages. Staff owners/bakers publish and manage posts in \`/admin\` → **The Oven — Posts**. Public readers see only published posts (Supabase RLS), with an intentional empty state before the first article. See [OVEN-JOURNAL.md](OVEN-JOURNAL.md).

The **small sticky freshness bar** still reports the real baker-published next oven-ready time from Admin → **Oven countdown**, now labeled **FRESHNESS** to avoid confusing it with the blog.

The Bread Club scheduling widget has preset weekly, biweekly, every three weeks, monthly and expandable custom X-day/X-week options. Custom selections are clearly described as **requested rhythms**, not live billing subscriptions.

## Oven freshness bar

\`src/components/BakeExperience.jsx\` now shows only **real baker-published oven estimates** from Supabase. The bar is approximately 43px tall, sticky above the navigation and visible while scrolling. It reads **"Next loaf coming out of the oven in MM:SS"** only with a future ETA set and published by a baker. No customer start/pause controls remain. With no valid time, use a neutral factual brand message. The linked Oven section is compact rather than a massive full-page fake timer.

The explicit Alberta permanent UTC−6 time rule is implemented and tested. For detailed baker workflow and data definitions see [OVEN-COUNTDOWN.md](OVEN-COUNTDOWN.md).

## CSS and component maintenance

- \`src/style.css\` remains the original structural stylesheet for the storefront.
- \`src/editorial.css\` is the **current V3 visual override**. Don't add another styling layer for future redesigns: update the existing V3 tokens and selectors, or progressively extract component styles as the app matures.
- \`src/components/Hero.jsx\` owns the product-led hero.
- \`src/components/BakeExperience.jsx\`, \`batchStatus.js\` and \`BakeExperience.css\` own the real freshness clock.
- \`admin/main.jsx\` plus \`admin/bakeTime.js\` own publishing and UTC/Calgary time conversion.
- Future commerce/fulfillment components being built on feature branches should be merged deliberately; do not overwrite them with old copies of \`src/main.jsx\`.

## QA checklist

Run \`npm run test\` and \`npm run build\`. Check Vercel **READY status for the exact commit**, not just a previous successful deployment. Review desktop 1440/1920px, mobile 360/390/430px, keyboard and reduced-motion behaviour, hero photography crop and product image sharpness. Confirm the bakery bar is truthful both with an active staff-published ETA and with **no** public schedule.

**Deployment warning:** Some commits may be delayed by Vercel build-rate limits if two engineers are deploying rapidly. GitHub commit success does not mean a change is live until the linked Vercel deployment reaches READY.
