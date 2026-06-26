# Prompt: Lens Integration Refactor

**Use when implementing any phase of the Lens-driven developmental architecture.**
Lenses become first-class temporal objects (Observatory); BARs grow under a Lens,
in a Garden, through an explicit arc; a queryable provenance graph ties
BARs ↔ Lenses ↔ Quests ↔ Campaigns ↔ Vibeulons.

## Context
- Spec/plan/tasks: [.specify/specs/lens-integration-refactor/spec.md](../../specs/lens-integration-refactor/spec.md)
- **Extends** [core-game-loop-audit](../../specs/core-game-loop-audit/spec.md) (the new flow IS the loop; H1 TTV→BAR shipped is the substrate; Garden subsumes H2).
- **Reshapes** [tap-the-vein-tier-2](../../specs/tap-the-vein-tier-2/spec.md) (Daily TTV attaches to today's Lens; TTVE mint gains lens/channel/growthSource attribution).
- **Supersedes** the `maturity` machine with `developmentStage` (mapping in spec).

## Phases (resolve § Open decisions per phase first)
- **LENS1** Lens model + `/observatory` (7 navigable levels) + auto today-lens.
- **LENS2** `CustomBar.lensId` + `developmentStage` (+ maturity backfill); TTV `commitTask` sets lens/stage.
- **LENS3** `Garden` first-class + `gardenId` + Plant flow (Choose Lens → Six Questions → Plant); Garden shows Planted+.
- **LENS4** Provenance graph (`ProvenanceLink`, `getBarProvenance`) + Vibeulon attribution (refit TTVE).
- **LENS5** Cultivate/Harvest stage moves + future hooks (3·2·1-on-BAR, TTV-on-BAR).

## Prompt text
> Implement per [.specify/specs/lens-integration-refactor/tasks.md](../../specs/lens-integration-refactor/tasks.md) in phase order. API-first; reuse existing capture/grow/321/garden mechanics. `developmentStage` supersedes `maturity` (use the mapping). Each phase: migration authored DB-free (`db push` forbidden), `npm run build` + `npm run check`, a `cert-*` quest. Resolve the spec's § Open decisions for a phase before building it.

## Open decisions (must answer)
developmentStage-vs-maturity · provenanceChain (derived vs stored) · the Six Questions · experienceIntent (enum vs free) · what "replace the planning flow" removes · lens auto-creation · garden multiplicity timing.

## Reference
- [.specify/specs/lens-integration-refactor/](../../specs/lens-integration-refactor/)
- `src/lib/bar-seed-metabolization/` (maturity → developmentStage), `src/actions/economy.ts` (mintVibulon), `src/actions/bars.ts` (grow*), `src/app/bars/garden/`
