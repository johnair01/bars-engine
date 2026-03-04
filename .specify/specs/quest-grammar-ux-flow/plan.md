# Plan: Quest Grammar UX Flow

## Summary

Implement the Quest Grammar flow: (0) emotional alchemy ontology; (1) multi-select + generation flow as CYOA (one question per passage); (1c) archetype/lens inputs; (2) QuestPacket → .twee; (3) .twee → Adventure + QuestThread; (4) campaign orientation; (5) passage completion, AI generation, recursive generation; (5e) repeatable prompt-to-Twine process and node gap bridging (player-move vs storyteller-story).

## Architecture

```
Generation CYOA (one question per passage)
    → Admin plays through; each passage collects one unpacking datum
    → Q2, Q4, Q6: multi-select (satisfaction, dissatisfaction, self-sabotage)
    → Emotional alchemy move emerges from that data (ontology-driven)
    → Unpacking + emotional alchemy move + next move → AI
    → AI constructs quest overview + .twee
    → Target archetype + developmental lens (admin input) → tailored output
    → QuestPacket / .twee
    → Adventure + Passages + QuestThread + N CustomBars
    → Edit sync; passage completion → completeQuest
    → Recursive: trigger "Generate another quest" from within a quest
```

## Repeatable prompt-to-Twine process

- **Prompt assembly** → buildQuestPromptContext produces structured prompt
- **AI skeleton generation** → AI outputs passage texts, choice labels, targets, emotional metadata
- **Twine conversion** → QuestPacket → Twee 3 format (deterministic)
- **Admin flavor pass** → Edit passage text in-place; preserve structure; choice refinement with validation
- **Publish** → Twee → Adventure + Passages (or append)

Document: `docs/quest-grammar-prompt-to-twine.md` — mechanics, choice patterns, admin workflow. AI skeleton output schema: passages, choices, targets, emotional metadata.

## Phase 5e: Node gap bridging (Storyteller Bridge vs Quest Bridge)

When reviewing a process, admin may realize movement from Node A to Node B needs emotional alchemy.
- **Edge-level UI**: "Bridge this gap" on each transition
- **Admin choice**: "Storyteller Bridge" vs "Quest Bridge" before selecting the emotional alchemy move
- **Storyteller Bridge**: `expandEdgeWithStory(fromNodeId, toNodeId, moveId, context)` → returns multiple passages (Epiphany Bridge structure, no choices). Insert as linear narrative between A and B.
- **Quest Bridge**: `expandEdgeWithQuest(fromNodeId, toNodeId, moveId, context)` → returns QuestPacket whose transformation = that move (choices flavor the path). Insert as playable path between A and B.

## File impacts

| Action | Path |
|--------|------|
| Create | `src/lib/quest-grammar/buildQuestPromptContext.ts` — assembles emotionalSignature, moveType, element, targetArchetype, expected moves, player POV for AI |
| Modify | [.agent/context/emotional-alchemy-ontology.md](../../.agent/context/emotional-alchemy-ontology.md) — 5 elements, WAVE, 15 moves, energy, Control reframe |
| Create | `src/lib/quest-grammar/elements.ts` — element-channel mapping |
| Create | `src/lib/quest-grammar/move-engine.ts` — 15 moves config, energy deltas |
| Modify | [src/lib/quest-grammar/types.ts](../../src/lib/quest-grammar/types.ts) — optional NodeMetadata (element, waveStage, etc.) |
| Modify | [src/lib/quest-grammar/compileQuest.ts](../../src/lib/quest-grammar/compileQuest.ts) — set CustomBar.moveType from alignedAction |
| Modify | [src/app/admin/quest-grammar/UnpackingForm.tsx](../../src/app/admin/quest-grammar/UnpackingForm.tsx) — semantic labels, experience dropdown, move dropdown, model selector, Export .twee button |
| Create | [src/lib/quest-grammar/questPacketToTwee.ts](../../src/lib/quest-grammar/questPacketToTwee.ts) — QuestPacket → Twee 3 string |
| Modify | [src/actions/quest-grammar.ts](../../src/actions/quest-grammar.ts) — createAdventureAndThreadFromTwee, or extend publishQuestPacketToPassages |
| Modify | [prisma/schema.prisma](../../prisma/schema.prisma) — link Adventure ↔ QuestThread (adventureId on QuestThread or questThreadId on Adventure) |
| Create | [src/actions/twee-to-adventure.ts](../../src/actions/twee-to-adventure.ts) — or add to quest-grammar.ts |
| Modify | [src/app/admin/adventures/](../../src/app/admin/adventures/) — edit sync when passage text changes |
| Modify | [src/app/admin/journeys/thread/](../../src/app/admin/journeys/thread/) — edit sync when quest description changes |
| Modify | [src/app/adventures/[id]/play/](../../src/app/adventures/[id]/play/) — passage completion → completeQuest for thread |
| Create | `docs/quest-grammar-prompt-to-twine.md` — mechanics, choice patterns, admin workflow |
| Create | `EdgeBridgeEditor` or extend passage editor — edge-level "Bridge this gap" UI with Storyteller Bridge vs Quest Bridge choice |
| Create | `expandEdgeWithQuest` action — returns QuestPacket (choices flavor path) |
| Create | `expandEdgeWithStory` action — returns multiple passages (Epiphany Bridge, no choices) |

