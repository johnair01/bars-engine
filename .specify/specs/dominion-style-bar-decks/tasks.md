# Tasks: Dominion-Style BAR Decks

## Phase 1: Affinity Decks
- [ ] Define nation deck: NationMove → BAR or card representation
- [ ] Define archetype deck: Archetype moves → BAR or card representation
- [ ] Resolve "borrowed deck" when player has no personal deck
- [ ] UI: Show borrowed deck when no personal deck equipped

## Phase 2: ActorDeckState
- [ ] Extend ActorDeckState schema (instanceId sentinel, handSize, BAR IDs)
- [ ] Migration for schema changes
- [ ] Draw logic: fill hand to 5 from deck
- [ ] Play logic: BAR from hand → discard, draw replacement
- [ ] Reshuffle: discard → deck when deck empty

## Phase 3: Deck Creation
- [ ] Create deck creation quest thread
- [ ] PlayerBarDeck model and relations
- [ ] Deck builder: add BAR from library to deck (maxSize check)
- [ ] Equip deck for adventuring context
- [ ] Hand page: show hand from equipped deck

## Phase 4: Campaign Decks
- [ ] Document prompt → BAR → BarBinding flow
- [ ] Use BARs from domain deck for campaign objectives
- [ ] Gameboard integration with domain decks

## Phase 5: Library-First
- [ ] Charge capture: BAR to Library only
- [ ] 321 extend to quest: quest created; BAR from 321 to Library only
- [ ] Face moves: BAR to Library only
- [ ] Deck builder: "Add from Library" action
