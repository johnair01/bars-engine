# Spec: Strand Self-Advocacy Signals

## Purpose

Implement self-advocacy signals (before/during/after) for BARS Engine strand sects. Each sect emits three lifecycle hooks: `before_advocacy` (should-run advisory), `during_flag` (mid-run observation), and `after_retro` (post-run reflection). Coordinator behavior is advisory-only — `before_advocacy.shouldRun = false` logs to audit trail but the sect always runs. All signals persisted as `AuditEntry` records in `strandMetadata.audit_trail`.

**Problem**: Strand sects run silently with no self-reporting mechanism. The coordinator cannot learn from sect experience, and operators cannot audit why a sect behaved a certain way. Self-advocacy adds observability without adding control (coordinator remains advisory-only).

**Practice**: Deftness Development — spec kit first, deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Coordinator authority | Advisory-only: `shouldRun=false` is logged, sect runs regardless — not a gate |
| Storage | `strandMetadata.audit_trail` JSON field only — no new DB tables |
| Scope | Phase 5a only; admin strand view is Phase 5b (out of scope) |
| Frontend | TypeScript/Next.js frontend unaffected |
| Stack | Python 3.14+ FastAPI + SQLAlchemy async backend |
| Thread linkage | `thread_linkage` is nullable stub — do not implement in this seed |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Strand sects (Python, self-reporting); Coordinator (reads audit trail, advisory) |
| **WHAT** | Three `AuditEntry` records per sect per run: `before_advocacy`, `during_flag`, `after_retro` |
| **WHERE** | `backend/runner.py`; `POST /api/strands/run` response |
| **Energy** | Observability without control — sects speak, coordinator listens |
| **Personal throughput** | Wake Up — sects surface what they see before/during/after |

## API Contracts (API-First)

### `POST /api/strands/run`

**Input** (unchanged): `{ strandId: string; preset?: string }`

**Output** (extended):
```python
{
  "result": "...",
  "audit_trail": [
    {
      "sect": str,
      "event": "before_advocacy" | "during_flag" | "after_retro",
      "actor": str | None,
      "timestamp": str,   # ISO 8601
      "rationale": str | None,
      "data": dict | None
    }
  ]
}
```

### `BeforeAdvocacy` signal (per sect)

```python
@dataclass
class BeforeAdvocacy:
    shouldRun: bool
    suggestRoute: Optional[str] = None
    reason: Optional[str] = None
```

### `DuringFlag` signal (per sect, mid-run)

```python
@dataclass
class DuringFlag:
    flag: str
    message: str
    severity: Optional[str] = None  # info | warning | critical
```

### `AfterRetro` signal (per sect, post-run)

```python
@dataclass
class AfterRetro:
    retrospective: str
    suggestedImprovements: Optional[List[str]] = None
```

### `AuditEntry` (in `strandMetadata.audit_trail`)

```python
@dataclass
class AuditEntry:
    sect: str
    event: str        # before_advocacy | during_flag | after_retro
    actor: Optional[str]
    timestamp: str
    rationale: Optional[str]
    data: Optional[dict]
```

## User Stories

### P1: Sect emits before-advocacy, coordinator logs and runs regardless

**As the coordinator**, I want to receive a sect's advisory signal before it runs, log it to the audit trail, and run the sect regardless, so I never skip work based on advisory-only input.

**Acceptance**: `before_advocacy` with `shouldRun=false` appears in `audit_trail` with `event=before_advocacy`. Sect runs. `POST /api/strands/run` returns 200.

### P1: Sect emits during-flag mid-run

**As an operator reviewing a strand run**, I want to see observations the sect had during execution, so I can diagnose issues without replaying the run.

**Acceptance**: `during_flag` entry appears in `audit_trail` with `event=during_flag` and `severity` field.

### P1: Sect emits after-retro with suggested improvements

**As a strand operator**, I want each sect to reflect on what it did and suggest improvements, so the strand system learns over time.

**Acceptance**: `after_retro` entry appears in `audit_trail` with `retrospective` string and optional `suggestedImprovements`.

## Functional Requirements

### Phase SSA-1: Signal contracts + AuditEntry schema

- **FR1**: Define `BeforeAdvocacy`, `DuringFlag`, `AfterRetro`, `AuditEntry` dataclasses in `backend/lib/advocacy.py`
- **FR2**: `AuditEntry` list appended to `strandMetadata.audit_trail` JSON field (no new DB table)

### Phase SSA-2: Sect instrumentation in `runner.py`

- **FR3**: Each sect in `backend/runner.py` calls `self.emit_before_advocacy()` → appends `AuditEntry(event='before_advocacy')` before running
- **FR4**: Each sect calls `self.emit_during_flag()` at natural observation points mid-run
- **FR5**: Each sect calls `self.emit_after_retro()` after completing (or failing) → appends `AuditEntry(event='after_retro')`
- **FR6**: Coordinator reads `before_advocacy.shouldRun` but NEVER skips a sect based on it (advisory-only)

### Phase SSA-3: API response extension

- **FR7**: `POST /api/strands/run` response includes `audit_trail: AuditEntry[]`
- **FR8**: `audit_trail` contains ≥1 advocacy entry per sect (at minimum `before_advocacy` + `after_retro`)

## Non-Functional Requirements

- Coordinator MUST NOT skip sects based on `shouldRun=false` — this is load-bearing
- Existing strand smoke test must pass unbroken
- `thread_linkage` field: nullable stub only, not implemented
- Admin strand view (Phase 5b) is out of scope

## Verification

- **Method**: Integration test (not Twine — this is Python backend only)
- `POST /api/strands/run` returns 200 with `audit_trail` containing `before_advocacy + during_flag + after_retro` per sect
- Existing smoke test passes
- `npm run check` 0 errors (TypeScript unaffected)

## Dependencies

- `1.24 ST` — Strand System for BARS Engine (strand runner base)
- `backend/runner.py` — sect execution pattern
- `strandMetadata.audit_trail` JSON field (already exists per strand system spec)

## References

- Seed: [seed-strand-self-advocacy.yaml](../../../seed-strand-self-advocacy.yaml)
- Source: conversation-2026-03-17-strand-consult
- Sage deftness notes: thread_linkage is nullable stub; audit_trail is load-bearing; admin strand view is Phase 5b
