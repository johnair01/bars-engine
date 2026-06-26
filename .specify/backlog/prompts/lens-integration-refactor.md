# Prompt: Lens Integration Refactor

**Use when implementing any phase of the Lens-driven developmental architecture.**
Lenses become first-class temporal objects (Observatory); BARs grow under a Lens,
in a Garden, through an explicit arc; a queryable provenance graph ties
BARs ↔ Lenses ↔ Quests ↔ Campaigns ↔ Vibeulons.

## Context
- Spec/plan/tasks: [.specify/specs/lens-integration-refactor/spec.md](../../specs/lens-integration-refactor/spec.md)
- **Extends** [core-game-loop-audit](../../specs/core-game-loop-audit/spec.md) (the new flow IS the loop; H1 TTV→BAR shipped is the substrate; Garden subsumes H2).
- **Reshapes** [tap-the-vein-tier-2](../../specs/tap-the-vein-tier-2/spec.md) (Daily TTV attaches to today's Lens; TTVE mint gains lens/channel/growthSource attribution).
- **Core stays agnostic**: no `developmentStage` — developmental level + nation are play-emergent overlays, never core fields. Existing `maturity` is untouched.

## Phases (resolve § Open decisions per phase first)
- **LENS1** Lens model + `/observatory` (7 navigable levels) + auto today-lens.
- **LENS2** `CustomBar.lensId` (+ `experienceIntent`); TTV `commitTask` sets lens. No stage column.
- **LENS3** `Garden` first-class + `gardenId` + Plant flow (Choose Lens → Six Questions → Plant); Garden shows Planted+.
- **LENS4** Provenance graph (`ProvenanceLink`, `getBarProvenance`) + Vibeulon attribution (refit TTVE).
- **LENS5** Cultivate/Harvest stage moves + future hooks (3·2·1-on-BAR, TTV-on-BAR).

## Prompt text
> Implement per [.specify/specs/lens-integration-refactor/tasks.md](../../specs/lens-integration-refactor/tasks.md) in phase order. API-first; reuse existing capture/grow/321/garden mechanics. **No `developmentStage`** — the core model is nation/developmental-level agnostic; those are play-emergent overlays. Each phase: migration authored DB-free (`db push` forbidden), `npm run build` + `npm run check`, a `cert-*` quest. Resolve the spec's § Open decisions for a phase before building it.

## Open decisions (must answer)
provenanceChain (derived vs stored) · experienceIntent (enum vs free) · what "replace the planning flow" removes · lens auto-creation · garden multiplicity timing. **Resolved:** no developmentStage; the plant "Six Questions" reuse the Six Unpacking Questions.

## Reference
- [.specify/specs/lens-integration-refactor/](../../specs/lens-integration-refactor/)
- `src/lib/bar-seed-metabolization/` (maturity → developmentStage), `src/actions/economy.ts` (mintVibulon), `src/actions/bars.ts` (grow*), `src/app/bars/garden/`
