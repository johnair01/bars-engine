# Tasks: Book Quest Targeted Extraction v0

## Implementation

- [x] TOC extraction persisted on Book (`extractBookToc`, `metadataJson.toc` + `sectionHints`)
- [x] `chunkBookTextWithToc` used in `analyzeBook` / `analyzeBookForMoves` when TOC available
- [x] `AnalysisFilters` + `chunkMatchesFilters` + `buildTargetPromptLine` in `book-analyze.ts`
- [x] Admin books UI passes filters to `analyzeBook` (`BookList.tsx`)

## Verification

- [x] `npm run build` and `npm run check` (repo CI / fail-fix)

## Deferred (spec v1)

- [ ] Chapter-only extraction scope in UI
- [ ] Metrics: tokens saved per filtered run (logging)
