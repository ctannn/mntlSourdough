# MNTL production release — Shop the Loaves navigation (October 31, 2026)

Reviewed PR: https://github.com/ctannn/mntlSourdough/pull/7
Merged code commit: `b07f5825feb21262d2559b7808a9b74047690015`.

**Requested change:** Every **Shop the Loaves** button and shopping nav link now takes the visitor directly to **Your loaf. Your way.** (`#order`) to choose order type, loaf, pickup/delivery, preferred date, and review the bag. The editorial **Meet the Bread** link still intentionally opens the product showcase.

The experience preserves smooth same-page scrolling and handles deep links from `/oven` using `/#order` after the storefront mounts. Scrolling aligns the form heading below the baker freshness ribbon.

**Pre-release:** GitHub Actions **71/71 passing tests**, full Vite storefront + admin build passed; source review and explicit CTA regression tests. The merge commit itself was skipped by Vercel's ignored-build gate, so this `[deploy]` release commit is the one production build trigger.

**Out of scope:** Live checkout remains inquiry-first; no payment or bakery scheduling settings were changed.

**Verify after deployment:** exact commit SHA, Vercel READY, runmntl.com and runmntl.ca aliases, and that the header/hero click navigates to the intended form.
