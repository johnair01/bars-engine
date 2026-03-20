# Tasks: Onboarding Quest Generation Unblock

## Phase 1: Quick Wins

- [x] Add `iching` step to STEPS in unpacking-constants.ts (after q7 or before generate)
- [x] Add I Ching step UI in GenerationFlow: Cast button, Select dropdown (1–64), Random option
- [x] Store hexagramId in state; build ichingContext from getHexagramStructure when hexagramId set
- [x] Pass ichingContext to compileQuestWithPrivileging in handleContinue
- [x] Add feedback text input on generate step (when preview shown)
- [x] Add adminFeedback state; pass to compileQuestWithPrivileging on regenerate
- [x] Update buildQuestPromptContext to accept adminFeedback; include in prompt when present
- [x] Add grammatical example (orientation_linear_minimal structure) to compileQuestWithAI system prompt
- [x] Add Regenerate button that uses adminFeedback
- [x] Run npm run build and npm run check — fail-fix

## Phase 2: Skeleton-First (Future)

- [x] Create compileQuestSkeleton (toSkeletonPacket + compileQuestSkeletonAction) → structure-only packet
- [x] Add skeleton review step to GenerationFlow (SkeletonReview component)
- [x] Generate flavor: compileQuestWithAI with adminFeedback from skeleton step (no separate generateFlavorFromSkeleton)
- [x] Wire skeleton → accept → flavor → publish

## Phase 3: Lens as First Choice

- [x] Add getFacesForHexagram (iching-faces.ts) — faces whose trigram matches hexagram upper/lower
- [x] Inject lens-choice node as first node when ichingContext present
- [x] compileQuestWithAI handles lens_choice in spine (7 or 9 nodeTexts)

## Phase 4: CYOA Process

- [x] Refactor GenerationFlow into CYOA passages
- [x] Each step = passage; Back = previous
- [x] Data persists in session

## Verification

- [x] Add cert-onboarding-quest-generation-unblock-v1 to seed-cyoa-certification-quests.ts — see [cert-onboarding-quest-generation-unblock](../cert-onboarding-quest-generation-unblock/spec.md)
- [x] Run `npm run seed:cert:cyoa` when DB is up; run cert quest manually to confirm flow (maintainer)
