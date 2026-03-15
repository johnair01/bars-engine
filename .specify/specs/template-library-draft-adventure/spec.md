# Spec: Template Library & Draft→Adventure Flow

## Purpose

Add a **template library** so admins and agents can generate Adventures from reusable structures. A template defines passage slots (e.g. 9-passage: context_1–3, anomaly_1–3, choice, response, artifact). Generated content is a **draft** (Adventure DRAFT) that admins edit and promote to ACTIVE.

**Problem**: Generated content (e.g. from encounter grammar) needs a home. Admins must edit it before it becomes playable. The current flow is manual: create Adventure, add passages one by one. We need a template-driven flow: pick template → generate draft → edit → promote.

**Practice**: Spec kit first, API-first. Schema + seed + service + admin UI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Draft = Adventure** | Draft is an Adventure with `status: DRAFT`. No separate Draft model. |
| **Template** | A schema that defines passage slots (nodeIds, order, optional labels). Stored as `AdventureTemplate` model. |
| **First template** | 9-passage structure: context_1, context_2, context_3, anomaly_1, anomaly_2, anomaly_3, choice, response, artifact. Start node = context_1. |
| **Ownership** | `ownership: 'system' | 'player'` — system = agent/admin-generated; player = player-created or brought in. v0 seeds system templates only. |
| **Naming** | Context-appropriate. No external references (e.g. Orb) in model or UI. |
| **Generate flow** | `generateFromTemplate(templateId, options)` → creates Adventure (DRAFT) with passages (placeholder or empty text). Admin edits via existing Adventure edit UI. |

## Conceptual Model

### AdventureTemplate

| Field | Type | Description |
|-------|------|-------------|
| id | cuid | Primary key |
| key | String (unique) | Slug e.g. `encounter-9-passage` |
| name | String | Display name |
| description | String? | Optional |
| passageSlots | String (JSON) | `[{ nodeId, label?, order }]` — defines structure |
| startNodeId | String | First passage nodeId |
| ownership | String | `system` \| `player` |
| createdAt, updatedAt | DateTime | |

### Passage slot structure (9-passage)

```json
[
  { "nodeId": "context_1", "label": "Context 1", "order": 0 },
  { "nodeId": "context_2", "label": "Context 2", "order": 1 },
  { "nodeId": "context_3", "label": "Context 3", "order": 2 },
  { "nodeId": "anomaly_1", "label": "Anomaly 1", "order": 3 },
  { "nodeId": "anomaly_2", "label": "Anomaly 2", "order": 4 },
  { "nodeId": "anomaly_3", "label": "Anomaly 3", "order": 5 },
  { "nodeId": "choice", "label": "Choice", "order": 6 },
  { "nodeId": "response", "label": "Response", "order": 7 },
  { "nodeId": "artifact", "label": "Artifact", "order": 8 }
]
```

### Flow

```
Template Library → Pick template → Generate → Adventure (DRAFT) with passages
                                        → Admin edits (existing /admin/adventures/[id])
                                        → Promote to ACTIVE (status change)
```

## API Contracts (API-First)

### generateFromTemplate(templateId: string, options?: GenerateOptions): Promise<Adventure>

**Input**:
- `templateId`: AdventureTemplate id
- `options?: { title?: string; slug?: string }` — override defaults for generated Adventure

**Output**: Adventure with passages (status DRAFT).

- **Implementation**: Server Action. Creates Adventure, creates Passage for each slot with placeholder text. Returns adventure.

### listTemplates(): Promise<AdventureTemplate[]>

**Output**: All templates (or filtered by ownership if needed).

**Implementation**: Server Action or inline in page.

### promoteDraftToActive(adventureId: string): Promise<Adventure>

**Input**: adventureId  
**Output**: Updated Adventure with status ACTIVE.

**Implementation**: Server Action. Updates status. May add validation (e.g. startNodeId set, at least one passage).

## User Stories

### P1: Template Library

**As an** admin, **I want** to see a list of templates in the admin UI, **so** I can generate new Adventures from them.

**Acceptance**: Admin can navigate to Template Library; sees at least one template (9-passage).

### P2: Generate Draft

**As an** admin, **I want** to generate a draft Adventure from a template, **so** I get a structured skeleton to edit instead of creating passages manually.

**Acceptance**: "Generate from template" creates Adventure (DRAFT) with 9 passages; admin is redirected to edit it.

### P3: Edit Draft

**As an** admin, **I want** to edit the generated draft using the existing Adventure edit UI, **so** I can refine content before publishing.

**Acceptance**: Generated draft appears in /admin/adventures/[id]; passages editable; existing flow works.

### P4: Promote to Active

**As an** admin, **I want** to promote a draft to ACTIVE when ready, **so** players can play it.

**Acceptance**: Status change DRAFT → ACTIVE; visible in Adventure settings.

## Functional Requirements

### Phase 1: Schema + Seed + Service

- **FR1**: Add `AdventureTemplate` model to Prisma: key (unique), name, description, passageSlots (JSON), startNodeId, ownership.
- **FR2**: Run `npm run db:sync`.
- **FR3**: Seed first template: key `encounter-9-passage`, 9 passage slots, startNodeId `context_1`.
- **FR4**: Create `generateFromTemplate(templateId, options?)` in `src/lib/template-library/` — creates Adventure + passages.
- **FR5**: Create `listTemplates()` and `promoteDraftToActive(adventureId)`.

### Phase 2: Admin UI

- **FR6**: Add `/admin/templates` page — list templates, "Generate" button per template.
- **FR7**: "Generate" calls `generateFromTemplate`, redirects to `/admin/adventures/[id]`.
- **FR8**: Add "Promote to Active" action on Adventure detail when status is DRAFT.
- **FR9**: Link Template Library from Admin nav (or Adventures page).

### Phase 3: Verification Quest (required for UX)

- **FR10**: Add verification quest `cert-template-library-v1` — walk through: open Template Library, generate from template, edit a passage, promote to Active.

## Non-Functional Requirements

- **Backward compatibility**: Existing Adventures unchanged. No migration of existing data.
- **Placeholder text**: Generated passages get minimal placeholder (e.g. `[Edit: context_1]`) so structure is visible.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI generation | Optional future: generateFromTemplate can accept AI-generated content per slot. v0 uses placeholders. |

## Dependencies

- `prisma/schema.prisma` — Adventure, Passage
- `src/app/admin/adventures/` — existing edit UI

## References

- [MODEL_DIFF_AND_CLARITY_QUESTIONS.md](../conclave-docs-ingestion/MODEL_DIFF_AND_CLARITY_QUESTIONS.md) — §7 Orb output, Ouroboros Q5–Q7
- [orb_triadic_twee_generator_spec.md](../../.specify/fixtures/conclave-docs/orb_triadic_twee_generator_spec.md) — 9-passage structure
