# Plan: Env onboarding for seed scripts

## Goal
When DATABASE_URL is missing, seed scripts (and other DB-using CLIs) fail with a clear, actionable message and load `.env.local`/`.env` so that after `npm run env:pull` they work without extra steps.

## Implementation (done)

1. **Shared helper**  
   [scripts/require-db-env.ts](scripts/require-db-env.ts): loads `dotenv` for `.env.local` then `.env`; if `DATABASE_URL` (or `POSTGRES_PRISMA_URL`) is missing, prints message pointing to docs/ENV_AND_VERCEL.md, `npm run env:pull`, and `npm run smoke`, then `process.exit(1)`.

2. **Seed scripts**  
   Import the helper first (before `db` or `PrismaClient`):
   - [scripts/seed-cyoa-certification-quests.ts](scripts/seed-cyoa-certification-quests.ts)
   - [scripts/seed-admin-tests.ts](scripts/seed-admin-tests.ts)
   - [scripts/seed-validation-quest.ts](scripts/seed-validation-quest.ts)
   - [scripts/seed-onboarding-thread.ts](scripts/seed-onboarding-thread.ts)

3. **Documentation**  
   [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md): added "Running seed scripts" section stating seeds require DATABASE_URL and to run env:pull (and optionally smoke) first.

## Verification
- With DATABASE_URL unset: `npm run seed:cert:cyoa` exits with the friendly message (no Prisma stack trace).
- After `npm run env:pull`: `npm run seed:cert:cyoa` runs successfully (if DB is reachable).

## Future scripts
Any new standalone script that uses the database should add `import './require-db-env'` (or the appropriate relative path) before importing `db` or instantiating `PrismaClient`.
