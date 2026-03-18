# Spec: Game Map ↔ Gameboard Bridge — 8 Hexagram Slots, CYOA Hub, BAR Emission

## Purpose

Bridge the game map (I Ching, exploration) and campaign gameboard (functional throughput) with a shared metaphor. Keep 8 gameboard slots aligned with 8 hexagrams per period (64 I Ching hexagrams; 8 Kotter stages). Each slot explicitly stores a hexagramId. When players interface with a slot, it expands into paths (Wake Up, Clean Up, Grow Up, Show Up). Quest availability is path-dependent: when a player chooses a Wake Up path from a hexagram portal, Wake Up quests are available on that path. Allow each quest to have up to 4 CYOA adventures (one per move type). Enable players to start adventures from the gameboard or from their hand. Extend CYOA grammar so players fill out a BAR based on game master advice—emitting to the BAR wallet and extendable to a quest seed. The move itself is represented as a BAR.

## Vision

**Current gap:** Adventures created via unpacking flow are not visible or startable from quest cards. Gameboard slots lack hexagram linkage.

**Desired state:** Shared metaphor ties exploration → quest generation → adventure extension → gameboard completion. Game map (8 I Ching portals) and gameboard (8 slots) are aligned. Each period uses 8 hexagrams; each slot stores hexagramId. When a player commits to a move (WCGS) from a hexagram portal, quests matching that move type are available. Each quest can have up to 4 CYOA adventures. Quest cards show "View/Start Adventure" from gameboard or hand. CYOA passages emit BARs to the player wallet; moves are represented as BARs.

## Conceptual Model

| Concept | Meaning |
|---------|---------|
| **8 slots** | Gameboard has 8 slots, one per hexagram in the period (64 hexagrams; 8 per period) |
| **hexagramId** | Each slot explicitly stores hexagramId (1–64); period P uses hexagrams base+1..base+8 |
| **moveType** | Set when player commits to path from portal; deck prefers quests matching moveType |
| **Path-dependent quests** | Player chooses Wake Up path → Wake Up quests available; same for Clean Up, Grow Up, Show Up |
| **4 adventures per quest** | One quest can have up to 4 CYOA variants, one per move type |
| **Adventure hub** | First node of a multi-adventure quest shows available adventures to choose from |
| **BAR emission** | Passage where player fills out a BAR based on GM advice → emits to BAR wallet → extendable to quest seed |
| **Move as BAR** | The move itself (Wake Up, etc.) is represented as a BAR |
| **Show Up** | Player can add BARS/QuestSeeds to the quest OR complete the quest as-is |

## Desired Flow

```
Game Map (8 options)
    → Explore nodes
    → Generates quests
    → Extend quest (unpacking) → adventures
    → Add to gameboard
    → Complete (Show Up: add BARS/QuestSeeds OR complete)
```

## User Stories

### P1: View/Start Adventure from quest card

**As a player**, I want to see "View/Start Adventure" on a quest card when that quest has been advanced to an adventure, so I can start the CYOA from the gameboard or from my hand.

**Acceptance:**
- Quest card shows "View/Start Adventure" when the quest has at least one linked adventure
- Player can start the adventure while the quest is still on the gameboard
- Player can put the quest in their hand and start the adventure from there
- Clicking starts the adventure (or hub if multiple adventures)

### P2: 8 gameboard slots by hexagram

**As a player**, I want the gameboard to have 8 slots—one per hexagram in the period—so the board aligns with the game map (8 I Ching portals) and the 8 Kotter stages / 64 hexagram system.

**Acceptance:**
- Gameboard has 8 slots
- Each slot stores hexagramId (1–64); each period uses 8 hexagrams
- Slots expand into WCGS paths when interfaced; moveType set when player commits to path from portal
- Deck drawing prefers quests with matching moveType when slot has moveType

### P3: Up to 4 CYOA adventures per quest

**As an admin**, I want to extend a quest with up to 4 CYOA adventures (one per move type) via the unpacking flow, so players can choose their path through the quest.

**Acceptance:**
- Admin runs unpacking flow on a quest; can specify move type for the generated adventure
- One quest can have up to 4 adventures (wakeUp, cleanUp, growUp, showUp)
- Each adventure is linked to the quest with a move type
- "Extending" = admin generates CYOA adventure for the quest

### P4: Adventure hub (first node)

**As a player**, when a quest has multiple adventures, I want the first node to show the available adventures to choose from, so I can pick my path (Wake Up, Clean Up, Grow Up, or Show Up).

