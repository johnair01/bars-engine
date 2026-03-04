# Plan: Quest Grammar Compiler (V1) + Segment Variants + Onboarding Refactor

## Summary

Add a quest grammar compiler that transforms 6 Unpacking Questions + Aligned Action into a QuestPacket (Emotional Alchemy Signature + 6 Epiphany Bridge nodes). Support player and sponsor segment variants. Include ritual+transaction donation moment and curiosity-gated lore. Produce onboarding refactor plan. Output feeds CampaignReader via Passages (seed script converts QuestPacket → Passages).

## Phase 1: Types + Spec

### 1.1 Create module structure

**Path**: `src/lib/quest-grammar/`

| File | Purpose |
|------|---------|
| `questGrammarSpec.md` | Grammar, constraints, output schema, Epiphany Bridge beats |
| `types.ts` | QuestCompileInput, QuestPacket, Node, Choice, LoreGate, Signature, SegmentVariant, TelemetryHooks |

### 1.2 Type definitions

- **QuestCompileInput**: unpackingAnswers (q1–q6: string), alignedAction: string, segment: "player" | "sponsor", campaignId?: string
- **QuestPacket**: signature, nodes, segmentVariant, telemetryHooks
- **Node**: id, beatType, wordCountEstimate, emotional (channel, movement, fromState?, toState?), text, choices, optionalLore?, anchors
- **Signature**: primaryChannel, dissatisfiedLabels, satisfiedLabels, movementPerNode, shadowVoices

## Phase 2: Compiler Implementation

### 2.1 Signature extraction

**File**: `src/lib/quest-grammar/compileQuest.ts`

- Parse Q4/Q5 for primary channel (Fear, Anger, Sadness, Joy, Neutrality) via keyword heuristics
- Fallback: "Fear" if ambiguous
- Extract dissatisfied labels from Q4, satisfied from Q2
- Extract shadow voices from Q6 (match: "not ready", "not worthy", "not good enough", "not capable", "insignificant", "don't belong")

### 2.2 Node generation

- Generate 6 nodes in order: Orientation, Rising engagement, Tension, Integration, Transcendence, Consequence
- Each node: 75–200 words target; 2–3 choices; 0–2 lore gates (≤120 words each)
- Lock primary channel across nodes 1–5
- Anchors: each node has ≥1 of goal, identityCue, consequenceCue

### 2.3 Segment lens

- Player: participation, discovery, "entering a living world mid-formation"
- Sponsor: stewardship, catalysis, "protecting emergence"
- Apply to framing language and consequence node only; spine unchanged

### 2.4 Donation node

- Identify node containing donation (likely Integration or Transcendence)
- Text: ritual threshold framing + practical transaction language
- Consequence node: system event, identity flag (Early Believer / Catalyst), unlock suggestion

### 2.5 Telemetry hooks

- QuestPacket.telemetryHooks: { questStarted, nodeViewed, choiceSelected, donationClicked, donationCompleted }
- Interface only; no implementation. Caller (CampaignReader) wires to analytics.

## Phase 3: Tests

### 3.1 Unit tests

**Path**: `src/lib/quest-grammar/__tests__/`

- `signature.test.ts`: primary channel extraction, label extraction, shadow voices
- `nodes.test.ts`: node count (6), beat ordering, word count estimate, choices per node (2–3)
- `segment.test.ts`: spine preserved between player and sponsor; framing differs
- `compileQuest.test.ts`: snapshot with Bruised Banana example (player + sponsor)

### 3.2 Determinism

- Same input → same output (no randomness)

## Phase 4: Interactive Unpacking Input (Campaign Owner–Facing)

### 4.1 Unpacking input UI

**Path**: Admin flow or dedicated page (e.g. `/admin/campaign/unpack` or `/admin/quest-grammar`)

- Campaign Owner (Allyship Target / Ally in Mastering the Game of Allyship context) inputs Q1–Q6 and aligned action
- Form or ritual-style flow: one question at a time, with space (or all 6 fields in a form)
- Fields: Q1–Q6 and aligned action
- Optional: segment selection (player / sponsor / both)
- On submit: call compileQuest → show preview or write Passages directly

### 4.2 Publish flow

- Preview: display generated nodes; allow edit before publish
- Publish: write QuestPacket nodes as Passages to bruised-banana-initiation Adventure; activate flow

## Phase 5: Onboarding Refactor Plan

### 5.1 Document

**File**: `docs/onboardingRefactorPlan_bruisedBanana.md`

Contents:
- Where current onboarding flow lives (campaign page, API route, CampaignReader, CampaignAuthForm)
- How to replace: generate QuestPacket for segment A/B → convert to Passages (seed script) → render via CampaignReader → wire donation into existing flow
- Incremental strategy: keep old flow behind flag (`?ritual=initiation`); ship new flow after verification

## Phase 6: Integration (Optional, for Campaign Onboarding Twine v2)

- Seed script: call `compileQuest` for player + sponsor; write nodes as Passages to `bruised-banana-initiation` Adventure
- API route: serve from Passages when `?ritual=initiation&segment=player|sponsor`
- See [campaign-onboarding-twine-v2/plan.md](../campaign-onboarding-twine-v2/plan.md)

## File Structure

| Action | File |
|--------|------|
| Create | `src/lib/quest-grammar/questGrammarSpec.md` |
| Create | `src/lib/quest-grammar/types.ts` |
| Create | `src/lib/quest-grammar/compileQuest.ts` |
| Create | `src/lib/quest-grammar/__tests__/signature.test.ts` |
| Create | `src/lib/quest-grammar/__tests__/nodes.test.ts` |
| Create | `src/lib/quest-grammar/__tests__/segment.test.ts` |
| Create | `src/lib/quest-grammar/__tests__/compileQuest.test.ts` |
| Create | `docs/onboardingRefactorPlan_bruisedBanana.md` |
| Create | Campaign Owner–facing unpacking input UI (admin flow or `/admin/quest-grammar`) |

## Verification

- `compileQuest` returns QuestPacket with 6 nodes
- Signature extraction matches expected for Bruised Banana example
- Player and sponsor variants differ in framing only
- Donation node has ritual + transaction language
- Unit tests pass; snapshot test passes

## Reference

- Spec: [.specify/specs/quest-grammar-compiler/spec.md](spec.md)
- Campaign Onboarding Twine v2: [.specify/specs/campaign-onboarding-twine-v2/spec.md](../campaign-onboarding-twine-v2/spec.md)
