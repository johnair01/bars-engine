# Spec: Story and Quest Map Exploration

## Purpose

Design a map UI that lets players visualize (a) campaign/story progress as a Twine-style graph, (b) quest stack position and movement through threads, and (c) optionally vibeulon flow ("map of meaning"). This spec is exploration-only; implementation is deferred until prioritized.

**Problem**: Players need a way to see where they are in the story and how quest stacks move through the game. The narrative mechanics doc describes a "map of meaning" — the movement of resources (Vibeulons) through the system, similar to a Twine-like CYOA structure.

**Practice**: Spec-first; no implementation in this iteration.

## Conceptual Model (Game Language)

| Dimension | Meaning | Map Application |
|-----------|---------|-----------------|
| **WHO** | Identity | Player position highlighted; who earned vibeulons |
| **WHAT** | The work | Nodes = passages/beats or quests; edges = choices or sequence |
| **WHERE** | Context | Campaign (Adventure), Thread, Gameboard |
| **Energy** | What makes things happen | Vibeulon flow (optional layer) |
| **Personal throughput** | How players get things done | Completed vs pending nodes; current position |

## Map Types

### Map A: Campaign/Story Progress (Twine-Style Graph)

**Nodes** = Passages or story beats  
**Edges** = Choices (from Passage.choices JSON)  
**Player position** = `PlayerAdventureProgress.currentNodeId`

| Schema | Field | Use |
|--------|-------|-----|
| Adventure | id, slug, startNodeId | Graph root; which adventure |
| Passage | id, nodeId, text, choices | Node content; edges from choices |
| PlayerAdventureProgress | currentNodeId, stateData | Player's current node; visited state |

**Data source**: `Adventure` → `Passage[]` (choices parsed from JSON). Graph structure: nodeId → target nodeIds from each choice.

**Entry points**: `/campaign`, `/adventure/[id]/play`, `/map?type=story&adventureId=...`

### Map B: Quest Stack Position and Movement

**Nodes** = Quests in a thread (ordered by position)  
**Edges** = Sequence (position N → N+1)  
**Player position** = `ThreadProgress.currentPosition`; completed vs pending from `PlayerQuest.status`

| Schema | Field | Use |
|--------|-------|-----|
| QuestThread | id, title | Thread container |
| ThreadQuest | threadId, questId, position | Ordered quests; edges = position sequence |
| ThreadProgress | currentPosition, completedAt | Player's position in thread |
| PlayerQuest | questId, status, completedAt | Completed vs pending per quest |
| CustomBar | id, title, moveType | Quest details |

**Data source**: `QuestThread` → `ThreadQuest[]` (ordered by position) → `CustomBar`. Player progress from `ThreadProgress` + `PlayerQuest`.

**Entry points**: `/dashboard`, `/hand`, `/map?type=thread&threadId=...`, quest detail modal

### Map C: Vibeulon Flow ("Map of Meaning") — Optional

**Nodes** = Players or quests that generated/earned vibeulons  
**Edges** = Flow (origin → recipient or staked-on)  
**Metadata** = amount, source, archetypeMove

| Schema | Field | Use |
|--------|-------|-----|
| VibulonEvent | playerId, source, amount, questId, archetypeMove | Who earned what, for what |
| Vibulon | ownerId, originSource, originId, originTitle, generation | Provenance; stakedOnBarId |
| CustomBar | id, title | Quest context for questId |

**Data source**: `VibulonEvent` for earned events; `Vibulon` for current holdings and provenance. Aggregation by player, quest, or time window.

**Entry points**: `/wallet`, `/map?type=vibeulon`, dashboard widget

## Design Decisions

| Topic | Decision |
|-------|----------|
| Map library | Defer; React Flow, D3, or Cytoscape.js are candidates. Prefer declarative, React-friendly. |
| Single vs multiple views | Separate views per map type (story, thread, vibeulon) with optional tab/toggle. |
| Real-time updates | Defer; initial load from server. WebSocket or polling for live position later. |
| Mobile | Map should be responsive; consider collapsible sidebar, zoom, pan. |

