# Tasks: Prisma Migrate Deploy — Graceful When DATABASE_URL Missing

## Phase 1: Build Script

- [ ] Create scripts/build-with-migrate.ts (load env, conditional migrate, run next build)
- [ ] Update package.json build script to use build-with-migrate.ts
- [ ] Verify: with DATABASE_URL unset, npm run build succeeds and prints warning
- [ ] Verify: with DATABASE_URL set, npm run build runs migrate deploy then next build

## Phase 2: Documentation

- [ ] Update docs/ENV_AND_VERCEL.md with note about build without DATABASE_URL

## Phase 3: Verification

- [ ] Run npm run build with DATABASE_URL unset
- [ ] Run npm run check
