# Spec: Book Quest Targeted Extraction v0

## Purpose

Reduce token waste and improve quest relevance when analyzing books by: (1) persisting a table of contents and section-level hints, (2) chunking with section metadata, and (3) letting admins filter analysis by move, nation, archetype, and Kotter stage soonly matching chunks are sent to the model.

**Problem**: Sending entire books or uniform chunks without structure yields noisy quests and high API cost.

**Practice**: Deftness — heuristics + optional filters before LLM; TOC stored in `metadataJson`; backward-compatible when TOC absent.

## Design Decisions

| Topic | Decision |
|-------|----------|
| TOC | `extractBookToc` writes `metadataJson.toc` with entries + `sectionHints` from `mapSectionsToDimensions`. |
| Chunking | `chunkBookTextWithToc` attaches `sectionIndex` / `sectionTitle` per chunk when TOC exists. |
| Filters | `AnalysisFilters` on `analyzeBook`; `chunkMatchesFilters` + `sectionContradictsFilters` skip irrelevant chunks; `buildTargetPromptLine` constrains the prompt. |
| Token savings | Skip chunks that contradict or fail heuristic filter; fewer `generateObjectWithCache` calls. |

## User Stories

### Admin

- As an admin, I want to extract a TOC from a book so sections align with chunks and hints.
- As an admin, I want to filter book analysis by move/nation/archetype/Kotter so I only pay for relevant sections.

## Functional Requirements (v0)

- **FR1**: `extractBookToc(bookId)` persists TOC + section hints (see `books.ts`).
- **FR2**: `analyzeBook(bookId, { filters })` uses TOC-aware chunks when metadata includes TOC.
- **FR3**: Filters are optional; with no filters, behavior matches full analysis (subject to existing `MAX_CHUNKS` / sampling).

## Acceptance Criteria

- [x] TOC extraction action exists and merges into `metadataJson`.
- [x] Chunks include section metadata when TOC present.
- [x] Admin UI can pass filters into `analyzeBook` (see `BookList.tsx`).
- [x] Filtered runs skip non-matching chunks per `chunkMatchesFilters`.

## Out of Scope (v1+)

- Player-facing “extract from chapter X only” without admin.
- Fine-tuned section→dimension classifier beyond current heuristics.

## References

- `src/actions/book-analyze.ts` — filters, `analyzeBook`, chunk pipeline.
- `src/actions/books.ts` — `extractBookToc`, `listBooks`.
- `src/lib/book-chunker.ts` — `chunkBookTextWithToc`.
- `src/lib/book-section-mapper.ts` — `mapSectionsToDimensions`.
- `src/lib/book-toc.ts` — `extractTocFromText`.
