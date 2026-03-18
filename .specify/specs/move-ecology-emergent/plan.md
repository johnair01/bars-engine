# Plan: Emergent Move Ecology

## Summary

Add move extraction from books alongside quest extraction. Create a move proposal queue for admin review and promotion. Provide a repeatable script for extracting moves. Connect to Quest Library via moveType.

## Phases

### Phase 1: Move extraction from books

- Extend `analyzeBook` or add `analyzeBookForMoves` that runs move extraction on book chunks.
- Move extraction prompt: "Extract transformation moves — named patterns or practices a player could apply repeatedly."
- Zod schema: `moves: [{ name, description, moveType, barKind?, requirementsHint?, nation? }]`.
- Create NationMove with `tier: CUSTOM`, `origin: BOOK_EXTRACTED` (add to origin enum if needed), link to Metal nation by default (or map nation hint).
- Store `sourceBookId`, `sourceChunkIndex` in agentMetadata or completionEffects.
- File impacts: `src/actions/book-analyze.ts`, `src/lib/book-chunker.ts` (reuse), new `analyzeBookForMoves` or branch in `analyzeBook`.

### Phase 2: Move proposal queue (admin)

- Admin page: `/admin/books/[id]/moves` or `/admin/moves` listing proposed moves (tier CUSTOM, origin BOOK_EXTRACTED).
- Actions: Edit (name, description, requirements), Promote (→ CANDIDATE or CANONICAL), Reject.
- Server actions: `listMoveProposals`, `promoteMoveProposal`, `updateMoveProposal`.
- File impacts: `src/actions/move-proposals.ts`, `src/app/admin/books/[id]/moves/page.tsx` or `src/app/admin/moves/page.tsx`.

### Phase 3: Deduplication and repeatable script

- Before creating move: check for existing NationMove with similar name (normalized, e.g. lowercase, trim).
- If match: skip or surface to admin. Option to merge/link as parentMoveId.
- Script: `scripts/extract-moves-from-book.ts` — accepts bookId, calls `analyzeBookForMoves`, idempotent (track extracted chunk indices or use deterministic keys).
- npm script: `npm run extract-moves -- [bookId]`.
- File impacts: `scripts/extract-moves-from-book.ts`, `package.json`.

### Phase 4: Library integration

- Quest Library: ensure quests have moveType; filter by moveType already supported. Document that quests exemplify moves.
- Move Library (minimal): admin view of moves by tier, moveType, nation. Link to book source. Player-facing deferred.
- File impacts: `src/app/library/page.tsx` (optional move filter), `src/actions/quest-library.ts` (no change if moveType already used).

## Architecture

```
Book (extracted text)
    → chunkBookText (existing)
    → runChunkAnalysis (quests) — existing
    → runChunkMoveExtraction (new) — moves
    → NationMove (tier: CUSTOM, origin: BOOK_EXTRACTED)
    → Admin queue → Promote → CANDIDATE / CANONICAL
```

## File Impacts

| Action | Path |
|--------|------|
| Modify | `src/actions/book-analyze.ts` — add move extraction path |
| Create | `src/actions/move-proposals.ts` — listMoveProposals, promoteMoveProposal |
| Create | `src/app/admin/books/[id]/moves/page.tsx` — move proposal queue |
| Create | `scripts/extract-moves-from-book.ts` — repeatable script |
| Modify | `prisma/schema.prisma` — add BOOK_EXTRACTED to origin if not present (or use AI_PROPOSED) |
| Modify | `package.json` — add extract-moves script |

## Schema Notes

- NationMove.origin: check if BOOK_EXTRACTED exists. If not, add migration or use AI_PROPOSED with metadata.
- NationMove.agentMetadata: JSON for `{ sourceBookId, sourceChunkIndex }` — no schema change if field exists.

## Dependencies

- book-to-quest-library (chunks, Book model, analyzeBook)
- nation-moves (NationMove model, ensureMetalNationMoves)
- Admin auth (existing)

## Verification

1. Upload PDF, extract text.
2. Run `analyzeBookForMoves(bookId)` or `npm run extract-moves -- <bookId>`.
3. Open `/admin/books/[id]/moves` — see proposed moves.
4. Edit one, promote to CANDIDATE.
5. Verify move appears in nation move panel (or in getNationMovePanelData when CANDIDATE included).
