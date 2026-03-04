# Spec: Quest Grammar UX Flow

## Purpose

Define and implement the end-to-end Quest Grammar flow: the **quest-generation flow is itself a CYOA quest** the admin plays through—one question per passage, chunked per CYOA rules. Multi-select satisfaction, dissatisfaction, and self-sabotage beliefs; emotional alchemy move emerges from that data; unpacking + emotional alchemy + next move → AI constructs quest overview. Output tailored by target archetype and developmental lens. Completing the generation quest produces the generated quest. Supports Epiphany Bridge (personal) and Kotter (communal) models.

## Root cause

- Current Quest Grammar uses a single form; admin experience does not mirror player CYOA flow.
- Q2, Q4, Q6 are single-select; need multi-select for satisfaction, dissatisfaction, self-sabotage.
- Emotional alchemy move (translate vs transcend) is hardcoded; must emerge from unpacking data and be mapped/saved so the system understands the narrative before players encounter it.
- No emotional alchemy ontology; missing context makes clarity an uphill battle.
- Archetype and developmental lens not inputs; output not tailored for target players.
- Generation flow is not a quest; cannot recursively generate from within a quest.

## User stories

**As an admin** (Game Master, who is also a player), I want to move through a CYOA-style quest-generation flow—one question per passage, chunked—where each step collects unpacking data. From multi-select satisfaction, dissatisfaction, and self-sabotage, the emotional alchemy move emerges. I define the moves I expect a completer to take (milestones). I optionally capture the player's POV (what they want). That data gets assembled into a prompt context and passed to AI to construct the quest overview. I select target archetype(s) and developmental lens so the output is tailored. Completing this generation quest produces the generated quest. The tools have a CYOA feel because the Game Master is a player too.

**As a quest giver**, I want to think in terms of moves and milestones—what must someone do to complete this?—so that the quest design is clear and the AI generates content that supports those moves. When players get stuck, I want them to have Emotional First Aid and subquest options (Wake Up to learn, Grow Up to build capacity) to unblock themselves.

**As a player**, I want quest text that speaks to what I want and what holds me back—so it feels written for me, not generic. When I'm stuck, I want to use Emotional First Aid or add a subquest (e.g. learn more, build capacity) instead of abandoning the quest.

## Content hierarchy

**Quests ⊂ Journeys (Threads) ⊂ Adventures ⊂ Campaigns**

Edits in one surface sync to the other. Passage text in Adventure and quest title/description in Thread are views of the same content.

## Model choice

| Quest type | Model | N |
|------------|-------|---|
| **Personal** (self-allyship) | Epiphany Bridge | 6 beats |
| **Communal** (campaign/allyship) | Kotter | 8 stages |

Admin can choose/update which model to use when generating. Overlap between models; flow keeps the best of each. BARs connect to player choices across both.

## Semantic mapping: 6 questions → outputs

| # | Semantic output | Question | Type | compileQuest use |
|---|-----------------|----------|------|------------------|
| 1 | Desired outcome | What experience do you want to create? | single (dropdown + Other) | q1 → orientation |
| 2 | Emotional Satisfaction Payoff | How will you feel when you get this? | **multi-select** | q2 → satisfiedLabels, toState |
| 3 | Summary of current state | Compared to that what's life like right now? | short | q3 → orientation, rising_engagement |
| 4 | Emotional affect toward current state | How does it feel to live here? | **multi-select** | q4 → dissatisfiedLabels, fromState |
| 5 | Insight about emotional truth | What would have to be true for someone to feel this way? | short | q5 → rising_engagement, primaryChannel |
| 6 | Self Sabotaging beliefs | What reservations do you have? | **multi-select** | q6 → shadowVoices, tension |
| 7 | Starting move | Aligned action | single (dropdown + Other) | alignedAction → integration |

Q1 experience: allyship domains (Gather Resource, Skillful Organizing, Raise Awareness, Direct Action) or Other. Q7: Wake Up, Clean Up, Grow Up, Show Up.

## Emotional alchemy ontology (Phase 0)

The system MUST map out emotional alchemy moves and save them so it understands the narrative **before** players encounter it. This is an **energy economy**, not a morality wheel. Control moves are high-cost precision moves—stabilizing, defensive, protective, catalytic—not bad moves.

### 5 Elements + Lessons (canonical)

| Element | Channel | Lesson |
|---------|---------|--------|
| Metal | Fear | Risk or opportunity detected. Excitement = Fear interpreted as opportunity. |
| Water | Sadness | Something I care about is distant or misaligned. |
| Wood | Joy | Vitality detected. |
| Fire | Anger | Obstacle present OR boundary violated. |
| Earth | Neutrality | Whole-system perspective / detachment. |

### WAVE progression per element

