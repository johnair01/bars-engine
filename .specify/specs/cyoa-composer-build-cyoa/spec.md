# Spec: CYOA Composer Build Contract

## Purpose

Define a canonical CYOA composer flow that accumulates typed fields into a persisted `CyoaBuild` object, then hands off reliably into hub/spoke execution.

**Problem**: Issue #36 references this spec kit, but no kit exists. Composer decisions and payload shape are currently scattered.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Canonical object | `CyoaBuild` is the single persisted composer payload for downstream handoff. |
| Face model | Only canonical `GameMasterFace` values are stored; Sifu/NPC names are presentation metadata. |
| Resume policy | Mid-flow persistence uses checkpoint + revalidate against current emotional state on resume (Option B). |
| Template source | Narrative templates resolve from a central registry, not scattered strings. |
| Handoff | Spoke entry reads merged campaign context + `CyoaBuild`, preserving `ref` and branch state. |

## Conceptual Model

| WHO | WHAT | WHERE | Energy | Personal throughput |
|-----|------|-------|--------|---------------------|
| Player | Makes branch choices in composer CYOA | Hub/spoke entry flow | Emotional vector + move commitment | Wake Up → Clean Up → Grow Up → Show Up |
| Steward | Defines templates and guardrails | Admin + spec-governed config | Design intent | Keeps ontology coherent |
| System | Validates and stores `CyoaBuild` | API + DB + runtime | Typed payload and resume checks | Deterministic handoff |

## API Contracts (API-First)

### saveCyoaBuild (Server Action)

**Input**:
```ts
type SaveCyoaBuildInput = {
  playerId: string
  campaignRef: string
  templateId: string
  gameMasterFace: GameMasterFace
  gmFaceMoveId?: string
  waveMove: 'wake-up' | 'clean-up' | 'grow-up' | 'show-up'
  emotionalVector: {
    source: 'checkin' | 'manual' | 'derived'
    state: string
    capturedAt: string
  }
  composerState: {
    passageId: string
    branchPath: string[]
  }
}
```

**Output**:
```ts
type SaveCyoaBuildOutput = {
  success: boolean
  buildId?: string
  error?: string
}
```

### loadCyoaBuildForResume (Route Handler)

**Input**: `buildId`, `playerId`  
**Output**: `CyoaBuild | { error: string }`

- Revalidates branch eligibility against current emotional state before exposing next choices.

## User Stories

### P1: Player composes a valid build

**As a player**, I want composer choices to accumulate into one coherent payload, so my spoke experience reflects what I actually chose.

**Acceptance**: Terminal composer step persists a valid `CyoaBuild` and routes to spoke entry with preserved context.

### P2: Player resumes honestly

**As a player**, I want resumed composer choices to reflect my current state, so stale branches are not misleading.

**Acceptance**: Resume flow revalidates branch eligibility and adjusts available passages when required.

### P3: Steward keeps one ontology

**As a steward**, I want face/template semantics to stay canonical, so downstream systems do not drift.

**Acceptance**: Stored face keys are canonical enum values; templates come from one registry.

## Functional Requirements

### Phase 1: Contract + persistence

- **FR1**: Introduce or confirm canonical `CyoaBuild` persisted shape.
- **FR2**: Persist composer branch state, selected template, face, move, and emotional vector provenance.
- **FR3**: Validate input with a shared schema before write.

### Phase 2: Resume + revalidation

- **FR4**: Resume endpoint loads prior state and re-runs eligibility checks.
- **FR5**: Invalidated branches redirect to the nearest valid checkpoint.
- **FR6**: Resume keeps `campaignRef` and composer provenance intact.

### Phase 3: Hub/spoke handoff

- **FR7**: Spoke entry merges campaign snapshot + `CyoaBuild` for deterministic startup.
- **FR8**: Existing hub/spoke routes keep working with new build payload.

## Non-Functional Requirements

- Backward compatibility for legacy flows without a persisted `CyoaBuild`.
- Deterministic validation errors with actionable messages.
- No hidden alternate face ontology in API or DB.

## Persisted Data & Prisma

| Check | Done |
|-------|------|
| Prisma models/fields documented before implementation | [ ] |
| `tasks.md` includes migration + commit steps | [x] |
| Verification uses `npm run db:sync` and `npm run check` | [x] |
| Human reviews generated migration SQL | [ ] |

## Verification Quest

- **ID**: `cert-cyoa-composer-build-v1`
- **Steps**:
  - Start composer from hub entry
  - Complete branch selections to terminal step
  - Confirm persisted build and spoke handoff
  - Resume an interrupted run and verify branch revalidation behavior

## Dependencies

- `.specify/specs/campaign-hub-spoke-landing-architecture/spec.md`
- `.specify/specs/game-master-face-moves/spec.md`
- `.specify/specs/campaign-ontology-alignment/spec.md`

## References

- Issue #36: https://github.com/johnair01/bars-engine/issues/36
- `src/lib/quest-grammar/types.ts`
- `.agent/context/game-master-sects.md`
