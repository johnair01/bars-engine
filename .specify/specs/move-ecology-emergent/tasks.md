# Tasks: Emergent Move Ecology

## Phase 1: Move extraction from books

- [x] Add `BOOK_EXTRACTED` to NationMove.origin (or document use of AI_PROPOSED with sourceMetadata)
- [x] Define move extraction Zod schema: `{ moves: [{ name, description, moveType, barKind?, requirementsHint?, nation? }] }`
- [x] Write move extraction system prompt (extract transformation moves, not quests)
- [x] Add `analyzeBookForMoves(bookId, options?)` to `src/actions/book-analyze.ts` (or extend `analyzeBook`)
- [x] Reuse `chunkBookText` / `chunkBookTextWithToc`; run move extraction per chunk (or batched)
- [x] Create NationMove with tier CUSTOM, origin BOOK_EXTRACTED, nationId (Metal default), requirementsSchema, effectsSchema from hints
- [x] Store sourceBookId, sourceChunkIndex in sourceMetadata (new NationMove field)
- [x] Add "Extract Moves" button to admin books page (`/admin/books` or book detail)

## Phase 2: Move proposal queue (admin)

- [x] Create `listMoveProposals(filters?)` — returns moves with tier CUSTOM, origin BOOK_EXTRACTED
- [x] Create `promoteMoveProposal(moveId, action, edits?)` — promote to CANDIDATE/CANONICAL or reject
- [x] Create `updateMoveProposal(moveId, edits)` — edit name, description, requirements before promote
- [x] Create admin page `/admin/books/[id]/moves` or `/admin/moves` with list, edit, promote, reject
- [x] Wire "Extract Moves" to navigate to moves queue or refresh list

## Phase 3: Deduplication and repeatable script

- [x] Before creating move: check for existing NationMove with similar name (normalize: lowercase, trim)
- [x] If duplicate: skip or return "duplicate" in result; optionally surface to admin
- [x] Create `scripts/extract-moves-from-book.ts` — accepts bookId, calls runMoveExtraction
- [x] Make script idempotent (track extracted chunks or use deterministic move keys from chunk+index)
- [x] Add `npm run extract-moves` script to package.json

## Phase 4: Library integration

- [x] Document Quest Library ↔ Move link: quests with moveType exemplify that move
- [x] (Optional) Add move filter to Quest Library browse when moveType filter exists
- [x] (Optional) Admin view: list moves by tier, moveType, nation with book source link

## Phase 5: Verification

- [ ] `npm run build` and `npm run check` pass
- [ ] Manual: Upload PDF → extract → run move extraction → see proposals → promote one → verify move in panel
