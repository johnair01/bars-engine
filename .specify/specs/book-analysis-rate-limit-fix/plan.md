# Plan: Book Analysis Rate Limit Fix

## Summary

Reduce token usage, lower concurrency, add inter-batch delay, and retry on rate limit. Target: stay under 30k TPM, complete in ~2–3 min.

## Implementation

### 1. Condensed parser context ([src/lib/allyship-domains-parser-context.ts](src/lib/allyship-domains-parser-context.ts))

Add `ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT`:

```
Domains (assign one when clear): GATHERING_RESOURCES=additive, resources; DIRECT_ACTION=obstacles, steps; RAISE_AWARENESS=helping others see; SKILLFUL_ORGANIZING=coordinating, delegating. Moves: wakeUp=see, cleanUp=unblock, growUp=skill, showUp=do. Prefer domain when clear; null if purely individual.
```

~80 tokens vs ~500. Use in book-analyze only.

### 2. Reduce constants ([src/actions/book-analyze.ts](src/actions/book-analyze.ts))

| Constant | Before | After | Rationale |
|----------|--------|-------|-----------|
| MAX_CHUNKS | 30 | 15 | Half the requests; 15×2k = 30k tokens total |
| PARALLEL_BATCH | 5 | 2 | Lower burst; 2×2k = 4k per batch |
| (new) BATCH_DELAY_MS | - | 6000 | 6s between batches; TPM resets |

### 3. Smaller chunks ([src/lib/book-chunker.ts](src/lib/book-chunker.ts))

| Constant | Before | After |
|----------|--------|-------|
| CHARS_PER_CHUNK | 6000 | 4000 |

~1000 tokens per chunk vs ~1500. Fewer tokens per request.

### 4. Inter-batch delay

```ts
for (let i = 0; i < chunksToProcess.length; i += PARALLEL_BATCH) {
  const batch = chunksToProcess.slice(i, i + PARALLEL_BATCH)
  const results = await Promise.all(batch.map(...))
  results.forEach((r) => allQuests.push(...r.object.quests))
  if (i + PARALLEL_BATCH < chunksToProcess.length) {
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
  }
}
```

### 5. Retry on rate limit

Wrap the `generateObject` call in a helper:

```ts
async function generateWithRetry(opts: GenerateObjectOptions, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateObject(opts)
    } catch (e: any) {
      const isRateLimit = /rate limit|429|TPM|tokens per min/i.test(e?.message ?? '')
      if (isRateLimit && attempt < maxRetries) {
        const waitMs = 15000 // 15s for TPM reset
        console.warn(`[BOOKS] Rate limit, waiting ${waitMs/1000}s (attempt ${attempt}/${maxRetries})`)
        await new Promise(r => setTimeout(r, waitMs))
      } else {
        throw e
      }
    }
  }
}
```

Use `generateWithRetry` instead of `generateObject` in the batch loop.

### 6. Optional: gpt-4o-mini

Add env `BOOK_ANALYSIS_MODEL` (default `gpt-4o-mini`). gpt-4o-mini has higher TPM and is cheaper. Test extraction quality; fallback to gpt-4o if needed.

## File impacts

| Action | Path |
|--------|------|
| Modify | src/lib/allyship-domains-parser-context.ts (add SHORT) |
| Modify | src/actions/book-analyze.ts (constants, delay, retry, use SHORT) |
| Modify | src/lib/book-chunker.ts (CHARS_PER_CHUNK) |
| Optional | getOpenAI model selection for book analysis |

## Verification

1. Run Trigger Analysis on 111k-word book — completes without rate limit
2. Check metadata: chunksAnalyzed ≤ 15, quests created
3. Verify quest quality (domain/move assignment) with condensed context