Each element supports: **Wake** (notice signal) → **Clean** (correct distortion) → **Grow** (extract lesson) → **Show** (act aligned). Translation (element-to-element) may only occur after Show stage is complete.

### 15 canonical moves

- **5 Transcend** (vertical completion, +2 energy): Step Through, Reclaim Meaning, Commit to Growth, Achieve Breakthrough, Stabilize Coherence
- **5 Generative translate** (flow cycle, +1 energy): Declare Intention, Integrate Gains, Reveal Stakes, Deepen Value, Renew Vitality
- **5 Control translate** (high-cost precision, -1 energy): Consolidate Energy, Temper Action, Reopen Sensitivity, Activate Hope, Mobilize Grief. NOT negative—protective, catalytic, strategic pivots.

### Mastery and completion rules

| Quest move type | Completion mechanism |
|-----------------|----------------------|
| **Wake Up** | Choice-based. Orientation, teaching. Pass by reaching passage (no action required). |
| **Show Up** | Action-based. Pass by taking action. End passage MUST have required attestation input; completion blocked until player submits. |

Quest threads end with action. Wake Up quests are the exception—good for orientation and teaching.

### Onboarding emotional scaffolding

Emotional alchemy is the scaffolding for onboarding. Story progresses with emotional beats across story/game logic. Confusion → Metal; expectation violation → Fire. As onboarding is edited, passages align to WAVE stages and elements.

## Generation flow as CYOA quest

The quest-generation flow **is** a CYOA quest the admin plays through. Completing it produces the generated quest.

- **One question per passage**: Admin clicks through like a player—one step at a time. No single long form.
- **Chunked per CYOA rules**: Each passage is a chunk; no walls of text. Game Master (admin) is a player; tools have CYOA feel.
- **Data collection**: As the admin moves through the story, the program collects unpacking data at each step.
- **Recursive**: The generation flow can be completed from within a quest—trigger "Generate another quest" and play through the CYOA again; the new quest gets added to the adventure.

## Target archetype and developmental lens

- **Inputs at generation time**: Admin selects target archetype(s) and developmental lens.
- **Output tailored**: The generated quest and .twee are tailored for "players like this."
- **Not runtime branching**: For v1, we generate for a specific target; .twee does not branch at runtime by player state (future enhancement).

## Quest giver mindset: moves and milestones

Quest givers MUST think in terms of **moves** they expect someone who can complete the quest will need to take. Design in milestones and moves—not just narrative beats.

- **Expected moves**: What 4-move sequence (Wake Up, Clean Up, Grow Up, Show Up) or emotional alchemy moves does a successful completer need? Define these explicitly.
- **Milestones**: Break the quest into checkpoints. Each milestone may require a specific move.
- **Unblocking paths**: When players get stuck, they have options:
  - **Emotional First Aid** — Use the EFAK flow to work through emotional blocks (Clean Up).
  - **Subquests** — Add subquests to unblock. Examples:
    - **Wake Up quest** — Learn more about the topic; orient before acting.
    - **Grow Up quest** — Increase a necessary capacity (skill, clarity, energy) before the main action.
  - Quest design should anticipate these paths and surface them when players indicate stuckness.

## Creator POV vs Player POV

Generation collects **two** unpacking flows:

### Creator POV (6 questions — existing)

What the quest giver wants to create. Q1–Q6 + aligned action. Produces emotional signature, movement arc, orientation.

### Player POV (6 questions — new)

"What does the player want?" A player-facing mirror of the unpacking flow. Captures:

| # | Semantic output | Question (player-facing) |
|---|-----------------|--------------------------|
| P1 | Desired outcome | What do you want to get out of this? |
| P2 | Satisfaction payoff | How will you feel when you get it? |
| P3 | Current state | What's life like for you right now? |
| P4 | Dissatisfaction | How does it feel to be here? |
| P5 | Emotional truth | What would have to be true for you to feel this way? |
| P6 | Reservations | What holds you back? |

Player POV is passed to the prompt context builder so the AI generates quest text that speaks to the player's wants and blocks—not just the creator's intention.

## Prompt context builder

A function `buildQuestPromptContext(input)` MUST assemble a structured block for the AI. Inputs:

- **Creator unpacking**: q1–q6, alignedAction
- **Player POV** (optional): p1–p6 or equivalent
- **Emotional signature**: primaryChannel, movementPerNode, moveType, satisfiedLabels, dissatisfiedLabels, shadowVoices
- **Element**: derived from primaryChannel (Metal, Water, Wood, Fire, Earth)
- **Target archetype(s)**: selected at generation time
- **Developmental lens**: Game Master face or equivalent
- **Expected moves**: moves the quest giver expects a completer to take (milestones)
- **Voice Style Guide**: presence first, tone rules, forbidden language

Output: A structured string or object the AI prompt consumes. Enables traceability and consistent quality.

## Repeatable process: Prompt to Twine story

