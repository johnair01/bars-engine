# Tasks: AI Deftness and Token Efficiency Strategy

## Phase 1: Foundation (complete rate limit fix first)

- [x] Implement [Book Analysis Rate Limit Fix](../book-analysis-rate-limit-fix/tasks.md) (merged into this implementation)
- [x] Add BOOK_ANALYSIS_MODEL env (default gpt-4o-mini) in book-analyze
- [x] Add QUEST_GEN_MODEL env in generate-quest

## Phase 2: Chunk Pre-filter

- [x] Create src/lib/chunk-filter.ts with chunkIsActionable()
- [x] Integrate filter in book-analyze: filter chunks before sampleEvenly
- [x] Add chunksSkipped to analysis metadata

## Phase 3: Response Cache

- [x] Add AiResponseCache model to Prisma (or choose Redis/lru-cache)
- [x] Create src/lib/ai-with-cache.ts with generateObjectWithCache
- [x] Implement getCached/setCached (DB or Redis)
- [x] Integrate cache in book-analyze with inputKey = bookId:chunkIndex:chunkHash
- [x] Integrate cache in generate-quest with inputKey = hexagramId:playbookId:firstAidLensId
- [x] Add cacheHits/cacheMisses to analysis metadata

## Phase 4: Heuristic Classification (optional)

- [ ] Create src/lib/quest-classifier.ts with suggestDomain()
- [ ] Use as hint in book-analyze when confidence > 0.8 (or defer)

## Phase 5: I Ching Template Fallback (optional, defer)

- [ ] Document template format in spec
- [ ] Create template files per hexagram (defer)

## Phase 6: Control Plane (optional)

- [ ] Add AiUsageLog model and logging in ai-with-cache
- [ ] Add BOOK_ANALYSIS_AI_ENABLED, QUEST_GEN_AI_ENABLED env
- [ ] Add per-feature token budget check (defer)

## Verification

- [ ] Test: Book analysis with filter — chunksSkipped > 0 for typical book
- [ ] Test: Re-run analysis — cache hits, no new API calls for same chunks
- [ ] Test: I Ching quest gen twice same params — second call cache hit
- [ ] Test: BOOK_ANALYSIS_AI_ENABLED=false — clear error returned
