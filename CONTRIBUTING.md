# Contributing to MNTL

This is a production-bound bakery website. Prefer clear, reversible changes over clever code.

## Working agreement

1. **Keep GitHub as the source of truth.** Commit source files, migrations, documentation and deployable optimized public assets. Do not leave deployment-only edits that cannot be reproduced from `main`.
2. **Keep related work together.** Use descriptive commits (`feat:`, `fix:`, `design:`, `assets:`, `docs:`, `chore:`). For nontrivial work, add an entry to `CHANGELOG.md` and update the relevant runbook.
3. **New React features belong in readable components.** Examples: `src/components/Hero.jsx` and `src/components/BakeExperience.jsx`. The original `src/main.jsx` still contains some legacy compact JSX; extract new work into focused components rather than expanding that block.
4. **Build before shipping.** Run `npm run build`, then verify the exact main commit is `READY` on Vercel. Check mobile and desktop layout and the browser console for runtime errors. A successful build is not visual QA.
5. **Preserve privacy and payment integrity.** Supabase secret/service-role and Stripe secret/webhook keys are server-only; never commit them or place them in browser bundles. Keep RLS enabled and restrictive for every exposed table. Only paid orders should count as confirmed production.
6. **Be truthful.** The bakery is inquiry-only until secure checkout is fully working. The Oven tracker is manually entered by bakers. The playful 35-minute timer is not an oven sensor. AI-generated loaf images are conceptual and must be replaced with photos of the actual product before paid launch.
7. **Accessibility first.** Preserve semantic headings, button labels, keyboard focus, responsive design and reduced-motion support.
8. **Version assets.** Store site assets in `public/images/`; use a descriptive kebab-case filename and update the reference and asset provenance in `docs/BRAND-DESIGN.md`.

## Useful files

- [README](README.md): architecture, setup, source map.
- [Design specification](docs/BRAND-DESIGN.md): visual tokens, hero, timer and photo strategy.
- [Operations guide](docs/OPERATIONS-LAUNCH-RUNBOOK.md): baker workflow and launch gating.

## Release discipline

All engineers follow [the shared release and collaboration policy](docs/ENGINEERING-RELEASE-POLICY.md). Routine commits and pull requests are validated by GitHub Actions; do **not** request Vercel deployments for every commit. Meaningful release commits use the `[deploy]` marker and are coordinated with the other engineer, aiming for only 1–3 intentional deployments per day. Before a release confirm that the Vercel Ignored Build Step matches the documented rule.

## Release check

A change is *committed* when GitHub confirms its commit SHA. It is *deployed* only when Vercel reports a READY production deployment with that SHA assigned to `runmntl.com`. Browser/mobile tests must be explicitly verified, not inferred from a build.
