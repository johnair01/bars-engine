# Prompt: Narrative Transformation Engine v0

**Use this prompt when implementing the Narrative Transformation Engine — parse stuck narrative, detect locks, generate moves, link to Emotional Alchemy / 3-2-1, produce quest seeds.**

## Context

The engine converts a player's stuck narrative into a playable transformation loop. Pipeline: Narrative Input → Parse → Boundary Detection → Transformation Move Generation → Emotional Alchemy Link → Quest/Action Generation. Heuristic parsing for v0; small move catalog (Perspective Shift, Boundary Disruption, Energy Reallocation). API-first; compatible with Emotional First Aid, 321 Shadow, quest grammar, BAR capture.

## Prompt text

> Implement the Narrative Transformation Engine per [.specify/specs/narrative-transformation-engine/spec.md](../specs/narrative-transformation-engine/spec.md). Add `src/lib/narrative-transformation/` with: types.ts, parse.ts, lockDetection.ts, moves.ts, alchemyLink.ts, quest321.ts, questSeed.ts, index.ts. **API contracts first** — define ParsedNarrative, LockType, TransformationMove, QuestSeed. Implement heuristic parser (actor, state, object), lock detector (identity, emotional, action, possibility), move generator, alchemy link, optional 3-2-1 prompts, quest seed generator. Add server actions or API routes: parse, moves, quest-seed, full. Ensure compatibility with emotional-first-aid and quest-grammar. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: types.ts, parse.ts, lockDetection.ts, unit tests
- [ ] Phase 2: moves.ts (move catalog + generator)
- [ ] Phase 3: alchemyLink.ts, quest321.ts
- [ ] Phase 4: questSeed.ts
- [ ] Phase 5: Server actions, docs, optional EFA intake wiring

## Reference

- Spec: [.specify/specs/narrative-transformation-engine/spec.md](../specs/narrative-transformation-engine/spec.md)
- Plan: [.specify/specs/narrative-transformation-engine/plan.md](../specs/narrative-transformation-engine/plan.md)
- Tasks: [.specify/specs/narrative-transformation-engine/tasks.md](../specs/narrative-transformation-engine/tasks.md)
- Architecture: [docs/architecture/narrative-transformation-engine.md](../../docs/architecture/narrative-transformation-engine.md)
- API: [docs/architecture/narrative-transformation-api.md](../../docs/architecture/narrative-transformation-api.md)
- Examples: [docs/examples/narrative-transformation-example.md](../../docs/examples/narrative-transformation-example.md), [docs/examples/transformation-quest-example.md](../../docs/examples/transformation-quest-example.md)
