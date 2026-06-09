# Spec: BAR Pipeline Test Gate

## Purpose

A mandatory verification layer that prevents any zo.space feature from shipping without passing its contract tests. The test gate runs against the LIVE deployed route, not the local file system. This closes the pattern where features ship broken because: (1) tests live only in the file system and aren't run against the deployed environment, (2) UI contracts are never verified against the running server, (3) empty-state behavior is never tested.

**Problem**: This session alone produced 5 silent failures:
1. `handleNewBatch()` → no visible confirmation that batch loaded
2. `/api/bars-review/batch` → hardcoded to batch-2026-04-30-002 (wrong contract)
3. Registry updates never tested against live server
4. No empty-state test for when all candidates are filtered
5. `catalog.jsonl` never loaded into the UI (UI didn't use the right endpoint)

**Practice**: Spec first, API-first, deterministic over AI. Test gate runs automatically on deploy and manually on demand.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Test execution target | Live zo.space server (localhost:3099 in dev), not file system |
| Test location | `Skills/hey-pocket-ai/scripts/e2e_bar_review.py` + companion tests |
| Gate timing | Pre-deploy (manual), post-deploy (automated) |
| Failure behavior | STOP — no bypass, no "it's probably fine" |
| Test ownership | Feature author owns tests; Council enforces gate |

## API Contracts

### `POST /api/bars-review/decision`

**Input**:
```json
{
  "candidate_id": "string",
  "decision": "accept | reject | skip",
  "rewritten": boolean,
  "original_text": "string (optional)",
  "rewritten_text": "string (optional)",
  "batch_id": "string"
}
```

**Output**:
```json
{
  "logged": true,
  "registry_entry": {
    "bar_id": "string",
    "candidate_id": "string",
    "decision": "string",
    "timestamp": "ISO8601"
  }
}
```

**Contract test** (L3): Accept a candidate → verify bar-registry.jsonl has entry with matching `candidate_id` + `decision=accept`.

### `GET /api/bars-review/catalog`

**Output**:
```json
{
  "catalog": [
    {
      "batch_id": "string",
      "status": "pending | in-progress | reviewed",
      "total": number,
      "reviewed": number,
      "pending": number
    }
  ],
  "pending_batches": ["batch_id", "..."]
}
```

**Contract test** (L2): Catalog returns array with required fields. Empty catalog returns `[]` (not null, not 404).

### `POST /api/bars-review/new-batch`

**Output**:
```json
{
  "batch_id": "string",
  "candidate_count": number,
  "success": true
}
```

**Contract test** (L3): Trigger new batch → verify new batch file exists and catalog has been updated.

### `GET /api/bars-review/batch?batch_id={id}`

**Output**:
```json
{
  "batch_id": "string",
  "candidates": [{ "id": "string", "text": "string", "face_owner": "string", "score": number }],
  "count": number
}
```

**Contract test** (L3): Load batch → verify accepted candidates are filtered (not in response). Empty batch returns `{ batch_id, candidates: [], count: 0 }`.

### UI Route: `/bars-review`

**Contract test** (L4): 
- Page renders without error
- "Give me a new batch" button visible
- Batch count shown in header
- Accept → reload → candidate removed from view
- All candidates reviewed → "Batch Complete" shown

## Functional Requirements

### Phase 1: Test Gate Infrastructure

- **FR1**: `e2e_bar_review.py` runs all L2/L3 data contract tests against localhost:3099
- **FR2**: L4 agent-browser tests run as part of the same script (not separate)
- **FR3**: Test results written to `bars-review/TEST-RESULTS-{timestamp}.json`
- **FR4**: Any test failure produces a descriptive message: what failed, expected vs actual, contract reference

### Phase 2: Integrate into AGENTS.md

- **FR5**: Add "run test gate" step to zo.space workflow in `AGENTS.md`
- **FR6**: Rule: "No deploy without test gate pass" — non-negotiable

### Phase 3: Automated Gate

- **FR7**: Create `Skills/sprint-preflight/scripts/preflight.sh local` → add bars-review E2E to pre-flight suite
- **FR8**: Pre-flight failure blocks deploy; report goes to COUNCIL/logs/

## Verification Tests

| Level | Name | What it checks | Gate |
|-------|------|---------------|------|
| L1 | Smoke | Scripts exist, no syntax errors | BLOCK |
| L2 | Data contract | All 4 API endpoints return correct shape | BLOCK |
| L3 | Integration | Accept → registry → filtered from batch | BLOCK |
| L4 | UI | agent-browser renders + interactions work | BLOCK |

**Run command**:
```bash
python3 Skills/hey-pocket-ai/scripts/e2e_bar_review.py
```

**Pass criteria**: ALL 4 levels pass. Any failure = STOP.

## Dependencies

- `SPEC-TEMPLATE.md` (canonical spec template for workspace)
- `Skills/hey-pocket-ai/scripts/e2e_bar_review.py` (test runner)
- `Skills/hey-pocket-ai/scripts/build_catalog.py` (catalog L1 check)

## References

- AAR_2026-04-30_BARS-REVIEW-REWRITE-USEFFECT.md — this session's failure log
- docs/plans/unified-batch-orchestrator-implementation-plan.md — pipeline spec
- AGENTS.md — workspace rules (updated with test gate)