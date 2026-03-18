# Spec: Shadow Name Library (Low-Cost, Vast, Improves Over Time)

## Purpose

Extend the 321 Suggest Name grammar into a **low-cost name library** that is as vast as possible, improves over time, and uses zero tokens at suggest time. Static vocab + optional feedback loop + batch refinement.

**Practice**: Deftness Development — deterministic over AI; vocab-first; feedback for learning.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Runtime cost | Zero tokens — hash + lookup only |
| Vastness | Expand vocab (more words, patterns, compound forms); externalize to JSON |
| Improvement | Optional feedback log (accepted vs edited); batch analysis; human curation |
| AI use | None at suggest time; optional rare batch job to propose new words for human approval |
| Vocab format | JSON/TS config; versioned; easy to extend |

## Conceptual Model

```
Static Vocab (JSON)     Runtime (zero tokens)      Feedback (optional)
───────────────────     ─────────────────────      ─────────────────
faces × roles ×         hash(input) → indices      { input_hash, name,
descriptors             → lookup → name            accepted | edited }
+ patterns
+ compound rules
```

## API Contracts

### Vocab Config (extend existing)

**Location**: `src/lib/shadow-name-grammar.ts` or `src/lib/shadow-name-vocab.json`

**Shape**:
```ts
type ShadowNameVocab = {
  version: string
  faces: Array<{
    id: string
    roles: string[]
    descriptors: string[]
  }>
  patterns?: string[]  // e.g. ["The {D} {R}", "{D} {R}"]
}
```

### Feedback (optional, Phase 2)

**Event**: When user accepts or edits a suggested name.

**Payload**: `{ inputHash: string, suggestedName: string, accepted: boolean, editedTo?: string }`

**Storage**: Lightweight table or append-only log. No PII.

## User Stories

### P1: Vast static library

**As a** system, **I want** a large, externalized vocab with multiple patterns, **so** names feel varied and sticky without token cost.

**Acceptance**: Vocab in JSON; 6+ faces, 8+ roles/descriptors per face; 2+ grammar patterns.

### P2: Feedback for improvement (optional)

**As a** curator, **I want** to see which names get accepted vs edited, **so** we can refine the vocab over time.

**Acceptance**: Log accept/edit events; batch report or dashboard; human can add/remove words.

## Functional Requirements

### Phase 1: Expand vocab

- **FR1**: Externalize vocab to JSON or typed config
- **FR2**: Expand to 8 roles × 8 descriptors per face (or more)
- **FR3**: Add 2+ grammar patterns (e.g. "The {D} {R}", "{D} {R}")
- **FR4**: Optional compound descriptors (e.g. "Bold-Hidden")

### Phase 2: Feedback loop (optional)

- **FR5**: Emit feedback event when user accepts or edits suggestion
- **FR6**: Store feedback (input_hash, name, accepted, edited_to)
- **FR7**: Batch job or report: accept rate per (role, descriptor)

### Phase 3: Batch refinement (optional)

- **FR8**: Periodic analysis of feedback; suggest vocab changes
- **FR9**: Optional: rare AI batch to propose new words; human approves before add

## Non-Functional Requirements

- Zero tokens at suggest time
- Vocab file < 50KB gzipped
- Feedback storage minimal; no PII

## Dependencies

- [321 Suggest Name Deterministic](.specify/specs/321-suggest-name/spec.md) — existing grammar

## References

- [shadow-name-grammar.ts](../../../src/lib/shadow-name-grammar.ts)
- [Game Master Sects](../../../.agent/context/game-master-sects.md)
