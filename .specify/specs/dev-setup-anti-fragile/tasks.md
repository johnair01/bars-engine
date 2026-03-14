# Tasks: Dev Setup Anti-Fragile

## Phase 1: Documentation

- [x] Create `.specify/specs/dev-setup-anti-fragile/INCIDENTS.md` (done in spec kit)
- [x] Create `docs/DB_STRATEGY.md` (migrate vs push, when to use each)
- [x] Update `docs/DEVELOPER_ONBOARDING.md` §4: migrate deploy + full seed sequence
- [x] Add link to INCIDENTS.md from DEVELOPER_ONBOARDING "Common failure modes"

## Phase 2: Loop readiness remediation hints

- [x] Add remediation map to `scripts/loop-readiness.ts` for each failure mode
- [x] "Missing quest: orientation-quest-1" / "system-feedback" → Fix: npm run db:seed or npm run setup
- [x] "Build passes" FAIL → Fix: migrate deploy or db:sync
- [x] Prisma/column errors → Fix: migrate deploy
- [x] Output remediation after each FAIL in summary

## Phase 3: Bootstrap script

- [x] Create `scripts/setup-dev.ts` (env check → migrate deploy → seeds → loop:ready:quick)
- [x] Add `npm run setup` to package.json
- [x] Document in DEVELOPER_ONBOARDING as Option A (recommended)

## Verification

- [ ] Run loop:ready with missing seeds → output includes "Fix: npm run db:seed" or "npm run setup"
- [ ] New developer can run `npm run setup` and reach loop:ready pass
- [x] INCIDENTS.md is linked from failure-mode docs
