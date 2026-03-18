# Spec: Walkable Sprites — Test and Production Release

## Purpose

Define the testing plan and production deployment process for the walkable sprites feature set: avatar config as map gate, MapAvatarGate fallback, Pixi RoomRenderer player sprites, and direction tracking.

**Problem**: Features are implemented but need systematic verification before production. No verification quest exists yet; deployment checklist must be tailored to the new surface area.

**Practice**: Deftness Development — test before deploy; verification quest for UX features; deterministic gates.

## Scope

### Features Under Test

| Feature | Surface | Status |
|---------|---------|--------|
| **Avatar config as map gate** | Lobby, World pages | Implemented |
| **MapAvatarGate** | Shown when no avatarConfig | Implemented |
| **resolveAvatarConfigForPlayer** | Server-side derivation | Implemented |
| **RoomRenderer player sprites** | LobbyCanvas, RoomCanvas | Implemented |
| **setPlayerSpriteUrl, setPlayerDirection** | Pixi RoomRenderer | Implemented |
| **WASD direction tracking** | LobbyCanvas, RoomCanvas | Implemented |

### Out of Scope (Not Yet Implemented)

- Phase 2: Agent sprites
- Phase 3: Replicate asset generation
- Phase 4: Validation script

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Test approach** | Manual verification + automated build/type-check; verification quest for UX |
| **Verification quest** | cert-walkable-sprites-v1 — Twine story walking through Lobby sprite flow |
| **Deploy flow** | Reuse push-to-main-vercel-deploy pattern; add walkable-specific smoke steps |
| **Rollback** | git revert; no schema changes in this release |

## User Stories

### P1: Tester verifies walkable sprites end-to-end

**As a tester**, I want a certification quest that walks me through verifying the avatar gate, entering Lobby with avatarConfig, and confirming the player sprite appears and updates direction with WASD, so I can validate the flow without ad-hoc steps.

**Acceptance**: cert-walkable-sprites-v1 exists; completing it validates the feature and grants vibeulons.

### P2: Developer runs pre-deploy gates

**As a developer**, I want a clear checklist of commands to run before pushing, so I don't deploy broken code.

**Acceptance**: Pre-push checklist (build, type-check, lint, smoke) documented and runnable.

### P3: Developer verifies production after deploy

**As a developer**, I want post-deploy smoke steps for the walkable sprites surface, so I can confirm production works.

**Acceptance**: Post-deploy checklist includes Lobby/World sprite verification steps.

## Functional Requirements

### Testing

- **FR1**: Manual test plan covering: MapAvatarGate (no avatarConfig), Lobby sprite (with avatarConfig), World sprite, WASD direction, fallback (missing sprite → rect).
- **FR2**: Verification quest cert-walkable-sprites-v1: Twine story with steps; CustomBar isSystem, visibility public; seed script idempotent.
- **FR3**: Automated gates: `npm run build`, `npm run build:type-check`, `npm run lint` pass before deploy.

### Production Release

- **FR4**: Pre-push checklist: build, type-check, lint, smoke (if available).
- **FR5**: Commit strategy: single or logical commits; message references walkable sprites.
- **FR6**: Push to main; Vercel auto-deploy.
- **FR7**: Post-deploy verification: home, login, Lobby (with avatarConfig), MapAvatarGate (without).
- **FR8**: Rollback procedure documented (git revert).

## Non-Functional Requirements

- No schema changes in this release; no migration risk.
- default.png must exist in `public/sprites/walkable/` for fallback.
- Env: No new vars for Phase 1 (Replicate is Phase 3).

## Verification Quest

- **ID**: `cert-walkable-sprites-v1`
- **Steps**: (1) Without avatarConfig: go to /lobby → see MapAvatarGate with "Build Your Character"; (2) Complete character or profile to get avatarConfig; (3) Return to /lobby → see map canvas; (4) Confirm player sprite (not green rect) appears; (5) Press WASD → confirm direction updates; (6) Complete quest → receive vibeulons.
- **Narrative**: "Validate the walkable avatar system so guests see themselves in the Conclave space at the Bruised Banana party."
- **Reference**: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [walkable-sprites-implementation](.specify/specs/walkable-sprites-implementation/spec.md)
- [push-to-main-vercel-deploy](.specify/specs/push-to-main-vercel-deploy/spec.md)
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md)

## References

- `scripts/seed-cyoa-certification-quests.ts` — pattern for certification quests
- `docs/LOOP_READINESS_CHECKLIST.md` — loop readiness
- `public/sprites/walkable/default.png` — required for fallback
