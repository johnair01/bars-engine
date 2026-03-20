# Plan: CYOA Modular Charge Authoring

## Summary

Move from research ([docs/CYOA_MODULAR_AUTHORING_RESEARCH.md](../../../docs/CYOA_MODULAR_AUTHORING_RESEARCH.md)) to **spec-backed** modular CYOA UX. **Phase 0** completes this spec kit + **strand consult** (six faces). **Phase 1+** implements block palette, IR alignment, and charge bridge per `tasks.md` after consult stabilizes decisions.

## Phases

### Phase 0 — Spec + strand consult (current)

- Spec kit: `spec.md`, `plan.md`, `tasks.md`, [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md)
- Backlog + backlog prompt for agents
- Run **strand: consult** using six-face brief; Sage → integration brief → task updates

### Phase 1 — Vision alignment (post-consult)

- ADR or `ARCHITECTURE_FRAGMENTS.md` slice: IR vs Twee, block taxonomy v0
- Confirm integration with [twine-authoring-ir](../twine-authoring-ir/spec.md), [quest-grammar-compiler](../quest-grammar-compiler/spec.md)

### Phase 2 — Block palette MVP

- Node archetypes + validator
- Admin-first UI (reuse GenerationFlow / quest grammar surfaces where possible)
- Compile: blocks → IR → Twee

### Phase 3 — Library + charge mapping

- Template subgraph persistence + provenance
- Charge → suggested blocks (non-binding)

### Phase 4 — Pedagogy & gating

- Progressive unlock + tutorial copy (Diplomat face — relational onboarding)
- Dual-track AI on/off paths

## File impacts (anticipatory)

| File | Phase |
|------|--------|
| `docs/CYOA_MODULAR_AUTHORING_RESEARCH.md` | Link to spec kit (done) |
| `.specify/specs/cyoa-modular-charge-authoring/*` | Phase 0 |
| `src/lib/quest-grammar/*`, `src/app/admin/quest-grammar/*` | Phase 2+ |
| `src/lib/twine-authoring-ir/*` | Phase 1–2 |
| `STRAND_OUTPUT.md` (optional, this folder) | After consult |

## Dependencies

- [strand-system-bars](../strand-system-bars/spec.md) — consult orchestration
- [onboarding-quest-generation-unblock](../onboarding-quest-generation-unblock/spec.md)
- [twine-authoring-ir](../twine-authoring-ir/spec.md)

## Changelog

| Date | Change |
|------|--------|
| 2026-03-20 | Initial spec kit + STRAND_CONSULT_SIX_FACES |
| 2026-03-20 | **Strand consult pass 1** — [STRAND_OUTPUT.md](./STRAND_OUTPUT.md): six-face research; v0 archetypes; validation order; gates; Diplomat copy principles; Sage synthesis + deferred scope |
| 2026-03-20 | Phases **2–4** MVP: `cmaStoryToIr` + `irToTwee`; Blocks UI templates (localStorage), charge hints, palette unlock, tutorial, structure-only toggle — see `tasks.md` |
