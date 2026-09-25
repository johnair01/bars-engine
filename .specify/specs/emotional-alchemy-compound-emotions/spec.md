# Spec: Emotional Alchemy Compound Emotions

## Purpose

Bring the **Compound Emotions — 20-Slot Lattice** into bars-engine as a deterministic diagnostic layer on top of the existing Emotional Alchemy channel system.

This spec must preserve the current core ontology:

```text
5 channels x 3 altitudes = 15 primary channel states
```

Compound emotions do **not** replace the five-channel model, do **not** create a third altitude axis, and do **not** create twenty new move families. They name directional two-channel blends so quest generation, coaching copy, wiki reference, and future scene selection can diagnose mixed charge more precisely.

## Problem

The library now has a mature doctrine for compound emotions:

- Five channels form a complete graph of **10 edges**.
- Each edge has **2 directional readings**, producing **20 compound slots**.
- Direction means either stage of becoming (sheng edges) or the winning force in a tension (ke edges).
- Each slot is a **family**, not a fixed feeling, because refinement is inherited from the two component channels.
- Treatment reduces to refining the component channels.

bars-engine currently models channels, altitudes, sheng/ke movement, and vector move families, but it has no first-class representation for compound emotion diagnosis. Existing mentions like Dread are scattered aliases or content labels, not a coherent model.

## Doctrine Decisions

| Topic | Decision |
| --- | --- |
| Additive diagnostic layer | Compound emotions sit above primary channel states. Existing channel and move logic remains canonical. |
| Deterministic data | The lattice is authored TypeScript data, not AI-generated. |
| No 60-state expansion | Compound identity is `edge x direction x component states`; no third primitive or independent compound altitude axis. |
| Refinement inherited | Lead/gold readings derive from the component channels' altitudes/refinement. |
| Treatment rule | Do not treat compounds directly. Resolve component channels and recommend existing stabilize/transcend/translate moves. |
| Runtime status | Phase 1-2 expose data and helper functions only. Gameplay mutation is out of scope. |
| Naming status | Only Dread, Disappointment, and Disgust/Contempt are currently named. Candidate labels stay marked as provisional. |
| Client safety | UI/wiki copy must say compounds are diagnostic language, not identity labels or pathology. |

## Conceptual Model

### Primary model

```ts
type EmotionChannel = 'fear' | 'sadness' | 'joy' | 'anger' | 'neutrality'
type AlchemyAltitude = 'dissatisfied' | 'neutral' | 'satisfied'
```

### Compound edge model

```ts
type CompoundEdgeKind = 'sheng' | 'ke'
type CompoundDirectionKind = 'source_dominant' | 'target_dominant' | 'dominant_channel'
type CompoundNameStatus = 'named' | 'candidate'

interface CompoundEmotionSlot {
  id: string
  edgeKind: CompoundEdgeKind
  channels: readonly [EmotionChannel, EmotionChannel]
  dominantChannel: EmotionChannel
  label: string
  alternateLabels: string[]
  nameStatus: CompoundNameStatus
  feltSense: string
  leadReading?: string
  goldReading?: string
}
```

### Component-state reading

A compound reading is derived from:

```text
compound slot + component state A + component state B
```

Example:

| Slot | Component states | Reading |
| --- | --- | --- |
| Fear-Sadness, fear-dominant | Fear lead + Sadness lead | Dread |
| Fear-Sadness, fear-dominant | Fear gold + Sadness gold | The sublime / mono no aware |

## Functional Requirements

### Phase 1 — Type contract + deterministic lattice

- **FR1**: Add a dedicated compound-emotions module under `src/lib/alchemy/compound-emotions.ts`.
- **FR2**: Define `CompoundEmotionSlot`, `CompoundEdgeKind`, `CompoundNameStatus`, and helper result types.
- **FR3**: Encode all 20 directional slots from the promoted vault note.
- **FR4**: Preserve provisional status for candidate names.
- **FR5**: Export lookup helpers:
  - `listCompoundEmotionSlots()`
  - `getCompoundEmotionSlot(id)`
  - `findCompoundSlotsForChannel(channel)`
  - `findCompoundSlotsForPair(a, b)`

### Phase 2 — Diagnosis helpers

- **FR6**: Add a resolver that accepts two `AlchemyState`s and returns possible compound slots plus component-treatment guidance.
- **FR7**: The resolver must not recommend a "compound move"; it must return component channels and existing move guidance.
- **FR8**: Add tests proving Dread resolves as Fear-Sadness fear-dominant, and that Fear+Joy can distinguish trepidation/reverent approach from thrill/temptation by direction.
- **FR9**: Add tests proving the lattice has exactly 20 slots, 10 unordered channel pairs, and 4 participations per channel.

### Phase 3 — Documentation and wiki exposure

- **FR10**: Update `/wiki/emotional-alchemy` with a compact "Compound Emotions" section.
- **FR11**: The wiki must explain that compounds are diagnostic and treatment reduces to component channels.
- **FR12**: Add a compact table of named/current slots, with candidates marked provisional.
- **FR13**: Link source lineage to the vault research note in comments or docs references.

### Phase 4 — Optional quest-generation integration

- **FR14**: Add compound diagnosis as optional context to quest-generation prompts or internal prompt context.
- **FR15**: Do not let compound diagnosis override primary state routing.
- **FR16**: If exposed in generation, compound output must include component channels and suggested existing move families.

## Non-Functional Requirements

- **Backward compatible**: No existing channel, altitude, move, or state APIs should break.
- **Deterministic**: The lattice and resolver work without AI or network access.
- **No persistence in v1**: Do not add Prisma fields until there is a separate gameplay/persistence spec.
- **No new move families**: Existing vector move families remain the treatment layer.
- **Terminology caution**: Avoid using candidate names as authoritative product copy until red-pen review.

## Acceptance Criteria

- The engine can list exactly 20 compound slots.
- Every unordered pair of distinct channels appears exactly once as an edge, with two directional slots.
- Every channel participates in exactly 4 edges and 8 directional slots.
- A pair resolver returns compound candidates and component-treatment guidance.
- Tests cover lattice counts, named slots, directionality, and no-direct-treatment behavior.
- `/wiki/emotional-alchemy` includes the compound layer without implying a new primary ontology.

## Out of Scope

- Persisting a player's compound emotional state.
- Creating a compound-emotion UI selector.
- Adding twenty compound-specific quests or moves.
- Renaming the candidate labels.
- Porting the module to `packages/bars-core` in the first pass.
- AI enrichment or automatic emotion classification.

## Dependencies / References

- Vault source: `The Library/05 Research/Emotional Alchemy/Compound Emotions — The 20-Slot Lattice.md`
- Root ontology: `The Library/02 Index/KEYTERM-EMOTIONAL-ALCHEMY.md`
- Channel map: `The Library/02 Index/KEYTERM-EA-Channels.md`
- Existing engine files:
  - `src/lib/alchemy/types.ts`
  - `src/lib/alchemy/alchemy-graph.ts`
  - `src/lib/alchemy/wuxing.ts`
  - `src/lib/alchemy/vector-move-families.ts`
  - `src/app/wiki/emotional-alchemy/page.tsx`

## Open Questions

1. Should "gold reading" labels become first-class fields for every slot, or only for slots where the language is settled?
2. Should the resolver infer direction from intensity/altitude, or require an explicit dominant channel?
3. Should Dread move from a fear alias in `alchemy-graph.ts` into the compound resolver only, or remain as a convenience alias?
4. When should `packages/bars-core` receive parity, given the current package duplication?
