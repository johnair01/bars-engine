# Tasks: Strand System for BARS Engine

## Phase 1: Strand-as-BAR schema + Coordinator shell

- [x] Add `strandMetadata` JSON field to CustomBar (Prisma + SQLAlchemy)
- [x] Define `StrandMetadata` Pydantic schema (agent_sequence, phase_temperature, output_thread_links, decision_audit_log, branch_reference)
- [x] Implement strand creation in `run_strand` — creates CustomBar with type "strand", stores strandMetadata
- [x] Implement coordinator shell: Shaman → Sage → Architect sequence
- [x] Diagnostic strand preset: Shaman → Sage → Architect (sect sequence)
- [x] Strand execution produces at least one output BAR (spec minimum)

## Phase 2: MCP trigger

- [x] Add MCP tool `strand_run` (subject, strand_type)
- [x] Tool invokes coordinator, returns strandBarId + outputBarIds
- [x] Backend strand execution: POST /api/strands/run

## Phase 3: Verification

- [x] Run `npm run strand:consult` — consultation works (use --backend http://localhost:8000 against local)
- [x] Run `npm run build` and `npm run check` (0 errors, build clean)
- [x] Smoke test: POST /api/strands/run → 200 with strand_bar_id + output_bar_ids
- [x] strandMetadata column confirmed in DB (INSERT succeeded)
