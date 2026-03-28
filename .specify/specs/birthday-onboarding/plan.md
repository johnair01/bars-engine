# Plan: Birthday Onboarding

## Architecture

Extends the existing `Instance` model (already in schema) with `vibeData`, `goalData`, and `sourceInstanceId` fields. Adds an optional `instanceId` FK to `Nation` and `Archetype` (null = global, non-null = instance-scoped). New `InstanceExportRequest` model handles the "Fork This Game" export flow. No existing guest onboarding system exists — this is net-new for the `/join/[instanceSlug]` path.

The instance creation wizard lives under `/lobby` (admin + `ENABLE_LOBBY=true` gate). Guest onboarding is publicly accessible at `/join/[instanceSlug]` with no special roles required. Fork wizard is at `/fork-wizard`.

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `prisma/migrations/[ts]_add_birthday_onboarding/` | Extends `Instance`, `Nation`, `Archetype`; adds `InstanceExportRequest` |
| `src/actions/birthday-onboarding.ts` | `createInstance`, `onboardGuest`, `claimForkBar`, `approveExportRequest`, `exportNationToGlobal` |
| `src/lib/birthday-onboarding/generate-instance-bars.ts` | `generateInstanceBars(vibeData, goalData): DraftBar[]` — AI BAR generation via `gpt-4o-mini` |
| `src/lib/birthday-onboarding/generate-guest-content.ts` | `generateNationContent(input)`, `generateArchetypeContent(input)` — AI-assisted nation/archetype descriptions |
| `src/app/lobby/layout.tsx` | Gate: `admin` role + `ENABLE_LOBBY=true`; redirect to `/` otherwise |
| `src/app/lobby/page.tsx` | Instance list: player count, status, pending export requests, copy + reset |
| `src/app/lobby/new/page.tsx` | Route: renders `InstanceCreationWizard` |
| `src/app/lobby/new/InstanceCreationWizard.tsx` | 3-step wizard: vibe interview → campaign goals → review + create |
| `src/app/join/[instanceSlug]/page.tsx` | Route: loads instance, renders `GuestOnboardingWizard` |
| `src/app/join/[instanceSlug]/GuestOnboardingWizard.tsx` | 4-step wizard: vibe check → custom nation → custom archetype → confirmation |
| `src/app/fork-wizard/page.tsx` | 5-step in-game fork wizard with checkboxes |
| `src/app/wiki/fork-your-instance/page.tsx` | Static docs: prerequisites, fork, env, deploy, import |
| `scripts/seed-fork-bar.ts` | Seeds "Fork This Game" BAR in global quest library |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Extend `Instance` with `vibeData?`, `goalData?`, `sourceInstanceId?`; add `instanceId?` to `Nation`, `Archetype`; add `InstanceExportRequest` |
| `src/actions/instances.ts` | Add `copyInstance(instanceId)` — copy config only, no players/BARs |

## Key Patterns

- **Lobby gate is dual**: `player.role === 'admin'` AND `process.env.ENABLE_LOBBY === 'true'`. Either condition alone does not grant access. This is explicit in `layout.tsx`.
- **AI is draft-only**: `generateInstanceBars` creates `CustomBar` records with `status: 'draft'`, `visibility: 'private'`. GM sees them in admin panel before publishing. No AI runs at guest onboarding time.
- **Instance scope via nullable FK**: `Nation.instanceId = null` is global; `Nation.instanceId = instanceId` is instance-scoped. `exportNationToGlobal` sets `instanceId = null`. Simple and reversible.
- **Copy + Reset is config-only**: `copyInstance` copies `vibeData`, `goalData`, `sourceInstanceId`, `name`, `slug` (with suffix). Players and BARs are NOT copied. Clean slate.
- **Fork BAR is in-game**: "Fork This Game" is a real `CustomBar` in the quest library — not a UI shortcut. Claiming it creates `InstanceExportRequest`. This keeps the fork pathway inside the game world.

## Dependencies

- `Instance`, `Nation`, `Archetype` models (existing)
- `src/actions/instances.ts` — existing instance CRUD
- AI SDK: `generateObject` + `gpt-4o-mini`
- `src/lib/auth.ts` — `getCurrentPlayer()`, role check
- AES daily check-in (existing) — gates content pacing; no new pacing system
