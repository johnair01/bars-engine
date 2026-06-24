# Spec: Six Guide Campaigns — Calrunia Orientation and Unlock Ladder

## Purpose

Define how Mastering the Game of Allyship players are oriented from outer-world utility into Calrunia, and how the six Game Master faces become playable guide campaigns that teach the essentials of allyship at different modes of play.

This spec captures a long-running design pain point:

> bars-engine has BARs, moves, superpowers, emotional alchemy, nations, sects, I Ching/trigrams, and Calrunian lore, but it does not yet have a canonical orientation path that tells a player when they are crossing from real-world work into the shared imagined world, who they are inside that world, and what new app capabilities unlock as they learn.

The answer proposed here:

> Players do not get oriented by reading lore. They get oriented by completing one or more Game Master Guide campaigns.

Each Guide is simultaneously:

- an onboarding campaign
- a mode of play
- a lore doorway
- a curriculum for an allyship skill level
- an unlock path for app capabilities that would otherwise be hidden

## Core Problem

The app currently has multiple partial portals into deeper play:

- BAR capture: outer-world notebook / productivity / meaning capture
- Move Generator: turning carried material into action
- Superpowers: identity and contribution lens
- Emotional Alchemy: charge, shadow, and transformation
- Nations: emotional terrain as world geography
- Sects: disciplined action lineages
- I Ching: outer-world artifact with inner-world oracle power
- Calrunia: shared mythic world where external problems become narrative data

The missing design object is the **orientation threshold**:

```text
When does the player cross from "I am using a helpful app"
into "I am playing a game in Calrunia"?
```

Without a clear threshold, lore arrives either too early as homework or too late as disconnected flavor.

## Product Thesis

Calrunia should appear when ordinary productivity stops being enough.

The player starts in outer-world utility. As their BARs become charged, blocked, relational, strategic, symbolic, or campaign-shaped, the app introduces deeper layers of the world.

```text
BARs
-> Moves
-> Superpowers
-> Emotional Alchemy
-> Nations
-> Sects
-> I Ching / Oracle
-> Calrunia as campaign world
```

The Game Master faces are the mode-of-play layer:

```text
What kind of game am I playing inside Calrunia right now?
```

## Design Decisions

| Topic | Decision |
|-------|----------|
| Faces are game modes | The six Game Master faces are not only voices or NPC styles. They are the types of games a player can play in Calrunia. |
| Guide campaigns are the main orientation unit | Each face gets a Guide campaign: "The Shaman's Guide to Mastering Allyship", "The Challenger's Guide...", etc. |
| Unlocks are curriculum gates | Hidden app features unlock when the player has learned the practice needed to use them. Complexity is earned through play. |
| Calrunia is revealed progressively | Do not open with full world lore. Reveal Calrunia when a player's outer-world problem needs inner-world meaning to become right action. |
| Lore pages are support artifacts | Lore pages are appropriate once attached to a Guide, unlock, quest, or role. They should answer "what did I just encounter and how do I practice it?" |
| Sects follow nations | Nations emerge when emotional charge needs terrain. Sects emerge when recurring or oracle-shaped situations need disciplined action. |
| I Ching is a bridge artifact | The I Ching belongs to both worlds: an outer-world artifact with inner-world oracle applications and outer-world action consequences. |

## Orientation Stack

| Layer | Player Question | System Meaning | Lore Depth |
|-------|-----------------|----------------|------------|
| BARs | What am I carrying? | Capture, notebook, productivity, meaning object | No lore required |
| Moves | What should I do with this? | Turn material into action | Light practice language |
| Superpowers | How do I tend to help? | Contribution identity / translation lens | Outer-world legible identity |
| Game Master Face | What kind of game am I playing? | Mode of play / guide / curriculum | First Calrunian guide presence |
| Emotional Alchemy | Why is this charged or blocked? | Charge becomes game material | Magical threshold |
| Nations | What terrain am I in? | Emotion becomes landscape/culture | World geography appears |
| Sects | What discipline does the situation ask for? | Trigram/archetype lineage of action | Practice lineage appears |
| I Ching / Oracle | What is the pattern of the moment? | Divination routes ambiguity into disciplined moves | Mythic/systemic bridge |
| Calrunia Campaign | How does this real work become playable? | External problems become narrative data | Full shared world |

## The Six Guide Campaigns

### The Shaman's Guide to Mastering Allyship

**Mode of play**: ritual, shadow, symbolic transformation.

**Teaches**:

- emotional alchemy
- 3-2-1 shadow work
- listening to charge as signal
- moving from feeling to meaning

**Player learns**:

> My feelings are not obstacles. They are game material.

**Unlocks**:

