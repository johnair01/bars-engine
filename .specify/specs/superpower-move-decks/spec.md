# Spec: Superpower Move Decks (Expansion Packs)

## Purpose

Define the six **Superpower expansion decks** as standalone add-on packs to the base Allyship Deck. Each superpower deck is a full **60-card grid = 5 basic moves × 6 levels (Shaman→Sage) × 2 aspects (inner / outer)**. These decks are **not** part of the 120-card base deck and are **not** merged into the base technique pool. The base experience can **cite** where a superpower card would apply and **invite** the player to acquire that superpower's deck; the card content stays gated to owners.

Superpowers were deliberately moved out of the book as an orienting device, so they belong in an expansion layer, not the core. This keeps the base deck at a clean 120 and turns each superpower into its own product.

**Problem**: The loadout overlay (inner = self-defense, outer = help-others) has no class content, and the previous draft of this spec wrongly proposed merging a 13-move sampler into the base pool. The right model is a separate, complete, ownable deck per superpower that parallels the base deck and is consulted alongside it.

**Practice**: Deftness Development — deterministic grid structure, content generated then human-curated, assembled to its own artifact per pack. No change to the base deck, the `Technique` schema, the resolver, or the validator.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Deck shape (per superpower)** | A complete grid: **`BasicMove (5) × Operation (6) × aspect (2) = 60 cards`.** Each card is one (move, level, inner/outer) cell. Six superpowers × 60 = **360 superpower cards total**, in six separate packs. |
| **Domain is collapsed** | Superpower cards are **domain-agnostic** (`domains: []`). One superpower card at (move, level, aspect) applies across all four domain columns of the matching base card — which is why it's 60, not 240. |
| **Aspect is per-card** | Unlike base cards (where inner/outer is a consult toggle), each superpower card is fixed to one aspect: 30 inner + 30 outer. The inner cards are the superpower's self-defense repertoire; the outer cards are its help-others repertoire — directly feeding the two loadout slots. |
| **NOT in the base deck or base pool** | Superpower decks are **never** added to `allyship-deck.json` (stays 120) nor merged into `CANONICAL_TECHNIQUES` (stays base-only: substrate + operation techniques). They assemble to their own artifacts and their own pools. |
| **Pools + ownership** | The resolver already takes a `pool` argument. Base play uses the base pool. A player who **owns** a superpower deck composes `base + ownedPack(s)` into the pool. Unowned packs are never in the pool. |
| **Cite + invite (free), content gated (owned)** | Because every superpower deck is a *complete* grid, the existence of a card at any (move, level, aspect) is guaranteed without owning it. So the base experience can always cite "your active superpower has a move here" and invite acquisition; only the card's content (name/essence/steps) is gated to owners. |
| **Reuse `Technique`, no schema change** | A superpower card is a `Technique` tagged `superpowers:[<sp>]`, `moves:[<one>]`, `operations:[<one>]`, `aspect:'inner'|'outer'`, `domains:[]`. The resolver/validator handle it unchanged. The "deck/pack" is a packaging + pool concept, not a new entity. |
| **Channels** | Channel-agnostic by default (`channels: []`); tag a channel only where a specific cell is intrinsically one (rare). |
| **Provenance / lifecycle** | No per-superpower content exists in the manuscript (the book is organized by operation), so content is **generated** (`source.origin:'ai'`) then curated to `status:'published'`. Drafts are inert (never in any pool) until promoted. |
| **Alchemist** | Still special (it is the base substrate). Its expansion deck is optional/thin: the base substrate already gives every player Alchemy. If an Alchemist pack ships, it follows the same 60-grid but may largely re-skin substrate tools. Flag as open question. |

## Conceptual Model

```
BASE PRODUCT                              EXPANSION PRODUCTS (one per superpower)
┌─────────────────────────────┐          ┌───────────────────────────────────────┐
│ Allyship Deck — 120 cards    │          │ Connector Deck — 60 cards             │
│ move × operation × domain    │  cite +  │ move × operation × aspect             │
│ + base technique pool        │  invite  │ (5 × 6 × 2), domain-agnostic         │
└─────────────────────────────┘  ───────▶ └───────────────────────────────────────┘
        ▲                                            ▲
        │ draw a base card (m, o, d), read as self/other → aspect a
        │                                            │
        └─ if player owns the active superpower's deck, consult its (m, o, a) card
           else: cite that a card exists there + invite them to get the deck
```

