# Tasks: Lenses Lineage Stability Bridge

## Discovery

- [x] Hostile review identified destructive goal saves.
- [x] Six Game Master gap analysis identified lineage stability as the next bridge.
- [x] Parent implementation exists in `codex/lenses-onboarding-implementation`.

## Implementation Tasks

- [x] Add `LensGoal.stableKey`.
- [x] Add `LensGoal.supersededById`.
- [x] Add `LensGoal.archivedAt`.
- [x] Add `LensGoal.lineageSnapshot`.
- [x] Add `TapTheVeinTask.attachSnapshot`.
- [x] Add `CustomBar.plantSnapshot`.
- [x] Add TTV daily task rank uniqueness invariant.
- [x] Add keyed workshop option shape.
- [x] Add client `tempKey` handling for unsaved options.
- [x] Normalize legacy string workshop options into keyed options through autosaved draft mode or final-save normalization mode.
- [x] Return canonical server `stableKey` values after save.
- [x] Carry `stableKey` through onboarding/descent clients.
- [x] Add lineage snapshot helper.
- [x] Add live-or-snapshot lineage resolver.
- [x] Add lineage trace source label: `live`, `attach_snapshot`, or `plant_snapshot`.
- [x] Keep attach-time and plant-time snapshots distinct in field names and UI labels.
- [x] Add `supersededById` validation for same-player, same-domain, same-cadence successors.
- [x] Add explicit stable-key/backfill rules for legacy goals and drafts.
- [x] Replace delete/recreate in `saveYearLensFrame`.
- [x] Replace delete/recreate in `saveLensGoalDescent`.
- [x] Match saved goals by `stableKey` only.
- [x] Add referenced-goal detection before delete/archive.
- [x] Implement removed-goal state machine.
- [x] Archive/park/supersede removed referenced goals.
- [x] Delete only unreferenced draft goals.
- [x] Store `attachSnapshot` on TTV task creation.
- [x] Make TTV commit cap/rank atomic.
- [x] Enforce historical rank uniqueness; do not reuse ranks.
- [x] Copy `plantSnapshot` to BAR on plant.
- [x] Build plant-time snapshot when live lineage is available.
- [x] Fail BAR plant if task has stale `lensGoalId` and no snapshot.
- [x] Add reactivation UI for parked yearly domains.
- [x] Add resume UI for parked descent passes.
- [x] Load existing descent drafts/goals into descent editor.
- [x] Add compact lineage viewer for TTV task trace.
- [x] Add planted BAR confirmation trace.

## Verification Tasks

- [ ] Test editing yearly goal preserves `LensGoal.id`.
- [ ] Test editing yearly goal preserves quarterly descendants.
- [ ] Test removing referenced yearly goal parks/supersedes instead of deleting.
- [ ] Test editing quarterly goal preserves monthly descendants.
- [ ] Test TTV task stores `attachSnapshot`.
- [x] Test TTV rapid commits cannot exceed five active tasks.
- [ ] Test TTV rapid commits cannot duplicate `priorityRank`.
- [x] Test completed/composted ranks are not reused.
- [x] Test same-title goals in same domain preserve separate identity.
- [ ] Test BAR plant copies `lensGoalId`.
- [ ] Test BAR plant copies `plantSnapshot`.
- [ ] Test BAR plant fails loudly when lineage is unavailable.
- [ ] Manual flow: create year -> descend -> edit year -> verify descendants.
- [ ] Manual flow: TTV attach -> plant BAR -> verify trace.
- [ ] Manual flow: park domain -> reactivate -> save.

## Product Decisions

- [x] Choose whether removed referenced goals become `parked` or `superseded`.
- [x] Decide whether `stableKey` is generated client-side per option or server-side at first save.
- [x] Decide how much lineage snapshot appears in the compact TTV card versus expanded detail.
- [x] Decide active-only vs historical TTV rank semantics.
- [x] Decide attach-time vs plant-time snapshot semantics.