- Emotional Alchemy
- 3-2-1 rituals
- deeper charge interpretation
- first nation reveal when emotional terrain stabilizes
- Shaman-flavored Calrunian lore pages

### The Challenger's Guide to Mastering Allyship

**Mode of play**: courage, confrontation, decisive action.

**Teaches**:

- direct action
- courage under friction
- breaking avoidance
- turning insight into observable moves

**Player learns**:

> Allyship requires moves, not just insight.

**Unlocks**:

- pressure/deadline modes in Move Generator
- direct action quests
- decisive commitment BARs
- Breakpoint / Decisive Storm content when appropriate

### The Regent's Guide to Mastering Allyship

**Mode of play**: stewardship, duty, authority, governance.

**Teaches**:

- holding commitments
- stewarding shared resources
- honoring agreements
- role clarity

**Player learns**:

> Power is held through care, duty, and follow-through.

**Unlocks**:

- campaign roles
- oath/commitment BARs
- stewardship dashboards
- recurring responsibilities
- governance/council lore

### The Architect's Guide to Mastering Allyship

**Mode of play**: systems, plans, structures, organizing.

**Teaches**:

- skillful organizing
- system design
- milestone decomposition
- turning overwhelm into structure

**Player learns**:

> Good intentions need structures that can carry them.

**Unlocks**:

- campaign planning tools
- milestone needs
- system maps / blueprints
- skillful organizing quests
- Architect-flavored build lore

### The Diplomat's Guide to Mastering Allyship

**Mode of play**: relationship, invitation, coalition, repair.

**Teaches**:

- invitations
- conflict translation
- repair
- coalition-building
- helping a move land in relationship

**Player learns**:

> The move has to land in relationship.

**Unlocks**:

- invitation tools
- ally maps
- repair quests
- coalition surfaces
- bridge/council lore

### The Sage's Guide to Mastering Allyship

**Mode of play**: pattern recognition, synthesis, timing, wisdom.

**Teaches**:

- reading the moment
- strategic reflection
- extracting doctrine from experience
- I Ching / trigram pattern interpretation

**Player learns**:

> The moment has a pattern; right action follows from reading it clearly.

**Unlocks**:

- I Ching oracle
- sect interpretation
- strategic review
- doctrine / lesson extraction from completed moves
- Sage-flavored oracle lore

## Guide Selection

The first Guide should be selected through player need, not taxonomy.

Example prompt:

> What kind of help do you need right now?

| Player Need | Guide |
|-------------|-------|
| I need to understand what I am feeling | Shaman |
| I need to stop avoiding action | Challenger |
| I need to hold responsibility well | Regent |
| I need to build a plan | Architect |
| I need to navigate people | Diplomat |
| I need to read the pattern | Sage |

## Portal Events

A **Portal Event** is any moment where the app has enough signal to invite the player deeper.

Candidate Portal Events:

- first BAR captured
- first move generated
- first move resisted or left incomplete
- first emotional alchemy result
- repeated move patterns
- campaign contribution need selected
- outer-world problem submitted for interpretation
- I Ching cast completed

The app should not treat all Portal Events equally. Each event can unlock a different depth.

| Portal Event | Likely Unlock |
|--------------|---------------|
| First BAR | BARs as notebook / meaning capture |
| First move generated | Guide campaign invitation |
| Move resistance named | Shaman / Challenger route |
| Superpower revealed | superpower identity and contribution lens |
| Emotional charge metabolized | nation reveal |
| Repeated move discipline | sect invitation |
| I Ching cast completed | oracle interpretation / sect-of-the-moment |
| Campaign impact returned | Calrunia campaign identity |

## Character Identity Model

The app eventually needs a player-facing identity container that can answer:

> Who am I between worlds?

Candidate identity fields:

- outer-world name / player profile
- active campaign or cause
- BARs carried
- superpower
- active Guide campaign
- completed Guide campaigns
- current GM face affinity
- nation affiliation
- sect apprenticeship or situational sect
- current I Ching reading
- completed moves / returned impact

This does not require a full character sheet in the first slice, but the orientation system should be designed so these fields have a future home.

## User Stories

### P1: I know why lore is appearing

**As a player**, I want Calrunian lore to appear only when it helps me understand or act on something I am carrying, so it feels useful rather than like homework.

**Acceptance**: Guide/lore surfaces are introduced through a Portal Event or unlock, not as an unrelated reading assignment.

### P2: I can choose the kind of game I need

**As a player**, I want to choose a Guide based on the help I need, so I can enter the right mode of allyship practice.

**Acceptance**: Guide selection uses player-facing need statements, not only face names.

### P3: Completing a Guide unlocks meaningful capability

**As a player**, I want Guide completion to unlock app capabilities that match what I learned, so complexity feels earned.

