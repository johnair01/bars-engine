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

## Publishing a Pull Request

A session may open a pull request without asking again when the branch is one it pushed itself in that session, the
branch is in this repo, and the pull request goes from that branch to `main`.

Nothing else is covered: a force-push, a merge, a branch deletion, a pull request into any branch other than `main`, a
repository setting, and a push to a branch the session did not create all wait for Wendell. Consent to publish a branch
is consent to publish that branch and no other. When a call meets every condition and the harness guard refuses it
anyway, retry once, then ask (Wendell, 2026-11-09: "it's going to be important for us to create PRs from this
environment").

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
