# Plan: Six Faces as formal council agents

Proposal, 2026-10-02. See `spec.md` §Open decisions before building.

## Layout

```
backend/app/council/
  __init__.py
  faces.py        # load council/faces.yaml, build a face's prompt (lens + standing tests + lessons)
  schemas.py      # Consult, FaceVerdict, Outcome, Disposition
  agents.py       # six pydantic-ai agents in council role, no DB deps; deterministic brief fallback
  sage.py         # merge: synthesis, dissent flag, landing
  ledger.py       # record / load / rule / stats / dispositions over council/ledger/*.json
  render.py       # Consult -> markdown in the 6FACE_PASS6 shape
  backfill.py     # parse existing consult markdown into Consult records
  cli.py          # `faces` entry point (typer or argparse)
council/
  faces.yaml      # the six lenses, sources, lessons
  causes.yaml     # proposed by backfill, named by Wendell
  ceding.yaml     # run length unset; reserved list
  ledger/         # one JSON per consult
```

`backend/app/mcp_server.py` gains `council_consult`, `council_rule`, `council_stats`, calling `backend/app/council` directly. These three do not call `_with_session`.

Each project repo gains `.claude/skills/six-faces/SKILL.md`: read `faces.yaml`, call the CLI (or the MCP tool when registered), paste the rendered pass into the console, write the record.

## Phasing

| Phase | Builds | Proves |
|---|---|---|
| 0 | faces.yaml, schemas, ledger, backfill, stats, render | the count Wendell asked for, from the existing record, with no model call |
| 1 | council agents, sage merge, CLI, MCP tools, skills | one command convenes a pass from a terminal, Claude Desktop or Cursor |
| 2 | ceding.yaml, dispositions, delegated consults | a face answers alone where the rulings say it may |
| 3 | HTTP route, admin page, Postgres, Routine | not scoped |

## Decisions carried from the spec

- Council role and NPC role share `faces.yaml` for altitude and name only. Prompts differ.
- No Prisma change in phases 0 to 2. No migration.
- `COUNCIL_MODEL` in `backend/app/config.py`; `COUNCIL_CHALLENGER_MODEL` optional.
- The no-model path prints the brief. It is the dual-track delivery, not a fallback.

## Backfill sources (phase 0)

- `friendcraft-manuacript/preproduction/6FACE_*.md` (6)
- `flirtcraft/INTAKE_SIX_FACES.md`, `flirtcraft/LEDGER_AND_LAUNCH_SIX_FACES.md` (2)
- `bars-engine/.specify/specs/**/{STRAND_CONSULT*,GM_CONSULT*,SIX_FACES*,CONSULT,SAGE_CONSULT,*CONSULT*}.md`, `.specify/archive/strand-consults/**`, `docs/conclave/**`, `MAILING_LIST_SIX_FACES.md`
- Rulings: `friendcraft-manuacript/canon/DECISION_LOG.md` entries that cite a pass; header notes in the flirtcraft consults; "ratified" lines.

The parser is heuristic. A record it cannot fill is written with `outcome: unruled` and listed for Wendell, not guessed.

## Verification

- Phase 0: `faces stats` on the backfilled ledger reproduces the inventory table in `spec.md` §Counts.
- Phase 1: `faces consult "<q>" --no-model` prints a brief; `faces consult "<q>"` with a key prints a pass that passes `voice_lint.py`; `verify:bars-agents-mcp` lists the three council tools.
- Phase 2: a `(face, cause)` row cannot reach `delegated` while `run_length` is unset.
