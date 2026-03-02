# Spec: Book Analysis — Rate Limit and Token Efficiency Fix

## Purpose

Fix the "Rate limit reached for gpt-4o... TPM: Limit 30000, Used 30000" error when running Trigger Analysis on large books. Make the process token-efficient and resilient to rate limits.

## Root cause analysis

### Rate limit

- **Limit**: 30,000 tokens per minute (TPM) for gpt-4o (Tier 1)
- **Current usage**: 30 chunks × 5 parallel = 6 batches in quick succession
- **Per request**: ~2,000–2,500 tokens (system prompt ~500, chunk ~1,500, schema + response ~500)
- **Burst**: 5 parallel × 2,500 = 12,500 tokens per batch; 6 batches ≈ 75,000 tokens in ~30 seconds
- **Result**: Exceeds 30k TPM; "Failed after 3 attempts" when retries also hit limit

### Token drivers

| Component | Est. tokens | Notes |
|-----------|-------------|-------|
| ALLYSHIP_DOMAINS_PARSER_CONTEXT | ~500 | Full domain definitions, table, rules |
| Chunk text | ~1,500 | 6000 chars @ ~4 chars/token |
| Schema + system wrapper | ~200 | Zod schema, instructions |
| Response | ~300 | 1–5 quests per chunk |
| **Total per request** | **~2,500** | |

## Expected behavior

1. **Complete without rate limit**: Trigger Analysis finishes for books up to 150k words.
2. **Token efficient**: Minimize tokens per request and total requests.
3. **Resilient**: When rate limited, wait and retry instead of failing.

## User story

**As an admin**, I want to run Trigger Analysis on extracted books without hitting rate limit errors, so I can complete the Book-to-Quest Library flow reliably.

**Acceptance**: Analysis completes; rate limit errors are avoided or handled with retry; total time remains reasonable (~2–3 min).

## Solution approach

### 1. Reduce token usage per request

- **Shorter parser context**: Create `ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT` — condensed domain definitions (~200 tokens) for book analysis. Keep full context for other use cases.
- **Smaller chunks**: Reduce `CHARS_PER_CHUNK` from 6000 to 4000 (~1000 tokens per chunk). Fewer tokens per request; may need more chunks for coverage — net: similar or fewer total tokens.
- **Tighter prompts**: Shorter system instructions; remove redundant text.

### 2. Reduce burst (spread over time)

- **Lower concurrency**: `PARALLEL_BATCH` from 5 to 2. Fewer simultaneous requests.
- **Inter-batch delay**: Add `await sleep(6000)` between batches. Allows TPM window to recover. 6 batches × 6s = 36s of delay; total time ~2 min.
- **Fewer chunks**: `MAX_CHUNKS` from 30 to 15. Half the requests; 15 × 2,500 = 37,500 tokens total. With 2 parallel + 6s delay: 8 batches × 6s = 48s delay. 37.5k tokens over ~90s = 25k TPM. Under limit.

### 3. Retry with backoff on rate limit

- Wrap `generateObject` in retry logic: on "rate limit" or "429", wait 10–15 seconds, retry. Max 3 retries per chunk.
- Or use AI SDK retry if available; ensure delay is long enough for TPM reset.

### 4. Model choice (optional)

- **gpt-4o-mini**: Higher TPM limits (150k+ on some tiers), cheaper, may suffice for structured extraction. Test quality first.
- Make model configurable via env: `BOOK_ANALYSIS_MODEL=gpt-4o-mini` default, override to gpt-4o if needed.

## Functional requirements

- **FR1**: Analysis MUST complete without rate limit errors for typical books (up to 150k words).
- **FR2**: Token usage per request MUST be reduced (shorter context, smaller chunks, or both).
- **FR3**: Request burst MUST be reduced (lower PARALLEL_BATCH, inter-batch delay).
- **FR4**: On rate limit error, MUST retry after delay (e.g. 10–15s) up to N times before failing.
- **FR5**: Total analysis time MUST remain under ~3 minutes for 15 chunks.

## Non-functional requirements

- Preserve quest extraction quality; condensed context must still allow correct domain/move assignment.
- Configurable constants (MAX_CHUNKS, PARALLEL_BATCH, delay) for tuning.

## Out of scope

- Background job / queue for analysis (future)
- Streaming progress UI
- Batch API (different product)

## Reference

- [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts)
- [src/lib/book-chunker.ts](../../src/lib/book-chunker.ts)
- [src/lib/allyship-domains-parser-context.ts](../../src/lib/allyship-domains-parser-context.ts)
- [OpenAI Rate limits](https://platform.openai.com/docs/guides/rate-limits)
