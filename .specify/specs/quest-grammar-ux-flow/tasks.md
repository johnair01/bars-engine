# Tasks: Quest Grammar UX Flow

## Phase 0: Emotional alchemy ontology (Foundation)

### Phase 0a: Ontology and move engine
- [x] Map out emotional alchemy moves (translate, transcend) with narrative meaning
- [x] Create ontology doc: `.agent/context/emotional-alchemy-ontology.md`
- [x] Create `src/lib/quest-grammar/emotional-alchemy.ts` with deriveMovementPerNode
- [x] Define derivation rules: multi-select satisfaction/dissatisfaction/self-sabotage → move
- [x] Persist moves and context (module + ontology doc) for system consumption
- [x] Update compileQuest to derive movementPerNode from ontology (not hardcode)
- [x] Expand ontology: 5 elements, WAVE, 15 moves, energy economy, Control reframe
- [x] Create `src/lib/quest-grammar/elements.ts` (element-channel mapping)
- [x] Create `src/lib/quest-grammar/move-engine.ts` (15 moves config, energy deltas)
- [x] Update types.ts with optional NodeMetadata (element, waveStage, translateCategory)

### Phase 0b: Mastery and completion rules
- [x] Document completion rule: Wake Up = choice; Show Up = action attestation
- [x] Ensure compileQuest sets signature.moveType from alignedAction
- [x] Add .twee author guidance: Show Up end passages need required input

### Phase 0c: Onboarding emotional scaffolding
- [x] Add onboarding scaffolding section to ontology (Confusion→Metal, expectation violation→Fire)
- [x] Document passage-to-element/WAVE mapping for bruised-banana-initiation
- [x] Update FOUNDATIONS.md, ARCHITECTURE.md, conceptual-model.md, terminology.md

## Phase 1: Form alignment + multi-select (Low risk)

- [x] Add explicit semantic labels (1–7) to each question
- [x] Add Q1 experience dropdown: Gather Resource, Skillful Organizing, Raise Awareness, Direct Action, Other
- [x] Change Q2 (satisfaction) to **multi-select** (checkboxes)
- [x] Change Q4 (dissatisfaction) to **multi-select**
- [x] Change Q6 (self-sabotage) to **multi-select**
- [x] Add Q7 aligned action dropdown: Wake Up, Clean Up, Grow Up, Show Up
- [x] Add model selector: Personal (Epiphany Bridge, N=6) vs Communal (Kotter, N=8)
- [x] Update UnpackingAnswers type: q2, q4, q6 as string[] or equivalent

## Phase 1b: Generation flow as CYOA (Medium risk)

- [x] Replace single form with step-by-step flow: **one question per passage**
- [x] Create generation Adventure/twee: Start → Q1 → Q2 → … → Q7 → Model → Archetype/Lens → Generate
- [x] Use CampaignReader or equivalent to render; admin clicks through like a player
- [x] Each passage chunked per CYOA rules (no walls of text)
- [x] Collect unpacking data at each step; on completion, pass to compileQuest + AI
- [x] Completing the flow produces the generated quest

## Phase 1c: Archetype and developmental lens (Low risk)

- [x] Add archetype selector (multi?) at generation time
- [x] Add developmental lens selector (Game Master faces or equivalent)
- [x] Pass to AI/compileQuest so output is tailored for target

## Phase 2: QuestPacket → .twee (Medium risk)

- [x] Create `questPacketToTwee(packet: QuestPacket): string` in src/lib/quest-grammar/
- [x] Output Twee 3 format; Add "Export .twee" button
- [x] Add Kotter variant for N=8 when model is Communal

## Phase 3: .twee → Adventure + QuestThread (Higher risk)

- [x] Add schema: QuestThread.adventureId (optional)
- [x] Create `createAdventureAndThreadFromTwee(tweeSource, title)`
- [x] Parse .twee → Adventure + Passages + QuestThread + N CustomBars
- [x] Implement edit sync: Passage.text ↔ CustomBar.description
- [x] Add Import from .twee UI (textarea + title/slug + button)

## Phase 4: Campaign orientation (Low risk)

- [x] Admin UI: set Adventure.campaignRef when editing
- [x] Verify campaign page uses campaignRef for orientation

## Phase 5a: Passage → quest completion (Medium risk)

- [x] Define passage-to-quest mapping (BIND or completion marker)
- [x] When player reaches completion passage, call completeQuest for corresponding quest

## Phase 5b: AI generation (Medium risk)

- [x] Create `buildQuestPromptContext(input)` — assembles emotionalSignature, moveType, element, targetArchetype, expected moves, player POV, Voice Style Guide
- [x] Pass prompt context (not raw unpacking) to AI
- [x] AI constructs overview of quests and objectives; output { quests, tweeSource }

## Phase 5b2: Player POV and expected moves

- [x] Add Player POV flow (player-facing 6 questions p1–p6) — optional at generation
- [x] Add expected moves input — quest giver defines moves a completer must take (milestones)
- [x] Wire Player POV and expected moves into buildQuestPromptContext

## Phase 5d: Unblocking and subquests

- [x] Surface Emotional First Aid (EFAK) when player indicates stuckness
- [x] Enable players to add subquests to unblock (Wake Up to learn, Grow Up to increase capacity)
- [x] Quest design anticipates unblocking paths

## Phase 5c: Recursive generation (Medium risk)

- [x] Add "Generate another quest" trigger from within a quest
- [x] Generation CYOA runs; new quest added to adventure

## Phase 5e: Node gap bridging (Storyteller Bridge vs Quest Bridge)

- [x] Add edge-level UI: "Bridge this gap" on each transition (Node A → Node B)
- [x] Admin choice: "Storyteller Bridge" vs "Quest Bridge" before selecting emotional alchemy move
- [x] Create `expandEdgeWithQuest(adventureId, fromNodeId, toNodeId, moveId)` → inserts Quest Bridge passages
- [x] Create `expandEdgeWithStory(adventureId, fromNodeId, toNodeId, moveId)` → inserts Storyteller Bridge passages (6 Epiphany Bridge, no choices)
- [x] Insert quest as playable path (Quest Bridge) or insert passages as linear narrative (Storyteller Bridge)
- [ ] Add edge metadata for bridge type in types (optional; deferred)

## Repeatable prompt-to-Twine process

- [x] Create `docs/quest-grammar-prompt-to-twine.md` — mechanics, choice patterns, admin workflow
- [ ] Define AI skeleton output schema (passages, choices, targets, emotional metadata)
- [ ] Admin UI: passage editor with flavor editing (edit text, preserve structure)
- [ ] Admin UI: choice editor (add/remove/relabel choices; validate targets)
- [ ] Validation before publish: all choice targets exist, no orphans, start passage defined

## Verification

- [ ] Multi-select: Q2, Q4, Q6 allow multiple selections
- [ ] Emotional alchemy move emerges from data (not hardcoded)
- [ ] Generation flow: one question per passage; CYOA feel; data collected
- [ ] Archetype + lens: output tailored for target
- [ ] Export .twee: valid Twee 3; download works
- [x] Create Adventure + Thread: both created; linked; editable
- [x] Edit sync: change in Adventures reflects in Journeys
- [x] Passage completion: auto-completes quest in thread
- [ ] Recursive: can generate another quest from within a quest
- [ ] Repeatable process: prompt → skeleton → Twine → flavor pass → publish
- [ ] Gap bridging: Quest Bridge generates quest; Storyteller Bridge generates narrative passages
