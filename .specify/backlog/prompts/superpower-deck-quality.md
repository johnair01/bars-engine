# Spec Kit Prompt: Superpower Deck Quality

## Role

You raise the six generated superpower decks from drafts to robust, usable cards — by defining what makes a move good, measuring the gap, and closing it, proven against a live campaign.

## Objective

Implement per [.specify/specs/superpower-deck-quality/spec.md](../specs/superpower-deck-quality/spec.md). Measurement first (rubric + `assessQuality`), then content (profile enrichment + hand-authored hero cells), validated by a deterministic car-campaign harness. Additive schema only; base deck/resolver/validator unchanged.

## Requirements

- **Rubric**: 12 criteria grounded in the book (Shaman's Rule, token/ticket, Consent Gate, Placement Test, working-vs-performed tells) and the base deck's authored anatomy. Quality levels L0–L4; "usable" = L3.
- **Schema (additive)**: `Technique` gains optional `primaryQuestion`, `campaignQuestion`, `forbiddenMoves`, `remediation`, `tell`, `example`, `qualityLevel`.
- **`quality.ts`**: `RUBRIC` + deterministic `assessQuality(t) → {level, met, unmet}` (heuristic criteria flagged).
- **Harness**: `CAR_CAMPAIGN` ("raise $8,500 for a car") + `superpower-quality-report.ts` scoring every (move × face × domain) cell for a loadout; punch-list of cells `< L3`.
- **Content**: enrich `profiles.ts`/`grid.ts` to emit L2; hand-author hero cells to L4 for campaign-critical coordinates (apply via an `overrides/` map like the base deck's AUTHORED).
- **Gate**: no `published` superpower card below L3 (enforced by test).

## Deliverables

- [ ] `src/lib/technique-library/types.ts` (+ optional anatomy), `quality.ts`
- [ ] `src/lib/technique-library/superpowers/{profiles,grid,decks}.ts` updates + `overrides/*`
- [ ] `__tests__/{quality,superpower-quality}.test.ts` + `fixtures/campaign-car.ts`
- [ ] `scripts/superpower-quality-report.ts`
- [ ] `gap-analysis.md` (done) ; `BACKLOG.md` entry + `npm run backlog:seed`

## Reference

- Spec: [.specify/specs/superpower-deck-quality/spec.md](../specs/superpower-deck-quality/spec.md)
- Gap analysis: [.specify/specs/superpower-deck-quality/gap-analysis.md](../specs/superpower-deck-quality/gap-analysis.md)
- Plan/Tasks: same folder
- Superpower decks: [.specify/specs/superpower-move-decks/spec.md](../specs/superpower-move-decks/spec.md)
- Gold standard: `src/lib/allyship-deck/move-library.ts` (AUTHORED cards)
