# Spec: BAR intake record and polarity decks

**Spec ID:** BIPD
**Status:** draft (design ruled; build not started)
**Related:** [`world-map-campaign-deck-portals`](../world-map-campaign-deck-portals/spec.md), the council's world map
spec kit (wendell-britt/six-faces-council #1446, `.specify/specs/worldmap/`, FR-006), the council pass
`pass-bar-decks-2` (sealed in the board store), the Between's two-move card (`public/between/iching/two-move.js`).

---

## Problem

Wendell, 2026-11-15: each polarity produces a deck, and a deck is a set of available BAR prompts. That is what connects
an I Ching draw to the worldbuilding system and lets an oracle procedurally determine the story graph.

A BAR (`CustomBar`) already holds its hexagram, face, move, garden and emotional alchemy triad. It cannot hold which world
and level it belongs to, which polarity and quadrant it speaks from, which pole it leans toward, which holder it touches,
or which of its answers are confirmed, drafted or open. No deck kind deals from a polarity, and no dealer turns a cast
into a polarity card.

## His rulings this spec builds on (Council Board, answered 2026-11-16)

| Row | Answer | What it means here |
|---|---|---|
| bar-decks-q1 | A | A holder's deck is 4 quadrant pairs x 2 poles x 4 moves = 32 cards, no wild card. Only the Challenger's Shielding pole is playable first. |
| bar-decks-q2 | B | A changing line 5 or 6 recasts until the ladder-loop ruling (Calrunia turn 18). |
| bar-decks-q3 | C, "2 other high Level non elder NPCs" | Thunder and Water are held by two high-level NPCs who are not Elders. Names are open (row bar-decks-holders-1). |
| bar-decks-q4 | B, "Merge the pairs" | The Between's trigram pairs and Calrunia's pairs live in one table. |
| bar-decks-q5 | C, "Playtesters tend it too" | Playtesters tend the designer's garden too. What they may change is open (row bar-decks-garden-1). |

## Open rows that gate parts of the build

- **bar-decks-pole-1** gates the dealer's pole rule (FR-008). The council's Skeptic found that reading the pole from the
  changing line's own value fixes the pole for a given deck and line: Fire is yang, yin, yang from the bottom, so the
  Challenger's line 2 only ever deals Shielding, line 1 only Daring, line 3 only Glory. Shielding then comes up in 3 of
  128 raw casts (2.3%, about one in 43). Options on the row: A read the pole from the paired line in the other trigram
  (recommended), B keep fixed poles per deck, C the pole follows the player's own round on the pair.
- **bar-decks-wording-1** gates the merged table's display names (FR-005).
- **bar-decks-garden-1** gates the garden's playtester permissions beyond the floor in FR-012.
- **bar-decks-holders-1** gates the names of the Thunder and Water holders (data only; the table carries placeholders).
- **bar-decks-shielding-look-1** gates the sealed-card hand's look (FR-010).

---

## Functional requirements

### The record

- **FR-001** `CustomBar` gains one nullable JSON column, `intakeRecord Json?`, in the pattern of `promiseMove` and
  `seedMetabolization`. One migration, no new table. `hexagramId` keeps the primary hexagram so existing I Ching code
  still reads it.
- **FR-002** Shape (TypeScript type `IntakeRecord` in `src/lib/intake/record.ts`):

  ```ts
  type Door = 'chat' | 'board' | 'garden' | 'map' | 'floor'
  type ItemState = 'confirmed' | 'draft' | 'open' | 'composted'
  type Level = 'world' | 'campaign' | 'adventure' | 'encounter' | 'asset' | 'inspiration'
  type Move = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
  interface IntakeItem {
    slot: string            // e.g. 'lean', 'world', 'polarity'
    words: string           // the speaker's words, verbatim, never rewritten
    state: ItemState
    door: Door              // stamped by the writer, never by the caller
    at: string              // ISO time, stamped by the writer
    by?: string             // player id of the speaker
    carriedTo?: Level       // set when an item is carried one rung up (world map FR-009)
  }
  interface IntakeRecord {
    world: string           // 'calrunia'
    level: Level
    polarity?: { holder: string; quadrant: 'I' | 'It' | 'We' | 'Its'; poles: [string, string] }
    lean?: string           // the pole leaned toward
    touches?: string[]      // holders the act lands on (the upper trigram)
    move?: Move             // where this player's round on this pair stands
    draw?: { hexagram: number; changing: number[]; becomes: number | null; seed?: string }
    prompt?: { deck: string; card: string; sealed?: boolean }
    items: IntakeItem[]
  }
  ```

  The door values `map` and `floor`, the item state `composted` and the `carriedTo` field are the world map spec's
  FR-006, carried here so the two specs share one shape.
- **FR-003** One writer: `writeIntakeToBar(barId, patch, { door, by })` in `src/lib/intake/write.ts` merges a patch
  into `intakeRecord`, stamps each new item with its door and time, and appends rather than overwrites items. Every
  door calls it, and nothing else writes the column (a test greps for other writes). It refuses a patch that rewrites
  an existing item's `words`, and it refuses a garden-door patch that breaks FR-012.
- **FR-004** The polarity tables stay out of the BAR. The record names a holder and a quadrant; the lookup file holds
  what they mean.

### The merged pair table

- **FR-005** One file, `src/lib/polarity/pair-table.ts`, keyed by trigram. Each row holds the Between's pair (today in
  `two-move.js` `PAIRS` and `TRIGRAM_RELATIONAL_PAIR2`), the holder, the holder's favoured pole, and the holder's four
  quadrant pairs. `PAIRS` and `TRIGRAM_RELATIONAL_PAIR2` are derived from it or checked against it; the existing test
  `src/lib/between/__tests__/two-move.test.ts` keeps working. Seats: Earth Shaman, Fire Challenger, Lake Regent, Heaven
  Architect, Wind Diplomat, Mountain Sage, Thunder and Water an unnamed high-level NPC each. Where the Between's pair and
  the holder's pair differ (Fire: Clarify/Tact against Sparring/Shielding), the row keeps both until
  bar-decks-wording-1 is ruled; the build displays the holder's pair inside Calrunia and the Between's pair in the
  Between.
