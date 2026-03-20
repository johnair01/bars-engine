# Challenger Books — Integration Analysis
**Books**: Kids on Bikes (Deluxe Edition — Jon Gilmour & Doug Levandowski, Hunters Entertainment 2018)
**Date**: 2026-03-19

---

## Kids on Bikes

### Core Concepts

Kids on Bikes is a Powered by the Apocalypse-adjacent system (though it predates full PbtA categorization; it uses its own dice economy). Its core DNA, relevant to bars-engine, is:

**1. Collaborative World Building (Town Creation)**
Players co-create the setting by answering structured prompts (industry, fame, infamy, landmarks, organizations) and contributing one *Rumor* each. Rumors may or may not be true — but the GM keeps them as live plot seeds. World is player-authored before play begins.

**2. Tropes as Archetypes (Playbooks)**
Characters are built from a *Trope* (e.g., Loner Weirdo, Brutish Jock, Stoic Professional). The Trope determines stat dice distribution, age-based bonuses, and two trope-specific questions. Players can depart from their trope but start there for fast onboarding.

**3. Six Stats (Brains / Brawn / Fight / Flight / Charm / Grit)**
These are dice ratings (d4–d20), not point values. Stat resolution is a roll against a GM-set difficulty. The six stats map to distinct problem-solving *orientations*, not just power levels.

**4. Planned Actions vs. Snap Decisions**
All checks are categorized as Planned (time to deliberate; may take half-die) or Snap (under pressure; must roll full). Collaboration is structurally rewarded in Planned — other players may spend Adversity Tokens to help.

**5. Adversity Tokens**
Failed checks generate Adversity Tokens (+1 each). Tokens can be spent on future rolls. Failure is explicitly generative — it funds future success. Token pooling between players is the primary collaboration mechanic.

**6. Exploding Rolls**
When a die rolls its maximum, reroll and add. Narrative rule: exploding outcomes must be co-authored with external causation. The character alone cannot account for extreme success.

**7. Relationship Web (Introductions and Questions)**
Before play, players answer structured relationship questions about each other (positive, negative, unknown). Three tiers: Quick Start (1 question each), One-Sided (1 per player-pair), Complete (2 known + 1 unknown). Questions surface debts, betrayals, loyalties, and secrets. These are *in-fiction facts*, not just backstory.

**8. Character Evolution**
Between sessions, players and GM collaboratively add/remove Strengths, Flaws, and Fears based on what happened. Gains and losses must balance. Characters are never static.

**9. Strengths and Flaws**
Strengths are mechanical advantages (e.g., Quick Healing, Rebellious, Skilled at ___). Flaws shape personality and roleplay texture but have no direct mechanical penalty. Both are selected at creation; both can change.

**10. Age as Developmental Register**
Child (d20 Charm/Flight bonus, Quick Healing, curiosity-driven fear), Teen (d20 Brawn/Fight bonus, Rebellious, social fear), Adult (d20 Grit/Brains bonus, Skilled, loss-based fear). Age is a developmental frame with mechanical implications.

**11. Setting Boundaries**
Session zero: players negotiate content limits. A table-knock signal pauses and rewinds any scene without discussion or justification. Safety is structurally built into the opening protocol.

**12. Failure as Narrative Forward Motion**
Failing a roll never means narrative stasis. Failed hacking might redirect to an NPC who gives a clue. Failed escape might lead to a facility that holds the next mystery. The GM's job is to ensure failure *pushes the story somewhere interesting*, not punishes the player.

**13. Powered Characters (referenced but not in extracted text)**
A PC holds psychic/supernatural powers that are collectively managed by the table. The Powered Character's special abilities are authored collaboratively, not controlled by a single player. This is the "Shared Power" mechanic referenced in Kids on Bikes design discussions.

---

### Existing System Mappings

