# Plan: Superpower Move Decks (Expansion Packs)

> Implement per [.specify/specs/superpower-move-decks/spec.md](spec.md). Each superpower deck is a standalone **60-card** pack (move × level × aspect), **isolated** from the base deck and base pool. Additive; no schema/resolver/validator changes.

## Strategy

The schema, resolver (with `superpowers` matching + `viaSlot`), and validator already exist. This feature is (a) a deterministic 60-cell grid builder, (b) generated+curated content per superpower, (c) two pure helpers (`poolWithSuperpowers`, `citeSuperpowerMove`), and (d) per-pack static artifacts. The non-negotiable invariant: **the base deck stays 120 and the base pool (`CANONICAL_TECHNIQUES`) contains zero superpower cards** — packs are only ever composed into a pool by an owner at call time.

Land incrementally: drafts are `status:'draft'` and never pooled, so partial decks can't affect base play.

## New surface

```
src/lib/technique-library/superpowers/
  profiles.ts            # SUPERPOWER_PROFILES (6): gift, shadow, inner/outer character
  grid.ts                # buildSuperpowerDeck(sp, cells) — enforces the 60-cell shape + id convention
  strategist.ts connector.ts escape-artist.ts disruptor.ts storyteller.ts alchemist.ts
                         #   each: <SP>_DECK: Technique[] (60), origin:'ai', status:'draft'
  pools.ts               # poolWithSuperpowers(base, owned), citeSuperpowerMove(...)
  index.ts               # SUPERPOWER_DECKS, superpowerDeck(sp), publishedDeck(sp)
  __tests__/superpower-decks.test.ts
scripts/
  assemble-superpower-decks.ts   # writes public/superpower-decks/<sp>.json (mirrors assemble-allyship-deck.ts)
  superpower-coverage.ts          # owned-vs-unowned resolution + base-isolation report
public/superpower-decks/<sp>.json # assembled artifacts (one per pack)
```

`canonical.ts` is **not** touched — base pool stays base-only.

## Grid contract (enforced by test)

Per superpower: exactly 60 cards = every `(BasicMove × Operation × {inner,outer})`. Tags per card: `superpowers:[sp]`, `moves:[m]`, `operations:[o]`, `aspect:a`, `domains:[]`, `channels:[]` (unless intrinsic). Id `sp-<sp>-<MOVE>-<OP>-<ASPECT>`. 30 inner + 30 outer.

## Key implementation notes
- **Resolver reuse** — a superpower card surfaces only when its `sp` is the active-slot superpower AND it's in the pool. Owners get it via `poolWithSuperpowers`; non-owners never do. Verify with tests; do not modify `resolve.ts`.
- **Citation needs no content** — the full grid guarantees a card exists at every `(m,o,a)`, so `citeSuperpowerMove` is pure coordinate math (returns the deterministic `cardId` + `owned` flag), usable even when the player doesn't own the pack.
- **Base isolation test is load-bearing** — assert `CANONICAL_TECHNIQUES` has no `superpowers.length > 0` cards and `allyship-deck.json` length stays 120.
- **Generation** — follow the spec's method and the Connector worked example for voice/length; require a shadow-check line per cell. 60 cells × 5 decks is large — generate per deck, curate, promote.
- **Artifacts** — mirror `assemble-allyship-deck.ts` so packs are printable/shippable independently.

## Risks / mitigations
| Risk | Mitigation |
|------|------------|
| Pack content leaks into base play | Never merge into `CANONICAL_TECHNIQUES`; base-isolation test; drafts unpooled. |
| 300+ generated cells are generic | Curate against the Connector exemplar; shadow-check per cell; author promotes to `published`. |
| Citation reveals gated content | `citeSuperpowerMove` returns coordinates + `owned` only — never name/essence/steps. |
| Naming drift vs `superpower-move-extensions` | Reconcile the six keys in Phase 1; `Superpower` enum is source of truth. |
| Alchemist double-counts the substrate | Decide in FR5 — ship a distinct 60-grid or document re-skin; don't duplicate substrate into the base pool. |

## Verification
- `vitest run src/lib/technique-library` — 60-cell completeness, base isolation, owned/unowned resolution, citation.
- `tsx scripts/superpower-coverage.ts` — owned pack resolves a class card on every base card; unowned resolves none (but cites).
- `tsc --noEmit` + `eslint` clean; `npm run check`/`build` before merge (DB needed for `db:generate`).
