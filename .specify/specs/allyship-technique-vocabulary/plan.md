# Plan: Allyship Technique Vocabulary

> Implement per [.specify/specs/allyship-technique-vocabulary/spec.md](spec.md). **API-first**: the deterministic vocabulary + resolver (pure TS) ship before any persistence or UI. No DB or UI in Phases 1–2.

## Architectural strategy

The vocabulary is a **contract**, so the safest sequence is: pure types + pure functions first (no side effects, fully unit-testable), then a static canonical data seed, then (only if/when community/personal techniques are actually needed) persistence. Each phase is independently shippable and reversible.

**Single-source-of-truth rule (non-negotiable):** the new module **re-exports** existing canonical enums and only *adds* `Superpower`, `Loadout`, `Technique`. If a type test ever shows divergence, that is a build failure, not a merge.

## New surface

```
src/lib/technique-library/
  vocabulary.ts      # re-exports canonical enums; defines Superpower, Loadout, channel<->emotion helpers
  types.ts           # Technique, TechniqueSource, TechniqueTier, TechniqueAspect, TechniqueOrigin
  resolve.ts         # resolveTechniques() — the deterministic matching + ranking
  validate.ts        # validateTechnique() — provenance gate + tag validity
  canonical.ts       # Phase 2: static Tier-1 MTGOA tool seed
  index.ts           # barrel
  __tests__/
    resolve.test.ts
    validate.test.ts
    vocabulary-no-drift.test.ts
scripts/
  technique-coverage.ts   # Phase 2: per-card resolution count over the 120 deck cards
```

## File impacts

| File | Change | Phase |
|------|--------|-------|
| `src/lib/technique-library/vocabulary.ts` | new — re-exports + `Superpower`/`Loadout` + helpers backed by `CAPABILITIES` | 1 |
| `src/lib/technique-library/types.ts` | new — `Technique` + supporting types | 1 |
| `src/lib/technique-library/resolve.ts` | new — `resolveTechniques` predicate + ranking | 1 |
| `src/lib/technique-library/validate.ts` | new — `validateTechnique` (provenance gate) | 1 |
| `src/lib/technique-library/__tests__/*` | new — unit + no-drift tests | 1 |
| `src/lib/technique-library/canonical.ts` | new — Tier-1 tool seed (3-2-1, W.A.V.E., Grounding, …) | 2 |
| `scripts/technique-coverage.ts` | new — coverage/gaps report over `allyship-deck.json` | 2 |
| `prisma/schema.prisma` | extend `clean-up-technique-system`'s `Technique` with tag columns | 3 |
| `prisma/migrations/…` | `technique_vocabulary_tags` migration (additive) | 3 |

## Key decisions for the implementer

- **Channel → emotion** is read-only off `CAPABILITIES` in `move-library.ts`. Do not hardcode the mapping a second time; import the table.
- **`channelsForCapabilities`** maps each `Capability` back to its `Channel` via the same table (agency→fire, connection→water, exploration→metal, rest→earth, participation→wood).
- **Empty tag array = wildcard.** This is load-bearing for the "one technique, many cards" property; document it at each call site.
- **`viaSlot = 'substrate'`** when a technique matched only because it carries `'alchemist'`/universal eligibility, not the active-slot superpower. Surfaces let UI separate "your class moves" from "the alchemy floor."
- **Validation is the integrity gate.** `origin ∈ {tradition, book, personal_dev}` requires `source.lineage`/`source.permission`/`ontologicalFooting`. Player-authored personal techniques (`origin: 'player'`, `tier: 'personal'`) require only `name`, `essence`, `steps`, and at least `moves`.
- **Phase 3 extends, never forks.** Confirm whether `clean-up-technique-system`'s `Technique` model is already migrated; if yes, this is `ALTER TABLE` additive columns; if not, coordinate so a single `Technique` model carries both feature sets.

## Risks / mitigations

| Risk | Mitigation |
|------|------------|
| Vocabulary drift if someone redefines an enum here | `vocabulary-no-drift.test.ts` asserts re-exported types are identical (compile-time `expectTypeOf`/assignability checks). |
| Two competing `Technique` models (this spec vs clean-up-technique-system) | Phase 3 explicitly extends the existing model; coordination note in tasks. |
| Over-linking (a wildcard technique floods every card) | Ranking by specificity + a `limit` arg on `resolveTechniques`; coverage script flags cards with absurd counts. |
| Channel naming debate (element vs emotion) reopening | Element is canonical key; emotion is a one-helper projection — re-skinnable with zero migration. Documented in Design Decisions. |

## Verification
- `npm run check` (lint + type-check) — including the no-drift type test.
- Unit tests: matching predicate (each of the 6 conditions), ranking order, aspect/subject swap, substrate eligibility, validation gate.
- `tsx scripts/technique-coverage.ts` prints coverage; expect Tier-1 seed to cover 100% of `clean_up` cards and ≥1 technique on a majority of the 120.
