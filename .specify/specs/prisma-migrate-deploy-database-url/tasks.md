# Tasks: Prisma Migrate Deploy — Graceful When DATABASE_URL Missing

## Phase 1: Build Script

- [x] Extend scripts/build-with-env.ts (load env, conditional migrate, run next build)
- [x] package.json build script already uses build-with-env.ts
- [x] When DATABASE_URL unset: skip migrate, run prisma generate + next build, print warning
- [x] When DATABASE_URL set: run migrate deploy then next build

## Phase 2: Documentation

- [x] Update docs/ENV_AND_VERCEL.md with note about build without DATABASE_URL
- [x] Update docs/DEVELOPER_ONBOARDING.md verification table

## Phase 3: Verification

- [ ] Run npm run build with DATABASE_URL unset (e.g. mv .env.local .env.local.bak)
- [x] npm run check passes
