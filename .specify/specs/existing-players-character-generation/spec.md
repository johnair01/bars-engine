# Spec: Existing Players Character Generation (Orientation Quest)

## Purpose

Enable existing players who already have nation and archetype choices (`nationId`, `playbookId`) but no `avatarConfig` to generate their character avatar via an orientation quest. New players get `avatarConfig` from CYOA signup or guided flow; existing players have no path until this feature.

## Rationale

- **Backfill gap**: Players who completed onboarding before `avatarConfig` was introduced have WHO (nation, archetype) but no visual identity. The JRPG sprite avatar requires `avatarConfig` to render.
- **Orientation as bridge**: An orientation quest "Build Your Character" provides a guided, narrative path for existing players to claim their avatar without requiring a profile edit or migration script.
- **Game language**: WHO (nation, archetype) maps to visual representation; the quest completes the character creation loop for legacy players.

## User Stories

### P1: Existing player generates avatar via quest

**As an existing player** with nation and archetype already set, I want to complete an orientation quest that derives my avatar from those choices, so I see my sprite in the Conclave.

**Acceptance**: When a player has `nationId` and `playbookId` but no `avatarConfig`, they can complete "Build Your Character" quest; on completion, `avatarConfig` is derived and stored; avatar renders in dashboard header.

### P2: Quest assignment for eligible players

**As an existing player**, I want the "Build Your Character" quest to appear on my dashboard when I have nation/archetype but no avatar, so I know I can claim my character.

**Acceptance**: Orientation thread "Build Your Character" is assigned via `assignOrientationThreads`; players with no active orientation thread (e.g. after completing "Welcome to the Conclave") receive it on next visit.

### P3: Completion effect derives avatar

**As the system**, when a player completes the quest, I want to derive `avatarConfig` from their stored nation/playbook and save it, so the avatar persists.

**Acceptance**: New completion effect `deriveAvatarFromExisting` fetches player's nation/playbook, resolves names, calls `deriveAvatarConfig`, updates `player.avatarConfig`; no-op when player lacks nation or playbook.

### P4: Verification quest

**As a tester**, I want a certification quest that verifies existing players can generate their character via the orientation quest, so I can validate the feature and earn vibeulons. Narrative: preparing the party for the Bruised Banana Fundraiser.

**Acceptance**: `cert-existing-players-character-v1` walks through: use existing player with nation/playbook but no avatar, visit dashboard, complete "Build Your Character", confirm avatar appears.

## Functional Requirements

- **FR1**: Quest engine MUST support completion effect `deriveAvatarFromExisting`. When executed: fetch player's `nationId`, `playbookId`, `campaignDomainPreference`, `pronouns`; resolve Nation/Playbook names; call `deriveAvatarConfig`; update `player.avatarConfig` if non-null.
- **FR2**: Orientation quest "Build Your Character" (id: `build-character-quest`) MUST have `completionEffects: { effects: [{ type: 'deriveAvatarFromExisting' }] }`.
- **FR3**: Orientation thread "Build Your Character" (id: `build-character-thread`) MUST have `threadType: 'orientation'` and contain the single quest; assigned via `assignOrientationThreads` with other orientation threads.
- **FR4**: Quest MUST have a minimal Twine story (one passage with "Confirm" link to end) so completion flows through the existing quest engine.
- **FR5**: Verification quest `cert-existing-players-character-v1` MUST be seeded by `npm run seed:cert:cyoa` (or equivalent).

## Non-functional Requirements

- No schema changes; uses existing `Player.avatarConfig`.
- Effect is idempotent: if player already has `avatarConfig`, re-deriving overwrites with equivalent; if player lacks nation/playbook, effect no-ops.
- Seed script idempotent (upsert by id/slug).

## Out of Scope (v1)

- One-time backfill migration script (optional; can be added separately for immediate fix).
- Targeted assignment (only players with nation+playbook but no avatar); v1 assigns to all via orientation thread system.

## Reference

- Avatar derivation: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts)
- Completion effects: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)
- Orientation threads: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- Seed pattern: [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts)
- Related: [avatar-from-cyoa-choices](../avatar-from-cyoa-choices/spec.md), [jrpg-composable-sprite-avatar](../jrpg-composable-sprite-avatar/spec.md)
