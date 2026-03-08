# Spec: Gameboard Quest Review Loop

## Purpose

Split the gameboard's fire-and-forget quest generation into a preview-review-accept-publish flow so the admin can see, refine, and approve AI-generated quests before they land on the gameboard.

**Problem**: `generateGameboardAlignedQuest` bundles compile + publish in one server action. The admin clicks "Generate," waits 30-90s, and a quest silently appears in the DB with no preview, no feedback, and no accept gate.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Split vs replace | Add new preview/publish actions; preserve the old `generateGameboardAlignedQuest` for backward compat |
| Unpacking stability | First generation uses `generateRandomUnpacking`; regenerations reuse the same unpacking answers so only feedback changes |
| Component reuse | Reuse `QuestOutlineReview` (already built for admin quest grammar page) |
| Modal vs page | Keep the flow inside the gameboard modal — no new routes |

## API Contracts (API-First)

### previewGameboardAlignedQuest (Server Action)

**Input**:
- `parentQuestId: string`
- `campaignRef: string`
- `opts?: { adminFeedback?: string; priorUnpacking?: { answers: UnpackingAnswers; alignedAction: string; moveType?: string } }`

**Output**:
- Success: `{ packet: SerializableQuestPacket; unpacking: { answers: UnpackingAnswers; alignedAction: string; moveType?: string } }`
- Error: `{ error: string }`

```ts
export async function previewGameboardAlignedQuest(
  parentQuestId: string,
  campaignRef: string,
  opts?: {
    adminFeedback?: string
    priorUnpacking?: { answers: UnpackingAnswers; alignedAction: string; moveType?: string }
  }
): Promise<
  | { packet: SerializableQuestPacket; unpacking: { answers: UnpackingAnswers; alignedAction: string; moveType?: string } }
  | { error: string }
>
```

- First call (no `priorUnpacking`): fresh `generateRandomUnpacking` + `compileQuestWithAI` with gameboard context
- Regeneration (with `priorUnpacking` + `adminFeedback`): reuse unpacking, inject feedback into AI prompt

### publishGameboardQuestFromPreview (Server Action)

**Input**:
- `packet: SerializableQuestPacket`
- `parentQuestId: string`
- `slotId: string`
- `campaignRef: string`

**Output**:
- Success: `{ success: true; questId: string }`
- Error: `{ error: string }`

```ts
export async function publishGameboardQuestFromPreview(
  packet: SerializableQuestPacket,
  parentQuestId: string,
  slotId: string,
  campaignRef: string
): Promise<{ success: true; questId: string } | { error: string }>
```

Calls `publishGameboardAlignedQuestToPlayer` + attaches to slot via `attachQuestToSlot`.

## User Stories

### P1: Admin previews generated quest before committing

**As an admin**, I want to see the AI-generated quest outline before it's added to the gameboard, so I can verify quality and refine with feedback.

**Acceptance**: After clicking "Generate," the modal shows a collapsible outline with beat labels, emotional arc, and expandable prose. Publish buttons are hidden until "Accept" is clicked.

### P2: Admin regenerates with feedback

**As an admin**, I want to give free-text feedback and regenerate the quest, so the output quality improves before publishing.

**Acceptance**: Feedback textarea + "Regenerate" button. Same unpacking answers are preserved; only AI prose changes. Generation counter increments.

### P3: Admin accepts and publishes to gameboard

**As an admin**, I want to click "Accept" then "Add to gameboard" to commit the quest to the slot.

**Acceptance**: After accept, "Add to gameboard" button appears. On click, quest + adventure + thread are created and attached to the slot. Modal closes, page reloads.

## Functional Requirements

### Phase 1: Server Actions

- **FR1**: `previewGameboardAlignedQuest` — admin-only, returns packet + unpacking without DB writes
- **FR2**: `publishGameboardQuestFromPreview` — admin-only, creates quest/adventure/thread and attaches to slot
- **FR3**: Regeneration preserves unpacking answers; only feedback and AI generation change

### Phase 2: Modal UI

- **FR4**: Replace fire-and-forget generate button with preview flow
- **FR5**: Show `QuestOutlineReview` in modal after generation
- **FR6**: Feedback + regenerate loop works within the modal
- **FR7**: Publish gated behind accept; "Add to gameboard" button in post-accept children slot

## Non-Functional Requirements

- AI generation time: 30-90s per call (existing constraint); UI shows loading state
- No new env vars required
- No Prisma schema changes

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | Uses existing `compileQuestWithAI` with `generateObjectWithCache`; model override via `QUEST_GRAMMAR_AI_MODEL` env |
| Request body | Packet is small (~5KB); no body size concerns |

## Dependencies

- `QuestOutlineReview` component (`src/components/admin/QuestOutlineReview.tsx`) — already implemented
- `compileQuestWithAI` with `adminFeedback` support (`src/actions/quest-grammar.ts`) — already implemented
- `publishGameboardAlignedQuestToPlayer` (`src/actions/quest-grammar.ts`) — existing
- `attachQuestToSlot` (`src/actions/gameboard.ts`) — existing

## References

- [src/actions/gameboard.ts](../../../src/actions/gameboard.ts) — `generateGameboardAlignedQuest` (line 289)
- [src/app/campaign/board/GameboardClient.tsx](../../../src/app/campaign/board/GameboardClient.tsx) — modal (line 175)
- [src/components/admin/QuestOutlineReview.tsx](../../../src/components/admin/QuestOutlineReview.tsx) — review component