| Kids on Bikes Concept | bars-engine Equivalent | File(s) |
|---|---|---|
| Tropes (Playbooks) | Archetypes (archetype table, `PlayerPlaybook` model, `playbookTemplate`) | `prisma/schema.prisma` lines 1841–1860, `src/app/admin/adventures/[id]/CharacterCreatorTemplateEditor.tsx` |
| Six Stats (Brains/Brawn/Fight/Flight/Charm/Grit) | 15 Canonical Moves (5 Transcend, 5 Generative, 5 Control) structured by element | `src/lib/quest-grammar/move-engine.ts`, `src/lib/quest-grammar/move-expressions.ts` |
| Trope-Specific Questions (two per trope) | Unpacking Questions Q1–Q6 — the six-question EFA interview | `src/lib/quest-grammar/questGrammarSpec.md`, `src/lib/quest-grammar/types.ts` (UnpackingAnswers) |
| Relationship Web (per-player answers) | BAR sharing / BarShare model; player-authored content in shared network | `src/actions/bars.ts` (sendBar, claimBarShareExternal) |
| Town Building (collaborative world authoring) | Instance creation, campaign seeding | `prisma/schema.prisma` (Instance model), admin campaign flows |
| Rumor (player-contributed, may/may not be true) | BAR (player-authored, tags = storyContent, truth not validated) | `src/actions/bars.ts` (createPlayerBar, `storyContent` field) |
| Adversity Token (failure → future resource) | vibulon economy (quest failure mechanics not explicit; vibeulons mint on completion) | `src/actions/quest-engine.ts` (completeQuestForPlayer) |
| Planned Action vs. Snap Decision | QuestCompletionSource — gameboard vs. dashboard completion paths | `src/actions/quest-engine.ts` lines 61–68 (QuestCompletionContext, source field) |
| Strength (mechanical advantage) | NationMove unlock (grantsMoveId, PlayerNationMoveUnlock) | `src/actions/quest-engine.ts` lines 350–363; `prisma/schema.prisma` |
| Flaw (personality, no mechanical penalty) | Shadow voices in EmotionalAlchemySignature (Q6 reservations) | `src/lib/quest-grammar/types.ts` (EmotionalAlchemySignature.shadowVoices) |
| Age as developmental register | Kotter Stage (kotterStage on CustomBar); WAVE stages (wakeUp/cleanUp/growUp/showUp) | `prisma/schema.prisma` line 231; `src/lib/quest-grammar/types.ts` (PersonalMoveType) |
| PbtA Move structure (trigger → outcome) | Face Move BAR / GrowUp quest node — move type determines passage branch | `src/lib/quest-grammar/types.ts` (QuestNode.choiceType, enabledFaces) |
| Setting Boundaries (session zero consent) | Missing: no structured consent or safety protocol in the onboarding flow | — |
| Failure pushes narrative forward | Blocked quest unblocking cascade (isKeyUnblocker) | `src/actions/quest-engine.ts` lines 455–465 |
| Exploding Rolls (external causation) | Parallel in Transcend moves: breakthrough narrated as co-authored with forces beyond player | `backend/app/agents/challenger.py` (SYSTEM_PROMPT: Transcend move = "requires readiness") |
| GM as world steward | Game Master Face system (6 faces) | `src/lib/quest-grammar/types.ts` (FACE_META, GameMasterFace) |

---

### Missing Mechanics

**1. Adversity Token Economy (Formalized)**
Kids on Bikes makes failure explicitly *generative currency* — every failed roll produces a token that funds future success or collaborative pooling. bars-engine has vibeulons but they are earned on *completion*, not *failure*. There is no mechanical reward that emerges directly from hitting an obstacle. The Roadblock Quest structure exists conceptually (`.specify/specs/roadblock-metabolism/`) but the currency loop — *fail → earn → spend* — is not wired to the BAR/quest economy.

Specific gap: `src/actions/quest-engine.ts` mints vibeulons only on success (lines 273–286). No token is minted on blocked, failed, or abandoned quest states.

**2. Relationship Question Framework**
Kids on Bikes generates its relational web through structured prompts answered between players before play. bars-engine has BAR sharing but no *relationship question* pass — there is no mechanism for a new player to answer structured questions about known and unknown players, producing in-fiction facts about the relational field. The `BarShare` and invitation BAR mechanics (`src/actions/bars.ts`) carry artifacts between players but do not generate the web of positive/negative/unknown relational facts that drive story.

Specific gap: No `RelationshipQuestion` model or player-pair relational state anywhere in `prisma/schema.prisma`.

**3. Town Building as Collective World Authoring Session**
Kids on Bikes opens with collaborative world construction — each player contributes structured facts (industry, landmark, infamy) and a Rumor. bars-engine has `Instance` (campaign/world container) but it is admin-created, not player-co-created. Players cannot contribute authoring facts to a shared world in a structured, session-zero-style process.

Specific gap: `Adventure.playbookTemplate` (JSON, admin-authored) vs. a player-contributed world-building packet.

**4. Planned vs. Snap Decision as Quest Design Mode**
The Planned/Snap distinction maps cleanly to quest design but is not surfaced as a player experience. In Kids on Bikes, Planned Actions allow deliberate half-die selection and collaborative token pooling. A bars-engine equivalent: some quests should signal "you have time to prepare — collaborate" (group quest, asynchronous) vs. "this is a Snap Decision — solo, time-pressured." The `QuestCompletionSource` enum exists (`src/actions/quest-engine.ts` line 61) but source is context, not quest-design-level framing for the player.

**5. Collaborative Adversity Spending (Token Pooling)**
In Kids on Bikes, other players can spend their own Adversity Tokens to help during Planned Actions, with a narration requirement. bars-engine has no mechanism for players to contribute their vibeulons or other resources to help another player complete a quest. The BAR send mechanic (`sendBar`) is gifting, not collaborative spending toward a shared check.