Resolution coordinate: a base card `(move m, operation o, domain d)` read in `subject` → `aspect a`. The active loadout slot's superpower deck has exactly **one** card at `(m, o, a)`. That is the consult.

## Card Grid (per superpower)

| Axis | Values | Count |
|------|--------|-------|
| BasicMove | wake_up, open_up, clean_up, grow_up, show_up | 5 |
| Operation (level) | shaman, challenger, regent, architect, diplomat, sage | 6 |
| Aspect | inner, outer | 2 |
| **Total** | | **60** |

Card id convention: `sp-<superpower>-<MOVE>-<OP>-<ASPECT>` (e.g. `sp-connector-OPEN-DIPLOMAT-OUTER`).

## API / Data Contracts

No new types; superpower cards are `Technique`s. New packaging + pool helpers:

```ts
// src/lib/technique-library/superpowers/index.ts
export const SUPERPOWER_DECKS: Record<Superpower, Technique[]>   // each length 60 (published)
export function superpowerDeck(sp: Superpower): Technique[]

// Pool composition — base stays base; owners add packs explicitly.
export function poolWithSuperpowers(
  base: readonly Technique[],
  owned: readonly Superpower[],
): Technique[]

// Cite + invite (works without owning content — existence is guaranteed by the full grid)
export interface SuperpowerCitation {
  superpower: Superpower
  move: BasicMove
  operation: Operation
  aspect: MoveAspect
  owned: boolean
  cardId: string          // deterministic coordinate id
}
export function citeSuperpowerMove(
  card: Pick<MoveCard,'move'|'operation'>,
  loadout: Loadout,
  subject: Subject,
  owned: readonly Superpower[],
): SuperpowerCitation       // always resolvable; `owned` flags gate on content
```

Base resolution is unchanged: `CANONICAL_TECHNIQUES` excludes superpower cards. A player consulting with packs calls `resolveTechniques(card, loadout, subject, poolWithSuperpowers(CANONICAL_TECHNIQUES, owned))`.

Each pack also assembles to its own static artifact `public/superpower-decks/<superpower>.json` (parallel to `allyship-deck.json`), so packs are independently shippable / printable.

## Worked Example — The Connector grid

The 60 cells are (move × level × aspect). A few sample cells to show the pattern (content is `origin:'ai'`, `status:'draft'` until curated):

| move | level | inner card | outer card |
|------|-------|-----------|-----------|
| wake_up | shaman | *Sense Your Own Pull* — notice who you instinctively orbit toward | *Sense the Thread* — feel the unspoken relational charge in the room |
| open_up | diplomat | *Receive Without Absorbing* — feel the field without taking it on | *Hold the Space Between Camps* — stay present in the gap between groups |
| clean_up | challenger | *Clear Your Need to Be the Hub* — metabolize the urge to be central | *Name the Distance* — say the disconnection no one names |
| grow_up | architect | *Widen Your Own Capacity* — hold more ties without bottlenecking | *Design the Network* — build connection that doesn't depend on you |
| show_up | regent | *Tend Your Own Ties* — keep your own relationships alive over time | *Precision Introduction* — link two people with a reason, then step back |

…and so on for all 30 inner + 30 outer cells. The remaining superpowers (Strategist, Escape Artist, Disruptor, Storyteller, and optionally Alchemist) follow the identical 60-cell grid, generated from each superpower's profile (gift/shadow) crossed with the move and level registers.

## Generation Method

