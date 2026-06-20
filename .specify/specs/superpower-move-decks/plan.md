# Plan: Superpower Move Decks

> Implement per [.specify/specs/superpower-move-decks/spec.md](spec.md). Additive data on top of the existing `technique-library`. No schema, resolver, or validator changes.

## Strategy

The hard parts are already done: `Technique`, the resolver (with `superpowers` matching + `viaSlot`), and the validator all exist. This feature is **structured content** — 78 `Technique` objects tagged `superpowers:[<sp>]` — plus a thin profile constant and a coverage check. Land it incrementally and safely: generated moves are `status: 'draft'` and excluded from the default pool until the author promotes them, so partial decks never affect play.

## New surface

```
src/lib/technique-library/superpowers/
  profiles.ts          # SuperpowerProfile + SUPERPOWER_PROFILES (6)
  strategist.ts        # STRATEGIST_MOVES: Technique[]  (13)
  connector.ts         # CONNECTOR_MOVES   (13)  ← worked example in spec
  escape-artist.ts     # ESCAPE_ARTIST_MOVES (13)
  disruptor.ts         # DISRUPTOR_MOVES   (13)
  storyteller.ts       # STORYTELLER_MOVES (13)
  alchemist.ts         # ALCHEMIST_MOVES   (deltas + 2 signatures)
  index.ts             # SUPERPOWER_TECHNIQUES = [...all]
  __tests__/superpower-decks.test.ts
scripts/
  superpower-coverage.ts   # per-superpower 120-card coverage
```

`canonical.ts` merges `published` superpower moves into `CANONICAL_TECHNIQUES`.

## Deck-shape contract (enforced by test)

Per non-Alchemist superpower: exactly **5 basic** (`moves:[one], operations:[]`), **6 altitude** (`moves:[], operations:[one]`), **2 signature** (`aspect:inner` + `aspect:outer`, both wildcard move/op). All `superpowers:[<sp>]`, `channels:[]` unless intrinsic, `domains:[]`. Alchemist: documented subset (substrate covers basic/altitude; author the 2 signatures + any deltas).

## Key implementation notes
- **Resolver already works** — a move tagged `superpowers:['connector']` surfaces only when Connector is the active-slot superpower (or never, if neither slot is Connector). `viaSlot` is set to the active aspect. Verify, don't rebuild.
- **Status gating** — `canonical.ts` should merge only `status === 'published'`. Add a filter at the merge site so draft decks are inert. (Decide: keep a separate `SUPERPOWER_TECHNIQUES_ALL` for tooling vs the published subset for the pool.)
- **Generation** — draft content with AI assistance per the spec's Generation Method, then hand-curate. Treat the Connector worked example in the spec as the canonical pattern for voice/length.
- **Coverage math** — basic moves cover by move-row, altitude moves by operation-column; together they blanket the grid. The per-superpower report should show 120/120 once a deck's 11 basic+altitude moves are `published`.

## Risks / mitigations
| Risk | Mitigation |
|------|------------|
| Generated content is generic / off-voice | Curate against the Connector exemplar; require a shadow-check line per move; author promotes to `published`. |
| Draft decks leak into play | Merge only `published` into the pool; structural test asserts drafts excluded. |
| Naming drift vs `superpower-move-extensions` | Reconcile the six keys with that spec in Phase 1; `Superpower` enum is the source of truth. |
| Over-authoring (chasing per-cell coverage) | Hold the 13-slot shape; wildcard tags give full coverage without 60 moves/superpower. |

## Verification
- `node_modules/.bin/vitest run src/lib/technique-library` — structural + validation tests green.
- `tsx scripts/superpower-coverage.ts` — 120/120 per published superpower.
- `tsc --noEmit` + `eslint` clean. (`npm run check` when a DB is available.)
