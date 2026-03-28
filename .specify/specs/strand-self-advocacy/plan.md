# Plan: Strand Self-Advocacy Signals

## Architecture

Pure Python backend change. No TypeScript/Next.js modifications. The advocacy signal system instruments existing strand sects in `backend/runner.py` with three lifecycle hooks. All signal data flows into `strandMetadata.audit_trail` — a JSON field that already exists on the strand metadata model. No new DB tables.

The three dataclasses (`BeforeAdvocacy`, `DuringFlag`, `AfterRetro`) live in a new `backend/lib/advocacy.py` module. Each sect gains a mixin or base class with `emit_before_advocacy()`, `emit_during_flag()`, and `emit_after_retro()` methods. The `POST /api/strands/run` response is extended to include the full `audit_trail` list.

Coordinator behavior is **advisory-only** by design: `shouldRun=false` is logged to the audit trail but the coordinator always runs the sect. This is non-negotiable and must not be weakened.

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `backend/lib/advocacy.py` | `BeforeAdvocacy`, `DuringFlag`, `AfterRetro`, `AuditEntry` dataclasses + serialization |

### Modified Files

| File | Change |
|------|--------|
| `backend/runner.py` | Instrument each sect with `emit_before_advocacy()`, `emit_during_flag()`, `emit_after_retro()` calls; coordinator reads `shouldRun` advisory-only (logs, never skips) |
| `backend/api/strands.py` (or equivalent route handler) | Extend `POST /api/strands/run` response to include `audit_trail: list[AuditEntry]` |

## Key Patterns

- **Advisory-only is load-bearing**: The coordinator MUST NOT skip or delay a sect based on `shouldRun=false`. This is architectural, not a preference. The check is: `if not advocacy.shouldRun: log_to_audit(...)` — never `if not advocacy.shouldRun: return`.
- **`AuditEntry` is the canonical shape**: All three signal types serialize to `AuditEntry` with a common schema (`sect`, `event`, `actor`, `timestamp`, `rationale`, `data`). The `event` field distinguishes signal types.
- **Minimum two entries per sect per run**: Every sect must emit at minimum `before_advocacy` + `after_retro`. `during_flag` is emitted at natural observation points and may fire 0 or more times.
- **`thread_linkage` is nullable stub**: The `thread_linkage` field exists in the `AuditEntry` dataclass as `Optional[str] = None` — not implemented. Do not add any logic for it.
- **Audit trail in response, not just DB**: The full `audit_trail` list is returned in the `POST /api/strands/run` response body. It is also persisted to `strandMetadata.audit_trail`.

## Dependencies

- `1.24 ST` — Strand System for BARS Engine (strand runner base)
- `backend/runner.py` — sect execution pattern; this file is the primary instrumentation target
- `strandMetadata.audit_trail` JSON field (already exists per strand system spec)
- Python 3.14+ FastAPI + SQLAlchemy async
