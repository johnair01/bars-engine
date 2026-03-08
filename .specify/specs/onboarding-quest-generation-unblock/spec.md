# Spec: Onboarding Quest Generation Unblock

## Purpose

Unblock testing of the onboarding quest generation function. The generation process is brittle and inflexible. This spec enables a clear flow: inputs (Unpacking, Domain, Move, I Ching draw) → skeleton → feedback → flavor → finalization. First choice point: developmental lens derived from I Ching lines.

**Problem:** Generated quests are malformed; UI is not intuitive; no I Ching in flow; no feedback loop; no skeleton-first phase.

**Practice:** Deftness Development — spec kit first, quick wins first (I Ching, feedback, grammatical examples), then skeleton phase.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Phased rollout | Phase 1: quick wins (I Ching, feedback, examples). Phase 2: skeleton-first. Phase 3: lens as first choice. Phase 4: CYOA process. |
| I Ching in flow | Add I Ching draw step to GenerationFlow; admin casts or selects hexagram; pass ichingContext to compileQuest. |
| Feedback-driven regeneration | Add adminFeedback field; pass to buildQuestPromptContext; AI incorporates on regenerate. |
| Grammatical examples | Add 1–2 golden path examples to compileQuestWithAI system prompt; constrains output structure. |
| Skeleton-first (Phase 2) | compileQuestSkeleton outputs structure-only; admin reviews; feedback; then generateFlavorFromSkeleton. |
| Lens as first choice (Phase 3) | I Ching lines → available Game Master faces; skeleton's first choice = pick lens. |

## Conceptual Model (Game Language)

- **WHO**: Admin (Campaign Owner) inputs unpacking; generates quest; player receives CYOA
- **WHAT**: Quest packet = Epiphany Bridge + nodes; first choice = developmental lens (from I Ching)
- **WHERE**: Bruised Banana onboarding; Domain = Q1 (Gather Resource, etc.)
- **Energy**: I Ching hexagram → available faces; emotional alchemy signature from unpacking
- **Personal throughput**: Move (Wake Up, etc.) from Q7; lens choice gates narrative path

## User Stories

### P1: I Ching–driven generation

**As an admin**, I want to cast or select an I Ching hexagram when generating an onboarding quest, so the generated quest can align with the hexagram and derive available developmental lenses.

**Acceptance:** GenerationFlow has I Ching step; hexagramId passed to compileQuest; ichingContext available.

### P2: Feedback-driven regeneration

**As an admin**, I want to give feedback when regenerating ("the structure is wrong, add branch at node 3"), so the AI adjusts the next draft.

**Acceptance:** Generate step has feedback text input; regenerate passes adminFeedback to AI; system prompt instructs AI to incorporate feedback.

### P3: Grammatically valid output

**As an admin**, I want generated quests to be structurally valid (reachable completion, no orphan nodes), so I can publish without manual fixes.

**Acceptance:** System prompt includes grammatical example; output validated against schema; simulation passes for golden-path-like flows.

### P4: Skeleton review before flavor (Phase 2)

**As an admin**, I want to review the quest structure (nodes, choices) before AI generates flavor text, so I can correct structure without regenerating prose.

**Acceptance:** Skeleton phase outputs structure-only; admin reviews; feedback; accept → flavor generation.

### P5: Lens as first choice (Phase 3)

**As a player**, I want the first choice in the onboarding quest to be "choose your developmental lens" (from I Ching–available faces), so I pick my narrative path before the story unfolds.

**Acceptance:** When I Ching present, first node is lens choice; options derived from hexagram lines; compiler injects lens-choice node.

## Functional Requirements

### Phase 1: Quick Wins

- **FR1**: Add I Ching draw step to GenerationFlow. Options: Cast (button → API), Select (dropdown 1–64), Random (for testing). Store hexagramId.
- **FR2**: Pass ichingContext to compileQuestWithPrivileging when hexagramId present. Build from getHexagramStructure, hexagram name/tone.
- **FR3**: Add feedback text input on generate step. Pass adminFeedback to buildQuestPromptContext on regenerate.
- **FR4**: Add grammatical example (orientation_linear_minimal.json structure) to compileQuestWithAI system prompt. "Generate structure like this."

### Phase 2: Skeleton-First (Medium-Term)

- **FR5**: compileQuestSkeleton(input, ichingContext?) → SerializableQuestPacket with placeholder text. Structure only.
- **FR6**: Skeleton review UI: show node graph or linear list; feedback input; regenerate skeleton.
- **FR7**: generateFlavorFromSkeleton(skeleton, feedback?) → same structure, prose filled in. AI replaces placeholders.

### Phase 3: Lens as First Choice

- **FR8**: When ichingContext present, derive available faces from hexagram (e.g., getFacesForHexagram or alignment logic).
- **FR9**: Inject lens-choice node as first depth branch or first choice; options = available faces. Compiler supports this.

### Phase 4: CYOA Process (Long-Term)

- **FR10**: Refactor GenerationFlow into playable CYOA passages. Each step = passage; Back = previous; data persists in session.

## Non-Functional Requirements

- Backward compatible: existing GenerationFlow continues to work; new steps optional.
- I Ching step: reuse cast-iching API or add hexagram select; no new external deps.
- Grammatical example: keep prompt size reasonable; 1–2 examples max.

## Verification Quest

- **ID**: `cert-onboarding-quest-generation-unblock-v1`
- **Steps**: (1) Open admin quest grammar. (2) Complete steps including I Ching draw. (3) Generate quest. (4) Give feedback; regenerate. (5) Confirm output is structurally valid. (6) Publish.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [quest-grammar-ux-flow](.specify/specs/quest-grammar-ux-flow/spec.md)
- [quest-grammar-compiler](.specify/specs/quest-grammar-compiler/spec.md)
- [iching-grammatic-quests](.specify/specs/iching-grammatic-quests/spec.md)
- [quest-generation-prompt-contract](../../docs/architecture/quest-generation-prompt-contract.md)
- [quest-bar-flow-grammar](../../docs/architecture/quest-bar-flow-grammar.md)

## References

- [onboarding-quest-generation-unblock.md](../../docs/architecture/onboarding-quest-generation-unblock.md) — analysis
- [src/app/admin/quest-grammar/GenerationFlow.tsx](../../src/app/admin/quest-grammar/GenerationFlow.tsx)
- [src/actions/quest-grammar.ts](../../src/actions/quest-grammar.ts) — compileQuestWithAI
- [fixtures/flows/orientation_linear_minimal.json](../../fixtures/flows/orientation_linear_minimal.json)
