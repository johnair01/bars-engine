# Plan: Book Analysis Timeout Fix

## Summary

Limit analysis to a max number of chunks, sample evenly for large books, process chunks in parallel, and set route maxDuration. Target: complete within ~2 min for 111k-word books.

## Implementation

### 1. Chunk limit and sampling ([src/lib/book-chunker.ts](src/lib/book-chunker.ts))

Add `chunkBookText(text, options?: { maxChunks?: number })`. When `maxChunks` is set and total chunks exceed it, sample evenly:

```ts
// If chunks.length > maxChunks, pick evenly spaced indices
// e.g. maxChunks=30, total=103 → indices 0,3,6,...,99
```

Export the sampling logic or do it in the chunker. Alternative: add `sampleChunks(chunks, maxN)` in book-analyze.

### 2. Parallel processing ([src/actions/book-analyze.ts](src/actions/book-analyze.ts))

Replace sequential loop with batched parallel:

```ts
const MAX_CHUNKS = 30
const PARALLEL_BATCH = 5
const chunksToProcess = chunks.length > MAX_CHUNKS 
  ? sampleEvenly(chunks, MAX_CHUNKS) 
  : chunks

const allQuests: ... = []
for (let i = 0; i < chunksToProcess.length; i += PARALLEL_BATCH) {
  const batch = chunksToProcess.slice(i, i + PARALLEL_BATCH)
  const results = await Promise.all(batch.map(chunk => 
    generateObject({ model: getOpenAI()('gpt-4o'), schema: analysisSchema, ... })
  ))
  results.forEach(r => allQuests.push(...r.object.quests))
}
```

### 3. Sampling helper

```ts
function sampleEvenly<T>(arr: T[], maxN: number): T[] {
  if (arr.length <= maxN) return arr
  const step = (arr.length - 1) / (maxN - 1)
  return Array.from({ length: maxN }, (_, i) => arr[Math.round(i * step)])
}
```

### 4. Route maxDuration ([src/app/admin/books/page.tsx](src/app/admin/books/page.tsx))

```ts
export const maxDuration = 120 // 2 min for Vercel Pro
```

### 5. Metadata

Store `chunksAnalyzed` and `chunksTotal` in analysis metadata so admins see "30 of 103 chunks" when sampling was used.

## File impacts

| Action | Path |
|--------|------|
| Modify | src/lib/book-chunker.ts (add sampleChunks or options) |
| Modify | src/actions/book-analyze.ts (limit, sample, parallelize) |
| Modify | src/app/admin/books/page.tsx (maxDuration) |

## Verification

1. Analyze 111k-word book — completes in ~1–2 min
2. Metadata shows chunksAnalyzed ≤ 30 when total > 30
3. Quests created; no timeout or stuck UI
