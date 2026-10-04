# Consult → spec kit pipeline

There is **no automated command** that "moves a spec to the next phase" after a consult. Consults do **investigation and synthesis**; **implementation authority** stays in the **spec kit** (`spec.md`, `plan.md`, `tasks.md`) updated by humans or agents.

Since 2026-10-03 consults run through the **six-faces skill** (`.claude/skills/six-faces/SKILL.md`, `council/faces.yaml`) in a Claude session. The backend-run `strand:consult:*` scripts were retired (see [strand-process-decision](../.specify/specs/strand-process-decision/spec.md)). Older consult files (`STRAND_CONSULT*.md`, `STRAND_OUTPUT*.md`) stay in their spec folders as history.

## What exists today

| Mechanism | Role |
|-----------|------|
| six-faces skill | Runs the six faces on a question and returns a verdicts table; the Sage never decides |
| `STRAND_CONSULT*.md` / `STRAND_OUTPUT*.md` in spec folders | **History** from earlier consults |
| **Manual edits** to `spec.md` (Design Decisions, FRs), `plan.md` (changelog), `tasks.md` (checkboxes) | **Promotes** work from "researched" to "scheduled" |
| `npm run compost:strand-consults` | **Archive** heavy consult files **after** a backlog row is **Done** (cleanup only) |

## Recommended workflow (after a consult)

1. Run the six faces on the question; keep the verdicts.
2. Turn the ruling into a **Design Decisions row** labelled "Six Faces ruling" in `spec.md`, with **task deltas** and **open questions**.
3. Update **`plan.md`**: Changelog row with date and what the consult changed.
4. Update **`tasks.md`**: New checkboxes, phase splits, deferrals.
5. **Backlog**: If the idea is new, add or refresh a `BACKLOG.md` row pointing at the spec folder.
6. **Implement** from `tasks.md` in order (fail-fix: `npm run build`, `npm run check`).

## CYOA Modular Charge Authoring (CMA)

Already has a **full spec kit**; its consult **feeds** it. Further consults → repeat steps 2–4 above.

## BAR seed metabolization (BSM)

Consult captured in [.specify/specs/bar-seed-metabolization/STRAND_CONSULT.md](../.specify/specs/bar-seed-metabolization/STRAND_CONSULT.md); **spec kit** in the same folder is the implementation checklist **derived from** that consult.

## See also

- [.cursor/rules/spec-kit-plans.mdc](../.cursor/rules/spec-kit-plans.mdc) — spec kit is canonical
- [docs/AGENT_WORKFLOWS.md](./AGENT_WORKFLOWS.md) — MCP / Sage
- `scripts/compost-strand-consults.ts` — when to archive consult files
