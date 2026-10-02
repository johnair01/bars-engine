# Tasks: Six Faces as formal council agents

Proposal, 2026-10-02. Not started. Phase 0 can begin once Wendell answers `spec.md` §Open decisions 1 and 4.

## Phase 0: definition and backfill
- [ ] `council/faces.yaml` with the six lenses, sources cited, empty `lessons`
- [ ] `backend/app/council/schemas.py`: `Consult`, `FaceVerdict`, `Outcome`, `Disposition`
- [ ] `backend/app/council/ledger.py`: `record`, `load`, `rule`, `stats`
- [ ] `backend/app/council/backfill.py` over the sources in `plan.md`; writes `council/ledger/*.json`; prints the unfilled list
- [ ] `council/causes.yaml` proposed from the backfill; Wendell names the categories
- [ ] `faces stats` reproduces the spec's inventory table

## Phase 1: the council runs
- [ ] `backend/app/council/agents.py`: six council agents, no DB; `COUNCIL_MODEL` in config
- [ ] `backend/app/council/sage.py`: synthesis, `dissent`, `landing`
- [ ] `backend/app/council/render.py` in the PASS6 shape; lint-clean
- [ ] `faces consult`, `faces rule`, `faces stats`, `faces ceding` CLI
- [ ] `council_consult`, `council_rule`, `council_stats` in `backend/app/mcp_server.py`; `verify:bars-agents-mcp` updated
- [ ] `.claude/skills/six-faces/SKILL.md` in bars-engine, friendcraft-manuacript, flirtcraft
- [ ] `docs/AGENT_WORKFLOWS.md` section: convening the council from a terminal, Claude Desktop, Cursor

## Phase 2: ceding
- [ ] `council/ceding.yaml`: `run_length` unset, reserved list
- [ ] `dispositions()`; promotion refused while `run_length` unset; demotion on one overrule
- [ ] delegated consult path: one face, `convened` recorded, still ruleable

## Phase 3: not scoped
- [ ] `POST /api/council/consult`; admin page; Postgres table; scheduled Routine
