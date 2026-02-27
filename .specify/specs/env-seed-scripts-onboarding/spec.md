# Spec: Seed Scripts and CLI — Env Onboarding

## Purpose
When contributors run seed scripts (or other standalone CLI scripts that use the database) in a new environment, they often see `PrismaClientInitializationError: Environment variable not found: DATABASE_URL`. The failure is opaque and does not point to the fix. Onboarding should be smooth: the codebase should make the required env obvious and actionable.

## User stories
- **As a contributor** setting up the app on a new machine, I want any seed or DB-using script to fail with a clear message telling me how to get `DATABASE_URL` (e.g. run `npm run env:pull` or see docs), so I can fix it without searching the repo or asking the team.
- **As a contributor** who has run `vercel env pull .env.local`, I want seed scripts to load `.env.local` (and `.env`) so that running `npm run seed:cert:cyoa` (or similar) works without extra steps.

## Functional requirements
- **FR1 (Load env)**: Any standalone script that uses the database (e.g. seeds, migrations, dev CLIs) must load environment variables in the same order as the app: `.env.local` first, then `.env` (e.g. via `dotenv`), so that after `npm run env:pull` the script sees `DATABASE_URL`.
- **FR2 (Check before DB use)**: Before using Prisma (or any DB client), the script must check that `DATABASE_URL` (or the project’s chosen env var) is set. If it is missing, the script must exit with a non-zero code and print a short, actionable message that:
  - States that `DATABASE_URL` is required.
  - Points to the canonical doc: [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md).
  - Suggests running `npm run env:pull` (if the user has Vercel access) or `npm run smoke` to verify env and DB.
- **FR3 (Documentation)**: The doc [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md) must include a short “Running seed scripts” (or equivalent) section that states seed scripts require `DATABASE_URL` and that users should run `npm run env:pull` (or obtain env another way) and optionally `npm run smoke` before running seeds.

## Non-functional requirements
- Reuse the same env-load order and messaging as the existing preflight/smoke script where possible.
- No secrets in the repo; only pointers to the doc and npm scripts.

## Out of scope
- Changing how the Next.js app loads env (it already uses `.env.local`).
- Adding i18n or multiple env files beyond the existing pattern.

## Verification
- With `DATABASE_URL` unset, running `npm run seed:cert:cyoa` exits with a clear message and no Prisma stack trace; the message references the doc and `npm run env:pull` / `npm run smoke`.
- After running `npm run env:pull`, running `npm run seed:cert:cyoa` succeeds (assuming DB is reachable).

## Spec Kit backlog prompt
When adding or modifying DB-using scripts, use the prompt in [.specify/backlog/prompts/env-seed-scripts-onboarding.md](../backlog/prompts/env-seed-scripts-onboarding.md).
