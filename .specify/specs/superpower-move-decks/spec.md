# Spec: Superpower Move Decks

## Purpose

Give each of the six Superpowers its own deck of named moves, so the 2-slot inner/outer loadout becomes functional and **every** card in the Allyship Deck gets a class-specific reading. Today the technique library covers all 120 cards on the move × operation axis (the Tier-1 alchemy substrate + 30 operation practices), but the **WHO axis is empty** — a player who picks `inner: escape_artist / outer: connector` currently surfaces nothing superpower-specific. This spec fills that.

A Superpower move is **not a new entity** — it is a `Technique` (from `allyship-technique-vocabulary`) tagged `superpowers: ['<superpower>']`. So this spec is mostly **content generation** plus a small structural contract for how each superpower's deck is shaped and how it overlays the cards.

**Problem**: The loadout overlay was designed (inner = self-defense, outer = help-others, bound to the card subject toggle) but has no class moves to surface. Without superpower decks, the overlay is inert and the deck isn't replayable by class.

**Practice**: Deftness Development — spec kit first, deterministic structure over AI, content drafted with AI assistance then human-curated to canonical. The resolver and schema already exist and need no changes; this is additive data.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Deck shape (per superpower)** | Honor the proposed three-part structure: **5 Basic Moves** (the superpower's version of Wake/Open/Clean/Grow/Show), **6 Altitude Moves** (one per level Shaman→Sage, the book's "Ladder"), and **2 Signature Moves** (one inner, one outer — the anchors that define the superpower in each loadout slot). **= 13 moves per superpower × 6 = 78 total.** |
| **No new schema** | A superpower move is a `Technique` with `superpowers: ['connector']` etc. Reuse the existing type, validator, and resolver unchanged. |
| **Coverage by wildcard tagging** | Basic moves use `moves:[<one>], operations:[]` → match their move-row at any altitude. Altitude moves use `moves:[], operations:[<one>]` → match their operation-column at any move. Signatures use `moves:[], operations:[], aspect:inner\|outer` → the default the superpower brings to that slot. Result: every card surfaces ≥2 class moves for the active-slot superpower (its basic move for that row + its altitude move for that column), plus the slot signature. |
| **Aspect** | Basic + altitude moves are `aspect: 'both'` (they apply whether the card is read as self or other). The 2 signatures are the only `aspect: 'inner'` / `aspect: 'outer'` moves and are what make the inner-slot vs outer-slot distinction meaningful. |
| **Channels stay agnostic** | Per the author's decision, superpowers are channel-agnostic: `channels: []` unless a specific move is intrinsically one channel (e.g. a Disruptor confrontation move = fire). |
| **Domains stay agnostic** | `domains: []` — a class move applies across all four domain columns (the domain changes the example, not the move). |
| **Alchemist = the substrate** | Alchemist is the universal substrate already seeded in `canonical.ts` (12 Tier-1 tools tagged `alchemist`). Its "deck" is mostly those tools; Alchemist needs only its **2 signatures** + any altitude-specific transmutations not already covered. So Alchemist contributes fewer net-new moves (~2–6) than the other five (13 each). |
| **Provenance / lifecycle** | This manuscript draft has **no per-superpower chapters** (the book is organized by operation). So superpower-specific content is **derived**, not transcribed: `source.origin: 'ai'` for generated drafts, promoted to authored canonical by the author. Lifecycle: `status: 'draft'` (generated) → `'candidate'` (reviewed) → `'published'` (canonical). Only `published` enters the default resolver pool. |
| **Generation, then curation** | The 78 moves are drafted by a structured generation pass (method below) from (a) the MTGOA superpower profiles, (b) the operation chapters, and (c) the deck grammar — then human-curated. Deterministic structure (13 slots per superpower) + generated content. |

## Conceptual Model

Superpowers are the **WHO** (method of impact) overlaid on the existing card grid:

```
Card (move × operation × domain)  ── read in subject (self|other) ──▶ active loadout slot (inner|outer)
                                                                          │
                                              active slot's Superpower ───┤
                                                                          ▼
   resolveTechniques surfaces, for that superpower:
     • its Basic Move for the card's MOVE row        (moves:[move],  operations:[])
     • its Altitude Move for the card's OPERATION col (moves:[],     operations:[op])
     • its Signature for the active ASPECT            (aspect:inner|outer)
   …on top of the universal Alchemy substrate (always present).
```

The six superpowers (MTGOA), channel-agnostic, each with a gift, a burden/shadow, and inner+outer signatures:

