# Spec: Branching Quest

## Purpose

Enable rich branching in AI-generated quests: players cast I Ching in-quest (traditional 6-line mode with face mapping), admins configure per-node choice type (altitudinal vs horizontal), reorder face paths in the Altitude Map, and enforce a 3-layer depth limit.

**Problem**: Current quest grammar has fixed 3-face depth branches per gap; no in-quest I Ching; no admin control over choice type or face order; no depth limit.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| I Ching mode | Traditional 6-line casting; lines map to 6 Game Master faces; changing lines resolve to transformed hexagram |
| Hexagram → next node | AI re-generates target node prose with hexagram context (original, transformed, face mapping) |
| Horizontal choices | 4 WAVE moves: Wake Up, Clean Up, Grow Up, Show Up |
| Altitude Map | 6 options per gap; hidden by default, expandable; admin drag-and-drop reorder |
| Altitude Map persistence | Reorder/feedback live in packet (ephemeral until publish) |
| Depth limit | Max 3 layers; at depth 3, choices must converge to spine |

## Conceptual Model

- **WHO**: Game Master faces (6) — altitudinal paths; WAVE moves (4) — horizontal paths
- **WHAT**: Branching quest — nodes with configurable choice type and obstacle actions
- **WHERE**: Altitude (vertical) vs horizontal (WAVE) — admin chooses per node
- **Energy**: I Ching hexagram — influences next node prose via AI context
- **Personal throughput**: 4 WAVE moves as horizontal choice options

## API Contracts (API-First)

### castIChingTraditional (Server Action)

**Input**: `{ adventureId?: string; nodeId?: string; returnTargetId?: string }` (optional; for in-quest flow)

**Output**:
- Success: `{ hexagramId: number; transformedHexagramId?: number; changingLines: number[]; faceMapping: Record<number, GameMasterFace> }`
- Error: `{ error: string }`

```ts
export async function castIChingTraditional(opts?: {
  adventureId?: string
  nodeId?: string
  returnTargetId?: string
}): Promise<
  | { hexagramId: number; transformedHexagramId?: number; changingLines: number[]; faceMapping: Record<number, GameMasterFace> }
  | { error: string }
>
```

- Traditional mode: 6 lines (yin/yang, possibly changing). Line 1 ↔ Shaman, 2 ↔ Challenger, 3 ↔ Regent, 4 ↔ Architect, 5 ↔ Diplomat, 6 ↔ Sage.
- Changing lines (3 or 6 of one type) resolve to transformed hexagram.

### regenerateNodeWithHexagramContext (Server Action)

**Input**: `{ nodeId: string; packet: SerializableQuestPacket; hexagramContext: IChingCastResult }`

**Output**: `{ packet: SerializableQuestPacket } | { error: string }`

```ts
export async function regenerateNodeWithHexagramContext(
  nodeId: string,
  packet: SerializableQuestPacket,
  hexagramContext: { hexagramId: number; transformedHexagramId?: number; changingLines: number[]; faceMapping: Record<number, GameMasterFace> }
): Promise<{ packet: SerializableQuestPacket } | { error: string }>
```

- AI re-generates the target node's prose using hexagram context. Admin-only.

### QuestNode extensions (types)

```ts
// In QuestNode
actionType?: ActionType | 'cast_iching'
castIChingTargetId?: string
choiceType?: 'altitudinal' | 'horizontal'
enabledFaces?: GameMasterFace[]
enabledHorizontal?: PersonalMoveType[]
obstacleActions?: Record<string, string>
branchDepth?: number
```

```ts
// In QuestPacket / packet metadata
depthBranchOrder?: Record<number, string[]>
```

## User Stories

### P1: Player casts I Ching inside quest

**As a player**, I want to cast the I Ching from within an AI-generated quest node, so the hexagram influences the next passage.

**Acceptance**: Node with `actionType: 'cast_iching'` shows "Cast the I Ching" button; modal opens with traditional 6-line casting; on complete, storyProgress stores hexagram context; flow advances to target node with hexagram-informed prose.

