# Spec: Conclave Docs Ingestion — Sage-Powered Analysis Pipeline

## Purpose

Ingest the Conclave design docs (Orb Encounter Grammar, Orb Triadic Twee Generator, Bridge Scenario Engine, Onboarding Storytelling Grammar) into the BARS Engine via a **deft API-first** pipeline. The Sage agent analyzes docs and produces structured outputs for spec kit updates, schema validation, and implementation planning.

**Problem:** Design docs live in external folders; they are not systematically analyzed or integrated into the spec kit workflow.

**Practice:** API-first ingestion. Sage analyzes. Outputs feed spec kit, backlog, and implementation plans.

---

## User Stories

### P1: Sage Analyzes Conclave Docs

**As a** developer or designer, **I want** to submit Conclave docs to the Sage for analysis, **so** I get structured extraction (entities, conflicts, schema mappings) and integration recommendations.

**Acceptance:** API accepts doc content; Sage returns structured analysis; analysis is persisted or returned for inspection.

### P2: Analysis Feeds Spec Kit

**As a** spec kit maintainer, **I want** the Sage analysis to produce actionable outputs (spec updates, merge notes, schema diffs), **so** I can update the backlog and implementation plans without manual doc parsing.

**Acceptance:** Analysis can be written to `.specify/` or used to generate backlog prompts.

### P3: Testable Pipeline

**As a** developer, **I want** the ingestion pipeline to be testable (unit + integration), **so** I can verify it works before and after doc changes.

**Acceptance:** Script or API can be run; tests assert output shape and key extractions.

---

## API Endpoints

### POST `/api/admin/conclave-docs/analyze`

**Purpose:** Submit Conclave doc content for Sage analysis.

**Request:**
```json
{
  "docs": [
    {
      "name": "orb_encounter_grammar_spec",
      "content": "string (markdown)"
    },
    {
      "name": "orb_triadic_twee_generator_spec",
      "content": "string (markdown)"
    },
    {
      "name": "bars_bridge_scenario_engine_spec",
      "content": "string (markdown)"
    },
    {
      "name": "bars_onboarding_storytelling_grammar",
      "content": "string (markdown)"
    },
    {
      "name": "unexpected_passenger_orb_seed_001",
      "content": "string (twee)"
    }
  ],
  "query": "optional prompt override — e.g. 'Extract GM faces and anomaly types'"
}
```

**Response:**
```json
{
  "analysis_id": "string",
  "synthesis": "string",
  "extracted_entities": {
    "gm_faces": ["shaman", "challenger", "regent", "architect", "diplomat", "sage"],
    "anomaly_types": ["unexpected_voice", "impossible_pattern", "npc_appearance"],
    "emotional_vectors": ["fear:dissatisfied->fear:neutral", "..."],
    "orb_phases": ["context", "anomaly", "contact", "interpretation", "decision", "world_response", "continuation"]
  },
  "conflicts": [
    {
      "doc": "string",
      "issue": "string",
      "suggestion": "string"
    }
  ],
  "schema_mappings": [
    {
      "source": "string",
      "target": "string",
      "notes": "string"
    }
  ],
  "implementation_order": ["string"],
  "consulted_agents": ["string"]
}
```

---

### POST `/api/admin/conclave-docs/analyze-from-path`

**Purpose:** Read docs from a local path and analyze. Admin-only.

**Request:**
```json
{
  "path": "/path/to/Construc conclave (3)",
  "query": "optional"
}
```

**Response:** Same as `analyze`. Path must be allowed (allowlist or env).

---

## CLI Script

`npm run conclave:analyze -- --path "/path/to/Construc conclave (3)"`

- Reads all `.md` and `.twee` files from path
- Calls `POST /api/admin/conclave-docs/analyze` (or local Sage consult if no backend)
- Writes analysis to `.specify/plans/conclave-analysis-{date}.md`
- Optionally writes extracted entities to `.specify/specs/conclave-docs-ingestion/extracted.json`

---

## Sage Prompt

The Sage receives a prompt of the form:

```
You are analyzing Conclave design documents for ingestion into the BARS Engine spec kit.

Documents provided:
[doc content]

Tasks:
1. Extract canonical entities: GM faces, anomaly types, emotional vectors, Orb phases, Bridge scenario entities.
2. Identify conflicts with existing specs (orb-encounter-grammar, onboarding, etc.).
3. Propose schema mappings (what new tables/fields are implied).
4. Suggest implementation order (dependencies, testability).

Output format: structured JSON per the response schema.
```

---

## Canonical Model Privilege

When integrating Conclave docs, **privilege existing BARS Engine models**. For any difference:

1. Document the diff in `MODEL_DIFF_AND_CLARITY_QUESTIONS.md`
2. Propose integration using the canonical model
3. Ask for clarity before implementing non-canonical structures

See [MODEL_DIFF_AND_CLARITY_QUESTIONS.md](./MODEL_DIFF_AND_CLARITY_QUESTIONS.md) for current diffs and open questions.

---

## Non-Functional Requirements

- API-first: contract before implementation
- Admin-only: require admin role or `CONCLAVE_ANALYZE_SECRET`
- Testable: deterministic output shape; mock Sage for unit tests
- Idempotent: same docs → same analysis (modulo Sage non-determinism; optional seed)

---

## Dependencies

- Sage agent (`POST /api/agents/sage/consult`)
- Existing orb-encounter-grammar spec
- Admin auth

---

## Out of Scope

- Automatic spec file updates (Phase 2)
- Doc versioning / diff tracking
- Real-time doc sync
