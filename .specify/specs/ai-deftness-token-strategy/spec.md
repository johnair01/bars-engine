# Spec: AI Deftness and Token Efficiency Strategy

## Purpose

Implement a multi-layered strategy to increase AI deftness, reduce OpenAI token usage at scale, and make the app more deterministic. Combines rule-based alternatives, caching, smarter chunking, and architectural controls so the app can scale without unbounded API costs.

**Problem**: Current AI usage (book analysis, I Ching quest generation) is fully non-deterministic, uncached, and can hit rate limits. As the app grows, token costs and reliability become blockers.

**Terminology**: Deftness = intentional, controlled use of AI; deterministic = predictable outputs without AI when possible.

## Conceptual Model

| Layer | Goal | Examples |
|-------|------|----------|
| **Deterministic** | Replace AI with rules where possible | Chunk pre-filter, keyword→domain heuristics |
| **Hybrid** | Rules first, AI fallback | Pre-filter chunks; AI only on ambiguous |
| **Token efficiency** | Reduce cost per call | Cache, smaller model, condensed prompts |
| **Control plane** | Cap and monitor usage | Budgets, feature flags, logging |

## Current AI Usage

| Feature | Location | Model | Token drivers |
|--------|----------|-------|---------------|
| Book analysis | [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts) | gpt-4o | 30 chunks × ~2.5k tokens; ALLYSHIP_DOMAINS_PARSER_CONTEXT ~500 |
| I Ching quest gen | [src/actions/generate-quest.ts](../../src/actions/generate-quest.ts) | gpt-4o | Per-player, per-hexagram; system + hexagram + playbook |

No caching, no rule-based fallbacks. All calls are live and non-deterministic.

## User Stories

### Admin

- As an admin, I want book analysis to complete without rate limit errors, so I can reliably process books.
- As an admin, I want re-analysis of the same book to use cached results when chunks are unchanged, so I save tokens and time.

### Developer

- As a developer, I want AI usage logged and budgeted per feature, so I can control costs and debug issues.
- As a developer, I want the option to disable AI and use rule-based fallbacks, so the app degrades gracefully when needed.

### System

- The app MUST stay under configurable token budgets per feature.
- The app MUST reduce AI calls where deterministic rules suffice.

## Functional Requirements

### Phase 1: Foundation (depends on [Book Analysis Rate Limit Fix](../book-analysis-rate-limit-fix/spec.md))

- **FR1**: Rate limit fix MUST be implemented (condensed context, delay, retry, optional gpt-4o-mini).
- **FR2**: `BOOK_ANALYSIS_MODEL` env MUST allow gpt-4o-mini (default) or gpt-4o override.
- **FR3**: `QUEST_GEN_MODEL` env MUST allow model override for I Ching quest generation.

### Phase 2: Deterministic Pre-filtering

- **FR4**: Chunk pre-filter MUST skip chunks that clearly lack actionable content (copyright, tables, pure narrative).
- **FR5**: `chunkIsActionable(chunk)` MUST use regex/keyword scoring; chunks with score below threshold are not sent to AI.
- **FR6**: Metadata MUST record `chunksSkipped` and `chunksAnalyzed` for observability.

### Phase 3: Response Caching

- **FR7**: AI response cache MUST store outputs keyed by input hash (chunk hash for books; hexagramId+playbookId for quests).
- **FR8**: Cache lookup MUST occur before calling OpenAI; on hit, return cached result without API call.
- **FR9**: Cache MUST have configurable TTL (e.g., 7–30 days); stale entries can be evicted.
- **FR10**: Cache storage: DB table `AiResponseCache` or Redis; implementation choice documented.

### Phase 4: Heuristic Classification (Optional)

- **FR11**: Heuristic move/domain hints MAY classify obvious cases (e.g., "delegate" → SKILLFUL_ORGANIZING) without AI.
- **FR12**: When heuristic confidence > threshold, use rule result; else call AI. Quality preserved.

### Phase 5: I Ching Template Fallback (Optional)

- **FR13**: Quest templates MAY exist per hexagram or playbook move; AI only fills slots when no template fits.
- **FR14**: Player MAY opt for "creative" mode to force AI; otherwise template-first.

### Phase 6: Control Plane

- **FR15**: AI call registry MUST log feature, model, inputTokens, outputTokens, latency (to DB or analytics).
- **FR16**: Per-feature token budgets MUST be configurable; when exceeded, fail gracefully or queue.
- **FR17**: Feature flags `BOOK_ANALYSIS_AI_ENABLED`, `QUEST_GEN_AI_ENABLED` MUST allow disabling AI; fallback to rules/templates.

## Non-functional Requirements

- Preserve quest extraction quality; condensed context and heuristics must not degrade output.
- Configurable constants for tuning (thresholds, TTL, budgets).
- Cache and registry add minimal latency; use async where appropriate.

## Out of Scope (Future)

- Embedding-based pre-filtering (requires vector DB)
- Structure-aware chunking (chapter/section parsing)
- OpenAI Batch API for bulk analysis
- Background job queue for analysis

## Dependencies

- [Book Analysis Rate Limit Fix](../book-analysis-rate-limit-fix/spec.md) (Phase 1)
- [Book-to-Quest Library](../book-to-quest-library/spec.md)
- OpenAI / Vercel AI SDK (existing)
- Prisma (existing)

## Reference

- [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts)
- [src/actions/generate-quest.ts](../../src/actions/generate-quest.ts)
- [src/lib/book-chunker.ts](../../src/lib/book-chunker.ts)
- [src/lib/allyship-domains-parser-context.ts](../../src/lib/allyship-domains-parser-context.ts)
- [src/lib/openai.ts](../../src/lib/openai.ts)
- [docs/OPENAI_API_USAGE.md](../../docs/OPENAI_API_USAGE.md)