## UI Wireframes (Descriptive)

### Story Map (Map A)

- **Layout**: Graph with nodes as cards or circles; edges as lines/arrows. Player's current node highlighted (e.g. border, glow).
- **Node content**: Passage nodeId + truncated text. Click → navigate to passage or show full text.
- **Legend**: Start node, current node, visited nodes (muted), unvisited (dimmed or hidden by default).
- **Controls**: Zoom, pan, fit-to-view. Toggle: show all nodes vs only visited + current + immediate choices.

### Quest Thread Map (Map B)

- **Layout**: Horizontal or vertical sequence. Nodes = quest cards (title, moveType icon). Completed = checkmark; current = highlighted; pending = muted.
- **Edges**: Arrows between positions. Optional: branch if thread has alternate paths (future).
- **Player indicator**: Badge or line at `currentPosition`. Progress bar (N of M completed).

### Vibeulon Map (Map C)

- **Layout**: Sankey-style or node-link. Nodes = players or quests; edges = flow (amount as weight). Optional: time filter (this period, all time).
- **Simpler variant**: Table or list grouped by player/quest with amounts. "Map" = metaphorical (flow visualization).

## Entry Points Summary

| Entry Point | Map Type | Context |
|-------------|----------|---------|
| `/map` | All (tabs) | Dedicated map page |
| `/campaign` | Story (A) | Campaign reader; "View map" link |
| `/adventure/[id]/play` | Story (A) | During play; sidebar or modal |
| `/dashboard` | Thread (B), Vibeulon (C) | Dashboard widget or link |
| `/hand` | Thread (B) | Quest stack in hand |
| `/wallet` | Vibeulon (C) | Vibeulon holdings + history |
| Quest detail modal | Thread (B) | "Where am I in this thread?" |

## Functional Requirements (When Implemented)

### Phase 1: Story Map (Map A)

- **FR1**: Fetch Adventure + Passages; build graph from Passage.choices. Parse choices JSON for target nodeIds.
- **FR2**: Fetch PlayerAdventureProgress for current player; highlight currentNodeId.
- **FR3**: Route `/map?type=story&adventureId=X` or `/adventure/[id]/map`. Read-only; no state changes.

### Phase 2: Quest Thread Map (Map B)

- **FR4**: Fetch QuestThread + ThreadQuest (ordered) + ThreadProgress + PlayerQuest for current player.
- **FR5**: Render sequence with completed/current/pending states.
- **FR6**: Entry from dashboard, hand, or thread detail.

### Phase 3: Vibeulon Map (Map C) — Optional

- **FR7**: Fetch VibulonEvent (and optionally Vibulon) for time window; aggregate by player/quest.
- **FR8**: Render flow or table. Entry from wallet or map page.

## Non-Functional Requirements

- Use existing schema; no schema changes in this spec.
- Map rendering should not block critical paths; lazy-load or separate route.
- Accessibility: keyboard navigation, screen reader support for graph (defer details to implementation).

## Dependencies

- [bruised-banana-quest-map](../bruised-banana-quest-map/spec.md) — Quest map structure (8 Kotter stages); visualization deferred to this spec.
- [gameboard-campaign-deck](../gameboard-campaign-deck/spec.md) — References "Full map visualization (story-quest-map-exploration)".

## References

- Narrative mechanics: [content/narrative-mechanics.md](../../../content/narrative-mechanics.md)
- Quest threads: [src/actions/quest-thread.ts](../../../src/actions/quest-thread.ts)
- Campaign: [src/app/campaign/page.tsx](../../../src/app/campaign/page.tsx)
- Schema: `prisma/schema.prisma` — QuestThread, ThreadQuest, PlayerQuest, ThreadProgress, VibulonEvent, Adventure, Passage, PlayerAdventureProgress
