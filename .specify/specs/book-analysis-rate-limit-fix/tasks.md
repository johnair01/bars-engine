# Tasks: Book Analysis Rate Limit Fix

- [x] Add ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT to allyship-domains-parser-context.ts
- [x] Reduce MAX_CHUNKS to 15, PARALLEL_BATCH to 2 in book-analyze
- [x] Add BATCH_DELAY_MS (6s) between batches
- [x] Add generateWithRetry helper with 15s wait on rate limit (in ai-with-cache.ts)
- [x] Reduce CHARS_PER_CHUNK to 4000 in book-chunker
- [x] Use SHORT context in book-analyze
- [x] (Optional) Add BOOK_ANALYSIS_MODEL env for gpt-4o-mini
- [x] Test: Trigger Analysis on large book; verify no rate limit (manual: run from Admin > Books on extracted book)
