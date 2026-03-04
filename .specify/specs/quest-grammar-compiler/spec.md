# Spec: Quest Grammar Compiler (V1) + Segment Variants + Onboarding Refactor

## Purpose

Implement a quest creation grammar that compiles 6 Unpacking Questions + one Aligned Action into an Emotional Alchemy Signature and a mythic initiation onboarding quest thread. Output supports semi-dynamic variants by audience segment (player vs sponsor). The donation moment is both a ritual threshold and a practical transaction. Output is deterministic, testable, and admin-editable.

## Context / Goal

We are shipping v1.0 onboarding. The compiler generates strong "first shot" content with clear metadata and structure to enable manual refinement. **The Campaign Owner** (Allyship Target or Ally in the Mastering the Game of Allyship context) **must be able to input the 6 Unpacking Questions interactively** — oneshot the campaign without editing code. We do NOT use lore dumps; we use curiosity-gated lore (player-pulled, optional, never required). We do NOT do real-time emotional detection; segment-aware variants only. Primary emotional channel is locked across the spine.

**SpecBAR context**: This spec is part of [bruised-banana-launch-specbar](../bruised-banana-launch-specbar/spec.md) — the emergent SpecBAR affecting the Bruised Banana campaign launch thread.

## Conceptual Model (Game Language)

- **WHAT**: Quest (CustomBar) — generated from unpacking answers; editable by admins
- **WHERE**: Segment (player / sponsor) — audience lens; framing differs, spine preserved
- **Energy**: Emotional Alchemy — primary channel (Fear, Anger, Sadness, Joy, Neutrality); movement (Translate / Transcend)
- **Personal throughput**: Epiphany Bridge Micro — 6-beat arc (Orientation → Rising engagement → Tension → Integration → Transcendence → Consequence)

## Definitions

### 6 Unpacking Questions (inputs)

1. What experience do you want to create?
2. How will you feel when you get this? (satisfaction feelings)
3. Compared to that what's life like right now?
4. How does it feel to live here? (dissatisfaction or neutral emotional)
5. What would have to be true for someone to feel this way? (emotional logic)
6. What reservations do you have about your creation? (self-sabotaging beliefs)

### Emotional Alchemy Signature (output)

- Primary Channel: one of Fear, Anger, Sadness, Joy, Neutrality
- Dissatisfied state labels (free text from Q4)
- Target satisfied state labels (free text from Q2)
- Movement type per node: Translate or Transcend
- Shadow voices from Q6 (e.g. "I'm not ready", "I'm not worthy")

### Fractal Storytelling Arc Template (Epiphany Bridge Micro)

All generated quests MUST follow:

1. Orientation
2. Rising engagement
3. Moment of tension
4. Integration (translation)
5. Transcendence (completion)
6. Structural consequence (system + identity shift)

### Curiosity-Gated Lore

- Each node: 0–2 optional lore gates
- ≤ 120 words each
- Player-pulled; never required to progress
- Answers tension already present in spine

### Constraints (Mobile-first)

- Node word count target: 75–200 words
- Choices per node: 2–3
- One primary emotional vector per node
- Depth > width: prefer deeper linear-ish arcs

## User Stories

### P1: Compiler produces QuestPacket

**As an admin**, I want to run `compileQuest` with unpacking answers and aligned action, so that I get a QuestPacket with 6 nodes, signature, and segment variant.

**Acceptance**: `compileQuest(input)` returns QuestPacket with signature, nodes (6 beats), segmentVariant, telemetryHooks. Output is deterministic for same input.

### P2: Segment variants (player vs sponsor)

**As an admin**, I want player and sponsor variants of the same quest, so that framing matches audience intent without changing the emotional spine.

**Acceptance**: Player variant emphasizes participation, discovery, "entering a living world mid-formation". Sponsor variant emphasizes stewardship, catalysis, "protecting emergence". Spine (primary channel, beat sequence) unchanged.

### P3: Ritual + transaction donation moment

**As a visitor**, I want the donation node to feel like a threshold crossing AND a clear transaction, so that I understand both the ritual and practical impact.

**Acceptance**: Donation node frames as ritual crossing; includes practical transaction language. After-donation consequence node includes system event, identity flag (Early Believer / Catalyst), unlock suggestion.

### P4: Curiosity-gated lore

**As a visitor**, I want optional lore expansions I can pull when curious, so that I deepen understanding without blocking progress.

**Acceptance**: Each node may have 0–2 optional lore gates; each ≤ 120 words; always optional; return link to spine.

### P5: Telemetry hooks

**As a developer**, I want QuestPacket to expose telemetry hook interfaces, so that I can wire questStarted, nodeViewed, choiceSelected, donationClicked, donationCompleted.

