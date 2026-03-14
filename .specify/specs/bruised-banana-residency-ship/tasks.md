# Tasks: Bruised Banana Residency Ship

## Phase 1: Unblock

- [x] Create `.specify/backlog/prompts/daemons-inner-work-collectibles.md` (inner work types, unlock criteria, collectible schema sketch, use-in-quests)
- [x] Run `npm run loop:ready` or `npm run loop:ready:quick` with DATABASE_URL set; fix any failures
  - **Note**: Fixed seed-onboarding-thread.ts playbook→archetype; loop:ready passes.
- [x] When prod DATABASE_URL available: run `verify-production-db` and `ensure-admin-local` against prod
- [x] Verify docs/ENV_AND_VERCEL.md has Production demo readiness runbook (PD FR2)

## Phase 2: Pre-launch (when deploy works)

- [x] Run `npm run seed:party`
- [x] Run `npm run seed:quest-map`
- [x] Run `npm run seed:onboarding`
- [x] Run `npm run seed:cert:cyoa`
- [ ] Manual smoke: auth, quest completion, wallet (LOOP_READINESS_CHECKLIST Section 3)

## Phase 3: Daemons (deferred)

- [x] Create full spec from daemons prompt when ready → [daemons-inner-work-collectibles](../daemons-inner-work-collectibles/spec.md)
- [ ] Implement per spec (Reliquary, talisman earning, use-in-quests)
