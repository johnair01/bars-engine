# Strand consult → spec kit pipeline

There is **no automated command** that “moves a spec to the next phase” after a strand consult. Strand tooling in this repo does **investigation and synthesis**; **implementation authority** stays in the **spec kit** (`spec.md`, `plan.md`, `tasks.md`) updated by humans or agents.

## What exists today

| Mechanism | Role |
|-----------|------|
| `STRAND_CONSULT_SIX_FACES.md` / topic consult scripts | **Input brief** for multi-agent passes |
| `STRAND_OUTPUT.md`, `STRAND_CONSULT.md` | **Capture** face outputs + Sage synthesis |
| `npm run sage:consult:*` / `POST .../sage/consult` | **Sage integration** pass (optional) |
| **Manual edits** to `spec.md` (Design Decisions, FRs), `plan.md` (changelog), `tasks.md` (checkboxes) | **Promotes** work from “researched” to “scheduled” |
| `npm run compost:strand-consults` | **Archive** heavy consult files **after** a backlog row is **Done** — cleanup only, not promotion |

## Recommended workflow (after a strand)

1. **Paste** shared context; run faces (or `strand:consult:*` / Sage) → save to `STRAND_OUTPUT.md` or `STRAND_CONSULT.md`.
2. **Sage (or human)** turns synthesis into **task deltas** and **open questions**.
3. Update **`spec.md`**: Design Decisions table + FR/NFR as needed.
4. Update **`plan.md`**: Changelog row with date + what the consult changed.
5. Update **`tasks.md`**: New checkboxes, phase splits, deferrals.
6. **Backlog**: If the idea is new, add/refresh a `BACKLOG.md` row pointing at the spec folder.
7. **Implement** from `tasks.md` in order (fail-fix: `npm run build`, `npm run check`).

## CYOA Modular Charge Authoring (CMA)

Already has a **full spec kit**; strand consult **feeds** it — it does not replace it. Further consults → repeat steps 3–5 above.

## BAR seed metabolization (BSM)

Strand captured in [.specify/specs/bar-seed-metabolization/STRAND_CONSULT.md](../.specify/specs/bar-seed-metabolization/STRAND_CONSULT.md); **spec kit** in the same folder is the implementation checklist **derived from** that consult.

## See also

- [.cursor/rules/spec-kit-plans.mdc](../.cursor/rules/spec-kit-plans.mdc) — spec kit is canonical
- [docs/AGENT_WORKFLOWS.md](./AGENT_WORKFLOWS.md) — MCP / Sage
- `scripts/compost-strand-consults.ts` — when to archive consult files
