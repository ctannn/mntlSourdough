# Coordinated MNTL engineering and deployment policy

This is the shared agreement for the storefront engineer, customer-experience engineer and future maintainers.

## Work together without collisions

- GitHub `main` is the integration source of truth. Start every feature branch from the latest `main`; inspect recent commits and existing PRs first. Never overwrite a teammate's changes to get a build passing.
- Isolate changes in focused components, tests and documentation. Avoid broad edits to `src/main.jsx`, `src/editorial.css`, the baker ETA logic, the admin data model, and Supabase SQL unless absolutely necessary; explain those edits in the PR.
- One branch per change set. Open a PR with the problem, implementation, risk, tests, and release plan. Merge only after checks pass and review is complete.
- Use the existing GitHub Actions `MNTL checks` workflow to test and build on PRs. **A GitHub Actions build is not a Vercel deployment.** Run `npm run build` locally when possible and keep code reviews explicit.
- No fake checkout confirmations, invented bake times, stale pickup addresses, untested credentials, or production-demo cross-contamination.

## Vercel budget: 1–3 meaningful deployments per day

Vercel project `mntl-sourdough` uses the following *Ignored Build Step* configuration:

```bash
node -e "process.exit((process.env.VERCEL_GIT_COMMIT_MESSAGE||'').includes('[deploy]')?1:0)"
```

Vercel semantics: **exit 0 skips** the build; **exit 1 builds**. Normal commits (`feat:`, `fix:`, `docs:`, `test:`, etc.) therefore should not deploy. To request a real build for a validated feature or release, include **`[deploy]`** in that exact commit message.

This rule applies to Vercel Git deployments only. A manual deployment or Vercel setting change can still create builds, so both engineers should coordinate those too. The build trigger is a *coordination gate*, not a hard per-day quota or a security boundary. Keep count manually or through Vercel history; target **1–3 deliberate deployments per calendar day** (Calgary time), with exceptions only for urgent production fixes. Protect production through approvals and required CI checks.

**Release sequence:**
1. Batch relevant code changes together. Confirm latest `main`, no overlapping PR conflicts, and successful GitHub Actions checks.
2. Review owner-controlled flags (checkout stays disabled without secure Stripe secrets, published bake availability and approved pickup logistics).
3. Designate a single approved release commit carrying `[deploy]` (in its commit message). Coordinate with the other engineer before pushing it to `main`.
4. Inspect Vercel for that exact Git commit SHA. Verify target environment and READY state, not merely that `npm run build` passed.
5. Conduct smoke tests on desktop and mobile: real oven countdown, catalog, cart, date/calendar, map/pin, inquiry flow, staff authentication, demo/live isolation, and error logging.
6. If the rollout fails, follow the existing operations runbook and revert or roll back. Never keep pressing Deploy on each small fix.

**Operational note:** The Vercel project's Ignored Build Step setting must be checked in the Vercel UI under Project → Settings → Git → Ignored Build Step after changes. Its API response may omit that property. A GitHub commit marked `[deploy]` can still fail for account build quota, billing, or configuration; do not interpret silence as READY.

## Ownership and quality focus

- **Storefront/brand engineer:** photography, bold visual identity, oven clock, branding, editorial responsive design and public bake content.
- **Customer journey engineer:** purchasing UX, interactive pickup/delivery/date selectors, accessibility, analytics event model, test coverage, privacy and integration hygiene.
- **Shared:** cart and `src/main.jsx`, server endpoints, Supabase schema/RLS, Stripe checkout and production release. Coordinate shared-file edits in a PR before merging.

## Working backlog

- Add authenticated owner-configurable pickup points, bake slots and delivery zones before paid checkout.
- Finish paid subscription billing and skip/pause/cancel flows; maintain idempotent invoice/order reconciliation.
- Validate address provider selection and delivery-fee computation without storing raw customer location unless needed.
- Add automated end-to-end mobile/browser tests and lightweight funnel analytics (view product → add to bag → start checkout → paid/order confirmed).
- Align `README.md` launch statements with actual capabilities, while keeping the current paid status explicit.