## Schema decision: Adventure ↔ QuestThread link

**Option A**: `QuestThread.adventureId` (optional) — thread can optionally link to an Adventure for play.

**Option B**: `Adventure.questThreadId` (optional) — adventure can optionally link to a thread for completion tracking.

**Recommendation**: Option A. QuestThread is the "source of truth" for quest order; Adventure is the playable CYOA. When a thread is created from .twee, we create both and set `thread.adventureId = adventure.id`.

## Edit sync design

- **Passage** ↔ **CustomBar**: When a passage has `nodeId` that maps to a quest (by position), edits to `Passage.text` should update `CustomBar.description` (or a dedicated field). Vice versa: editing quest in Journeys updates the corresponding Passage.
- **Mapping**: Passage.nodeId = `node_0`..`node_5` (Epiphany) or `stage_1`..`stage_8` (Kotter). ThreadQuest has position 1..N. Map by position: passage at index i ↔ quest at position i+1.

## Passage completion design

- When player reaches a passage that marks completion (e.g. last passage, or BIND marker), call `completeQuest(questId, ...)` for the corresponding quest in the thread.
- Requires: player has ThreadProgress for the thread; we know which passage maps to which quest.
- BIND marker: `[BIND quest_complete=<questId>]` in passage text, or passage metadata.

## Emotional alchemy ontology (Phase 0)

- Expand `.agent/context/emotional-alchemy-ontology.md`: 5 elements, WAVE, 15 moves, energy economy, Control reframe
- Create `src/lib/quest-grammar/elements.ts` — element-channel mapping (Metal=Fear, Water=Sadness, etc.)
- Create `src/lib/quest-grammar/move-engine.ts` — 15 canonical moves config, energy deltas
- Existing `emotional-alchemy.ts` + `deriveMovementPerNode` remain; move engine enriches
- Persist in config/schema so compileQuest and AI prompts consume it

## Mastery and completion rules

| Quest move type | Completion | Implementation |
|-----------------|------------|----------------|
| Wake Up | Choice-based. Pass on passage reach. | No required inputs on end passage. |
| Show Up | Action-based. Pass on action attestation. | End passage MUST have required input; PassageRenderer blocks until filled. |

compileQuest MUST set CustomBar.moveType from alignedAction (Q7). .twee authors: Show Up end passages need `[BIND input_action_attestation required]` or equivalent.

## Onboarding emotional scaffolding

- Ontology documents: Confusion→Metal, expectation violation→Fire
- Passage-to-element/WAVE mapping for bruised-banana-initiation.twee (or mapping doc)
- As onboarding is edited, emotional beats inform the arc

## Generation flow as CYOA (Phase 1b)

- Replace UnpackingForm with a step-by-step flow: one passage per question
- Use CampaignReader or equivalent to render passages; admin clicks choices to advance
- Passages: Start → Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Model → Archetype/Lens → Expected Moves → Player POV (optional) → Generate
- Each passage: chunked text + 1–3 choices (or single "Next" if no branching)
- Data accumulates in state as admin progresses; on final step, pass to compileQuest + AI

## Quest giver mindset: moves and milestones

Quest givers think in **moves** a completer will need. Design in milestones. When players get stuck:
- **Emotional First Aid** — EFAK flow for emotional blocks (Clean Up)
- **Subquests** — Wake Up (learn more), Grow Up (increase capacity). Quest design anticipates these paths.

## Creator POV vs Player POV

- **Creator POV**: Existing 6 questions (q1–q6) + aligned action. What the quest giver wants to create.
- **Player POV**: Player-facing 6 questions (p1–p6). "What does the player want?" Mirrors unpacking flow. Optional at generation; passed to prompt context so AI speaks to player wants.

## Prompt context builder

Create `buildQuestPromptContext(input)` in `src/lib/quest-grammar/` or `src/lib/ai/`:
- Inputs: creator unpacking, player POV (optional), emotional signature, element, target archetype, developmental lens, expected moves, Voice Style Guide ref
- Output: Structured string/object for AI prompt consumption
- Enables traceability and consistent quality

## Dependencies

- BY (Quest Grammar Compiler)
- CC (Quest Grammar Allyship Unpacking) — overlaps Phase 1
- QuestThread, ThreadQuest, CustomBar, Adventure, Passage (existing)
- Archetypes, developmental lens (Game Master faces or equivalent)
