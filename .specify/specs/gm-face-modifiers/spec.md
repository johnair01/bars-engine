# Spec: GM Face Modifiers

## Purpose

Add a `GmFaceModifier` table that stores **modulation metadata** per Game Master face. Each of the six faces (shaman, challenger, regent, architect, diplomat, sage) gets one row with style descriptors that modulate encounter/scene generation.

**Problem**: `GameMasterFace` and `FACE_META` exist as types and static config. Conclave encounter grammar needs per-face modulation (anomaly style, contact voice, etc.) that is editable and seedable. This extends the canonical face model without replacing it.

**Practice**: Spec kit first, API-first. Schema + seed + service. No UI in v0.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Table name** | `gm_face_modifiers` (Prisma model `GmFaceModifier`). Generic; no external references. |
| **Relationship** | One row per face. `face` is unique. No FK to a "face" table — faces are a type, not a model. |
| **Face values** | Use canonical `GameMasterFace` enum values: shaman, challenger, regent, architect, diplomat, sage |
| **JSON fields** | `contactVoice`, `responseStyle` stored as JSON strings (flexible descriptors). `anomalyStyle`, `interpretationPressure`, `artifactAffinity` as plain strings with known vocabularies. |
| **Consumers** | Template system, encounter generators, quest grammar modulation. Not tied to any single feature. |

## Conceptual Model

### GmFaceModifier (one per face)

| Field | Type | Description |
|-------|------|-------------|
| id | cuid | Primary key |
| face | String (unique) | shaman \| challenger \| regent \| architect \| diplomat \| sage |
| anomalyStyle | String | How the anomaly presents: numinous, provocative, official, patterned, social, subtle |
| contactVoice | String (JSON) | Descriptor for how the world addresses the player |
| interpretationPressure | String | low \| medium \| high |
| responseStyle | String (JSON) | How the world responds to player choices |
| artifactAffinity | String | Primary artifact type: memory_entry, quest_hook, obligation, orientation, relationship_update, contemplation |

### Face → Modifier mapping (from Conclave)

| Face | Anomaly Style | Contact Voice | Artifact Affinity |
|------|---------------|---------------|-------------------|
| Shaman | numinous | mythic/ritual | memory_entry |
| Challenger | provocative | taunting/daring | quest_hook |
| Regent | official | world asserting jurisdiction | obligation |
| Architect | patterned | puzzle/map | orientation |
| Diplomat | social | empathic/inviting | relationship_update |
| Sage | subtle | says little | contemplation |

## API Contracts (API-First)

### getGmFaceModifier(face: GameMasterFace): Promise<GmFaceModifier | null>

**Input**: `GameMasterFace`  
**Output**: `GmFaceModifier` record or null if not seeded

- **Route**: Server-side only (no public API in v0). Used by encounter/template services.
- **Implementation**: Prisma `findUnique` by `face`.

### Seed script

- **Command**: `npm run seed:gm-face-modifiers`
- **Behavior**: Upsert 6 rows (one per face). Idempotent.

## User Stories

### P1: Schema and Seed

**As a** developer or seed script, **I want** a GmFaceModifier table with one row per face, **so** encounter generators can look up modulation metadata.

**Acceptance**: Table exists; seed creates 6 rows; `getGmFaceModifier('architect')` returns a record.

### P2: Service Layer

**As a** template or encounter service, **I want** a function to fetch modifier by face, **so** I can apply modulation without raw Prisma calls.

**Acceptance**: `getGmFaceModifier(face)` exists and returns the seeded record.

## Functional Requirements

### Phase 1: Schema + Seed + Service

- **FR1**: Add `GmFaceModifier` model to `prisma/schema.prisma` with fields: face (unique), anomalyStyle, contactVoice, interpretationPressure, responseStyle, artifactAffinity.
- **FR2**: Run `npm run db:sync` after schema change (per .cursorrules).
- **FR3**: Create `scripts/seed-gm-face-modifiers.ts` — upsert 6 rows (one per GameMasterFace). Use `face` as upsert key.
- **FR4**: Add `npm run seed:gm-face-modifiers` to package.json.
- **FR5**: Create `src/lib/gm-face-modifiers/index.ts` with `getGmFaceModifier(face: GameMasterFace): Promise<GmFaceModifier | null>`.
- **FR6**: Export `GmFaceModifier` type from Prisma; re-export from lib.

## Non-Functional Requirements

- **Idempotent seed**: Running seed twice produces same state.
- **No UI**: Admin UI for editing modifiers is out of scope for v0.

## Verification

- [ ] `npm run db:sync` succeeds
- [ ] `npm run seed:gm-face-modifiers` runs without error
- [ ] `getGmFaceModifier('architect')` returns a record with anomalyStyle, etc.
- [ ] `npm run build` and `npm run check` pass

## Dependencies

- `src/lib/quest-grammar/types.ts` — GameMasterFace
- `prisma/schema.prisma`

## References

- [MODEL_DIFF_AND_CLARITY_QUESTIONS.md](../conclave-docs-ingestion/MODEL_DIFF_AND_CLARITY_QUESTIONS.md) — §5 Orb Encounter Models
- [orb_encounter_grammar_spec.md](../../.specify/fixtures/conclave-docs/orb_encounter_grammar_spec.md) — §5.2 Modulation Schema
- [orb-encounter-grammar/plan.md](../orb-encounter-grammar/plan.md) — GmFaceModifier schema draft
