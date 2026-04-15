# BAR System v1

## Overview

The BAR System v1 introduces a canonical 52-card deck (4 suits = allyship domains) alongside Personal BARs. Deck cards are fixed prompts; Personal BARs are charged inspiration (charge_capture, insight, vibe). A **BarBinding** links a deck card to a personal BAR, creating a "bound card" that surfaces both prompt and personal meaning.

**Key distinction**: Deck cards (fixed prompts) vs Personal BARs (charged inspiration) vs Bound cards (deck card + personal BAR). The gameboard (8 slots) remains for campaign quest completion; the daily hand (7 cards) is a new personal play surface.

---

## Object Model

### BarDeck

One deck per Instance (campaign). Contains 52 BarDeckCards.

**Legacy DB columns:** If you see references to old `deckType` / `libraryId` on `bar_decks`, they were removed from the database intentionally; the app never used them. See [bar-decks-legacy-columns.md](bar-decks-legacy-columns.md).

### BarDeckCard

| Field | Type | Description |
|-------|------|-------------|
| suit | String | GATHERING_RESOURCES \| RAISE_AWARENESS \| DIRECT_ACTION \| SKILLFUL_ORGANIZING |
| rank | Int | 1–13 |
| promptTitle | String | Card title |
| promptText | String | Card prompt |
| shufflePower | Boolean | When played, reshuffles discard into deck |

### BarBinding

Links a deck card to a Personal BAR (CustomBar). One binding = one deck card + one personal BAR. A card may have multiple bindings over time; a BAR may bind to multiple cards.

### ActorDeckState

Per-actor, per-instance deck state:

- `deckCardIds`: cards remaining in deck
- `handCardIds`: 7 cards in hand
- `discardCardIds`: played cards
- `lastDrawAt`: last daily draw timestamp

---

## Suits (Domains)

From [allyship-domains.ts](../src/lib/allyship-domains.ts):

| Suit | Label |
|------|-------|
| GATHERING_RESOURCES | Gathering Resources |
| RAISE_AWARENESS | Raise Awareness |
| DIRECT_ACTION | Direct Action |
| SKILLFUL_ORGANIZING | Skillful Organizing |

---

## Personal BARs

CustomBar with `type` in `charge_capture`, `insight`, `vibe`. Created via charge capture flow or `createPersonalBar`. Can be bound to deck cards.

---

## Daily Hand Rules

- **Draw daily hand**: Once per day per actor/instance. Draw 7 from deck into hand.
- **Hand size**: 7 cards.
- **On play**: Move card to discard; draw 1 replacement from deck (if deck has cards).

---

## Shuffle Rules

- **Shuffle card**: When a card with `shufflePower: true` is played → reshuffle discard into deck.
- **Deck exhaustion**: When deck is empty and player needs to draw → reshuffle discard into deck.
- **No arbitrary shuffle**: Shuffle only when one of the above conditions is met (or admin override).

---

## Card Play Flow

1. Resolve binding for card + actor (or use generic prompt if unbound).
2. Inputs: suit/domain, prompt, bound BAR (title, summary, charge), linked quests.
3. Output: move / quest suggestion / campaign action / playbook fragment.
4. Move card to discard; draw replacement.
5. Integrate with Charge → Quest Generator, Quest System.

---

## Integration Points

| System | Integration |
|--------|--------------|
| Charge Capture | Creates Personal BAR; can bind to deck card |
| Charge → Quest Generator | Card play can invoke `generateQuestSuggestions` with bound BAR context |
| Campaign Playbook | BAR creation/binding/play → playbook fragments |
| Gameboard | Unchanged; continues 8-slot campaign quest completion |

---

## Constraints

- Do not collapse BAR library and deck into one object.
- Do not use emotional alchemy as suits (domains only).
- Do not allow arbitrary reshuffling.
- Do not require players to author 52 cards before play.
- Preserve physical-card feel in UI.
- Favor: stable structure, personal meaning through binding, daily action limitation, API-first design.