**6. Character Evolution Between Sessions (Gain/Loss Balance)**
Kids on Bikes explicitly tracks Strength/Flaw/Fear changes between sessions, requiring GM+player agreement and gain/loss balance. bars-engine has archetype assignment (one-time, via `setPlaybook` completion effect) but no session-to-session character evolution protocol — no mechanism for Strength additions, Fear acquisitions, or collaborative character sheet revision.

**7. Setting Boundaries Protocol (Safety Layer)**
No structured consent/safety layer exists in the onboarding flow. Kids on Bikes opens every campaign with a boundary-setting protocol. The table-knock signal (immediate scene rewind without discussion) has no equivalent. This is a community design consideration, especially given the Portland community's sensitivity to uncomfortable content in play.

---

### NPC Constitution Language

The Challenger agent (`backend/app/agents/challenger.py`) currently has voice, mission, and move knowledge but lacks the character-level specificity that Kids on Bikes uses for trope sheets. Drawing from Kids on Bikes language and the existing Challenger system prompt:

**Voice**
Direct. No softening. Names the move before asking if the player is ready. "The fire has found its target." Uses second-register compression phrases (from `src/lib/quest-grammar/move-expressions.ts`): "Walk the Cutting Edge," "The Boundary Holds," "Cool Before You Cut."

**Values**
Edge as care. Pushes not to wound but to unlock. Believes that avoided discomfort grows into stagnation. Every unmet fear is an unspent Adversity Token. Will not let a player remain comfortable in a blocked state.

**Function**
- Validate energy before recommending. Control moves cost energy; Transcend moves require readiness. (Already in SYSTEM_PROMPT, line 93–94.)
- Distinguish Planned Action context from Snap Decision: if the player has time to deliberate, recommend a Transcend move (high readiness required, high reward). If they are under pressure, recommend a Generative move (forward motion, lower risk).
- Name the fear explicitly before naming the move. Fear named is Adversity Token generated.
- After a failed check (blocked quest, incomplete thread), respond with: "You have a token now. What will you spend it on?"

**Limits**
- Does not push when a player signals a boundary (knock-at-the-table equivalent: any signal of overwhelm, not resistance).
- Distinguishes overwhelm (needs space) from resistance (needs edge). Resistance gets the move. Overwhelm gets a Control move or a pause.
- Never narrates a player's failure as character failure. Failure is plot momentum, not identity verdict.
- Will not recommend a Snap Decision response in a Planned Action context — doing so would be the Challenger going beyond its function (urgency-manufacturing).

**Patch for `backend/app/agents/challenger.py` SYSTEM_PROMPT**

The current prompt (lines 62–98) is functionally correct on move knowledge. The following constitutional additions would sharpen NPC voice:

```
## Voice
- Name the move before asking if they are ready
- Use second-register compression phrases (these fire felt sense)
- Never say "it might help to" — say "the move is X"

## Limits
- Overwhelm ≠ Resistance: overwhelm → Control move or pause; resistance → Transcend
- Failure is an Adversity Token, not an identity statement
- Never manufacture urgency in a Planned Action context
```

These additions align with Kids on Bikes' failure-as-generative principle and the Snap vs. Planned Action distinction, ported into emotional coaching register.

---

### Adventure / CYOA Grammar Extensions

The current Adventure/Passage system (`prisma/schema.prisma` lines 1785–1878; `src/app/adventure/[id]/play/AdventurePlayer.tsx`) supports: node-by-node traversal, choice navigation, BAR emit nodes, I Ching cast nodes, and completion passages. It is a well-formed CYOA player.

Kids on Bikes contributes structural patterns that could extend the adventure grammar:

**1. Rumor Node Type**
Kids on Bikes players contribute Rumors (unverified facts about the world) that become live plot seeds. Translated: an adventure could include a *Rumor Passage* — a node where the player authors a Rumor (a short player-generated text), which is stored as a BAR with `storyContent` = rumor category, and potentially surfaced to other players as a live world artifact.

Implementation: Add `actionType: 'rumor_emit'` to `Passage.metadata` (alongside existing `bar_emit`). `rumor_emit` nodes use the existing `emitBarFromPassage` flow (`src/actions/emit-bar-from-passage.ts`) with a dedicated BAR type or tag. The Rumor's truth-status remains unresolved — it enters the world ambiguously, which is core to the mechanic.

**2. Relationship Question Node**
Before a campaign adventure begins, a Relationship Pass — a sequence of passages that ask each player structured questions about known and unknown co-players — could be authored as an Adventure. Answers become Relationship BARs (type: `relationship`, visibility: `private` or `shared_with_target`). The relational web is player-authored, not GM-invented.

