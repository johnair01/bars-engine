# Deck, Card & Move Grammar — Tasks

## Phase 1: Grammar Resolver (no migrations)

- [ ] DCG-1: Create `/src/lib/move-grammar/index.ts` — FaceKey, FaceMoveType, BaseFaceMove, NationFlavorProfile types
- [ ] DCG-2: Author `/src/lib/move-grammar/base-moves.ts` — 12 BaseFaceMove constants (6 faces × 2 move types)
- [ ] DCG-3: Author `/src/lib/move-grammar/nation-profiles.ts` — 5 NationFlavorProfile constants (Argyra, Pyrakanth, Virelune, Meridia, Lamenth)
- [ ] DCG-4: Create `/src/lib/move-grammar/resolver.ts` — resolveMoveSentence() with graceful null degradation
- [ ] DCG-5: Create `/src/lib/deck-templates/index.ts` — DeckTemplate, CardSeedEntry types + registry functions
- [ ] DCG-6: `npm run check` passes

## Phase 2: Schema + Starter Decks

- [ ] DCG-7: Migration `add_player_deck_and_cards` — PlayerDeck model, PlayerCard model, CustomBar.promotedCardId, QuestProposal.proposalType + cardEffect
- [ ] DCG-8: Run `npm run db:sync`
- [ ] DCG-9: Author `/src/lib/deck-templates/starters/onboarding.ts` — ~8 cards, no archetype/nation keys
- [ ] DCG-10: Author `/src/lib/deck-templates/starters/domain-gathering-resources.ts`
- [ ] DCG-11: Author `/src/lib/deck-templates/starters/domain-direct-action.ts`
- [ ] DCG-12: Author `/src/lib/deck-templates/starters/domain-raise-awareness.ts`
- [ ] DCG-13: Author `/src/lib/deck-templates/starters/domain-skillful-organizing.ts`
- [ ] DCG-14: Create `/src/actions/deck.ts` with assemblePlayerDeck(), drawCards(), playCard()
- [ ] DCG-15: Wire assemblePlayerDeck() into campaign join flow (InviteSignupForm or invitations action)
- [ ] DCG-16: `npm run build` + `npm run check` pass

## Phase 3: BAR→Card Promotion

- [ ] DCG-17: Add promoteBarToCard() to `/src/actions/deck.ts`
- [ ] DCG-18: Create `/src/components/bars/PromoteToCardButton.tsx`
- [ ] DCG-19: Create `/src/app/bars/[id]/promote/page.tsx` (or modal in BarDetailClient)
- [ ] DCG-20: Wire PromoteToCardButton into `/src/app/bars/[id]/BarDetailClient.tsx`
- [ ] DCG-21: Add card hand display section to `/src/app/hand/page.tsx`
- [ ] DCG-22: `npm run build` + `npm run check` pass

## Phase 4: Archetype Starter Decks + Co-Design

- [ ] DCG-23: Author archetype starter deck files (8 files in `/src/lib/deck-templates/starters/archetype-*.ts`)
- [ ] DCG-24: Wire archetype templates into assemblePlayerDeck()
- [ ] DCG-25: Migration `add_quest_proposal_card_type` (if not included in DCG-7)
- [ ] DCG-26: Extend admin quest review flow to handle proposalType='card'
- [ ] DCG-27: Extend assemblePlayerDeck() to include approved community card proposals
- [ ] DCG-28: `npm run build` + `npm run check` pass
