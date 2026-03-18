# Prompt: Emergent Move Ecology

**Use this prompt when implementing the Emergent Move Ecology spec.**

## Prompt text

> Implement the Emergent Move Ecology per [.specify/specs/move-ecology-emergent/spec.md](../../specs/move-ecology-emergent/spec.md). Add move extraction from books alongside quest extraction. Create a move proposal queue for admin review and promotion. Provide a repeatable script for extracting moves. Connect to Quest Library via moveType.
>
> **Key flows:**
> 1. `analyzeBookForMoves(bookId)` — extract transformation moves from book chunks (distinct from quest extraction); create NationMove with tier CUSTOM, origin BOOK_EXTRACTED
> 2. Admin page for move proposals — list, edit, promote, reject
> 3. Script `npm run extract-moves -- [bookId]` — idempotent, resumable
> 4. Deduplication: check for similar move names before creating
>
> **Dependencies:** book-to-quest-library (chunks, Book), nation-moves (NationMove model)

## Checklist

- [ ] Move extraction Zod schema and prompt
- [ ] analyzeBookForMoves in book-analyze.ts
- [ ] listMoveProposals, promoteMoveProposal actions
- [ ] Admin page /admin/books/[id]/moves
- [ ] scripts/extract-moves-from-book.ts
- [ ] npm run extract-moves
- [ ] Deduplication (name similarity)

## Reference

- Spec: [.specify/specs/move-ecology-emergent/spec.md](../../specs/move-ecology-emergent/spec.md)
- Plan: [.specify/specs/move-ecology-emergent/plan.md](../../specs/move-ecology-emergent/plan.md)
- Tasks: [.specify/specs/move-ecology-emergent/tasks.md](../../specs/move-ecology-emergent/tasks.md)
