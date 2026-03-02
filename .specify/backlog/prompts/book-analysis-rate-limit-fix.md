# Spec Kit Prompt: Book Analysis Rate Limit Fix

## Role

Fix the "Rate limit reached for gpt-4o... TPM: Limit 30000" error when running Trigger Analysis. Make the process token-efficient and resilient to rate limits.

## Objective

Implement per [.specify/specs/book-analysis-rate-limit-fix/spec.md](../specs/book-analysis-rate-limit-fix/spec.md). Root cause: 30 chunks × 5 parallel bursts exceed 30k TPM.

## Requirements

- **Token efficiency**: Condensed parser context (SHORT), smaller chunks (4000 chars)
- **Reduce burst**: MAX_CHUNKS=15, PARALLEL_BATCH=2, 6s delay between batches
- **Retry**: On rate limit, wait 15s and retry (max 3 attempts per chunk)
- **Verification**: Trigger Analysis completes on large book without rate limit

## Deliverables

- [ ] ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT
- [ ] book-analyze: constants, delay, retry helper
- [ ] book-chunker: CHARS_PER_CHUNK=4000
- [ ] Test on large book

## Reference

- Spec: [.specify/specs/book-analysis-rate-limit-fix/spec.md](../specs/book-analysis-rate-limit-fix/spec.md)
- Plan: [.specify/specs/book-analysis-rate-limit-fix/plan.md](../specs/book-analysis-rate-limit-fix/plan.md)
