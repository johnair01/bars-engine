# Spec Kit Prompt: Superpower Move Decks (Expansion Packs)

## Role

You are a Spec Kit agent building the six Superpower expansion decks — standalone add-on packs to the base Allyship Deck.

## Objective

Implement per [.specify/specs/superpower-move-decks/spec.md](../specs/superpower-move-decks/spec.md). Each superpower deck is a complete **60-card grid (5 moves × 6 levels × 2 aspects)**, **isolated** from the base deck and base pool. Additive content + two pure helpers; schema/resolver/validator unchanged.

## Requirements

- **Grid (per superpower)**: every `BasicMove (5) × Operation (6) × aspect (2)` = 60 cards. 30 inner + 30 outer. Domain-agnostic (`domains:[]`). Id `sp-<sp>-<MOVE>-<OP>-<ASPECT>`.
- **Isolation**: never merge into `allyship-deck.json` (stays 120) or `CANONICAL_TECHNIQUES` (base pool stays base-only). Packs compose into a pool only for owners, at call time.
- **Helpers**: `poolWithSuperpowers(base, owned)` and `citeSuperpowerMove(card, loadout, subject, owned)` — citation is coordinate-only (existence guaranteed by the full grid), never reveals gated content.
- **Cards are Techniques** tagged `superpowers:[sp], moves:[m], operations:[o], aspect:a`. Generated → `origin:'ai'`, `status:'draft'`; promote to `published` to enter an owner's pool.
- **Artifacts**: assemble each pack to `public/superpower-decks/<sp>.json` (mirror `assemble-allyship-deck.ts`).
- **Generation**: superpower profile × level register (ch1–7) × move purpose (WAVE). Connector worked example in the spec is the canonical pattern. Alchemist pack is an open question (re-skins the substrate).

## Deliverables

- [ ] `src/lib/technique-library/superpowers/{profiles,grid,pools,index,strategist,connector,escape-artist,disruptor,storyteller,alchemist}.ts`
- [ ] `scripts/assemble-superpower-decks.ts` + `public/superpower-decks/<sp>.json`
- [ ] `scripts/superpower-coverage.ts`
- [ ] `__tests__/superpower-decks.test.ts` (60-cell completeness, base isolation, owned/unowned, citation)
- [ ] `BACKLOG.md` entry + `npm run backlog:seed`

## Reference

- Spec: [.specify/specs/superpower-move-decks/spec.md](../specs/superpower-move-decks/spec.md)
- Plan: [.specify/specs/superpower-move-decks/plan.md](../specs/superpower-move-decks/plan.md)
- Tasks: [.specify/specs/superpower-move-decks/tasks.md](../specs/superpower-move-decks/tasks.md)
- Vocabulary: [.specify/specs/allyship-technique-vocabulary/spec.md](../specs/allyship-technique-vocabulary/spec.md)
- Base deck assembly to mirror: `scripts/assemble-allyship-deck.ts`
