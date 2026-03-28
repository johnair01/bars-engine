# Tasks: Strand Self-Advocacy Signals

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row SSA, priority 1.70)
- [ ] Run `npm run backlog:seed`

## SSA-1: Signal Contracts + AuditEntry

- [ ] Create `backend/lib/advocacy.py`:
  - [ ] `BeforeAdvocacy(shouldRun: bool, suggestRoute: Optional[str], reason: Optional[str])`
  - [ ] `DuringFlag(flag: str, message: str, severity: Optional[str])` — severity: `info | warning | critical`
  - [ ] `AfterRetro(retrospective: str, suggestedImprovements: Optional[List[str]])`
  - [ ] `AuditEntry(sect: str, event: str, actor: Optional[str], timestamp: str, rationale: Optional[str], data: Optional[dict])` — `thread_linkage` as nullable stub only
  - [ ] Serialization: `AuditEntry.to_dict()` → plain dict for JSON response

## SSA-2: Sect Instrumentation in `runner.py`

- [ ] Add `emit_before_advocacy(sect_name) → BeforeAdvocacy` pattern to sect base class or mixin
- [ ] Add `emit_during_flag(sect_name, flag, message, severity=None) → DuringFlag` pattern
- [ ] Add `emit_after_retro(sect_name, retrospective, suggestions=None) → AfterRetro` pattern
- [ ] Instrument each existing sect in `backend/runner.py`:
  - [ ] Call `emit_before_advocacy()` before sect runs; append `AuditEntry(event='before_advocacy')` to trail
  - [ ] Call `emit_during_flag()` at natural mid-run observation points; append `AuditEntry(event='during_flag')`
  - [ ] Call `emit_after_retro()` after sect completes (or fails); append `AuditEntry(event='after_retro')`
- [ ] Coordinator reads `before_advocacy.shouldRun` advisory-only: if `False`, log to audit trail — NEVER skip sect
- [ ] Persist accumulated `audit_trail` list to `strandMetadata.audit_trail` JSON field

## SSA-3: API Response Extension

- [ ] Edit `POST /api/strands/run` response to include `audit_trail: list[dict]`
- [ ] Verify response shape matches spec contract: `{ result: str, audit_trail: AuditEntry[] }`
- [ ] Each sect in the run produces ≥1 `before_advocacy` + ≥1 `after_retro` entry

## Verification

- [ ] Run existing strand smoke test — passes unbroken
- [ ] `POST /api/strands/run` returns 200 with `audit_trail` in response body
- [ ] `audit_trail` contains `before_advocacy` + `during_flag` + `after_retro` entries per sect
- [ ] `before_advocacy.shouldRun=false` → entry logged to audit trail, sect runs regardless
- [ ] `npm run check` passes (0 TypeScript errors — TypeScript unaffected)