Implementation: New `actionType: 'relationship_question'` in passage metadata. Passage presents a question prompt (e.g., "What does [PlayerName] not know about you that shapes how you treat them?"). Player input creates a BarShare or a private note linked to the target player's ID. This maps to the existing `sendBar` + `BarShare` model but with structured prompts and relationship framing.

**3. Adversity Token as Quest Failure Output**
The failure-forward principle (Kids on Bikes: "failure gives you an Adversity Token") suggests a direct extension to the quest completion engine. When a quest reaches a blocked or timeout state, the engine should emit a small vibulon or a `Roadblock BAR` (existing concept in roadblock-metabolism spec) automatically.

Implementation in `src/actions/quest-engine.ts`: Add a `failQuest` path that creates a `CustomBar` of type `roadblock` (or `adversity`) sourced from the failed quest, with `reward: 1` to the player. This BAR becomes the seed for the metabolized output. Roadblock → BAR → Quest growth chain already exists (`growQuestFromBar` at line 674); the missing piece is the automatic emission from failure, not just manual collapse.

**4. Planned vs. Snap Adventure Framing**
Add `pacing: 'planned' | 'snap'` to `Passage.metadata` or `Adventure`. Planned passages render with a deliberation affordance (expandable lore gates, optional collaboration prompt). Snap passages suppress lore gates and add urgency framing in the UI. The `AdventurePlayer.tsx` would conditionally render `optionalLore` expansion based on pacing metadata.

**5. World-Building Adventure (Session Zero Module)**
A dedicated Adventure type: `WORLD_BUILDING`. Passages present the structured world-creation questions (industry, landmark, infamy, etc.). Each player's answer becomes a BAR (tagged by category: `town_famous_for`, `town_infamous_for`, etc.) linked to the Instance. The final passage generates the Rumor emission from each player. This turns Kids on Bikes' session-zero process into a game-native adventure module.

Implementation: New `adventureType: 'WORLD_BUILDING'` (extend `Adventure.adventureType` which currently supports `CHARACTER_CREATOR`). Admin creates one per campaign Instance. `src/app/admin/adventures/create/CreateAdventureForm.tsx` would add the option.

**6. Character Evolution Passage (Between-Session Check-In)**
A short adventure (3–5 nodes) that runs between campaign sessions:
- Node 1: What did your character face last session? (reflection)
- Node 2: What changed? (select from Strength/Flaw/Fear options)
- Node 3: What did you gain or lose? (balance check — must name both)
- Completion: applies `completionEffects` to update archetype or adds a note to the player's daemon or BAR record.

This maps to `processCompletionEffects` in `src/actions/quest-engine.ts` (lines 632–834) and the `strengthenResidency` effect type.

---

## Synthesis

### The Single Highest-Leverage Integration

**Adversity Token Economy — Failure Emits a Roadblock BAR**

Kids on Bikes' deepest mechanical contribution to bars-engine is not a feature to add; it is a structural correction to the existing economy. Currently, the only reward state in the quest engine is completion (vibeulons minted, thread advanced). Failure produces nothing except a blocked state.

The system already has the conceptual framework (`roadblock-metabolism` spec, `growQuestFromBar` in `src/actions/bars.ts`). What is missing is the automatic trigger: when a quest reaches a failure or timeout state, emit a Roadblock BAR seeded from that quest's content. This BAR is the Adversity Token — a resource generated from discomfort, redeemable by growing it back into a quest or sharing it as a metabolized artifact.

This single change makes failure structurally generative, not narratively generative (the GM improvising something interesting) but *mechanically generative* — the player receives something concrete from not succeeding. It closes the energy loop that Kids on Bikes understands instinctively: falling down gives you something to spend.

### Recommended Immediate Action

**Wire `failQuest` into the quest engine to emit a Roadblock BAR.**

Specifically:
1. In `src/actions/quest-engine.ts`, add a `failQuest(questId, playerId)` server action that:
   - Sets `PlayerQuest.status = 'failed'` (or uses `abandoned` if that exists)
   - Creates a `CustomBar` of type `roadblock` with `sourceBarId = questId`, `creatorId = playerId`, `title = "Roadblock: [quest.title]"`, `description = quest.description`, `reward = 0`, `visibility = 'private'`
   - Returns `{ roadblockBarId }` so the UI can route to `/bars/[id]` with a "metabolize this" CTA
2. Add a UI affordance in the quest completion modal or thread player for explicitly marking a quest as failed/blocked (not just abandoned silently)
3. The existing `growQuestFromBar` and `growDaemonFromBar` functions in `src/actions/bars.ts` already handle the downstream. No new infrastructure needed — only the upstream emission is missing.

This is a 1-day implementation, zero schema migration (uses existing `CustomBar` types), and immediately aligns the failure experience with the generative design intent that both Kids on Bikes and the bars-engine roadblock-metabolism spec describe but have not yet connected.
