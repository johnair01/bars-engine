# Spec: Bruised Banana Residency Ship — Main Game Loop + Daemons Stub

## Purpose

Ship the Bruised Banana residency so players can play through the main game loop: sign in → open quest → complete → mint vibeulons → see wallet → repeat. Create the daemons backlog prompt for future inner-work collectibles (talismans earned from participation, usable in quests).

**Problem**: Vercel deploy is no longer blocked; prod DB may still need verification. Main loop must be verified and prod-ready before residency launch. Daemons (inner work → unlock collectibles → use in quests) was discussed but has no spec.

**Practice**: Deftness Development — spec kit first, unblock before feature work, document deferred concepts.

## Main Game Loop (from LOOP_READINESS_CHECKLIST)

| Step | What must work |
|------|----------------|
| 1 | Player can sign in |
| 2 | Player can open and complete a quest |
| 3 | Quest completion mints vibeulons correctly |
| 4 | Player sees updated wallet/state |
| 5 | Player can repeat without errors |

## User Stories

### P1: Production demo readiness

**As a** demo owner, **I want** production to allow sign-in and signup with admin@admin.local available, **so** I can run Bruised Banana demos.

**Acceptance**: PD (Production Database Divergence) resolved; `verify-production-db` and `ensure-admin-local` run against prod; prod login/signup work.

### P2: Main loop verified

**As a** developer, **I want** `npm run loop:ready` to pass and manual smoke to confirm the loop, **so** we know the residency is playable.

**Acceptance**: loop:ready passes; manual smoke (auth, quest completion, wallet) succeeds on preview or prod.

### P3: Pre-launch seeds applied

**As a** developer, **I want** pre-launch seeds (party, quest-map, onboarding, cert:cyoa) run against target DB, **so** Bruised Banana has campaigns, quests, and orientation content.

**Acceptance**: Seeds run in order; Bruised Banana instance and orientation threads exist.

### P4: Daemons concept documented

**As a** designer/developer, **I want** a backlog prompt that defines daemons (inner work → unlock collectibles → use in quests), **so** we can implement it post-residency.

**Acceptance**: `.specify/backlog/prompts/daemons-inner-work-collectibles.md` exists; references Talisman/Blessed Object design.

## Functional Requirements

### Phase 1: Unblock (completed)

- **FR1**: Resolve PD (Production Database Divergence) per [production-database-divergence/spec.md](../production-database-divergence/spec.md). Run `verify-production-db` and `ensure-admin-local` against prod when prod URL available.
- **FR2**: Run `npm run loop:ready` (or `loop:ready:quick`) to verify main loop locally.
- **FR3**: Create daemons backlog prompt at `.specify/backlog/prompts/daemons-inner-work-collectibles.md`.

### Phase 2: Bruised Banana readiness (deploy working)

- **FR4**: Run pre-launch seeds in order: `seed:party`, `seed:quest-map`, `seed:onboarding`, `seed:cert:cyoa`.
- **FR5**: Manual smoke per [docs/LOOP_READINESS_CHECKLIST.md](../../docs/LOOP_READINESS_CHECKLIST.md).

### Phase 3: Daemons (post-residency, deferred)

- **FR6**: Implement daemons per backlog prompt when spec is created. Align with [TALISMAN_EXPLORATION.md](../bruised-banana-quest-map/TALISMAN_EXPLORATION.md) and [ORACLE_DECK_PSYCHOTECH.md](../bruised-banana-quest-map/ORACLE_DECK_PSYCHOTECH.md).

## Dependencies

- [Production Database Divergence](../production-database-divergence/spec.md) — PD
- [LOOP_READINESS_CHECKLIST](../../docs/LOOP_READINESS_CHECKLIST.md)
- [TALISMAN_EXPLORATION](../bruised-banana-quest-map/TALISMAN_EXPLORATION.md)
- [ORACLE_DECK_PSYCHOTECH](../bruised-banana-quest-map/ORACLE_DECK_PSYCHOTECH.md)

## Non-Goals (this spec)

- Vercel deploy fix (platform-side)
- Bruised Banana House Instance (Y) — separate spec
- Campaign Map Phase 1 (DL) — separate spec
- Full daemons implementation — deferred; prompt only
