# Tasks: Lenses Goal-Setting Onboarding

## Completed Discovery

- [x] Read Fasttrack Planning PDF content.
- [x] Inspect current worktree for existing Observatory/Tap the Vein pieces.
- [x] Inspect `remotes/origin/claude/spec-curie-924a57af2c`.
- [x] Inspect `remotes/origin/claude/kind-darwin-5pyp5c`.
- [x] Identify duplicate risk from rebuilding Lens/TTV primitives.
- [x] Correct spec framing after hostile review: Lenses onboarding is upstream of Tap the Vein.
- [x] Import Claude Design handoff from `BARS Redesign (7).zip` into `design-handoff/`.
- [x] Review Claude Design README and identify prototype-to-product gaps.
- [x] Complete six Game Master review for implementation readiness.

## Spec Updates

- [x] Replace "Daily Lenses only" framing.
- [x] Add five-domain yearly goal-setting flow.
- [x] Add superpower-downstream requirement.
- [x] Add ten-minute dreaming step.
- [x] Add year -> quarter -> month -> week -> day lineage rule.
- [x] Add humane Octalysis alignment.
- [x] Add LensGoal data model direction.
- [x] Add TTV task/BAR `lensGoalId` linkage direction.
- [x] Add Claude Design prompt for prototype-first exploration.
- [x] Incorporate Claude Design's authored free-write -> options -> keep loop.
- [x] Add hard requirement that production descends all active goals across all five domains, not only the Health demo thread.
- [x] Add dream-note persistence direction for free-write and discarded options.

## Implementation Tasks

- [x] Decide merge/cherry-pick path for `remotes/origin/claude/kind-darwin-5pyp5c`.
- [x] Bring in/reconcile Tap the Vein primitives from the other branch.
- [x] Add `LensGoal` Prisma model.
- [x] Add `LensWorkshopDraft` or equivalent persistence for free-write/options/kept order.
- [x] Add `CustomBar.lensGoalId`.
- [x] Add `TapTheVeinTask.lensGoalId`.
- [x] Add domain constants: Relationships, Career, Money, Health, Allyship.
- [x] Add reusable workshop state: free-write -> options -> keep.
- [x] Enforce max 10 authored options per workshop unit.
- [x] Enforce max 5 kept goals/actions per workshop unit.
- [x] Add deterministic superpower/domain prompt seeds.
- [x] Add fallback prompts for players without a quiz result.
- [x] Add Lenses onboarding route.
- [x] Add vague movement prompt.
- [x] Add calm ten-minute timer that never blocks or shames.
- [x] Add yearly free-write/options/keep flow across all five domains.
- [x] Add quarterly goal creation from every kept yearly goal.
- [x] Add monthly goal creation from every kept quarterly goal.
- [x] Add weekly action creation from every kept monthly goal.
- [x] Add parent goal/lens picker and progress UI for all active descent threads.
- [x] Add maintenance/recovery/parked classification.
- [x] Add Tap the Vein task attachment to active LensGoal.
- [x] Ensure lazy task-to-BAR promotion copies `lensId` and `lensGoalId`.
- [x] Show goal lineage on promoted BARs.

## Verification Tasks

- [x] Test all five domains are required/available for yearly onboarding.
- [x] Test workshop max 10 options and max 5 kept.
- [x] Test superpower prompt seeds are deterministic by superpower/domain.
- [x] Test prompt seeds are editable/rejectable and never mandatory.
- [ ] Test parent-child LensGoal lineage.
- [x] Test lower-level goals require a parent or maintenance/recovery/parked classification.
- [ ] Test every kept year goal can receive quarterly descendants.
- [ ] Test TTV task attachment to LensGoal.
- [ ] Test promoted BAR preserves `lensId` and `lensGoalId`.
- [ ] Hostile copy review for shame/streak/failure pressure.
- [ ] Verify implementation passes six Game Master gates in `SIX_GAME_MASTER_REVIEW.md`.
- [ ] Manual new-player flow: superpower quiz -> Lenses onboarding -> yearly goals.
- [ ] Manual descent flow across multiple domains/goals: yearly -> quarterly -> monthly -> weekly -> TTV -> BAR.
- [x] Run Claude Design prototype pass from `CLAUDE_DESIGN_PROMPT.md`.

## PMA alignment — weekly reflection (B2)

- [x] Document three-beat weekly reflection in spec (Clear / Current / Creative).
- [x] Add [COPY_AUDIT_PMA.md](./COPY_AUDIT_PMA.md) — forbidden productivity-planner copy.
- [ ] Implement review beats on Observatory week close UI (links lens-integration P5 / LWX).
- [ ] Wire orphan-quest surfacing to `NextActionBridge` + QLA shadow list.

## Product Decisions Needed

- [ ] Route name: `/lenses`, `/observatory/lenses`, or `/observatory/onboarding`.
- [ ] Whether yearly goal completion requires all five domains or allows parked domains.
- [ ] Whether superpower prompt seeds should use primary only or primary + secondary.
- [ ] Whether weekly hosted/drop-in Lenses belongs in this flow or in a separate offer page.
- [ ] Whether production should allow 1-5 kept yearly goals per domain immediately, or start at 1 active + parked dream notes.
- [ ] Whether Tap the Vein resonance is player-tagged, heuristically suggested, or both.
