# Spec: Emergent Move Ecology — PDF Extraction, Repeatable Pipeline, Library Integration

## Purpose

Make the move set **emergent** — expandable from books, 321, CYOA, and admin without code changes. Provide a repeatable process for updating moves and connect it to the Quest Library and book analysis pipeline.

**Problem**: Moves are hardcoded (Metal Nation only). The schema supports CUSTOM → CANDIDATE → CANONICAL, but no flow exists. Books are mined for quests, not moves. The move ecology is static.

**Goal**: Moves grow from multiple sources through a unified proposal → review → promote pipeline. Books yield both quests and moves. The library surfaces both.

## Conceptual Model

### Move vs Quest (from PDFs)

| | Quest | Move |
|---|-------|------|
| **Question** | "What should I do?" | "How do I do it?" |
| **Example** | "Reflect on one obstacle in your current quest" | "Cut the Noise: Remove distraction and return to signal" |
| **Granularity** | One-off or situational | Reusable pattern |
| **In a book** | Exercises, prompts, assignments | Frameworks, methods, principles |

### Emergent Sources

| Source | Output | Tier |
|--------|--------|------|
| **PDF extraction** | NationMove (or MoveProposal) | CUSTOM, origin: BOOK_EXTRACTED |
| **321 / Daemon** | DaemonMoveCreation → NationMove | CUSTOM, origin: PLAYER_NAMED |
| **CYOA / Bar emit** | BAR as move exemplar → nomination | CUSTOM (via nomination) |
| **Admin** | Manual creation | CANONICAL, origin: GM_AUTHORED |

### Repeatable Process

```
Extract/Propose → Draft (CUSTOM) → Review (Regent) → Promote (CANDIDATE → CANONICAL)
```

## User Stories

### Admin

- **A1**: As an admin, I can trigger move extraction from a book (alongside quest extraction), so moves emerge from the same PDF pipeline.
- **A2**: As an admin, I can review proposed moves in a queue, edit name/description/requirements, and promote to CANDIDATE or reject.
- **A3**: As an admin, I can see which book and chunk a proposed move came from, so I can verify provenance.
- **A4**: As an admin, I can run a repeatable script (`npm run extract-moves -- bookId`) to extract moves from a book, so the process is idempotent and resumable.

### System

- **S1**: Book analysis supports a **move extraction path** distinct from quest extraction — same chunks, different prompt and schema.
- **S2**: Extracted moves are created as NationMove with `tier: CUSTOM`, `origin: BOOK_EXTRACTED`, linked to Book via metadata.
- **S3**: Duplicate detection (semantic fingerprint or name similarity) surfaces near-matches before creating a new move.

### Player (Future)

- **P1**: As a player, I can browse a Move Library (proposed + canonical) filtered by moveType, nation, and source, so I discover new patterns.
- **P2**: As a player, I can see which quests exemplify a move, so I understand how to apply it.

## Functional Requirements

### FR1: Move extraction from books

- **FR1a**: Add `analyzeBookForMoves(bookId)` (or extend `analyzeBook` with a moves branch) that runs move extraction on the same chunks used for quest extraction.
- **FR1b**: Move extraction schema (Zod): `{ moves: [{ name, description, moveType, barKind?, requirementsHint?, nation? }] }`.
- **FR1c**: Each extracted move creates a NationMove with `tier: 'CUSTOM'`, `origin: 'BOOK_EXTRACTED'`, `nationId` from Metal (or mapped from book nation hint), `requirementsSchema` and `effectsSchema` from hints or defaults.
- **FR1d**: Store provenance in `agentMetadata` or new field: `{ sourceBookId, sourceChunkIndex }`.

### FR2: Move proposal queue

- **FR2a**: Admin page `/admin/moves` or `/admin/books/[id]/moves` lists proposed moves (tier CUSTOM, origin BOOK_EXTRACTED) with edit, promote, reject actions.
- **FR2b**: Promote sets `tier: 'CANDIDATE'` (or `CANONICAL` for admin-approved); reject soft-deletes or marks as rejected.
- **FR2c**: Edit persists name, description, requirementsSchema, effectsSchema before promotion.