### P2: Admin reorders face paths in Altitude Map

**As an admin**, I want to drag-and-drop face paths in the Altitude Map and have that order persist in the packet until publish.

**Acceptance**: Altitude Map is collapsible (hidden by default); admin can reorder face cards per gap; order stored in packet; feedback includes order delta (generated vs corrected).

### P3: Admin sets choice type per node

**As an admin**, I want to choose at each node whether choices are altitudinal (6 faces) or horizontal (4 WAVE moves), and which options are available.

**Acceptance**: Per-node toggle: Altitudinal | Horizontal; multi-select enabled faces or moves; text input per choice for "action to overcome obstacle."

### P4: Branching depth is limited to 3 layers

**As an admin**, I want the system to enforce a 3-layer depth limit so branching doesn't become unwieldy.

**Acceptance**: At depth 3, choices must target spine nodes only; admin UI warns and restricts when adding branch from depth-2 node.

## Functional Requirements

### Phase 1: I Ching in-quest

- **FR1**: `QuestNode.actionType: 'cast_iching'`; `castIChingTargetId` for target node
- **FR2**: Traditional casting: 6 lines, yin/yang, changing lines → transformed hexagram
- **FR3**: Line-to-face mapping: line 1–6 ↔ Shaman, Challenger, Regent, Architect, Diplomat, Sage
- **FR4**: `castIChingTraditional` server action returns hexagram context
- **FR5**: PassageRenderer/CampaignReader render Cast button; modal with CastingRitual (traditional mode)
- **FR6**: On complete, advance to target node; store hexagram context in storyProgress
- **FR7**: `regenerateNodeWithHexagramContext` — AI re-generates target node prose with hexagram context

### Phase 2: Altitude Map

- **FR8**: 6 face options per gap (all GAME_MASTER_FACES)
- **FR9**: Altitude Map hidden by default, expandable on click
- **FR10**: Drag-and-drop reorder face cards per gap
- **FR11**: `depthBranchOrder` in packet; feedback includes order delta
- **FR12**: Altitude-reflecting language in AI prompt for depth prose

### Phase 3: Per-node choice type

- **FR13**: `choiceType`, `enabledFaces`, `enabledHorizontal` on QuestNode
- **FR14**: `obstacleActions` per choice (action to overcome obstacle)
- **FR15**: Admin UI: toggle, multi-select, per-choice text input

### Phase 4: Depth limit

- **FR16**: `branchDepth` on QuestNode; spine = 0, branch = 1, 2, 3
- **FR17**: At depth 3, choices must target spine nodes
- **FR18**: Admin UI: warn and restrict when adding branch from depth-2 node

## Non-Functional Requirements

- Traditional I Ching casting may require new UI (6-line input) or extend CastingRitual
- Altitude Map reorder/feedback ephemeral until publish
- No new Prisma models for v1; use Passage JSON or packet metadata

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | regenerateNodeWithHexagramContext uses existing compileQuestWithAI; cache by hexagram context |
| Casting | castIChingTraditional may call existing cast + line derivation or new traditional draw |

## Dependencies

- [CastingRitual](src/components/CastingRitual.tsx)
- [QuestOutlineReview](src/components/admin/QuestOutlineReview.tsx)
- [compileQuestCore](src/lib/quest-grammar/compileQuestCore.ts)
- [iching-struct](src/lib/iching-struct.ts)
- FACE_META, GAME_MASTER_FACES, PersonalMoveType

## References

- [.cursor/plans/branching_quest_spec_e84a5dfb.plan.md](../../../.cursor/plans/branching_quest_spec_e84a5dfb.plan.md)
- [src/lib/quest-grammar/types.ts](../../../src/lib/quest-grammar/types.ts)
- [src/components/admin/QuestOutlineReview.tsx](../../../src/components/admin/QuestOutlineReview.tsx)
