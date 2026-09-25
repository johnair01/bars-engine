# Plan: Emotional Alchemy Compound Emotions

Implement per [spec.md](./spec.md). Keep this as a **read-only deterministic diagnostic layer** first. The deft move is to model the lattice in data, verify its invariants, then expose it gently in docs/wiki.

## Architectural Strategy

The existing engine already owns:

- primary channels,
- altitudes,
- sheng/ke cycles,
- vector move families,
- growth scene routing.

Compound emotions should not sit inside `resolveMoveDestination()` or change movement behavior. They should live beside the alchemy graph as an optional interpretive layer:

```text
AlchemyState + AlchemyState
-> possible CompoundEmotionSlot(s)
-> component channels
-> existing treatment guidance
```

The module should be pure TypeScript data and functions. No database. No server action. No UI state. No AI.

## Critical Files

| File | Change |
| --- | --- |
| `src/lib/alchemy/compound-emotions.ts` | New deterministic lattice data + lookup/resolver helpers |
| `src/lib/alchemy/__tests__/compound-emotions.test.ts` | New invariant and resolver tests |
| `src/app/wiki/emotional-alchemy/page.tsx` | Compact compound-emotions reference section |
| `src/lib/alchemy/alchemy-graph.ts` | Optional: link Dread alias to compound note in comments only; avoid behavior changes unless tests require |
| `packages/bars-core` | Out of scope for v1; add a parity note if needed |

## Data Shape

Use stable ids that encode edge and dominant channel:

```text
fear-sadness__fear-dominant
fear-sadness__sadness-dominant
joy-anger__joy-dominant
joy-anger__anger-dominant
```

For sheng edges, `dominantChannel` doubles as early/late stage:

- source dominant = early/source-heavy
- target dominant = late/target-heavy

For ke edges, `dominantChannel` means the force winning the standoff.

## Resolver Strategy

Start explicit and conservative:

```ts
resolveCompoundEmotion({
  a: { channel: 'fear', altitude: 'dissatisfied' },
  b: { channel: 'sadness', altitude: 'dissatisfied' },
  dominantChannel: 'fear',
})
```

Return:

- matching slot,
- component channels,
- component states,
- note that treatment uses component channels,
- suggested existing vector families for stabilizing/transcending each component.

Do not infer dominance automatically in v1. Inference can be a later UX or classifier concern.

## Verification Approach

Tests should cover:

- exactly 20 slots,
- exactly 10 unordered channel pairs,
- exactly 2 directional slots per pair,
- each channel appears in 4 pair edges and 8 directional slots,
- named slots: Dread, Disappointment, Disgust/Contempt,
- candidate status preserved for all non-named slots,
- resolver returns Dread for fear+sadness with fear dominant,
- resolver returns no direct compound move recommendation.

Run focused test if available, then `npm run check` or the repo's relevant type/test command.

## Phase Order

1. Type/data module.
2. Tests.
3. Resolver helper.
4. Wiki/docs exposure.
5. Optional prompt-context integration, only after the deterministic layer is stable.

## Risk Notes

- **Ontology drift risk**: Avoid language implying "35 emotional states" or "60 states." Always say 15 primary states plus 20 compound slots/families.
- **Runtime overreach risk**: Do not route gameplay from compounds until there is evidence it improves scene generation.
- **Naming risk**: Candidate names are not final. Keep `nameStatus`.
- **Duplicate package risk**: `packages/bars-core` has alchemy-adjacent code. Do not port casually; write a parity task when needed.
