# Spec: Branched Path Orientation

## Purpose

Define branched path model: altitude (6 Faces) + longitudinal (4 moves spread) + domain (allyship domains). Support token-controlled AI generation to avoid fractal chaos. Expand choice limit to 2–4 so all 4 moves can be available when move spread is primary.

## Conceptual Model

- **Altitude**: 6 Faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage) — developmental lens paths
- **Longitudinal**: 4 moves (Wake Up, Clean Up, Grow Up, Show Up) — at each beat, player chooses which move to apply
- **Domain**: Allyship domains (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing)
- **Combined**: Linear path with branching by move + optional altitude/domain; things change when altitude and domain are included

## Dependencies

- [nation-playbook-choice-privileging](.specify/specs/nation-playbook-choice-privileging/spec.md) — 2–4 choices; nation element + playbook WAVE
- [quest-grammar-ux-flow](.specify/specs/quest-grammar-ux-flow/spec.md) — Generation flow
- [ai-deftness-token-strategy](.specify/specs/ai-deftness-token-strategy/spec.md) — Token budgets, heuristic fallbacks

## Functional Requirements

- **FR1**: Choices per passage MUST support 2–4 (style guide). When move spread is primary, allow 4 (one per move).
- **FR2**: Branch points = move choice + optional altitude/domain. Heuristic-first; AI only for leaf expansion.
- **FR3**: Token budget per generation call; fail gracefully when exceeded.
- **FR4**: Max depth cap for branch expansion to avoid fractal chaos.

## API (Future)

```ts
function generateBranchedPath(input: BranchedPathInput, options?: { maxDepth?: number; tokenBudget?: number }): Promise<BranchedQuestPacket>
```

## Reference

- Move engine: [src/lib/quest-grammar/move-engine.ts](../../src/lib/quest-grammar/move-engine.ts)
- Choice privileging: [src/lib/quest-grammar/move-assignment.ts](../../src/lib/quest-grammar/move-assignment.ts)
