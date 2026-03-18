# Plan: Dominion-Style BAR Decks

## Phases

### Phase 1: Affinity Decks (Borrowed)
- Define nation deck and archetype deck as canonical BAR/move sets.
- When player has no personal deck, resolve equipped deck = nation or archetype (based on context).
- Schema: Ensure Nation and Archetype can expose default deck content (NationMove, Archetype moves → BAR-like cards).

### Phase 2: ActorDeckState for BARs
- Extend ActorDeckState: `instanceId` optional or sentinel `'personal'`; `handSize` default 5; store BAR IDs.
- Migration: Add `handSize`, change `instanceId` to optional or add scope.
- Draw/play/reshuffle logic for BARs.

### Phase 3: Deck Creation Quest Thread
- Create quest thread that guides: create BAR → add to deck → equip → draw → play.
- Deck builder UI: add BARs from library to deck (enforce maxSize).
- Equip flow for adventuring context.

### Phase 4: Campaign Deck Integration
- Campaign decks already exist (BarDeck, BarDeckCard, BarBinding). Clarify flow: prompt → answer with BAR → add to domain deck.
- Use BARs in deck to solve campaign objectives (gameboard, quest completion).
- Domain decks per Instance (suit = domain).

### Phase 5: Charge / 321 → Library
- Charge capture and 321 outcomes create BARs in Library only (no auto-add to hand).
- Deck builder: "Add from Library" with slot availability check.
