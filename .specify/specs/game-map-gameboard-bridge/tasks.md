# Tasks: Game Map ↔ Gameboard Bridge

## Phase 1: Quest–Adventure visibility and start

- [x] Add `QuestAdventureLink` model to `prisma/schema.prisma` (questId, adventureId, moveType, createdAt; unique [questId, moveType])
- [x] Run `npm run db:sync` and create migration
- [x] Add `getAdventuresForQuest(questId)` in `src/lib/quest-adventure.ts`
- [x] Extend `publishQuestPacketToPassagesWithSourceQuest` to accept optional `moveType`; create QuestAdventureLink when provided
- [x] Extend `createAdventureAndThreadFromTwee` to accept moveType and create link
- [x] Quest card (GameboardClient slot): when quest has linked adventures, show "View/Start Adventure" button
- [x] Quest card (hand/wallet via QuestDetailModal): when quest has linked adventures, show "View/Start Adventure" button
- [x] Start adventure: if 1 adventure, navigate to `/adventure/[id]/play`; if 2+, navigate to hub (Phase 3)
- [x] Ensure UpgradeQuestToCYOAFlow passes moveType when publishing

## Phase 2: 8 gameboard slots with hexagram linkage

- [x] Add `hexagramId` column to `GameboardSlot` (1–64; nullable)
- [x] Keep `SLOT_COUNT` at 8 in `src/actions/gameboard.ts`
- [x] Update `getOrCreateGameboardSlots`: create 8 slots; set hexagramId per slot (getHexagramsForPeriod)
- [x] GameboardClient: render 8 slots; label each by hexagramId (Hexagram {id})
- [x] Deck drawing: when slot has moveType, prefer quests with matching moveType (path-dependent; wire when portal→slot flow exists)

## Phase 3: Adventure hub for multi-adventure quests

- [x] Create `getAdventureHubData(questId)` — returns list of { adventureId, moveType, startNodeId, title }
- [x] Create hub route: `/adventure/hub/[questId]`
- [x] Hub page: list adventures by move type; each links to `/adventure/[adventureId]/play?start=[startNodeId]`
- [x] When "View/Start Adventure" clicked and quest has 2+ adventures: navigate to hub
- [x] When quest has 1 adventure: navigate directly to that adventure (no hub)

## Phase 4: BAR emission passage

- [x] Document Passage metadata schema: `actionType: 'bar_emit'`, optional `barTemplate`
- [x] Adventure player: detect passage with `metadata?.actionType === 'bar_emit'`
- [x] Render BAR form (title, description) when player reaches bar_emit passage
- [x] Create `emitBarFromPassage` action: create CustomBar, assign to player, set provenance (passage/adventure ref)
- [x] On BAR form submit: call emitBarFromPassage; advance to next passage or show confirmation
- [x] Move as BAR: when CYOA move is executed, create or link BAR; store in QuestMoveLog or metadata
- [x] BAR extendable to quest seed: ensure CustomBar has fields for quest-seed extension (existing flow)

## Phase 5: Game map → gameboard flow (shared metaphor)

- [x] Audit game map 8 options: ensure each links to explorable nodes (see PHASE5_AUDIT.md)
- [x] Node exploration → quest generation: wire or extend existing flows
- [x] Add BARS/QuestSeeds to quest: Show Up flow allows appending BARs or quest seeds before completion
- [x] Shared metaphor: align copy — gameboard slots show move type when set; lobby "8 Portals" = 8 hexagrams
- [x] Campaign deck: ensure generated quests can be added for gameboard drawing

## Phase 6: Verification

- [x] `npm run build` passes (or build:type-check)
- [x] `npm run check` passes (no errors in modified files; pre-existing warnings only)
- [ ] Manual: View/Start Adventure from gameboard slot
- [ ] Manual: View/Start Adventure from hand/quest wallet
- [ ] Manual: 8 slots display with hexagram + move type labels when set
- [ ] Manual: Hub shows when quest has 2+ adventures
- [ ] Manual: BAR emission passage creates BAR in wallet
