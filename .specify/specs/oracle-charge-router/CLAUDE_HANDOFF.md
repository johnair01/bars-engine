# Claude Code Handoff: Oracle Charge Router

## Objective

Implement the first code slice for the Oracle Charge Router: V1 contracts, pure route logic, draw-gate logic, and tests.

The feature connects NOW, `/iching`, I Ching draws, RTCM clarification, allyship deck cards, Emotional Alchemy, 321, and existing lens quests into one "stuck -> next action" routing layer.

Canonical spec kit:

- `.specify/specs/oracle-charge-router/spec.md`
- `.specify/specs/oracle-charge-router/plan.md`
- `.specify/specs/oracle-charge-router/tasks.md`

Read these first. This handoff summarizes the implementation path, but the spec kit is the authority.

## Repo State Warning

This checkout may be dirty and may not be on latest `main`.

Before implementing:

1. Run `git status --short`.
2. Fetch latest main.
3. Do not blindly merge if the worktree is dirty.
4. Prefer a fresh worktree from latest `origin/main` if this branch has unrelated local changes.

Important context found during planning:

- Latest `origin/main` has NOW's I Ching tool linking directly to `/iching`.
- Older local code may still show NOW linking to `/wiki/iching`.
- Treat `/wiki/iching` as learning/guidebook.
- Treat NOW -> `/iching` as the action/cast path.

## Product Decisions Already Made

### I Ching integration

- V1 wraps the existing `/iching` ritual.
- V1 keeps the current aligned `castIChing` engine.
- Do not switch `/iching` to `castIChingTraditional` in the first slice.
- Do not change I Ching randomness or alignment behavior.
- Changing lines and six-line Game Master mapping are V2 unless product explicitly switches the NOW ritual to traditional casting.

### Scarcity and economy

- 1 free I Ching draw per day in V1.
- Additional same-day I Ching draw costs 1 vibeulon.
- Same-day RTCM clarification costs 1 vibeulon unless an earned clarification token exists.
- Subscription includes access; vibeulons are in-game friction for delay/uncertainty, not a premium upsell.
- Always offer no-spend alternatives.
- 321, Emotional Alchemy, allyship card draw, and quest attachment remain free.

### Intensity and inference

- Do not infer emotional intensity from text.
- Self-reported intensity is canonical.
- Ambiguity and relationality must be explicit player choices/chips, not hidden inference.
- Route from reported intensity, explicit chips, and charge trend.

### Privacy

Split data into:

- private charge history
- shareable oracle artifact
- economy/audit event

Private charge text must never be stored in economy/audit events or attached to quests without player-approved transformation into a shareable artifact.

## Current App Surfaces

Relevant files:

- `src/components/now/NowHome.tsx`
- `src/app/iching/page.tsx`
- `src/components/CastingRitual.tsx`
- `src/actions/cast-iching.ts`
- `src/lib/iching-cast-context.ts`
- `src/components/CastIChingModal.tsx`
- `src/components/dashboard/DashboardTwoChannelHub.tsx`
- `src/lib/allyship-deck/*`
- `src/lib/quest-grammar/resolveMoveForContext.ts`
- `packages/bars-core/src/quest-grammar/resolveMoveForContext.ts`

Current cast flow:

```text
NOW -> /iching -> CastingRitual -> castIChing -> reveal -> acceptReading -> redirect home
```

Target router-aware flow:

```text
NOW -> /iching?source=now
  -> CastingRitual ready
  -> gate
  -> casting
  -> revealed
  -> accepted
  -> charge checkpoint
  -> next-step menu
```

Router mode must disable the current auto-return after accept so the checkpoint and next-step options can render.

## First Implementation Slice

Implement this before UI integration:

1. `src/lib/oracle-charge-router/types.ts`
2. `src/lib/oracle-charge-router/route.ts`
3. `src/lib/oracle-charge-router/draw-gate.ts`
4. `src/lib/oracle-charge-router/__tests__/route.test.ts`
5. `src/lib/oracle-charge-router/__tests__/draw-gate.test.ts`

Do not touch `castIChing` randomness/alignment in this slice.

## Required Types

Move the V1 contracts from `spec.md` into `types.ts`.

Must include:

- `ChargeIntensity`
- `ChargeTrend`
- `ExplicitSignalLevel`
- `OracleSignalChip`
- `OracleRoute`
- `OracleRouteAvailability`
- `OracleRouteDecision`
- `OracleChargeInput`
- `OracleChargeRouteResult`
- `OracleDrawBudget`
- `OracleDrawGate`
- `OracleScarcityPolicy`
- `OraclePrivacyClass`
- `ChargeCheckpointInput`
- `ChargeCheckpoint`
- `PrivateOracleRouteHistory`
- `ShareableOracleArtifact`
- `OracleEconomyAuditEvent`

Use the exact contract from `.specify/specs/oracle-charge-router/spec.md` unless you find a TypeScript issue; if you change it, update the spec too.

## Route Logic

Implement pure `routeOracleCharge(input)` with no database calls, AI calls, casts, or wallet writes.

Basic routing:

- intensity 1-2 + `currentQuestId` -> `existing_lens_quest`
- intensity 1-2 + no current quest -> `emotional_alchemy_move`
- intensity 3 + explicit timing/ambiguity signal -> `iching_draw`
- relational/campaign explicit signal -> `allyship_card`
- intensity 4-5 -> `shadow_321`
- unchanged/increasing charge after lighter move -> `shadow_321`
- prior reading + recent event/question for RTCM path -> `rtcm_clarification`

Fallback behavior:

- If I Ching or RTCM is gated, return `gatedPath` and `fallbackPath`.
- Fallback order:
  1. existing quest attachment
  2. Emotional Alchemy
  3. allyship card for relational/campaign contexts
  4. 321 for high or unchanged/increasing charge
  5. wait until next free draw

Never return an unusable primary recommendation without a no-spend fallback.

## Draw Gate Logic

Implement pure `resolveOracleDrawGate(...)`.

Inputs should include:

- free draws remaining today
- vibeulon balance
- requested route/action
- cost policy
- next free draw time
- reset basis

Expected statuses:

- `not_required`
- `free_available`
- `requires_vibeulon`
- `insufficient_vibeulons`
- `wait_until_tomorrow`

Rules:

- First daily I Ching draw is free.
- Additional same-day I Ching draw costs 1 vibeulon.
- Same-day RTCM clarification costs 1 vibeulon.
- Non-oracle routes are `not_required`.
- Do not spend vibeulons in draw-gate logic. It only reports gate state.

## Tests

Minimum route tests:

- low charge + current quest -> existing lens quest
- low charge + no quest -> Emotional Alchemy
- medium charge + timing unclear -> I Ching
- relational/campaign context -> allyship card
- high charge -> 321
- unchanged/increasing charge -> 321
- gated I Ching -> no-spend fallback
- gated RTCM -> no-spend fallback
- route result has `primaryPath`, optional `gatedPath`, optional `fallbackPath`, and `privacyClass`

Minimum draw-gate tests:

- non-oracle route -> `not_required`
- free draw available -> `free_available`
- exhausted free draw + enough vibeulons -> `requires_vibeulon`
- exhausted free draw + insufficient vibeulons -> `insufficient_vibeulons`
- wait path exposes `nextFreeDrawAt`
- reset basis is included

Privacy tests:

- economy/audit event shape does not include `chargeText`
- quest/shareable artifact requires `approvedByPlayer: true`

## Things Not To Do In First Slice

- Do not change `castIChing`.
- Do not switch `/iching` to `castIChingTraditional`.
- Do not build UI yet.
- Do not add wallet mutation/spend behavior yet.
- Do not add a new database schema unless implementation proves existing event storage cannot work.
- Do not infer intensity from text.
- Do not store private charge text in audit/economy objects.

## After First Slice

Next slices:

1. Wire `resolveOracleDrawGate` into `CastingRitual` with a new `gate` phase.
2. Add router mode to disable auto-redirect after accept.
3. Add post-accept charge checkpoint.
4. Add next-step menu after accepted reading.
5. Add optional charge context persistence.
6. Add economy/audit event persistence.

## Verification Commands

Prefer existing repo scripts where available. Likely useful:

```bash
npm run validate:routes
npm run validate:iching
npm run validate:iching-anthony-moog
```

For new TypeScript tests, follow the local pattern used by nearby tests. If using `tsx`, note that this environment may require running with the repo's local `node_modules/.bin/tsx`.