For each superpower, generate 60 cells deterministically from three sources:
1. **The MTGOA superpower profile** (gift, shadow, inner/outer character) — sets voice and the inner-vs-outer split.
2. **The level register** (the operation chapters ch1–7) — the column flavor (shaman = sensing, challenger = boundary/naming, regent = stewarding, architect = structure, diplomat = bridging, sage = whole-board).
3. **The move purpose** (the base deck's WAVE grammar) — the row verb (wake = notice, open = receive, clean = transform, grow = develop, show = act).

Each cell: imperative **name**, one-line **essence**, 2–4 **steps**, fixed tags `{superpowers:[sp], moves:[m], operations:[o], aspect:a, domains:[], channels:[]}`, plus a **shadow check**. Output `Technique` objects; never invent vocabulary values.

## User Stories

### P1: Owned pack enriches play
**As a player who owns the Connector deck with `outer: connector`**, drawing a base card and reading it as "them" surfaces the Connector card at that (move, level, outer) coordinate alongside the base techniques.
**Acceptance**: `resolveTechniques(card, loadout, 'other', poolWithSuperpowers(CANONICAL_TECHNIQUES, ['connector']))` returns the matching Connector card with `viaSlot:'outer'`; with `owned: []` it does not.

### P2: Unowned pack cites + invites
**As a player without the deck**, the base experience tells me a Connector move exists at this coordinate and invites me to get the Connector deck — without revealing the card content.
**Acceptance**: `citeSuperpowerMove(card, loadout, subject, [])` returns `{ superpower, move, operation, aspect, owned:false, cardId }`; content is not included.

### P3: Base deck stays clean
**As a maintainer**, the base deck and base pool are unchanged by this feature.
**Acceptance**: `allyship-deck.json` count stays 120; `CANONICAL_TECHNIQUES` contains zero `superpowers`-tagged cards; a test asserts both.

## Functional Requirements

### Phase 1 — Structure + profiles + helpers
- **FR1**: `superpowers/profiles.ts` — `SUPERPOWER_PROFILES` (gift/shadow/inner-character/outer-character) for all six.
- **FR2**: Grid builder + id convention `sp-<sp>-<MOVE>-<OP>-<ASPECT>`; a structural test asserts each deck is exactly 60 cells covering every (move × operation × aspect).
- **FR3**: `poolWithSuperpowers` + `citeSuperpowerMove` (pure); base pool untouched.

### Phase 2 — Generate + author decks (draft)
- **FR4**: Generate the five non-Alchemist decks (60 each) per the Generation Method, `origin:'ai'`, `status:'draft'`.
- **FR5**: Decide Alchemist's pack (open question) — ship a 60-grid or document why it re-skins the substrate.
- **FR6**: Every card passes `validateTechnique`.

### Phase 3 — Assemble, verify, isolate
- **FR7**: Assemble each pack to `public/superpower-decks/<sp>.json` (own artifact).
- **FR8**: Tests: 60-cell completeness per deck; base deck still 120; base pool has no superpower cards; `citeSuperpowerMove` always resolvable; owned-vs-unowned resolution differs.

### Phase 4 — Promotion + product wiring (later)
- **FR9**: Author promotes `draft → published` per deck.
- **FR10**: Ownership/entitlement source (which packs a player owns) — defer to the product/entitlement layer; this spec only consumes an `owned: Superpower[]`.

## Non-Functional Requirements
- Base deck/pool unchanged; additive and isolated.
- Deterministic resolution + citation; no AI in the play path.
- Drafts inert (never pooled) until published; packs ship independently.

## Verification Quest
Deferred — no user-facing surface yet. Verification = per-deck 60-cell completeness tests + base-isolation tests + citation tests. Required once a pack-aware draw UI or store/entitlement surface is specced.

## Dependencies
- `allyship-technique-vocabulary` — `Technique`, `Superpower`, `Loadout`, `resolveTechniques`, `validateTechnique`.
- `allyship-deck` — base 120 cards + move/operation grammar (the coordinates packs align to).
- `superpower-move-extensions` — the six superpowers (reconcile keys).
- `inner-outer-allyship-moves` — the inner/outer aspect.

## References
- `src/lib/technique-library/` (vocabulary, types, resolve, validate, canonical, canonical-operations)
- `public/allyship-deck/allyship-deck.json` + `scripts/assemble-allyship-deck.ts` (assembly pattern to mirror)
- MTGOA Part III "The Superpowers" (profiles); chapters ch1–7 (level registers)
- `.specify/specs/allyship-technique-vocabulary/spec.md`
