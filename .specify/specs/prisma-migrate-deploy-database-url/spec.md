# Spec: Prisma Migrate Deploy — Graceful Handling When DATABASE_URL Missing

## Purpose

Fix the `npm run build` failure when `DATABASE_URL` is not set. The build script runs `prisma migrate deploy && next build`, and `prisma migrate deploy` requires `DATABASE_URL` to connect to the database. On a fresh clone or in environments without env configured, the build fails with:

```
Error: Environment variable not found: DATABASE_URL.
  -->  prisma/schema.prisma:8
```

**Problem**: Contributors (and CI) may run `npm run build` before setting up `.env.local` or pulling env from Vercel. The failure is opaque and blocks type-checking and Next.js compilation, even though `prisma generate` and `next build` do not require a database connection.

**Practice**: Deftness Development — make build resilient when DATABASE_URL is missing; migrate only when DB is available; preserve full build behavior on Vercel and for developers with env configured.

## Root Cause

- `package.json` build script: `tsx scripts/with-env.ts "prisma migrate deploy && next build"`
- `with-env.ts` loads `.env` and `.env.local`, then execs the command
- `prisma migrate deploy` reads `DATABASE_URL` from the Prisma schema and fails immediately if unset
- `prisma generate` does **not** require DATABASE_URL (schema-only)
- `next build` does **not** require DATABASE_URL (Prisma client is generated; runtime DB access happens at request time)

## User Stories

- **As a contributor** on a new machine, I want `npm run build` to succeed (or fail with a clear message) when I haven't yet run `npm run env:pull`, so I can verify the app compiles and type-checks without a database.
- **As a deployer** on Vercel, I want `prisma migrate deploy` to run during build when `DATABASE_URL` is set, so migrations are applied before the app starts.
- **As a contributor** with env configured, I want the build to behave as today: migrate deploy, then next build.

## Design Decisions

| Topic | Decision |
|-------|----------|
| When DATABASE_URL missing | Skip `prisma migrate deploy`; run `prisma generate` then `next build`. Print a clear warning. |
| When DATABASE_URL present | Run `prisma migrate deploy && next build` as today. |
| Script location | New `scripts/build-with-migrate.ts` (or extend `with-env.ts` with conditional logic). Call from `package.json` build script. |
| Vercel | Vercel sets DATABASE_URL during build; migrate deploy will run. No change needed. |

## Functional Requirements

### FR1: Conditional build script

- **FR1a**: Load `.env` and `.env.local` (same order as Next.js and `with-env`).
- **FR1b**: If `DATABASE_URL` (or `POSTGRES_PRISMA_URL`) is not set: run `prisma generate && next build`. Print: `⚠ DATABASE_URL not set. Skipping prisma migrate deploy. Run npm run env:pull or add DATABASE_URL to .env.local for full build.`
- **FR1c**: If `DATABASE_URL` is set: run `prisma migrate deploy && next build` as today.

### FR2: package.json

- Update `build` script to invoke the new conditional logic (e.g. `tsx scripts/build-with-migrate.ts`).

### FR3: Documentation

- Update `docs/ENV_AND_VERCEL.md` or `docs/DEVELOPER_ONBOARDING.md`: note that `npm run build` works without DATABASE_URL but skips migrations; for full build (including migrations), set DATABASE_URL.

## Non-Goals

- Changing how Vercel or other CI sets DATABASE_URL
- Adding a separate `build:no-migrate` script (the single `build` script handles both cases)
- Requiring a placeholder DATABASE_URL for schema validation

## Verification

- With DATABASE_URL unset: `npm run build` completes successfully; warning printed; Next.js build output present.
- With DATABASE_URL set: `npm run build` runs migrate deploy then next build; no behavioral change.
- Vercel build: continues to work (DATABASE_URL set in project env).

## References

- [scripts/with-env.ts](../../scripts/with-env.ts)
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md)
- [docs/DEVELOPER_ONBOARDING.md](../../docs/DEVELOPER_ONBOARDING.md)
- [.specify/specs/env-seed-scripts-onboarding/spec.md](../env-seed-scripts-onboarding/spec.md) — similar pattern for seed scripts
