# bars-engine Working Memory

## Production Backend Policy (Canonical)
- Production Python backend host is **Render**.
- Treat Railway as **legacy/rollback** only unless explicitly reactivated.
- For any backend runtime/deploy/env change, validate Render impact first.
- If a change mentions Railway config, mirror the same intent for Render (or document why not).

## Environment Bring-up (Current Canonical Flow, 2026-11-04)
- Local-first: a local Postgres and a local database for this workspace. Never the production database.
- Steps (docs/LOCAL_FIRST_TESTING.md):
  1. `scripts/local/dev.sh dev` (starts Postgres, builds and seeds this workspace's database, runs `next dev` on a
     free port and prints the URL)
  2. Test; take pictures with `scripts/local/dev.sh shot /path ...`
  3. `scripts/local/check.sh --build` before pushing
  4. `scripts/local/dev.sh stop`
- `npx vercel env pull` is no longer part of bring-up: it writes production's `DATABASE_URL`, which a dev server now
  refuses (override `BARS_ALLOW_REMOTE_DB=1` only for a deliberate, named exception).

## Verification Checkpoint
- Donation wizard route (port from `scripts/local/dev.sh status`):
  - `http://localhost:<port>/event/donate/wizard?ref=bruised-banana`
- Expected:
  - Wizard renders campaign context for Bruised Banana (run `scripts/local/dev.sh run -- npm run seed:bb-campaign` first on a fresh database).
  - Logged-out flow shows sign-in gate for Time/Space offer BAR creation.

## Operational Notes
- `scripts/local/dev.sh` finds or starts Postgres without Docker (Debian cluster, Homebrew/Postgres.app private cluster, then Docker).
- If `npm run smoke` output disagrees with `npm run diagnose:db`, prefer `diagnose:db` for factual DB source and connectivity.
- Keep migration discipline: use Prisma migrations (`migrate dev`/`migrate deploy`), never `db push` for shared/prod flows.
