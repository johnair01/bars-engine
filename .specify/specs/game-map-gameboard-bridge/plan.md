# Plan: Game Map ↔ Gameboard Bridge

## Summary

Implement 4-move gameboard slots, quest–adventure links by move type, View/Start Adventure on quest cards, adventure hub for multi-adventure quests, and BAR emission passages. Bridge game map exploration with gameboard completion via a shared metaphor.

## Phases

### Phase 1: Quest–Adventure visibility and start

- Add `QuestAdventureLink` model (questId, adventureId, moveType)
- Extend `publishQuestPacketToPassagesWithSourceQuest` to accept moveType and create link
- Query: `getAdventuresForQuest(questId)` — returns adventures for a quest
- Quest card: when quest has linked adventures, show "View/Start Adventure" button
- Start adventure: from gameboard slot or from hand — navigate to adventure (or hub)
- File impacts: `prisma/schema.prisma`, `src/actions/quest-grammar.ts`, `src/components/QuestDetailModal.tsx`, `src/app/campaign/board/GameboardClient.tsx`, hand/quest wallet components

### Phase 2: 8 gameboard slots with hexagram linkage

- Add `hexagramId` to `GameboardSlot` (1–64); each period uses 8 hexagrams
- Keep `SLOT_COUNT` at 8 in `src/actions/gameboard.ts`
- slotIndex 0–7; each slot tied to one hexagram (getHexagramsForPeriod)
- Slot labels: Hexagram {id} (or hexagram name when available)
- `moveType` set when player commits to path from portal; deck prefers matching moveType when slot has moveType
- File impacts: `prisma/schema.prisma`, `src/actions/gameboard.ts`, `src/app/campaign/board/GameboardClient.tsx`

### Phase 3: Adventure hub for multi-adventure quests

- When quest has 2+ adventures: render hub page/node
- Hub lists adventures by move type; each choice links to adventure start
- Route: `/adventure/hub/[questId]` or inline in adventure player when questId has multiple adventures
- When 1 adventure: direct to that adventure (no hub)
- File impacts: `src/app/adventure/`, `src/actions/quest-grammar.ts` or adventure routing

### Phase 4: BAR emission passage

- Passage metadata: `actionType: 'bar_emit'`, optional `barTemplate`
- Adventure player: when passage has bar_emit, show BAR form instead of/in addition to passage text
- BAR form: title, description; submit creates CustomBar, assigns to player
- CustomBar provenance: `sourceBarId` or completionEffects pointing to passage/adventure
- Move as BAR: when move is executed in CYOA, create or link BAR; store in metadata
- File impacts: `src/app/adventure/`, `src/app/api/adventures/`, `src/actions/create-bar.ts` or new `emitBarFromPassage`

### Phase 5: Game map → gameboard flow (shared metaphor)

- Ensure game map 8 options link to explorable nodes
- Node exploration can generate quests (extend existing flows)
- Generated quests can be added to campaign deck
- Show Up: allow adding BARS/QuestSeeds to quest or completing as-is
- Shared metaphor: align copy, visuals, and flow so map and board feel connected
- File impacts: `src/app/game-map/`, `src/app/campaign/lobby/`, campaign authoring, deck logic

### Phase 6: Verification

- `npm run build` and `npm run check`
- Manual: View/Start Adventure from gameboard and hand; 4 slots; hub; BAR emission

## File Impacts

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add QuestAdventureLink; add moveType to GameboardSlot |
| `src/actions/gameboard.ts` | SLOT_COUNT=4; moveType in slot create/update; deck moveType matching |
| `src/actions/quest-grammar.ts` | publishQuestPacketToPassagesWithSourceQuest: moveType, create QuestAdventureLink |
| `src/lib/quest-adventure.ts` (new) | getAdventuresForQuest, getAdventureHubData |
| `src/components/QuestDetailModal.tsx` | View/Start Adventure when adventures exist |
| `src/app/campaign/board/GameboardClient.tsx` | View/Start Adventure on slot card; 4 slots; move type labels |
| `src/app/hand/` or quest wallet | View/Start Adventure on quest card |
| `src/app/adventure/` | Hub route when multiple adventures; BAR emission passage handling |
| `src/app/api/adventures/` | BAR emission form submit, create CustomBar |

## Dependencies

- gameboard-deep-engagement (existing slots, steward, etc.)
- quest-upgrade-to-cyoa (upgrade flow, publishQuestPacketToPassagesWithSourceQuest)
- game-loop-bars-quest-thread-campaign (addQuestToThread, addQuestToCampaign)

## Migration Strategy (8 slots with hexagramId)

**8 slots retained** — Align with game map (8 I Ching portals), 8 Kotter stages, 64 hexagrams. Each period uses 8 hexagrams; each slot stores hexagramId. Existing 8-slot instances: add hexagramId on next slot creation or backfill via migration. moveType set when player commits to path from portal.
