# Plan: Lenses Goal-Setting Onboarding

## Strategy

Build Lenses as the upstream goal-imagining and goal-setting flow. Reuse the other branch's Lens/Tap-the-Vein primitives instead of duplicating them.

The Claude Design handoff in `design-handoff/` is the prototype reference. Its strongest product decision is canonical for implementation: goals are authored by the player through a repeated workshop loop, not generated for them.

The implementation should make a clean stack:

```text
Superpower Quiz
  -> Lenses Goal-Setting Onboarding
  -> Yearly domain goals
  -> Quarterly goals
  -> Monthly goals
  -> Weekly actions
  -> Tap the Vein daily tasks
  -> keep/plant/upgrade into BARs
```

## Phase 0: Branch Integration

1. Review merge/cherry-pick path for `remotes/origin/claude/kind-darwin-5pyp5c`.
2. Bring in or reconcile:
   - `Lens` model and migrations,
   - `src/lib/lenses/ensure.ts`,
   - `src/actions/tap-the-vein.ts`,
   - `src/app/tap-the-vein/*`,
   - Observatory skeleton if still desired.
3. Preserve lazy TTV task-to-BAR creation.

## Phase 1: LensGoal Model

1. Add `LensGoal` as a player-owned, domain-scoped goal under a temporal `Lens`.
2. Add `parentGoalId` for year -> quarter -> month -> week lineage.
3. Add nullable `lensGoalId` to promoted BARs and TTV tasks.
4. Add `LensWorkshopDraft` or equivalent persistence for free-write text, candidate options, discarded options, kept order, parked/skipped state.
5. Add tests for parent lineage and domain validation.

## Phase 2: Workshop Authoring Engine

1. Add reusable free-write -> options -> keep state machinery.
2. Inputs:
   - superpower,
   - domain,
   - vague movement statement,
   - dream notes.
3. Support up to 10 candidate options per workshop unit.
4. Support up to 5 kept goals/actions per workshop unit, preserving keep order.
5. Add deterministic superpower/domain prompt seeds as optional examples, not generated goals.
6. Add fallback prompts when no superpower result exists.

## Phase 3: Lenses Onboarding UI

1. Entry after superpower quiz or onboarding.
2. Vague movement prompt.
3. Ten-minute workshop loop across five domains.
4. Options and keep phases per domain.
5. Park domain option with humane framing.
6. Save 1-5 yearly LensGoals per active domain.
7. Show humane closeout: "you have a year frame, not a life sentence."

## Phase 4: Descent UI

1. Quarterly goal creation from every kept yearly goal.
2. Monthly goal creation from every kept quarterly goal.
3. Weekly action creation from every kept monthly goal.
4. Each lower level shows parent goal context.
5. Maintenance/recovery/parked option is first-class.
6. Add a parent goal/lens picker with progress across all active parents so production does not only descend one Health example.

## Phase 5: Tap the Vein Attachment

1. In Tap the Vein commit/keep flow, allow a task to attach to an active weekly/monthly LensGoal.
2. Show the lineage compactly:
   - Weekly -> Monthly -> Quarterly -> Yearly.
3. Keep the five-action cap.
4. Preserve Top 3 as rank 1-3 inside the five kept actions.
5. When task is promoted to BAR, copy `lensId` and `lensGoalId`.

## Phase 6: Humane/Octalysis QA

1. Review copy for shame language.
2. Ensure parked goals are framed as focus.
3. Ensure no streak/failure pressure is added.
4. Ensure prompt seeds/examples are editable, rejectable, and never mandatory.
5. Ensure the flow rewards clarity and authorship, not compliance.

## Likely Files

From the Lens/TTV branch:

- `src/app/tap-the-vein/TapTheVeinRunner.tsx`
- `src/app/tap-the-vein/TaskActionSheet.tsx`
- `src/actions/tap-the-vein.ts`
- `src/lib/lenses/ensure.ts`
- `src/actions/observatory.ts`

New or changed:

- `prisma/schema.prisma`
- `prisma/migrations/*_add_lens_goals/`
- `src/actions/lens-goals.ts`
- `src/lib/lenses/domains.ts`
- `src/lib/lenses/prompt-seeds.ts`
- `src/app/lenses/page.tsx` or `src/app/observatory/lenses/page.tsx`
- `src/app/lenses/onboarding/page.tsx`
- `src/app/lenses/onboarding/LensesOnboardingClient.tsx`
- `src/lib/lenses/__tests__/prompt-seeds.test.ts`
- `src/lib/lenses/__tests__/goal-lineage.test.ts`

## Verification

- Unit test: all five domains are represented.
- Unit test: workshop enforces max 10 options and max 5 kept items.
- Unit test: deterministic superpower/domain prompt seeds do not create mandatory goals.
- Unit test: lower-level LensGoal requires parent or maintenance/recovery/parked classification.
- Unit test: TTV task promotion preserves `lensGoalId`.
- Manual test: new player with superpower result creates yearly goals across all five domains.
- Manual test: create quarterly/monthly/weekly children for multiple parent goals across multiple domains and attach a TTV task.
- Manual test: promote TTV task to BAR and confirm lineage is visible.
