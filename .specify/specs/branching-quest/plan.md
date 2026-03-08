# Plan: Branching Quest

## Overview

Four-phase implementation: (1) I Ching in-quest with traditional 6-line casting and hexagram→next-node prose; (2) Altitude Map with 6 options, collapsible, drag-and-drop reorder; (3) per-node choice type (altitudinal vs horizontal) and obstacle actions; (4) 3-layer depth limit.

## Phase 1: I Ching in-quest

### 1.1 Traditional casting mode

- **Current**: `castIChing` uses `drawAlignedHexagram` — single hexagram, no line-by-line input
- **New**: `castIChingTraditional` — player casts 6 lines (coins or yarrow simulation)
  - Each line: yin (broken) or yang (solid); optionally "changing" (moving)
  - Traditional rules: 3 coins → 4 outcomes per line (6,7,8,9). 6 and 9 are changing.
  - Or: 6 independent draws; changing = when line flips (e.g. old yang → new yin)
- **Line-to-face mapping**: Fixed order — line 1 (bottom) = Shaman, 2 = Challenger, 3 = Regent, 4 = Architect, 5 = Diplomat, 6 = Sage
- **Transformed hexagram**: Changing lines flip; compute new hexagram from resulting 6 lines

### 1.2 Types and API

- Extend `QuestNode`: `actionType: 'cast_iching'`, `castIChingTargetId?: string`
- New `castIChingTraditional` in `src/actions/cast-iching.ts`
- Return shape: `{ hexagramId, transformedHexagramId?, changingLines, faceMapping }`

### 1.3 CastingRitual traditional mode

- Add `mode?: 'aligned' | 'traditional'` to CastingRitual
- Traditional: render 6-line input (e.g. 6 coin flips or yarrow simulation)
- On complete, call `castIChingTraditional` with line results; return hexagram context

### 1.4 In-quest integration

- PassageRenderer / CampaignReader: when passage has `actionType: 'cast_iching'`, render "Cast the I Ching" button
- Button opens CastingRitual modal (traditional mode)
- On complete: store `{ hexagramId, transformedHexagramId, changingLines, faceMapping }` in storyProgress; navigate to `castIChingTargetId`
- **Prose generation**: When player reaches target node with hexagram in storyProgress, either:
  - Pre-generate at publish time (if cast is optional and we have default)
  - Or: generate on-demand when player arrives with hexagram context
  - Spec says: AI re-generates. So we need `regenerateNodeWithHexagramContext` — when player completes cast, call this to get target node prose, then show it. Or: target node prose is generated at runtime when storyProgress has hexagram. Simpler: store prose in passage; if hexagram present, optionally replace with AI-generated. For v1: generate target node prose when cast completes, store in passage or return to client for display.

### 1.5 regenerateNodeWithHexagramContext

- Server action: takes nodeId, packet, hexagramContext
- Finds target node in packet; calls `compileQuestWithAI` or similar with IChingContext extended (transformed hexagram, face mapping)
- Returns updated packet with new prose for that node

## Phase 2: Altitude Map

### 2.1 Six faces per gap

- In `compileQuestCore.ts`: change `pickFacesForGap` to return all 6 faces (or use `depthBranchOrder` if set)
- `generateDepthBranches`: create 6 depth nodes per gap instead of 3

### 2.2 Collapsible Altitude Map

- QuestOutlineReview: add `const [altitudeMapExpanded, setAltitudeMapExpanded] = useState(false)`
- Wrap Altitude Map section in collapsible header: "Altitude Map ▼" / "Altitude Map ▶"
- Default: collapsed

### 2.3 Drag-and-drop reorder

- Add `@dnd-kit/core` (or similar) for sortable face cards
- Per gap: render face cards in `depthBranchOrder[gapIndex]` order or default
- On drag end: update `depthBranchOrder` in packet state
- Packet state flows from parent (UnpackingForm, GenerationFlow); need callback `onPacketChange` or store in React state

### 2.4 Feedback with order delta

- Feedback payload: `{ text: string; orderDeltas?: Record<number, { generated: string[]; corrected: string[] }> }`
- When admin reorders, capture `generated` (initial) and `corrected` (current)
- Include in regeneration prompt or audit log

## Phase 3: Per-node choice type

### 3.1 Types

- `QuestNode.choiceType?: 'altitudinal' | 'horizontal'`
- `QuestNode.enabledFaces?: GameMasterFace[]`
- `QuestNode.enabledHorizontal?: PersonalMoveType[]`
- `QuestNode.obstacleActions?: Record<string, string>` (choiceId or targetId → action text)

### 3.2 compileQuestCore changes

- When generating choices, check `node.choiceType`
- Altitudinal: use `enabledFaces` or all 6; filter by `depthBranchOrder` if present
- Horizontal: use `enabledHorizontal` or all 4 WAVE moves; map to choice text
- Include `obstacleActions` in AI prompt for choice prose

### 3.3 Admin UI

- In QuestOutlineReview, per node (when expanded): add "Choice type" section
- Toggle: Altitudinal | Horizontal
- Altitudinal: checkboxes for 6 faces
- Horizontal: checkboxes for 4 WAVE moves
- Per choice: text input "Action to overcome obstacle"
- Wire to packet state; pass to compileQuest when regenerating

## Phase 4: Depth limit

### 4.1 branchDepth

- `QuestNode.branchDepth?: number`
- Spine nodes: depth 0
- Depth nodes: depth = parent depth + 1
- In `generateDepthBranches`: set `depth: 1` (already exists)
- For recursive branching (future): track depth when creating sub-branches

### 4.2 Enforcement

- When generating choices for a depth-2 node: only allow targets that are spine nodes
- In admin branch editor: at depth 2, restrict "Add branch" or force "Converge to spine"
- Validation: `branchDepth <= 3`

## File Impacts

| File | Change |
|------|--------|
| `src/lib/quest-grammar/types.ts` | actionType, castIChingTargetId, choiceType, enabledFaces, enabledHorizontal, obstacleActions, depthBranchOrder, branchDepth |
| `src/actions/cast-iching.ts` | castIChingTraditional |
| `src/components/CastingRitual.tsx` | mode: traditional; 6-line input |
| `src/app/adventure/[id]/play/AdventurePlayer.tsx` | Render cast_iching action; modal |
| `src/app/adventures/[id]/play/PassageRenderer.tsx` | Same |
| `src/app/campaign/components/CampaignReader.tsx` | Same |
| `src/lib/quest-grammar/compileQuestCore.ts` | 6 faces per gap; choiceType; branchDepth |
| `src/components/admin/QuestOutlineReview.tsx` | Collapsible Altitude Map; drag-and-drop; per-node choice config |
| `src/actions/quest-grammar.ts` | regenerateNodeWithHexagramContext |