**Acceptance:**
- When a quest has 2+ adventures, starting the adventure shows a hub node
- Hub lists available adventures (by move type)
- Choosing one navigates to that adventure's start
- When a quest has exactly 1 adventure, start goes directly to it (no hub)

### P5: BAR emission from CYOA passage

**As a player**, when I reach a passage where the game master advises me to fill out a BAR, I want to complete a BAR form and have it emit to my BAR wallet, so I can later extend it into a quest seed.

**Acceptance:**
- CYOA passages can be marked as "BAR emission" (metadata.actionType = 'bar_emit')
- At that passage, player sees a BAR form (title, description, etc.) based on GM advice
- Submitting creates a CustomBar in the player's wallet (creatorId = player, visibility = private or as configured)
- BAR is extendable to quest seed (existing or new flow)
- The move itself is also represented as a BAR (metadata or linked BAR)

### P6: Game map → gameboard flow

**As a player**, I want to see 8 options on the game map, explore nodes, have that generate quests, extend quests into adventures, and add them to the gameboard to complete—with Show Up allowing me to add BARS/QuestSeeds or complete the quest.

**Acceptance:**
- Game map shows 8 explorable options
- Exploring nodes can generate quests
- Quests can be extended into adventures (admin unpacking flow)
- Extended quests can be added to gameboard slots
- Show Up: player can add BARS/QuestSeeds to the quest OR complete it as-is

## Functional Requirements

### FR1: Quest card shows View/Start Adventure

- When a quest has linked adventures (via QuestAdventureLink or equivalent), the quest card shows "View/Start Adventure"
- Action: navigate to adventure start (or hub if multiple)
- Works from: gameboard slot card, hand/quest wallet card

### FR2: 8 gameboard slots with hexagram linkage

- Keep `SLOT_COUNT` at 8 (align with game map)
- Add `hexagramId` to `GameboardSlot` (1–64); each period uses 8 hexagrams
- slotIndex 0–7; each slot tied to one hexagram in the period
- `moveType` (wakeUp | cleanUp | growUp | showUp) set when player commits to path from portal
- Deck drawing: prefer quests with matching moveType when slot has moveType (path-dependent quest availability)

### FR3: Quest–Adventure link by move type

- New model: `QuestAdventureLink` (questId, adventureId, moveType)
- One quest can have up to 4 links (one per move type)
- Upgrade flow (publishQuestPacketToPassagesWithSourceQuest) accepts moveType; creates link
- Query: `getAdventuresForQuest(questId)` returns adventures by move type

### FR4: Adventure hub

- When quest has 2+ adventures: render hub node (client or server) listing choices by move type
- Each choice links to the corresponding adventure's start node
- When quest has 1 adventure: direct navigation to that adventure

### FR5: BAR emission passage

- Passage `metadata`: support `actionType: 'bar_emit'`
- When player reaches such a passage: show BAR form (title, description, optional fields)
- Form submission: create CustomBar, assign to player wallet
- BAR has `sourceBarId` or provenance pointing to passage/adventure
- Move represented as BAR: create or link BAR when move is executed; store in metadata or relation

### FR6: Game map exploration → quest generation

- Game map 8 options link to explorable nodes
- Exploring a node can trigger quest generation (existing or extended flow)
- Generated quests can be added to campaign deck for gameboard drawing

## Data Model (Proposed)

```
GameboardSlot (extend)
  - hexagramId?: Int    // 1–64; each period uses 8 hexagrams
  - moveType?: String   // wakeUp | cleanUp | growUp | showUp; set when player commits to path
  - slotIndex: 0–7      // 8 slots, one per hexagram in period

QuestAdventureLink (new)
  - questId: String
  - adventureId: String
  - moveType: String    // wakeUp | cleanUp | growUp | showUp
  - createdAt: DateTime
  @@unique([questId, moveType])

Passage (extend metadata)
  - metadata.actionType?: 'bar_emit' | ...
  - metadata.barTemplate?: { ... }  // optional BAR form config
```

## References

- [Gameboard Deep Engagement](../gameboard-deep-engagement/spec.md)
- [Quest Upgrade to CYOA](../quest-upgrade-to-cyoa/spec.md)
- [Game Loop BARS↔Quest↔Thread↔Campaign](../game-loop-bars-quest-thread-campaign/spec.md)
- [BAR → Quest Generation Engine](../bar-quest-generation-engine/spec.md)
- JOURNEY_SEQUENCE: `src/lib/bars.ts`
