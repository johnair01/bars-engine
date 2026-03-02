# Plan: AI Deftness and Token Efficiency Strategy

## Summary

Implement phased strategy: (1) complete rate limit fix, (2) chunk pre-filter to skip non-actionable content, (3) response cache for book chunks and I Ching quests, (4) optional heuristics and templates, (5) AI registry and feature flags. Target: reduce tokens, increase determinism, enable graceful degradation.

## Prerequisites

- [Book Analysis Rate Limit Fix](../book-analysis-rate-limit-fix/plan.md) MUST be implemented first (condensed context, delay, retry, model env).

## Phase 2: Chunk Pre-filter

### New file: `src/lib/chunk-filter.ts`

```ts
import type { TextChunk } from './book-chunker'

const ACTION_VERBS = /\b(do|try|practice|reflect|delegate|complete|write|list|identify|notice|observe)\b/i
const EXERCISE_MARKERS = /\b(exercise|practice|try this|activity|reflection|journal)\b/i
const SKIP_PATTERNS = [
  /\b(copyright|all rights reserved|isbn|published by)\b/i,
  /^[\d\s\.\-]+$/,  // mostly numbers
  /^.{0,200}$/,     // very short
]

export function chunkIsActionable(chunk: TextChunk): boolean {
  const text = chunk.text
  if (text.length < 300) return false
  if (SKIP_PATTERNS.some(p => p.test(text))) return false
  const actionScore = (text.match(ACTION_VERBS)?.length ?? 0) + (text.match(EXERCISE_MARKERS)?.length ?? 0) * 2
  return actionScore >= 2
}
```

### Integration in `book-analyze.ts`

- After `chunkBookText`, filter: `chunks.filter(chunkIsActionable)`
- Before `sampleEvenly`, apply filter so we sample from actionable chunks only
- Update `analysisMeta`: add `chunksSkipped: chunks.length - actionableChunks.length`

## Phase 3: Response Cache

### Option A: DB table (Prisma)

```prisma
model AiResponseCache {
  id        String   @id @default(cuid())
  inputHash String   @unique  // SHA-256 of normalized input
  feature   String   // "book_analysis" | "quest_gen"
  model     String
  outputJson String  // JSON string of result
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([inputHash, feature])
  @@index([expiresAt])
}
```

### Option B: In-memory / Redis (simpler for MVP)

- Use `lru-cache` or Redis with TTL. Key: `ai:${feature}:${inputHash}`.

### New file: `src/lib/ai-with-cache.ts`

```ts
import { generateObject } from 'ai'
import { createHash } from 'crypto'

export async function generateObjectWithCache<T>(opts: {
  feature: string
  inputKey: string  // e.g. chunk text or JSON string
  model: string
  schema: any
  system: string
  prompt: string
  getOpenAI: () => any
  ttlMs?: number
}): Promise<{ object: T; fromCache: boolean }> {
  const hash = createHash('sha256').update(opts.inputKey).digest('hex')
  const cacheKey = `ai:${opts.feature}:${hash}`

  // 1. Check cache (implement with DB or Redis)
  const cached = await getCached(cacheKey)
  if (cached) return { object: JSON.parse(cached) as T, fromCache: true }

  // 2. Call OpenAI
  const { object } = await generateObject({
    model: opts.getOpenAI()(opts.model),
    schema: opts.schema,
    system: opts.system,
    prompt: opts.prompt,
  })

  // 3. Store in cache
  await setCached(cacheKey, JSON.stringify(object), opts.ttlMs ?? 7 * 24 * 60 * 60 * 1000)

  return { object: object as T, fromCache: false }
}
```

### Cache key design

- **Book analysis**: `inputKey = `${bookId}:${chunk.index}:${chunk.text.slice(0,500)}:${chunk.text.length}``
- **Quest gen**: `inputKey = `${hexagramId}:${playbookId}:${firstAidLensId ?? 'none'}``

### Integration

- Replace direct `generateObject` in `book-analyze.ts` with `generateObjectWithCache`
- Replace in `generate-quest.ts` similarly
- Add `cacheHits` and `cacheMisses` to analysis metadata

## Phase 4: Heuristic Classification (Optional)

### New file: `src/lib/quest-classifier.ts`

```ts
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  SKILLFUL_ORGANIZING: ['delegate', 'organize', 'coordinate', 'structure', 'process'],
  RAISE_AWARENESS: ['let others know', 'visibility', 'discover', 'share'],
  DIRECT_ACTION: ['obstacle', 'blocking', 'remove', 'step', 'action'],
  GATHERING_RESOURCES: ['resource', 'capacity', 'energy', 'accumulate'],
}

export function suggestDomain(text: string): { domain: string | null; confidence: number } {
  // Score each domain by keyword matches; return top if confidence > 0.8
  // ...
}
```

- Use in book-analyze: if `suggestDomain(chunk.text).confidence > 0.8`, pass as hint to AI or skip AI for domain (AI still does title/description). Start conservative: use hint only, don't skip.

## Phase 5: I Ching Template Fallback (Optional)

- Create `docs/handbook/quest-templates/hexagram-{id}.json` or similar
- In `generateQuestCore`, check template first; if match, fill slots; else call AI
- Defer to later phase; document in spec only for now

## Phase 6: Control Plane

### AI usage logging

- Add `AiUsageLog` model or append to existing analytics
- Wrap `generateObject` / `generateObjectWithCache` to log after each call
- Fields: feature, model, inputTokens, outputTokens, latencyMs, timestamp

### Feature flags

- Env: `BOOK_ANALYSIS_AI_ENABLED=true`, `QUEST_GEN_AI_ENABLED=true`
- When false: book analysis returns error "AI disabled"; quest gen returns template or error

### Token budgets

- Env: `BOOK_ANALYSIS_DAILY_TOKEN_LIMIT=100000`
- Before analysis, sum today's usage for feature; if over limit, return "Daily limit reached"

## File Impacts

| Action | Path |
|--------|------|
| Create | src/lib/chunk-filter.ts |
| Create | src/lib/ai-with-cache.ts |
| Modify | src/actions/book-analyze.ts (filter, cache, metadata) |
| Modify | src/actions/generate-quest.ts (cache, model env) |
| Create | prisma/schema.prisma (AiResponseCache, AiUsageLog) — if DB cache |
| Optional | src/lib/quest-classifier.ts |

## Implementation Order

1. Complete [Book Analysis Rate Limit Fix](../book-analysis-rate-limit-fix/tasks.md)
2. Add chunk filter + integrate in book-analyze
3. Add AiResponseCache model + ai-with-cache.ts
4. Integrate cache in book-analyze and generate-quest
5. Add BOOK_ANALYSIS_MODEL, QUEST_GEN_MODEL env
6. (Optional) quest-classifier heuristics
7. (Optional) AiUsageLog + feature flags + budgets

## Verification

1. Run book analysis on large book — completes; metadata shows chunksSkipped
2. Re-run analysis on same book — cache hits; no new API calls for unchanged chunks
3. Set BOOK_ANALYSIS_AI_ENABLED=false — analysis returns clear error
4. I Ching quest gen with same hexagram+playbook — cache hit on second call
