# Spec Kit Prompt: Book Analysis Timeout Fix

## Role

Fix the analysis flow that appears stuck when clicking "Trigger Analysis" on large books (371 pages, 111k words). Root cause: 100+ sequential API calls taking 17+ min; no chunk limit; platform timeouts.

## Objective

Implement per [.specify/specs/book-analysis-timeout-fix/spec.md](../specs/book-analysis-timeout-fix/spec.md). Limit to ~30 chunks (sampled evenly), process 5 at a time in parallel, set maxDuration on route.

## Requirements

- **Chunk limit**: Max 30 chunks; sample evenly when total > 30
- **Parallel**: Process 5 chunks per batch
- **maxDuration**: 120s on admin/books page
- **Metadata**: Record chunksAnalyzed and chunksTotal
- **Verification**: 111k-word book completes in ~2 min

## Deliverables

- [ ] book-analyze.ts: sampling + parallel batching
- [ ] admin/books/page.tsx: maxDuration = 120
- [ ] Metadata update
- [ ] Test on large book

## Reference

- Spec: [.specify/specs/book-analysis-timeout-fix/spec.md](../specs/book-analysis-timeout-fix/spec.md)
- Plan: [.specify/specs/book-analysis-timeout-fix/plan.md](../specs/book-analysis-timeout-fix/plan.md)
