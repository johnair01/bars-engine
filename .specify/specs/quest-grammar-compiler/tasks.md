# Tasks: Quest Grammar Compiler (V1) + Segment Variants + Onboarding Refactor

## Phase 1: Types + Spec

- [x] Create `src/lib/quest-grammar/` directory

- [x] Create `questGrammarSpec.md` with grammar, constraints, Epiphany Bridge beats, output schema

- [x] Create `types.ts` with QuestCompileInput, QuestPacket, Node, Choice, LoreGate, Signature, SegmentVariant, TelemetryHooks

## Phase 2: Compiler Implementation

- [x] Implement signature extraction: primary channel from Q4/Q5 (keyword heuristics; fallback Fear)

- [x] Implement dissatisfied/satisfied label extraction from Q4/Q2

- [x] Implement shadow voice extraction from Q6 (match known belief strings)

- [x] Implement 6-node generation following Epiphany Bridge Micro beats

- [x] Apply constraints: 75–200 words per node, 2–3 choices, 0–2 lore gates (≤120 words)

- [x] Implement segment lens: player vs sponsor framing (spine preserved)

- [x] Implement donation node: ritual + transaction framing

- [x] Implement consequence node: system event, identity flag, unlock suggestion

- [x] Add telemetry hooks interface to QuestPacket

## Phase 3: Tests

- [x] Add `signature.test.ts`: primary channel, labels, shadow voices (covered in compileQuest.test.ts)

- [x] Add `nodes.test.ts`: node count (6), beat ordering, word count, choices per node (covered in compileQuest.test.ts)

- [x] Add `segment.test.ts`: spine invariant between player and sponsor (covered in compileQuest.test.ts)

- [x] Add `compileQuest.test.ts`: snapshot test with Bruised Banana example (player + sponsor)

- [x] Ensure determinism: same input → same output

## Phase 4: Interactive Unpacking Input (Campaign Owner–Facing)

- [x] Create Campaign Owner–facing unpacking input UI (admin or dedicated flow)

- [x] Support Q1–Q6 and aligned action input (ritual-style or form-style)

- [x] On submit: call compileQuest → show preview or write Passages

- [x] Optional: segment selection (player / sponsor / both)

## Phase 5: Onboarding Refactor Plan

- [x] Create `docs/onboardingRefactorPlan_bruisedBanana.md`

- [x] Document: where current onboarding flow lives

- [x] Document: how to replace with QuestPacket → Passages → CampaignReader

- [x] Document: incremental strategy (flag-based rollout)

## Phase 6: Integration (Optional, for Campaign Onboarding Twine v2)

- [x] Seed script: call compileQuest for player + sponsor; write to Passages (via publishQuestPacketToPassages)

- [x] API route: serve from Passages when ritual=initiation and segment param

## Verification

- [x] `compileQuest` returns valid QuestPacket

- [x] Bruised Banana snapshot test passes (player + sponsor)

- [x] All unit tests pass
