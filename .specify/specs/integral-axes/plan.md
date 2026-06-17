# Plan: Integral Axes — Allyship Domain inner/outer

> Implement per [spec.md](./spec.md). **API-first**: land `AllyshipAspect` / `MoveCellAffinity` types before touching consumers. Ontology docs first, then types, then cosmetic-safe refactor. Energy is a **separate sibling spec** ([`energy-direction-volume`](../energy-direction-volume/spec.md)).

## Architectural strategy

This spec is **low-risk and self-contained**: `WAVE_TO_DOMAIN` feeds only `pickExperienceForPlayer`, which produces narrative-flavor Q1 text with no progress/energy/quest-selection effect (proven in the fifth-move consumer trace). So the refactor can ship independently and be verified by `npm run check` exhaustiveness alone.

The deliberate separation from energy: domains live in `quest-grammar` (contained, cosmetic); energy lives in `alchemy-engine` (load-bearing math). Coupling them in one spec would tie a safe change to a risky one. Split.

## Critical files

| File | Change |
|------|--------|
| `FOUNDATIONS.md` | 8-cell board table + inner/outer definition (Wilber crossover + faces↔altitude already added) |
| `.specify/memory/conceptual-model.md` | `AllyshipAspect` + board + three-axes table |
| `src/lib/quest-grammar/types.ts` | add `AllyshipAspect`, `MoveCellAffinity` |
| `src/lib/quest-grammar/canonical-kernel.ts` | replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY`; add `moveDomain()`; keep `pickExperienceForPlayer` signature |
| `src/lib/quest-grammar/random-unpacking.ts` | (verify) consumer unaffected — still receives a domain string |
| `prisma/schema.prisma` | **Phase 3 only** — `allyshipDomainAspect String?` on `CustomBar`/`Instance` |

## Trade-offs & decisions

- **`MoveCellAffinity` struct vs. parallel maps.** One struct keyed by move keeps domain + aspect (+ secondary) together and stays exhaustive over `PersonalMoveType` (the type-safety net that caught the fifth move). No `altitude` field — altitude is the faces' axis, not a move property.
- **Keep `pickExperienceForPlayer` return type (string).** Affinity is internal; `moveDomain()` is the seam. Avoids rippling through the cosmetic chain.
- **Grow Up = ordinary inner move.** Earlier draft mis-imported Wilber's "Grow Up = levels." Corrected: vertical development = the six faces; the move "Grow Up" is horizontal (lines/capacity) and shares Gather Resource (inner) with Open Up. Harmless cosmetically.

## Verification approach

- Phase 1–2: `npm run check` (exhaustiveness over `PersonalMoveType` is the guard); spot-check `pickExperienceForPlayer` returns expected strings for each move + element.
- Phase 3: Prisma migration discipline (see spec § Persisted data).

## Sequencing

Phase 1 (docs) → Phase 2 (types + refactor, shippable alone) → Phase 3 (persistence, separate gated slice).
</content>
