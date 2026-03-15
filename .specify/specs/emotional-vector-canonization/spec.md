# Spec: Emotional Vector Canonization

## Purpose

Canonize the **structure** and **transformation logic** of emotional vectors so they are explicit, not latent. The 15-move engine already embodies this; we surface it in types, docs, and naming.

**Problem**: Emotional vectors are implied by moves and scattered across alchemy, quest grammar, and Conclave docs. Canonization makes the model explicit for agents, templates, and future features.

**Practice**: Spec kit first; no new API surface. Types and docs only.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Transcend vs Translate** | Transcend = altitude within channel (dissatisfied→satisfied). Translate = channel→channel. Add Translate as explicit parent concept; Generative and Control are translate subtypes. |
| **Vector format** | `channel:fromAltitude->channel:toAltitude` (e.g. `fear:dissatisfied->fear:neutral`). Same element both sides = Transcend; different = Translate. |
| **Altitude** | Use existing `AlchemyAltitude` (`dissatisfied \| neutral \| satisfied`). Already in `src/lib/alchemy/types.ts`. |
| **Channel** | Use existing `EmotionalChannel` (Fear, Anger, Sadness, Joy, Neutrality). Align with `ElementKey` via `elements.ts`. |
| **Naming** | Use context-appropriate names. No external references (e.g. Orb) in types or exports. |

## Conceptual Model

### Structure: Channel × Altitude × Direction

| Dimension | Values | Source |
|-----------|--------|--------|
| **Channel** | Fear, Anger, Sadness, Joy, Neutrality | `EmotionalChannel` / `ElementKey` |
| **Altitude** | dissatisfied, neutral, satisfied | `AlchemyAltitude` |
| **Direction** | Transcend (within-channel) or Translate (cross-channel) | Move category |

### Transformation Logic

| Move Type | Meaning | Energy | Example |
|-----------|---------|--------|---------|
| **Transcend** | Dissatisfaction → satisfaction within same channel | +2 | fear:dissatisfied→fear:satisfied |
| **Translate** | Channel → channel | — | — |
| **Generative** | Translate in alignment with system (flow cycle) | +1 | wood→fire, fire→earth, … |
| **Control** | Translate out of alignment (precision pivot) | -1 | wood→earth, fire→metal, … |

Generative and Control are **Translate** moves. The 15-move engine: 5 Transcend + 5 Generative (translate) + 5 Control (translate).

### Vector Format

```
channel:fromAltitude->channel:toAltitude
```

- **Transcend vector**: Same channel both sides (e.g. `fear:dissatisfied->fear:neutral`).
- **Translate vector**: Different channels (e.g. `fear:dissatisfied->anger:neutral`). Valid pairs follow flow cycle or control cycle.

## User Stories

### P1: Canonical Types

**As a** developer or agent, **I want** a single source of truth for emotional vector structure, **so** I can derive vectors from moves and validate template inputs.

**Acceptance**: `EmotionalVector` type and helpers exist; `MoveCategory` includes `'Translate'` as parent of Generative/Control.

### P2: Documentation Alignment

**As a** developer, **I want** conceptual-model and ontology docs to reflect Transcend vs Translate, **so** onboarding and AI context are consistent.

**Acceptance**: conceptual-model.md and emotional-alchemy-ontology.md describe Transcend (altitude) and Translate (channel) explicitly.

## Functional Requirements

### Phase 1: Types and Canon

- **FR1**: Add `MoveCategory` type: `'Transcend' | 'Translate'` with `Translate` subtyped by `'Generative' | 'Control'` where needed for energy/behavior.
- **FR2**: Add `EmotionalVector` interface (or type) in quest-grammar types: `{ channelFrom, altitudeFrom, channelTo, altitudeTo }` plus optional `vectorString` for serialization.
- **FR3**: Add `getMoveCategory(move: CanonicalMove): 'Transcend' | 'Translate'` — Transcend if same element; Translate if fromElement→toElement.
- **FR4**: Ensure `CanonicalMove` has `moveFamily?: 'Transcend' | 'Translate'` (or equivalent) so consumers can branch without re-deriving.

### Phase 2: Docs

- **FR5**: Update `.specify/memory/conceptual-model.md` — Emotional Alchemy section: Transcend = altitude; Translate = channel; Generative/Control = translate subtypes.
- **FR6**: Update `.agent/context/emotional-alchemy-ontology.md` — Add "Transcend vs Translate" section; document vector format.
- **FR7**: Update `/wiki/emotional-alchemy` page — Add Transcend vs Translate explanation; show move family.

## Non-Functional Requirements

- **Backward compatibility**: Existing `category: 'Transcend' | 'Generative' | 'Control'` remains valid. New `moveFamily` or `MoveCategory` is additive.
- **No schema changes**: No Prisma changes. Types and docs only.

## Verification

- [ ] `npm run build` and `npm run check` pass
- [ ] Types export correctly; no circular deps
- [ ] Wiki page renders; Transcend vs Translate visible
- [ ] Grep for `Transcend` and `Translate` in docs returns updated content

## Dependencies

- `src/lib/quest-grammar/move-engine.ts` — 15 moves
- `src/lib/quest-grammar/types.ts` — EmotionalChannel, MovementType, NodeEmotional
- `src/lib/alchemy/types.ts` — AlchemyAltitude
- `src/lib/quest-grammar/elements.ts` — ElementKey, channel mapping

## References

- [MODEL_DIFF_AND_CLARITY_QUESTIONS.md](../conclave-docs-ingestion/MODEL_DIFF_AND_CLARITY_QUESTIONS.md) — Ouroboros Q1/Q2
- [emotional-alchemy-ontology.md](../../../.agent/context/emotional-alchemy-ontology.md)
- [emotional-alchemy-interfaces.md](../../../.agent/context/emotional-alchemy-interfaces.md)