**Acceptance**: QuestPacket includes telemetry interface; integrate with existing event logging or stub with TODOs.

### P6: Interactive unpacking input (Campaign Owner–facing)

**As the Campaign Owner** (Allyship Target or Ally in the Mastering the Game of Allyship context), I want to input the 6 Unpacking Questions and aligned action through an interactive form or flow, so that I can oneshot the campaign without editing code or seed scripts.

**Acceptance**: Campaign Owner–facing UI (admin or dedicated flow) to enter Q1–Q6 and aligned action; optional segment selection (player/sponsor/both); on submit, compileQuest runs → QuestPacket generated → Passages written or preview shown. Flow can be ritual-style (one question at a time, with space) or form-style.

## Functional Requirements

### Compiler

- **FR1**: `compileQuest(input: QuestCompileInput): QuestPacket` MUST exist. Input: unpackingAnswers (q1–q6), alignedAction, segment ("player" | "sponsor"), optional campaignId.
- **FR2**: Signature extraction: primary channel from Q4/Q5 (keyword heuristics; fallback "Fear" if ambiguous); dissatisfied/satisfied labels from Q4/Q2; shadow voices from Q6 (match known belief strings).
- **FR3**: Spine lock: primary channel MUST remain constant across nodes 1–5.
- **FR4**: Generate 6 nodes following Epiphany Bridge Micro beats. Each node: id, beatType, wordCountEstimate, emotional (channel, movement, fromState?, toState?), text, choices (2–3), optionalLore (0–2), anchors (≥1 of goal, identityCue, consequenceCue).

### Segment lens

- **FR5**: Player variant: participation, discovery, "entering a living world mid-formation".
- **FR6**: Sponsor variant: stewardship, catalysis, "protecting emergence".
- **FR7**: Only framing language + consequence framing differ; emotional spine unchanged.

### Donation node

- **FR8**: Donation node MUST frame as threshold/ritual crossing AND include practical transaction language.
- **FR9**: After-donation consequence node MUST include: system event (donation logged), identity flag (Early Believer / Catalyst), unlock suggestion.

### Quality

- **FR10**: Output MUST be deterministic enough for unit tests.
- **FR11**: Unit tests: signature extraction, node count and beat ordering, constraints (word count, choices per node), segment lens invariants (spine preserved).

### Interactive input

- **FR12**: Campaign Owner–facing UI MUST exist to input Q1–Q6 and aligned action. On submit, call compileQuest and either (a) write Passages to DB, or (b) show preview with option to publish.

## Non-functional Requirements

- Implementation in `src/lib/quest-grammar/` (or `packages/quest-grammar/` if monorepo).
- No AI/LLM calls; heuristic-based for v1.
- Snapshot test with Bruised Banana example input (player + sponsor).

## Deliverables

- `src/lib/quest-grammar/questGrammarSpec.md` — grammar, constraints, output schema
- `src/lib/quest-grammar/types.ts` — QuestPacket, Node, Choice, LoreGate, Signature, SegmentVariant, QuestCompileInput
- `src/lib/quest-grammar/compileQuest.ts` — main compiler
- `src/lib/quest-grammar/__tests__/` — unit tests
- Campaign Owner–facing unpacking input UI — admin or dedicated flow for Q1–Q6 + aligned action (ritual or form style)
- `docs/onboardingRefactorPlan_bruisedBanana.md` — where current flow lives; how to replace with QuestPacket; incremental strategy (flag-based rollout)

## Example Input (Bruised Banana snapshot test)

```
q1: "I want people to donate to the Bruised Banana Residency"
q2: "I will feel triumphant and poignant and blissful"
q3: "I haven't received any donations. People don't know about my app..."
q4: "It's scary to be here. I'm frustrated... I'm anxious..."
q5: "To be anxious I'd have to be worried about the future... money can protect me..."
q6: "I'm not ready, and I'm not worthy"
alignedAction: "Update the onboarding flow... from confused/curious to excited/triumphant about donating and playing"
segment: "player" and "sponsor" (generate both)
```

Intended mapping: Fear channel (Anxiety → Excitement) primary; Anger (Frustration → Triumph) secondary in consequence. Afterglow: Poignance + Bliss.

## Reference

- Preservation strategy: [.cursor/plans/bb_flow_preservation_strategy_cc49be8e.plan.md](../../../.cursor/plans/bb_flow_preservation_strategy_cc49be8e.plan.md)
- Campaign Onboarding Twine v2: [.specify/specs/campaign-onboarding-twine-v2/spec.md](../campaign-onboarding-twine-v2/spec.md)
- Voice Style Guide: [src/app/wiki/voice-style-guide/page.tsx](../../src/app/wiki/voice-style-guide/page.tsx)
