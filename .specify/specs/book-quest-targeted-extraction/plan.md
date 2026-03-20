# Plan: Book Quest Targeted Extraction v0

## Phase 1: Persist TOC + hints (done)

- `extractTocFromText` → `mapSectionsToDimensions` → `metadataJson.toc`.

## Phase 2: TOC-aware chunking (done)

- `chunkBookTextWithToc` in analysis and move-extraction paths.

## Phase 3: Admin filters (done)

- `AnalysisFilters` + UI in `BookList.tsx`; server-side chunk filtering + prompt line.

## Phase 4: Verification (done)

- `npm run build` / `npm run check`; manual admin path on `/admin/books`.

## Deferred (v1)

- Stronger section classifiers; chapter picker; cache keys per filter set documented for invalidation.
