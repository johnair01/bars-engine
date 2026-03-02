# Spec Kit Prompt: AI Deftness and Token Efficiency Strategy

## Role

Implement a multi-layered strategy to increase AI deftness, reduce OpenAI token usage at scale, and make the app more deterministic.

## Objective

Implement per [.specify/specs/ai-deftness-token-strategy/spec.md](../specs/ai-deftness-token-strategy/spec.md). Strategy: (1) complete rate limit fix, (2) chunk pre-filter, (3) response cache, (4) optional heuristics, (5) control plane.

## Requirements

- **Phase 1**: BOOK_ANALYSIS_MODEL, QUEST_GEN_MODEL env; rate limit fix done
- **Phase 2**: chunkIsActionable() filter; skip non-actionable chunks; metadata chunksSkipped
- **Phase 3**: AiResponseCache; generateObjectWithCache; cache for book analysis and quest gen
- **Phase 4** (optional): quest-classifier heuristics
- **Phase 6** (optional): AiUsageLog, feature flags, budgets

## Deliverables

- [ ] chunk-filter.ts
- [ ] ai-with-cache.ts
- [ ] AiResponseCache model + getCached/setCached
- [ ] book-analyze: filter, cache, model env
- [ ] generate-quest: cache, model env
- [ ] Verification: cache hits on re-run; filter reduces chunks

## Reference

- Spec: [.specify/specs/ai-deftness-token-strategy/spec.md](../specs/ai-deftness-token-strategy/spec.md)
- Plan: [.specify/specs/ai-deftness-token-strategy/plan.md](../specs/ai-deftness-token-strategy/plan.md)
- Depends on: [Book Analysis Rate Limit Fix](../specs/book-analysis-rate-limit-fix/spec.md)
