# MNTL coordinated production release — October 30, 2026

Release source: reviewed and merged PR #5 at commit `648ec8432528af5c66e30bf76070f2faba3db262`.

This marker intentionally triggers **one Vercel production build** through the repository's `[deploy]` ignored-build convention.

Included:
- The Oven public journal at `/oven` and `/oven/:slug`
- RLS-protected staff blog editor, draft/publish and cover upload
- Locally hosted sharp bread hero and Original images
- Bread Club requested custom cadence (plus weekly, 2-week, 3-week, monthly)
- Existing actual baker-published freshness countdown remains separate

Pre-release checks: GitHub Actions 56/56 tests passed, both Vite entries built. Supabase blog migrations applied and verified (published visible publicly, drafts hidden, staff authors authorized). No real posts inserted. Live Stripe payment flags stay disabled.

After deployment, inspect production state, alias, exact SHA, and runtime logs. This is **not** a claim that all manual browser/mobile acceptance tests are complete.