| Superpower | Gift (method of impact) | Shadow (overuse) | Inner signature (self-defense) | Outer signature (help others) |
|---|---|---|---|---|
| **Strategist** | Clarity in complexity; cartographer of chaos; sees pattern, bottleneck, sequence | The Detached Planner (maps instead of acts) | Find the Next Right Step (cut overwhelm to one move) | Show the Map (make the path legible to others) |
| **Connector** | Relational gravity; pulls people into each other's orbits | The Overextended Hub (everything routes through you) | Hold Your Center in the Web (stay a self while connected) | Precision Introduction (link two people with a reason) |
| **Escape Artist** | Honors the wisdom of fear; finds exits, trapdoors, the well-timed retreat | The Perpetual Vanisher (leaves before it's time) | Name the Real Exit (distinguish wise retreat from flight) | Open a Door for Someone (create a way out for another) |
| **Disruptor** | Interruption; breaks stagnation; integrity over harmony | The Demolisher (rupture with no repair) | Aim the Anger (forge heat into a clean target) | Break the Pattern, Then Repair (interrupt + reconnect) |
| **Alchemist** | Turns heavy/messy emotion into fuel; transmutation | The Sponge / the Detached Observer | Emotional Filtration ("Is this mine to hold?") | Hold Space for Transmutation (let others' charge move) |
| **Storyteller** | Poignance; weaves loss into meaning; grief into belonging | The Performer (spectacle over truth) | Find Your Own Meaning First (metabolize before narrating) | Name What This Means (give the room a story to hold) |

## Deck Structure (the contract)

Each superpower deck is exactly:

1. **Basic Moves (5)** — one per `BasicMove`. Tag: `moves: [<move>]`, `operations: []`, `aspect: 'both'`, `superpowers: [<sp>]`.
2. **Altitude Moves (6)** — one per `Operation`. Tag: `moves: []`, `operations: [<op>]`, `aspect: 'both'`, `superpowers: [<sp>]`.
3. **Signature Moves (2)** — inner + outer. Tag: `moves: []`, `operations: []`, `aspect: 'inner' | 'outer'`, `superpowers: [<sp>]`.

(Alchemist: items 1–2 are largely satisfied by the existing substrate; author only the deltas + the 2 signatures.)

## Worked Example — The Connector (all 13)

So we can see "what the superpower moves might be." (Draft content; `source.origin: 'ai'`, `status: 'draft'` until curated.)

**Basic Moves (WAVE):**
1. **Map the Human Terrain** *(wake_up)* — notice who's connected to whom, who's isolated, where trust already flows.
2. **Receive the Room** *(open_up)* — feel the relational field before you try to link anyone.
3. **Clear Your Agenda** *(clean_up)* — metabolize your need to be the hub so the connection serves them, not you.
4. **Widen the Web** *(grow_up)* — build capacity to hold more relationships without becoming the bottleneck.
5. **Make the Link** *(show_up)* — take the concrete connecting act: the intro, the invite, the gathering.

**Altitude Moves (Shaman→Sage):**
6. **Sense the Thread** *(shaman)* — feel the unspoken relational charge in the room.
7. **Name the Distance** *(challenger)* — say out loud the disconnection no one is naming.
8. **Tend the Ties** *(regent)* — steward the relationships you've already made, over time.
9. **Design the Network** *(architect)* — build structure so connection doesn't depend on you.
10. **Bridge the Camps** *(diplomat)* — translate across groups that can't yet hear each other.
11. **Hold the Whole Web** *(sage)* — see the entire relational field and where it wants to move.

**Signatures:**
12. **Hold Your Center in the Web** *(inner)* — when everyone's needs pull at you, stay a self; choose which ties are yours to hold.
13. **Precision Introduction** *(outer)* — connect two people with a clear reason and a warm handoff, then step back.

## Data / API Contracts

No new types. Superpower decks are `Technique[]` files under `src/lib/technique-library/superpowers/<superpower>.ts`, each exporting e.g. `CONNECTOR_MOVES: Technique[]`. A small profile constant adds the descriptive layer:

```ts
// src/lib/technique-library/superpowers/profiles.ts
export interface SuperpowerProfile {
  key: Superpower
  label: string
  gift: string
  shadow: string
  innerSignature: string   // name of the inner signature move
  outerSignature: string   // name of the outer signature move
}
export const SUPERPOWER_PROFILES: Record<Superpower, SuperpowerProfile>
```

All decks aggregate into `SUPERPOWER_TECHNIQUES: Technique[]`, merged into `CANONICAL_TECHNIQUES` (only `status: 'published'` entries) in `canonical.ts`.

## User Stories

### P1: The loadout finally does something
**As a player with `inner: escape_artist / outer: connector`**, when I read a card as "them", I see Connector moves; as "me", I see Escape-Artist moves — different repertoire, same card.
**Acceptance**: `resolveTechniques(card, loadout, 'other')` returns Connector-tagged moves with `viaSlot: 'outer'`; `'self'` returns Escape-Artist moves with `viaSlot: 'inner'`; alchemy substrate appears in both.

### P2: Every card has a class reading
**As any player**, every one of the 120 cards surfaces at least one move from each of my two superpowers.
**Acceptance**: a per-superpower coverage report shows 120/120 for each of the six superpowers.

### P3: Generation is curatable
**As the author**, generated superpower moves arrive as `status: 'draft'` and do not enter play until I promote them to `published`.
**Acceptance**: the default resolver pool excludes non-`published` techniques; a draft deck can be reviewed before promotion.

## Functional Requirements

### Phase 1 — Structure + profiles
- **FR1**: `superpowers/profiles.ts` — `SuperpowerProfile` + `SUPERPOWER_PROFILES` for all six (gift/shadow/signatures per the table).
- **FR2**: A `buildSuperpowerDeck` helper or convention so each deck file declares exactly 5 basic + 6 altitude + 2 signature slots (a structural test asserts the shape).

### Phase 2 — Generate + author the decks
- **FR3**: Author the five non-Alchemist decks (Strategist, Connector, Escape Artist, Disruptor, Storyteller) — 13 moves each — via the generation method below, `source.origin: 'ai'`, `status: 'draft'`.
- **FR4**: Author the Alchemist deltas + 2 signatures (it inherits the substrate).
- **FR5**: Every generated move passes `validateTechnique`.

### Phase 3 — Aggregate, cover, verify
- **FR6**: `superpowers/index.ts` exports `SUPERPOWER_TECHNIQUES`; merge `published` ones into `CANONICAL_TECHNIQUES`.
- **FR7**: Extend `scripts/technique-coverage.ts` (or add `superpower-coverage.ts`) to report per-superpower card coverage; expect 120/120 each once published.
- **FR8**: A structural unit test: each superpower deck has the 13 slots (or Alchemist's documented subset), correct tags, and valid content.

### Phase 4 — Promotion (author-gated, later)
- **FR9**: Author reviews drafts and flips `status` to `published` per move/deck; only then do they enter the resolver pool.

## Generation Method (the "generate" part)

For each superpower, draft its 13 moves deterministically from three sources:
1. **The MTGOA superpower profile** (gift, shadow, signatures) → sets voice and the 2 signatures.
2. **The operation chapters** (ch1–7) → the 6 altitude moves are that superpower's expression *at* each mentor-world (e.g. Connector-at-Challenger = "Name the Distance", echoing the Challenger chapter's naming/boundary register through a relational lens).
3. **The deck grammar** (the 5 BasicMoves' purposes + the submove questions) → the 5 basic moves are the superpower's verb for each WAVE phase.

Constraints per generated move: a short imperative **name**, a one-line **essence**, 2–4 concrete **steps**, correct tags per the deck-structure contract, and a **shadow check** (what this move looks like when overused — drawn from the superpower's shadow). Output as `Technique` objects; never invent new vocabulary values.

## Non-Functional Requirements
- Additive only; no change to the resolver, validator, or schema.
- Deterministic resolution preserved (no AI in the play path; AI only assists authoring).
- Drafts are inert until `published` (safe to land incrementally).

## Verification Quest
Deferred — no user-facing surface yet (same posture as `allyship-technique-vocabulary`). Verification = the per-superpower coverage report + structural/validation unit tests. A Verification Quest becomes required when a loadout-picker or draw UI is specced.

## Dependencies
- `allyship-technique-vocabulary` — `Technique`, `Superpower`, `Loadout`, `resolveTechniques`, `validateTechnique` (all exist).
- `allyship-deck` — the 120 cards + move/operation grammar.
- `superpower-move-extensions` — the six superpowers + archetype compatibility (reconcile naming; this spec makes the moves concrete and channel-agnostic).
- `inner-outer-allyship-moves` — the inner/outer aspect the signatures key on.

## References
- `src/lib/technique-library/` (vocabulary, types, resolve, validate, canonical, canonical-operations)
- MTGOA: Part III "The Superpowers" (profiles); chapters ch1–7 (operation registers for altitude moves)
- `.specify/specs/allyship-technique-vocabulary/spec.md`