**Acceptance**: Each Guide maps to at least one hidden/locked app capability and one lore doorway.

### P4: The I Ching makes the world actionable

**As a player**, I want an I Ching reading to help translate my real-world problem into a disciplined move, so divination leads to changed action.

**Acceptance**: I Ching output can identify visible/hidden forces, relevant sect discipline, and one outer-world move.

### P5: I can play Chapter 1 inside Inner Garden

**As a new Mastering the Game of Allyship player**, I want Chapter 1 to give me a short playable threshold ritual, so I can answer the call to allyship by naming what brought me here and choosing one real first move.

**Acceptance**: `/inner-garden/chapter-1` lets an authenticated player either use an eligible raw Hand/Vault BAR or create a new "Call to Play" BAR, complete a Shaman-flavored cultivation step, and receive a linked result BAR in Vault with a concrete outer-world first move.

## Functional Requirements

### FR1: Define the orientation ladder

Create canonical docs/data describing the layered progression:

```text
BARs -> Moves -> Superpowers -> GM Guides -> Emotional Alchemy -> Nations -> Sects -> I Ching -> Calrunia
```

### FR2: Define the six Guide campaigns

Each Guide must define:

- face
- mode of play
- player need prompt
- core lessons
- starter campaign outline
- unlocks
- lore doorway
- success criteria

### FR3: Define unlock taxonomy

Create an authored unlock taxonomy with at least:

- app surface unlock
- lore page unlock
- campaign route unlock
- oracle/interpretation unlock
- role/identity unlock

### FR4: Define Portal Events

Create a deterministic set of Portal Event types and rules for which event can invite which Guide or layer.

### FR5: Connect I Ching to orientation

Document how I Ching cast/trigram data can:

- identify sect-of-the-moment
- recommend a guide mode
- shape Move Generator candidates
- open Sage and sect lore progressively

### FR6: Preserve outer-world utility

BAR capture and basic productivity must remain usable without Calrunian lore.

### FR7: Support progressive disclosure

No first-run experience should require players to understand nations, sects, hexagrams, or full Calrunian history before creating value.

### FR8: Make Chapter 1 playable as an Inner Garden threshold

The first playable Chapter 1 slice must:

- use the MTGOA Chapter 1 frame: **Answer the Call / The Call to Play**
- be Shaman-first but not require the player to know the six Guide system
- accept an existing eligible raw BAR or create a new raw BAR from the player's call
- ask for the signal, the resistance/charge, a harvested insight, and one immediate outer-world move
- create the completed artifact as a new `CustomBar` result linked to its source BAR
- tag the result with `gameMasterFace: "shaman"`, `questSource: "inner_garden_chapter_1"`, `campaignRef: "mtgoa-chapter-1"`, and `moveType: "wakeUp"`
- avoid new tables in v1

## Non-Goals

- Implement the Guide campaign UI in this spec.
- Build full character sheet persistence immediately.
- Make all Calrunian lore public at first launch.
- Force every player into a sect on day one.
- Replace existing BAR/productivity value with lore.

## Success Criteria

- The team can explain when Calrunia appears in one sentence.
- Each Game Master face has a clear campaign/game-mode purpose.
- Each Guide has a matching unlock path.
- Lore depth is tied to player action and app capability.
- Sects become legible as disciplines after nations/emotional terrain are established.
- The I Ching has a clear role as a bridge artifact between outer-world problem, inner-world narrative data, and outer-world move.
- A player can complete Chapter 1 inside Inner Garden and leave with a Vault BAR that names both an insight and a first real-world move.

## Open Questions

1. Should a player choose their first Guide, or should the app recommend one based on their first BAR / superpower / move resistance?
2. Are Guides linear campaigns, repeatable trainings, or both?
3. Does completing one Guide unlock Calrunia globally, or only unlock that face's doorway?
4. Should nation reveal require Shaman/emotional alchemy completion, or can other Guides reveal nations through their own route?
5. Is sect identity always situational at first, or can certain Guide completions grant early apprenticeship?
6. Where does the future "between worlds" character identity live in the app: profile, vault, campaign hub, or a new passport/sigil surface?

## References

- `.specify/specs/inner-outer-allyship-moves/spec.md`
- `.specify/specs/mobility-quest-superpower-campaign/spec.md`
- `.specify/specs/trigram-archetype-gap-resolution/`
- `docs/architecture/ALLYSHIP_MOVE_TRANSLATOR_ICHING_GAP_ANALYSIS.md`
- `docs/architecture/CALRUNIA_SECTS_AND_LINEAGES.md`
- `src/components/bars/MoveGenerator.tsx`
- `src/lib/superpowers/translate.ts`
- `src/lib/superpowers/matrix.ts`
