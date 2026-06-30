# Prompt: Living-World Experience (Observatory nav + feel)

**Use when implementing the experience/navigation layer** that makes the app feel
like a living world (Pokémon PC / Harvest Moon / BotW), not productivity software.
This is the UX layer over the Lens model.

## Context
- Spec: [.specify/specs/living-world-experience/spec.md](../../specs/living-world-experience/spec.md)
- **Experience layer of** [lens-integration-refactor](../../specs/lens-integration-refactor/spec.md); resolves loop-audit **H2** by splitting inventory into Garden/Hand/Vault/World.
- UI governed by [`UI_COVENANT.md`](../../../UI_COVENANT.md) + `src/lib/ui/card-tokens.ts` (read first). Tailwind = layout; `cultivation-cards.css` = aesthetic.
- Current nav: `src/components/NavBar.tsx` (NOW/VAULT/EVENTS/PLAY/+BAR).

## Phases
- **E1** Five-destination nav shell (Observatory/Garden/Hand/Vault/World) + persistent Capture.
- **E2** Observatory UI (planetarium over the Lens hierarchy) — after Lens P1.
- **E3** Daily Flow + Daily Reflection (TTV → plant → mint → reflect) — after Lens P2–P3 (+ SAT).
- **E4** Garden text-free growth, **derived from provenance** (branch/flower/fruit/compost) — after Lens P3–P4.
- **E5** Provenance living-timeline UI (+ Book/Chapter roots) — after Lens P4.

## Prompt text
> Implement per [.specify/specs/living-world-experience/spec.md](../../specs/living-world-experience/spec.md). Read `UI_COVENANT.md` + `card-tokens.ts` first. Build the experience phases E1–E5 in order, each gated on the matching Lens phase. Growth visuals are **derived from provenance**, never a stored developmental stage (core stays agnostic). Every surface is checked against the core feeling: "nothing meaningful is ever wasted." Covenant check + `cert-*` quest per phase.

## Open decisions (assumed defaults in spec — confirm)
Garden growth model · nav full-replacement + persistent Capture · what "World" is · Daily Reflection content/mint · Book/Chapter as provenance roots · Hand as a first-class destination.

## Reference
- [.specify/specs/living-world-experience/spec.md](../../specs/living-world-experience/spec.md)
- `src/components/NavBar.tsx`, `src/components/now/` (NowHome/HandGlance), `src/app/bars/garden/`, `src/app/daemons/`, `src/app/world/`, `getBarProvenance` (Lens P4)
