# Tasks: Story and Quest Map Exploration (AE)

## Phase 1: Story Map (Map A) — Done

- [x] Create `src/actions/story-map.ts` — getStoryMapData(adventureId, playerId)
- [x] Create `/map` route with searchParams type, adventureId
- [x] Create `StoryMapClient` with React Flow (nodes, edges, layout)
- [x] Add @xyflow/react dependency
- [x] Entry point: /adventure/[id]/play has "View map" link
- [x] FR1: Fetch Adventure + Passages; build graph from Passage.choices
- [x] FR2: Fetch PlayerAdventureProgress; highlight currentNodeId
- [x] FR3: Route /map?type=story&adventureId=X

## Phase 2: Quest Thread Map (Map B) — Done

- [x] Create `src/actions/thread-map.ts` — getThreadMapData(threadId, playerId)
- [x] Extend /map page: type=thread&threadId=X
- [x] Create ThreadMapClient — horizontal sequence, quest cards
- [x] Entry from QuestThread (Map link in header)
- [x] Entry from QuestDetailModal (Map button when context.threadId)

## Phase 3: Vibeulon Map (Map C) — Done

- [x] Create `src/actions/vibeulon-map.ts` — getVibeulonMapData(limit, timeWindow)
- [x] Extend /map page: type=vibeulon (days=7|30|90 for time filter)
- [x] Create VibeulonMapClient — table/list with time filter
- [x] Entry from wallet (View flow link for admin; View your vibeulon flow for non-admin)
