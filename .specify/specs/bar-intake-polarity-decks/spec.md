# Spec: BAR intake record and polarity decks

**Spec ID:** BIPD
**Status:** draft (design ruled, all five decks rows answered; build not started)
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
| bar-decks-q3 | C, "2 other high Level non elder NPCs" | Thunder and Water are held by two high-level NPCs who are not Elders. |
| bar-decks-q4 | B, "Merge the pairs" | The Between's trigram pairs and Calrunia's pairs live in one table. |
| bar-decks-q5 | C, "Playtesters tend it too" | Playtesters tend the designer's garden too. |
| bar-decks-pole-1 | C, "Follow the player's round" | The pole a card shows follows where the player stands on that pair, never the coins (FR-008). |
| bar-decks-holders-1 | A, "Lieutenant and envoy" | Thunder is the first of the thirty lieutenants, who runs the trials. Water is the Earth sect's envoy who lives at Heaven. |
| bar-decks-wording-1 | C, "Both stay, one row" | Each trigram row keeps its Between name and its holder's Calrunia name (FR-005). |
| bar-decks-garden-1 | A, "Own BARs, plus a mark" | Playtesters plant their own BARs, confirm or compost their own items, and mark his drafts "I saw this" (FR-012). |

## Open rows that gate parts of the build

- **bar-decks-shielding-look-1** gates the sealed-card hand's look (FR-010).
- **bar-decks-unseal-1** (posted with this change) gates when a sealed pole becomes playable (FR-008, FR-010); the
  dealer ships without it, with every pole but Shielding sealed.

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
  Architect, Wind Diplomat, Mountain Sage; Thunder is the first of the thirty lieutenants, who runs the trials; Water
  is the Earth sect's envoy who lives at Heaven (bar-decks-holders-1 A). Their personal names are not ruled: the table
  carries the role as the display name, and a name is a data edit when he gives one. Where the Between's pair and the
  holder's pair differ (Fire: Clarify/Tact against Sparring/Shielding), the row keeps both names (bar-decks-wording-1
  C): `betweenName` and `holderName` on the same row. The build shows the holder's name inside Calrunia and the
  Between's name in the Between. Nothing is rewritten or renamed, and the Between's 16 stock lines stay as they are.
- **FR-006** Only the Challenger's four pairs are filled in the first build: I Daring/Guarding, It Sparring/Shielding,
  We Glory/Comradeship, Its Challenge ladder/Shield wall, favoured pole Ascent (Sparring side). Each pair also carries `openPole`, the pole a player stands on before any round
  there: Guarding, Shielding, Comradeship, Shield wall, the pole opposite the favoured side, which is why Shielding is
  the first live one. Other holders' pairs come
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
  - no changing line deals the suit of the pair the player last stood on in that deck (It on a first cast), because the
    coins give no line to read;
  - the pole is the player's standing on that pair, never the coins (bar-decks-pole-1 C). One function,
    `standingFor(player, holder, quadrant)` in `src/lib/polarity/standing.ts`, returns `{ pole, move }` from the
    player's own kept BARs: the latest kept BAR whose record names that holder and quadrant gives its `lean` and
    `move`; with none, the pair's `openPole` at Wake Up. It adds no column and the player cannot set it from a menu: only
    a BAR the player keeps changes it. The cast picks the deck, `touches` and the suit; the standing picks pole and move;
  - the move is the standing's move;
  - `becomes` is the hexagram after the changing lines flip, which picks the next deck.
- **FR-009** Fixed-seed tests in `src/lib/polarity/__tests__/deal.test.ts`: hexagram 49 (Fire below, Lake above, lines
  1 0 1 1 1 0) with line 2 changing deals from the Challenger deck, It suit, touches the Regent, and becomes 43; its pole
  is Shielding for a player with no kept BAR on that pair and Sparring for one whose latest kept BAR leans Sparring,
  whatever the line's value; a lowest change on line 5 or 6 recasts; a no-change cast deals the standing pair's card at
  the standing move. An enumeration test over all 4^6 line-value combinations weighted 1/8, 3/8, 3/8, 1/8 for values
  6, 7, 8, 9 reports the odds in "Dealer odds" below, so the figures are checked in code.

### The hand

