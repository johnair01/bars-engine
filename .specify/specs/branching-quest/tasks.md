# Tasks: Branching Quest

## Phase 1: I Ching in-quest

- [x] Extend `QuestNode.actionType` with `'cast_iching'`; add `castIChingTargetId`
- [x] Implement `castIChingTraditional` in cast-iching.ts (6-line input, changing lines, transformed hexagram)
- [x] Add line-to-face mapping (1↔Shaman, 2↔Challenger, … 6↔Sage)
- [x] CastIChingModal for in-quest flow (server simulates 6 lines when client omits)
- [x] AdventurePlayer: render Cast button when `metadata.actionType === 'cast_iching'`
- [x] Modal integration: CastIChingModal; on complete, persist hexagram to storyProgress, navigate to target
- [ ] Implement `regenerateNodeWithHexagramContext` server action (deferred)

## Phase 2: Altitude Map

- [x] Change `pickFacesForGap` / `generateDepthBranches` to use all 6 faces per gap
- [x] Add collapsible Altitude Map (hidden by default) in QuestOutlineReview
- [x] Add `depthBranchOrder` to packet metadata (QuestCompileInput, QuestPacket)
- [ ] Add drag-and-drop for face cards (e.g. @dnd-kit/core) — deferred
- [ ] Extend feedback payload with orderDeltas
- [ ] Update AI prompt for altitude-reflecting language

## Phase 3: Per-node choice type

- [ ] Add `choiceType`, `enabledFaces`, `enabledHorizontal`, `obstacleActions` to QuestNode type
- [ ] Update compileQuestCore to respect choiceType and enabled sets
- [ ] Add per-node choice config UI in QuestOutlineReview (toggle, multi-select, per-choice text)

## Phase 4: Depth limit

- [x] Add `branchDepth` to QuestNode (depth nodes get branchDepth: 1)
- [ ] Enforce branchDepth <= 3 in compileQuestCore and admin editor
- [ ] At depth 3, restrict choices to spine targets only
- [ ] Admin UI: warn when adding branch from depth-2 node

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes
- [ ] Manual: Create quest with cast_iching node; cast; verify hexagram influences next node
- [ ] Manual: Reorder Altitude Map; verify order persists in packet
- [ ] Manual: Set choice type per node; verify choices match
- [ ] Manual: Add 3 layers of branching; verify depth 3 converges to spine
