# Spec: Book Analysis — Fix Timeout / Stuck "Analyzing" Loop

## Purpose

Fix the analysis flow that appears stuck when clicking "Trigger Analysis" on large books (e.g. 371 pages, 111k words). Users expect a summary aligned with game moves; instead the UI stays on "Analyzing..." for 3+ minutes with no completion or feedback.

## Root cause analysis

### 1. Unbounded sequential work

- **Chunk size**: 6000 chars (~1500 tokens) per chunk ([book-chunker.ts](../../src/lib/book-chunker.ts))
- **Book size**: 111,919 words ≈ 615,000 chars → **~103 chunks**
- **Processing**: Sequential `for` loop, one OpenAI API call per chunk ([book-analyze.ts](../../src/actions/book-analyze.ts) lines 77–95)
- **Per-chunk latency**: ~5–15 seconds each
- **Total time**: 103 × 10s ≈ **17 minutes** worst case

### 2. Platform timeouts

- **Vercel**: Server Actions default to ~15s (Hobby 10s, Pro up to 300s). Analysis would be killed mid-run on deploy.
- **Local**: No hard timeout, but 17 min feels "stuck" to users.

### 3. No progress feedback

- Client shows "Analyzing..." with no chunk count or progress. User cannot tell if it is working or hung.

### 4. No chunk limit

- Large books create 100+ API calls with no cap. Cost and time scale linearly with book size.

## Expected vs perceived behavior

| Expected | Perceived |
|----------|-----------|
| Click Analyze → get quest summary in alignment with game moves | App stuck in "Analyzing..." / "Rendering..." loop for 3+ min |

## User story

**As an admin**, I want to run Trigger Analysis on extracted books and receive a quest summary within a reasonable time (under 2 minutes), so I can proceed to publish without the UI appearing frozen.

**Acceptance**: Analysis completes within ~2 min for typical books; large books (100k+ words) complete via sampled chunks; user sees progress or clear feedback.

## Solution options

| Option | Pros | Cons |
|--------|------|------|
| **A: Chunk limit + sampling** | Bounded time; representative coverage | May miss content in middle of very long books |
| **B: Parallel processing** | Faster wall-clock; same coverage | Higher concurrent API load; rate limits |
| **C: Background job** | No timeout; progress UI | Larger change; queue infra |
| **D: Increase chunk size** | Fewer chunks | Less granular; may hit context limits |

**Recommended**: **A + B** — Limit to ~30 chunks, sample evenly for large books, process 5 chunks in parallel. Target: ~1–2 min for 111k-word book.

## Functional requirements

- **FR1**: Analysis MUST complete within ~2 minutes for books up to 150k words.
- **FR2**: Large books MUST be sampled (e.g. max 30 chunks) with even distribution across the text.
- **FR3**: Chunks MAY be processed in parallel (e.g. 5 at a time) to reduce wall-clock time.
- **FR4**: `maxDuration` MUST be set on the admin/books route to allow extended execution (e.g. 120s) where supported.
- **FR5**: Metadata MUST record how many chunks were analyzed vs total (e.g. "30 of 103 chunks") for transparency.

## Out of scope

- Full background job / queue (future enhancement)
- Real-time progress UI (requires streaming or polling; larger change)

## Reference

- [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts)
- [src/lib/book-chunker.ts](../../src/lib/book-chunker.ts)
- [src/app/admin/books/BookList.tsx](../../src/app/admin/books/BookList.tsx)
- [Next.js maxDuration](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration)