### FR3: Deduplication

- **FR3a**: Before creating a new move from extraction, check for existing moves with similar name (normalized) or semantic fingerprint.
- **FR3b**: If near-match found, surface to admin: "Similar move exists: [name]. Create anyway? Merge?" Option to link as variant (parentMoveId) instead of duplicate.

### FR4: Repeatable pipeline

- **FR4a**: Script `scripts/extract-moves-from-book.ts` (or npm script) accepts `bookId`, calls move extraction, is idempotent (skip already-extracted chunks or upsert by fingerprint).
- **FR4b**: Rate limits and batch behavior align with existing `analyzeBook` (chunk caps, resume support).

### FR5: Library integration

- **FR5a**: Quest Library: when filtering by moveType, optionally show which NationMove(s) that quest exemplifies (link via moveType; future: explicit exemplar relation).
- **FR5b**: Move Library (new or extend /library): list moves by tier, moveType, nation; link to exemplar quests (quests with matching moveType from same book).

## API Contracts (API-First)

### analyzeBookForMoves(bookId: string, options?: { filters?: AnalysisFilters })

**Input**: `bookId`, optional filters (moveType, nation, etc.)  
**Output**: `Promise<{ created: number; skipped: number; errors: string[] } | { error: string }>`

- Extracts moves from book chunks; creates NationMove records. Returns count created, skipped (duplicates/filters), and any per-chunk errors.

### listMoveProposals(filters?: { tier?: string; origin?: string; bookId?: string })

**Input**: optional filters  
**Output**: `Promise<MoveProposalSummary[]>`

- Returns proposed moves for admin review. Includes bookId, chunkIndex when origin is BOOK_EXTRACTED.

### promoteMoveProposal(moveId: string, action: 'promote' | 'reject', edits?: Partial<MoveEdits>)

**Input**: moveId, action, optional edits  
**Output**: `Promise<{ success: true } | { error: string }>`

- Promote: set tier to CANDIDATE or CANONICAL. Reject: mark rejected. Edits applied before promote.

### getMovesBySource(source: 'canonical' | 'proposed' | 'all', filters?: { moveType?: string; nationId?: string })

**Input**: source, optional filters  
**Output**: `Promise<NationMoveSummary[]>`

- For Move Library: returns moves for browsing. Canonical = tier CANONICAL; proposed = CUSTOM/CANDIDATE.

## Schema

### NationMove (existing, extend usage)

- `tier`: EPHEMERAL | CUSTOM | CANDIDATE | CANONICAL — use CUSTOM for extracted, CANDIDATE for Regent-approved, CANONICAL for live.
- `origin`: GM_AUTHORED | PLAYER_NAMED | AI_PROPOSED | BOOK_EXTRACTED. Add BOOK_EXTRACTED to schema comment; origin is free string so no migration required.
- `agentMetadata` or new `sourceMetadata`: JSON `{ sourceBookId?, sourceChunkIndex? }` for provenance.

### MoveProposal (optional alternative)

- If NationMove is too heavy for proposals, add MoveProposal model: id, bookId, chunkIndex, name, description, moveType, barKind, nationId, status (pending|approved|rejected), createdAt. On approve, create NationMove from proposal. For MVP, creating NationMove with tier CUSTOM is simpler.

## Dependencies

- [Book-to-Quest Library](book-to-quest-library/spec.md) — existing book analysis, chunks, admin books UI
- [Nation Move Profiles](nation-move-profiles/spec.md) — nation/move alignment
- [Transformation Move Library](transformation-move-library/spec.md) — WCGS, move types
- [Daemon Move System](seed-daemon-move-system.yaml) — DaemonMoveCreation, tier ladder (future 321 wiring)

## Non-Goals (MVP)

- 321 → move creation flow (DaemonMoveCreation wiring)
- CYOA BAR nomination to move (manual admin for now)
- Semantic embedding for fingerprinting (use name similarity first)
- Player-facing Move Library UI (admin-only in MVP)

## Verification

- Admin uploads PDF → extracts text → runs `analyzeBookForMoves` → sees proposed moves in queue → promotes one → move appears in nation move panel for quests.