- **FR-006** Only the Challenger's four pairs are filled in the first build: I Daring/Guarding, It Sparring/Shielding,
  We Glory/Comradeship, Its Challenge ladder/Shield wall, favoured pole Ascent (Sparring side). Other holders' pairs come
  from `/mnt/project-files/chronicler-ladder/calrunia-polarity/state.json` as they are confirmed.

### The deck and the dealer

- **FR-007** `DeckType` gains `POLARITY`. A polarity deck is a `BarDeck` with 32 `BarDeckCard` rows: suit = quadrant,
  each pole one card per move (ranks map to moves through `src/lib/prompt-deck/rank-move-map.ts`). Each card carries
  `live: boolean` (or the equivalent field on the card's metadata). The Challenger's deck seeds with the 4 Shielding
  cards live and 28 sealed. Grow Up cards credit a named therapy or personal development book in fresh words; the book
  is still to pick, and the seed carries `(book to name)` until it is.
- **FR-008** A pure dealer, `dealPolarityCard(cast, record, table)` in `src/lib/polarity/deal.ts`, no I/O and no model:
  - the lower trigram picks the live deck; the upper trigram fills `touches`;
  - the lowest changing line 1 to 4 picks the suit (1 I, 2 It, 3 We, 4 Its);
  - a changing line 5 or 6 as the lowest changing line means recast (q2 B), with no cap needed (13.8% of casts, mean
    1.16 casts per deal);
  - no changing line deals the holder's favoured pole at Wake Up;
  - the pole comes from one function, `poleFor(cast, line)`, whose rule waits on bar-decks-pole-1. The build ships the
    function with the ruled rule only, never a toggle left for the player;
  - the move is the player's own round on that pair (`record.move`, Wake Up when none);
  - `becomes` is the hexagram after the changing lines flip, which picks the next deck.
- **FR-009** Fixed-seed tests in `src/lib/polarity/__tests__/deal.test.ts`: hexagram 49 (Fire below, Lake above, lines
  1 0 1 1 1 0) with line 2 changing deals from the Challenger deck, It suit, touches the Regent, and becomes 43; its pole
  under the ruled rule (Shielding under the fixed rule, Sparring under option A, since line 5 of 49 is yang); a lowest
  change on line 5 or 6 recasts; a no-change cast on Fire deals Sparring Wake Up, which is sealed and redirects
  (FR-010). An enumeration test over all 4,096 line-value combinations reports the Shielding rate, so the rate the
  Skeptic computed by hand is checked in code.

### The hand

- **FR-010** Every cast ends with a card the player can act on today. A dealt card that is not live (another suit,
  the Sparring pole, another holder's deck) shows face up as sealed, with its real title and its holder's mark, and
  goes into the hand. The same cast deals the live Shielding card at the player's current move, with one plain line:
  "Sparring waits. Shielding is yours now." No surface says "unavailable", and the sealed card never blocks the live
  one. The look is bar-decks-shielding-look-1 (picture: `/mnt/project-files/looks/bar-decks-shielding-1/shielding-wake-up.png`).
- **FR-011** The BAR comes from the player's capture of the act, never from the card. When the player keeps it, the
  writer records world, level `encounter`, polarity, lean, touches, move, draw and prompt, and the player's words as a
  draft item until kept. A kept BAR moves the holder's needle one notch toward the leaned pole (one quest moves the
  needle; swaying an Elder takes many).

### The doors

- **FR-012** Garden door: a view of every BAR whose record names a world at the designer levels (world, campaign,
  adventure), scoped to the designer, reading `intakeRecord`. Playtesters see it and tend it (q5 C). Until
  bar-decks-garden-1 is ruled, a playtester may plant their own BARs and confirm or compost their own items; they may
  not edit anyone's verbatim words, change world, level, polarity or lean, move a needle, or confirm a designer's draft.
- **FR-013** Board door: one question at a time by card-turn (`canon/mechanics/card-turn.yaml` in the council repo): a
  pencilled draft drawn from the pair table, kept with one tap or rewritten, written through the writer with door
  `board`. Never a form and never more than one question on screen.
- **FR-014** Chat door: an MCP tool on `/api/mcp` that calls the writer with door `chat`. Map and floor doors belong to
  the world map spec and call the same writer.

## Non-goals

Lines 5 and 6 reaching inherited pairs (waits on the ladder-loop ruling); any holder's deck beyond the Challenger's;
the NPC holders' names; the map surface itself; any AI step in dealing.

## Not checked

No code ran. The odds are the Skeptic's hand enumeration, not a run. The Grow Up book is unnamed. The other holders'
pairs and the eight downsides are still drafts in state.json.

Next owner + wake: a Sonnet thread builds Phase 1 and 2 after this kit merges in the daily ship; Phase 3 waits on
bar-decks-pole-1 and Phase 4's look on bar-decks-shielding-look-1, each woken by his board answer.