Define what mechanically makes a good Twine story, how to introduce choices for solving problems, and how admins can modify AI-generated skeletons with flavor.

### Mechanics

- **Passage structure**: One beat per passage; 2–3 choices per passage. No walls of text; chunk per CYOA rules.
- **Problem-solution mapping**: When the narrative presents a problem (tension, wall, obstacle), choices offer distinct approaches. Map emotional alchemy moves to choice types (e.g. Wake Up = "Learn more", Clean Up = "Work through this", Grow Up = "Build capacity", Show Up = "Take action").
- **Skeleton + flavor**: AI generates a structural skeleton (beat text, choice targets). Admin edits text to add flavor, voice, and campaign-specific language without changing the graph.

### Process steps

1. **Prompt assembly** — buildQuestPromptContext produces structured prompt (External desire → Wall → Conflict → Transformation).
2. **AI skeleton generation** — AI outputs: passage texts (skeleton), choice labels, target passage IDs, emotional metadata per node.
3. **Twine conversion** — Deterministic: QuestPacket or equivalent → Twee 3 format (passages, links).
4. **Admin flavor pass** — Admin edits passage text in-place. Structure (choices, targets) preserved. Voice Style Guide applied.
5. **Publish** — Twee → Adventure + Passages (or append to existing).

### Admin modification of AI skeletons

- **Edit-in-place**: Admin sees each passage with its text. Can edit text without changing choice structure.
- **Choice refinement**: Admin can add/remove/relabel choices. Targets must resolve to valid passage IDs.
- **Flavor layer**: Voice Style Guide (Librarian Campaign Voice) applied as guidance. Admin can override.
- **Validation**: Before publish, validate that all choice targets exist, no orphan passages, start passage defined.

## Phase 5e: Node gap bridging (Storyteller Bridge vs Quest Bridge)

When reviewing a process, the admin may realize that movement from Node A to Node B needs emotional alchemy—either told by the storyteller or played through by the player. Admin tools MUST support both.

### Two bridge types

| Bridge type | Who does the work | Structure | Player role |
|-------------|-------------------|-----------|-------------|
| **Storyteller Bridge** | The storyteller narrates | Multiple passages, Epiphany Bridge beats (6), no choices | Reads and advances |
| **Quest Bridge** | The player plays through | Same Epiphany Bridge structure, choices flavor the linear path | Choices change flavor; linear movement |

Both bridge types use the Epiphany Bridge structure (orientation → rising engagement → tension → integration → transcendence → consequence). The difference is interactivity: Storyteller Bridge has no choices; Quest Bridge has choices that flavor the path without branching.

### Admin choice

Per edge (transition from Node A → Node B): "Does this gap need a Storyteller Bridge or a Quest Bridge?" Before selecting the emotional alchemy move, admin chooses which path applies.

- **Storyteller Bridge**: Choose move → AI generates multiple passages (Epiphany Bridge structure) with no choices. Inserted as linear narrative between A and B.
- **Quest Bridge**: Choose move → AI generates a quest whose transformation is that move. Same structure, but choices flavor the path. Inserted as playable path between A and B.

## Functional requirements

### Phase 0: Emotional alchemy ontology (foundation)
- **FR0a**: Map out emotional alchemy moves (translate, transcend, 15 canonical moves) with narrative meaning.
- **FR0b**: Persist moves and context (schema or config) so the system understands the narrative before players encounter it.
- **FR0c**: Derive emotional alchemy move from multi-select satisfaction, dissatisfaction, self-sabotage data (heuristic or AI).
- **FR0d**: 5 elements + WAVE + energy economy (Transcend +2, Generative +1, Control -1).
- **FR0e**: Mastery rules: Wake Up quests = choice-based completion; Show Up quests = action-based (required attestation input on end passage).
- **FR0f**: Onboarding emotional scaffolding: document passage-to-element/WAVE mapping; Confusion→Metal, expectation violation→Fire.

### Phase 1: Form alignment + multi-select
- **FR1**: UnpackingForm MUST show explicit semantic labels (1–7) for each output.
- **FR2**: Q1 MUST offer experience dropdown: Gather Resource, Skillful Organizing, Raise Awareness, Direct Action, Other.
- **FR3**: Q2 (satisfaction) MUST support **multi-select** (checkboxes or multi-select dropdown).
- **FR4**: Q4 (dissatisfaction) MUST support **multi-select**.
- **FR5**: Q6 (self-sabotage) MUST support **multi-select**.
- **FR6**: Q7 (aligned action) MUST be move dropdown: Wake Up, Clean Up, Grow Up, Show Up.
- **FR7**: Add model selector: Personal (Epiphany Bridge, N=6) vs Communal (Kotter, N=8).