- **FR-010** Every cast ends with a card the player can act on today. A dealt card that is not live (another suit,
  a pole the player does not stand on yet, another holder's deck) shows face up as sealed, with its real title and its holder's mark, and
  goes into the hand. The same cast deals the live Shielding card at the player's current move, with one plain line:
  "Sparring waits. Shielding is yours now." No surface says "unavailable", and the sealed card never blocks the live
  one. Because the live card comes with every cast, the odds below describe which sealed card a player sees, never
  whether play has a card. The look is bar-decks-shielding-look-1 (picture: `/mnt/project-files/looks/bar-decks-shielding-1/shielding-wake-up.png`).
- **FR-011** The BAR comes from the player's capture of the act, never from the card. When the player keeps it, the
  writer records world, level `encounter`, polarity, lean, touches, move, draw and prompt, and the player's words as a
  draft item until kept. A kept BAR moves the holder's needle one notch toward the leaned pole (one quest moves the
  needle; swaying an Elder takes many).

### The doors

- **FR-012** Garden door: a view of every BAR whose record names a world at the designer levels (world, campaign,
  adventure), scoped to the designer, reading `intakeRecord`. Playtesters see it and tend it (q5 C). A playtester may
  plant their own BARs, confirm or compost their own items, and mark a designer's draft "I saw this" (bar-decks-garden-1
  A). A mark is an item of slot `seen`, state `confirmed`, `by` the playtester, whose `words` are empty, so it leaves a
  trace the designer sees without touching his item. A playtester may not edit anyone's verbatim words, change world,
  level, polarity or lean, move a needle, or confirm or compost a designer's draft. A kept playtester card does not move
  an Elder's needle (option B was not chosen).
- **FR-013** Board door: one question at a time by card-turn (`canon/mechanics/card-turn.yaml` in the council repo): a
  pencilled draft drawn from the pair table, kept with one tap or rewritten, written through the writer with door
  `board`. Never a form and never more than one question on screen.
- **FR-014** Chat door: an MCP tool on `/api/mcp` that calls the writer with door `chat`. Map and floor doors belong to
  the world map spec and call the same writer.

## Dealer odds under "follow the player's round"

Computed by script, not hand: an exact enumeration of the 4^6 cast outcomes, each line weighted 1/8 for 6, 3/8 for 7,
3/8 for 8 and 1/8 for 9 (the three-coin cast), not a random simulation. It reproduces the Skeptic's 3/128 for the old
rule, so the method agrees with his hand count. The test in FR-009 reruns it in code.

- A lowest changing line on 5 or 6 recasts in 13.8% of casts, so a deal takes 1.16 casts on average.
- Per deal, the coins give the deck by the lower trigram, one in eight for Fire, so the Challenger's deck comes up 12.5%
  of the time. Inside it the suit is I 29.0%, It 21.8%, We 16.3%, Its 12.2%, and 20.7% with no changing line.
- Per deal across all decks, the Challenger's deck deals I 3.6%, It 2.7%, We 2.0%, Its 1.5%, no-change 2.6%.
- The pole no longer depends on the coins, so each pole's odds follow the standing. A new player stands on the open pole
  of every pair, so the odds above go entirely to Guarding, Shielding, Comradeship and Shield wall, and Daring,
  Sparring, Glory and Challenge ladder come up 0% until a kept BAR moves the standing.
- Shielding as the dealt card still comes up about 2.7% of deals (one in 37), which is Fire plus the It suit. The
  ruling does not raise that, because deck and suit still come from the coins. It removes the pole's tie to the coins
  and makes sure that the other three suits show the pole the player stands on. FR-010's live Shielding card comes with
  every cast, so a first-round player holds a live card on 100% of casts.

## Non-goals

Lines 5 and 6 reaching inherited pairs (waits on the ladder-loop ruling); any holder's deck beyond the Challenger's;
the NPC holders' personal names; the map surface itself; any AI step in dealing.

## Not checked

No product code ran. The dealer odds are a throwaway script's exact enumeration, not the in-repo test. The Grow Up book is unnamed. When a standing flips, and so when a sealed pole unseals, is not ruled (bar-decks-unseal-1). The no-change suit rule and the `openPole` choice are this spec's reading of "follows the player's round", for him to overrule. The other holders'
pairs and the eight downsides are still drafts in state.json.

## Notes for the world map spec (council #1446)

The map shares this one record. It must pick up: the `seen` mark item (a playtester's "I saw this" on a draft); the
standing, which the map's waymark for a pair can read from `standingFor` and never store itself; the holder roles for
Thunder and Water, so a map place names the lieutenant and the envoy by role; and the rule that a pole shown on a map
card follows the player's standing, never a coin.

Next owner + wake: a Sonnet thread builds Phases 1 to 3 after this kit merges in the daily ship (no gate left on them);
Phase 4's look waits on bar-decks-shielding-look-1 and its unsealing rule on bar-decks-unseal-1, each woken by his board
answer.
