# bars-engine Working Memory

## Environment Bring-up (Current Canonical Flow)
- Use Vercel-backed env by default on this machine.
- Steps:
  1. `npx vercel link --yes` (one-time)
  2. `npx vercel env pull .env.local --yes`
  3. `npm run diagnose:db` (verify DB identity + connectivity)
  4. `npm run dev`

## Verification Checkpoint
- Donation wizard route:
  - `http://localhost:3000/event/donate/wizard?ref=bruised-banana`
- Expected:
  - Wizard renders campaign context for Bruised Banana.
  - Logged-out flow shows sign-in gate for Time/Space offer BAR creation.

## Operational Notes
- If local Docker is unavailable, avoid `make dev-local` and local `localhost:5432` workflows.
- If `npm run smoke` output disagrees with `npm run diagnose:db`, prefer `diagnose:db` for factual DB source and connectivity.
- Keep migration discipline: use Prisma migrations (`migrate dev`/`migrate deploy`), never `db push` for shared/prod flows.
