# Plan: Lenses Lineage Stability Bridge

## Strategy

Fix identity and lineage before polishing the user experience.

The next patch should be mostly Regent/Architect work:

```text
stable LensGoal identity
  -> non-destructive save behavior
  -> lineage snapshots
  -> atomic TTV commit
  -> reactivation UI
  -> lineage viewer
```

## Phase 1: Model Additions

1. Add `LensGoal.stableKey` and backfill existing goals.
2. Add archival/supersession fields to `LensGoal`.
3. Add `TapTheVeinTask.attachSnapshot` and `CustomBar.plantSnapshot`.
4. Add DB-level uniqueness invariant for TTV daily task rank.
5. Add indexes for `supersededById`, `archivedAt`, and `lensGoalId` if needed.
6. Regenerate Prisma client.

## Phase 2: Workshop Option Identity

1. Replace persisted option strings with keyed option objects.
2. Support client `tempKey` for unsaved options.
3. Normalize legacy string options into `{ stableKey, text }` through autosaved draft mode or final-save normalization mode.
4. Return canonical server `stableKey` values after save.
5. Ensure the client carries `stableKey` through later edits.
6. Add tests for duplicate same-title goals.

## Phase 3: Lineage Snapshot Helpers

1. Build `loadLensGoalLineage(goalId, playerId)`.
2. Build `buildLensGoalSnapshot(goalId, playerId)`.
3. Build `resolveLensGoalTrace({ lensGoalId, attachSnapshot, plantSnapshot })`.
4. Implement precedence: live chain first, immutable snapshot fallback.
5. Add source labels: `live`, `attach_snapshot`, or `plant_snapshot`.
6. Add pure/DB-backed tests where feasible.

## Phase 4: Non-Destructive Goal Saves

1. Replace delete/recreate in `saveYearLensFrame`.
2. Replace delete/recreate in `saveLensGoalDescent`.
3. Match existing goals by stable key only.
4. Implement removed-goal state machine.
5. Archive/park/supersede removed referenced goals.
6. Delete only unreferenced drafts.
7. Validate `supersededById` successors by same player/domain/cadence except explicit migration/admin repair.

## Phase 5: Atomic TTV Commit

1. Move active task count and create into a transaction.
2. Add DB-level unique rank invariant for historical daily rank.
3. Prevent duplicate `priorityRank`.
4. Store attach snapshot on task creation.
5. Add tests for cap behavior and rank behavior.

## Phase 6: BAR Plant Lineage

1. Require valid live goal or task snapshot before copying lineage.
2. Build plant snapshot from live lineage when available.
3. Fall back to task attach snapshot only when live lineage is unavailable.
4. Fail loudly when lineage cannot be resolved.
5. Show lineage trace after planting.

## Phase 7: Park/Reactivate UX

1. Add “Make active” for parked yearly domains.
2. Add “Resume” for parked descent passes.
3. Load existing descent drafts/goals into the descent client.
4. Avoid trapping users in empty keep screens.

## Phase 8: Lineage Viewer

1. Add shared lineage trace component/data shape.
2. Render source badge: `live`, `attach_snapshot`, or `plant_snapshot`.
3. Add compact TTV task trace.
4. Add planted BAR confirmation trace.

## Phase 9: Verification

1. Test edit-year-goal preserves ID.
2. Test edit-year-goal preserves quarterly children.
3. Test removed referenced goal parks/supersedes instead of deleting.
4. Test TTV task snapshot creation.
5. Test BAR snapshot copy.
6. Test TTV cap/rank under simulated rapid commits.
7. Test same-title goals retain separate identity.

## Likely Files

- `prisma/schema.prisma`
- `prisma/migrations/*_lenses_lineage_stability/`
- `src/actions/lens-goals.ts`
- `src/actions/tap-the-vein.ts`
- `src/lib/lenses/lineage.ts`
- `src/lib/lenses/workshop-options.ts`
- `src/lib/lenses/workshop.ts`
- `src/lib/lenses/types.ts`
- `src/app/lenses/onboarding/LensesOnboardingClient.tsx`
- `src/app/lenses/descent/LensesDescentClient.tsx`
- `src/app/tap-the-vein/TapTheVeinClient.tsx`
- `src/lib/lenses/__tests__/lineage.test.ts`
- `src/lib/lenses/__tests__/workshop.test.ts`
- `src/lib/tap-the-vein/__tests__/commit-policy.test.ts`
