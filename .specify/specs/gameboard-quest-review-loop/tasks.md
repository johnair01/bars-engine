# Tasks: Gameboard Quest Review Loop

## Phase 1: Server Actions

- [x] Define `previewGameboardAlignedQuest` signature (API contract)
- [ ] Implement `previewGameboardAlignedQuest` in `src/actions/gameboard.ts`
- [ ] Implement `publishGameboardQuestFromPreview` in `src/actions/gameboard.ts`

## Phase 2: Modal UI

- [ ] Add state vars to GameboardClient (`generatedPacket`, `generatedUnpacking`, `accepted`, `generationCount`, `isRegenerating`)
- [ ] Replace fire-and-forget generate handler with preview flow
- [ ] Show `QuestOutlineReview` in modal after generation
- [ ] Wire regeneration handler (`priorUnpacking` + `adminFeedback`)
- [ ] Wire publish handler ("Add to gameboard" button in post-accept children)

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes
- [ ] Manual: Admin clicks Generate on gameboard -> sees outline -> gives feedback -> regenerates -> accepts -> publishes -> quest appears on gameboard