### Phase 1b: Generation flow as CYOA
- **FR8**: Replace single form with **one question per passage**—admin clicks through like a player.
- **FR9**: Each passage MUST be chunked per CYOA rules (no walls of text).
- **FR10**: As admin moves through the story, the program MUST collect unpacking data at each step.
- **FR11**: Completing the generation flow MUST produce the generated quest.

### Phase 1c: Archetype and developmental lens
- **FR12**: Admin MUST select target archetype(s) and developmental lens at generation time.
- **FR13**: Generated quest and .twee MUST be tailored for the selected target.

### Phase 2: QuestPacket → .twee
- **FR14**: `questPacketToTwee(packet: QuestPacket): string` MUST output Twee 3 format.
- **FR15**: Preview MUST have "Export .twee" button (download only).

### Phase 3: .twee → Adventure + QuestThread
- **FR16**: Import .twee MUST create Adventure + Passages and QuestThread + N CustomBars.
- **FR17**: Adventure and QuestThread MUST be linked.
- **FR18**: Edits in Admin Adventures MUST sync to quest description in Journeys, and vice versa.

### Phase 4: Campaign orientation
- **FR19**: Admin MUST be able to link Adventure as campaign orientation (set `campaignRef`).

### Phase 5a: Passage → quest completion
- **FR20**: When player completes a passage in the Adventure, the corresponding quest in the thread MUST auto-complete.

### Phase 5b: AI generation
- **FR21**: Unpacking + emotional alchemy move + next move MUST be passed to AI to construct overview of quests and objectives.
- **FR22**: AI output schema: `{ quests: [...], tweeSource: string }` or equivalent.
- **FR23a**: `buildQuestPromptContext(input)` MUST assemble emotionalSignature, moveType, element, targetArchetype, expected moves, player POV, Voice Style Guide into a structured block for the AI.
- **FR23b**: Creator unpacking MUST be collected (existing 6 questions). Player POV (player-facing 6 questions) MUST be collected or optional at generation time.
- **FR23c**: Quest giver MUST define expected moves (milestones) — moves a completer must take. Generation flow MUST surface these as inputs.

### Phase 5c: Recursive generation
- **FR24**: Admin MUST be able to trigger "Generate another quest" from within a quest; the generation CYOA runs and the new quest gets added to the adventure.
- **Phase 5c extension (Upgrade to CYOA)**: See [quest-upgrade-to-cyoa](../quest-upgrade-to-cyoa/spec.md) — upgrade existing quests to CYOA (wrapper/replacement), provenance via QuestThread.sourceQuestId, merge Adventures.

### Phase 5d: Unblocking and subquests
- **FR25**: When a player is stuck, the system MUST surface Emotional First Aid (EFAK) as an option.
- **FR26**: Players MUST be able to add subquests to unblock—e.g. Wake Up quest to learn more, Grow Up quest to increase capacity. Quest design must anticipate these paths.

### Phase 5e: Repeatable process and node gap bridging
- **FR27**: Repeatable prompt-to-Twine process MUST be documented (mechanics, choice patterns, admin workflow). See `docs/quest-grammar-prompt-to-twine.md`.
- **FR28**: AI skeleton output schema MUST define passages, choices, targets, emotional metadata.
- **FR29**: Admin MUST be able to edit passage text (flavor) without changing choice structure. Choice refinement (add/remove/relabel) MUST validate targets.
- **FR30**: When bridging a gap between nodes, admin MUST choose: (a) Quest Bridge → generate quest whose transformation is that move (choices flavor the path), or (b) Storyteller Bridge → generate multiple passages (Epiphany Bridge structure, no choices).
- **FR31**: Edge-level UI MUST support "Bridge this gap" with Storyteller Bridge vs Quest Bridge choice before selecting the emotional alchemy move.

## Non-functional requirements

- Preserve existing compileQuest and publishQuestPacketToPassages; add new paths.
- Phased implementation to avoid monolithic changes.
- **CYOA rules**: Chunked passages; no walls of text. Game Master tools must feel like playing.

## Reference

- UX clarification: Cursor plan quest_grammar_ux_clarification
- Related: [quest-grammar-compiler](../quest-grammar-compiler/spec.md), [quest-grammar-allyship-unpacking](../quest-grammar-allyship-unpacking/spec.md), [campaign-kotter-domains](../campaign-kotter-domains/spec.md)
- Emotional First Aid: [src/lib/emotional-first-aid.ts](../../src/lib/emotional-first-aid.ts) — EFAK flow for stuck players
- Voice Style Guide: [src/app/wiki/voice-style-guide/page.tsx](../../src/app/wiki/voice-style-guide/page.tsx)
- UnpackingForm: [src/app/admin/quest-grammar/UnpackingForm.tsx](../../src/app/admin/quest-grammar/UnpackingForm.tsx)
- compileQuest: [src/lib/quest-grammar/compileQuest.ts](../../src/lib/quest-grammar/compileQuest.ts)
