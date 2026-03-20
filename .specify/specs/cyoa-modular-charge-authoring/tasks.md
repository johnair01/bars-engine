# Tasks: CYOA Modular Charge Authoring

## Phase 0: Spec kit + consult readiness

- [x] Create `spec.md`, `plan.md`, `tasks.md`
- [x] Add [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md) for `strand: consult` (all six Game Master faces)
- [x] Link research doc ↔ spec kit
- [x] Add backlog row + [backlog prompt](../../backlog/prompts/cyoa-modular-charge-authoring.md)
- [x] Run **strand consult** (six faces); capture outputs in [STRAND_OUTPUT.md](./STRAND_OUTPUT.md)
- [x] After consult: update **Design Decisions** in `spec.md` + plan Changelog

## Phase 1: Vision alignment (post-consult)

- [ ] Add `ADR-cma-v0.md` (or `ARCHITECTURE_NOTE.md`) in this folder: **7 archetypes**, IR sketch `Story{nodes,edges,fragments,...}`, validation pipeline order, `include`/`widget` mapping to IR
- [ ] Document integration points: [twine-authoring-ir](../twine-authoring-ir/spec.md), [quest-grammar-compiler](../quest-grammar-compiler/spec.md), `validateQuestGraph` / [flow-simulator-cli](../flow-simulator-cli/spec.md) (pick minimal path)
- [ ] Specify **3 falsification tests** for CI (unreachable End; single-arm Choice; zero End) — see STRAND_OUTPUT Challenger section
- [x] **MCP gate:** Run `npm run verify:bars-agents-mcp`; enable **bars-agents** in Cursor when using MCP — see `docs/AGENT_WORKFLOWS.md` § MCP availability (HTTP `sage_consult` equivalent: `npx tsx scripts/run-sage-consult-cma.ts`)
- [x] **Sage** second pass — `POST /api/agents/sage/consult` / MCP `sage_consult`; captured in [STRAND_OUTPUT.md](./STRAND_OUTPUT.md) § Sage (MCP synthesis)

## Phase 2: Block palette MVP

- [ ] Define node archetypes (5–8) + graph validation rules
- [ ] Admin UI: palette + structure review (reuse quest grammar where possible)
- [ ] Compiler path: blocks → IR → Twee export
- [ ] `npm run build` && `npm run check`

## Phase 3: Library + charge bridge

- [ ] Persist template subgraphs + provenance (BAR/quest ids)
- [ ] Charge fields → block suggestions (non-mandatory)

## Phase 4: Pedagogy & gating

- [ ] Progressive block unlock + tutorial copy
- [ ] Dual-track: AI-assisted vs structure-only path verified
