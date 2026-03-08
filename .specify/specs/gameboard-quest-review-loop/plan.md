# Plan: Gameboard Quest Review Loop

## Phase 1: Server Actions (API-first)

### previewGameboardAlignedQuest

Add to `src/actions/gameboard.ts`. Extract the compile logic from `generateGameboardAlignedQuest` (lines 289-358) into a preview action that returns the packet without publishing.

- Admin auth check (reuse existing pattern)
- If `opts.priorUnpacking` provided, use those answers; otherwise call `generateRandomUnpacking`
- Call `compileQuestWithAI` with gameboard context + optional `adminFeedback`
- Return `{ packet, unpacking }` — no DB writes

### publishGameboardQuestFromPreview

Add to `src/actions/gameboard.ts`. Takes an accepted packet and commits it.

- Admin auth check
- Call `publishGameboardAlignedQuestToPlayer(packet, playerId, parentQuestId, campaignRef, parentTitle)`
- Call `attachQuestToSlot(slotId, questId)` to link to the gameboard slot
- `revalidatePath('/campaign/board')`
- Return `{ success: true, questId }`

## Phase 2: Modal UI

### GameboardClient.tsx changes

- Import `QuestOutlineReview` from `@/components/admin/QuestOutlineReview`
- Add state: `generatedPacket`, `generatedUnpacking`, `accepted`, `generationCount`, `isRegenerating`
- Replace the fire-and-forget generate button handler:
  - On click: call `previewGameboardAlignedQuest` -> store packet + unpacking
  - Show `QuestOutlineReview` in the modal body
  - Regeneration handler: call `previewGameboardAlignedQuest` with `priorUnpacking` + `adminFeedback`
  - Post-accept children: "Add to gameboard" button that calls `publishGameboardQuestFromPreview`

## File impacts

| File | Change |
|------|--------|
| `src/actions/gameboard.ts` | Add `previewGameboardAlignedQuest`, `publishGameboardQuestFromPreview` |
| `src/app/campaign/board/GameboardClient.tsx` | Add review flow to modal, import QuestOutlineReview |
