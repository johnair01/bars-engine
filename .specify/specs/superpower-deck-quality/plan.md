# Plan: Superpower Deck Quality

> Implement per [.specify/specs/superpower-deck-quality/spec.md](spec.md). Measurement first, then content. Additive schema only; base deck, resolver, validator unchanged.

## Strategy

You can't raise quality you can't measure, so build `assessQuality` + the rubric **before** touching content. Then close the gap in priority order: schema → assessment → harness → hero cells → floor-raise → publish-gate. Keep the deterministic generator as the L1 floor; quality lives in richer `profiles.ts` data (lifts the whole grid) plus hand-authored hero cells (lifts the few cells that matter for the live campaign).

## New / changed surface

```
src/lib/technique-library/
  types.ts                 # + optional anatomy fields (primaryQuestion, campaignQuestion,
                           #   forbiddenMoves, remediation, tell, example, qualityLevel)
  quality.ts               # RUBRIC (12) + assessQuality() (deterministic predicates)
  superpowers/
    profiles.ts            # enrich per-move material so the generator emits L2 anatomy
    grid.ts                # populate the new anatomy fields from profile data
    overrides/             # hand-authored hero cells (L4), keyed by card id (AUTHORED pattern)
      connector.ts escape-artist.ts storyteller.ts strategist.ts
    decks.ts               # apply overrides on top of generated cells
  __tests__/
    quality.test.ts
    superpower-quality.test.ts
    fixtures/campaign-car.ts
scripts/
  superpower-quality-report.ts   # car-campaign harness → per-cell levels + punch-list
```

## Key implementation notes
- **`assessQuality` is pure predicates** — each of the 12 criteria is a function of the card's fields/tags (e.g. #4 = `!!optimizesFor`; #5 = `forbiddenMoves?.length`; #8 = `!!tell`; #3 = has both questions or is aspect-fixed + names its pair; #1/#2/#12 use heuristics: steps count, non-template markers). Document heuristic criteria honestly — they approximate; human review is the final word for L4.
- **Overrides mirror the base deck's `AUTHORED`** — `decks.ts` builds the generated grid, then spreads an override map over matching ids. Keeps generation intact while letting hand-authored cells win.
- **Harness reuses the grid** — load `allyship-deck.json`, for a loadout walk (move × face × domain), surface the superpower card via `poolWithSuperpowers(..., includeDrafts:true)`, run `assessQuality`, tabulate by domain/face/move; list cells `< L3`.
- **Publish gate** — `assessQuality` ≥ L3 required for any `status:'published'` superpower card; a test enforces it. (Currently all draft, so the gate is green until promotion.)
- **Don't inflate `qualityLevel` by hand** — it's a cache; `assessQuality` is source of truth. The guard test recomputes.

## Risks / mitigations
| Risk | Mitigation |
|------|------------|
| Heuristic criteria (#1/#2/#12) give false confidence | Mark them as heuristic; require human sign-off for L4; the harness flags, humans decide. |
| Authoring 360 cells by hand is infeasible | Hero cells only (~12–24 for the campaign) to L4; profile enrichment lifts the rest to L2; gate at L3. |
| Schema churn breaks existing data | All new fields optional; generator + existing cards unaffected; no DB migration (TS-only canonical content). |
| Overrides drift from generated tags | Override merge keeps generated tags unless explicitly replaced; test asserts overridden cells keep valid coordinates. |

## Verification
- `vitest run src/lib/technique-library` — quality assessment, harness determinism, publish-gate.
- `tsx scripts/superpower-quality-report.ts` — car-campaign report; track the count `< L3` dropping as hero cells land.
- `tsc --noEmit` + `eslint` clean; `npm run check`/`build` before merge.
