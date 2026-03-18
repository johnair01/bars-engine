# Dominion-Style BAR Decks — Spec

## Summary

BAR scarcity follows a Dominion-style deck-building model: Library (full collection) → Decks (purpose-built, equipped) → Hand (5 cards, drawn from deck). You borrow from affinity groups (nation, archetype) until you create your own deck via a quest thread. Campaign decks are collective, domain-scoped, and prompt-driven: answer prompts with BARs, add to deck, use BARs (moves) to solve campaign objectives (like buying Estate in Dominion).

---

## Resolved Design Decisions

| Question | Decision |
|----------|----------|
| Hand size | 5 (Dominion) |
| Default deck | Borrow from affinity groups (nation deck, archetype deck). Gameplay = deck creation. Quest thread guides players to create their own BARs deck (mix of nation + archetype). |
| Campaign deck | Collective. Each domain has its own deck. Decks = prompts; cards emerge from answering prompts with BARs → add BAR to deck → use BARs (moves) to solve campaign objectives. |
| Charge / 321 | Library first; player chooses to add to deck. Keeps "speed of play." |
| ActorDeckState vs PlayerBarHandState | See GM Face Advisory below. |

---

## 1. Affinity Decks (Borrowed)

New players **borrow** decks from their affinity groups. No personal deck required to start.

- **Nation deck**: BARs derived from or aligned with your Nation's moves (NationMove). Nation provides a default deck of prompts/moves.
- **Archetype deck**: BARs derived from or aligned with your Archetype's moves. Playbook provides a default deck.
- **Borrowing**: When adventuring without a personal deck, you use your nation deck or archetype deck (or a mix, based on context). These are shared/canonical, not player-owned.

**Schema implication**: Nation and Archetype need a way to expose a "default deck" — either a deck of prompts (like BarDeckCard) or a deck of BAR IDs. Likely: NationMove/Archetype moves become "cards" you can play; or there are canonical BARs per nation/archetype that form the borrowed deck.

---

## 2. Deck Creation (Core Gameplay)

**Gameplay is about deck creation.** A quest thread guides players to:

1. Create BARs (from 321, charge capture, etc.) → Library
2. Add BARs from Library to a deck (when deck has space)
3. Build a personal deck that mixes nation + archetype BARs
4. Equip the deck for adventuring

**Quest thread**: Onboarding or early-game thread that teaches: "Create your first BAR" → "Add it to your deck" → "Draw your hand" → "Play a BAR to complete a quest."

---

## 3. Campaign Decks (Collective, Domain-Scoped)

Campaign decks are **collective** and **domain-scoped**. Existing infrastructure:

- **BarDeck** (Instance): One per Instance. Contains **BarDeckCard** (suit = domain, rank 1–13).
- **BarDeckCard**: `suit` = GATHERING_RESOURCES | RAISE_AWARENESS | DIRECT_ACTION | SKILLFUL_ORGANIZING. `promptTitle`, `promptText`.
- **BarBinding**: Links a BarDeckCard to a CustomBar when a player answers the prompt with a BAR.

**Flow**:

1. **Prompt**: Draw or reveal a BarDeckCard (prompt) for a domain.
2. **Answer**: Player answers the prompt by creating a BAR (or selecting existing BAR from library).
3. **Add to deck**: BAR is added to the campaign's domain deck via BarBinding. Card is "filled" with that BAR.
4. **Use**: BARs in the deck are **moves**. Players use them to solve campaign objectives — like buying Estate in Dominion (acquiring victory/objective cards).

**Domain decks**: Each of the four allyship domains has its own deck (suit) within the Instance's BarDeck. Campaign objectives are solved by "playing" BARs from the domain decks.

---

## 4. Library, Decks, Hand

- **Library**: All BARs you've created (creatorId = you). Charge captures, 321 outcomes, etc. go here first.
- **Decks**: Purpose-built. Personal decks (adventuring, mix of nation+archetype). Campaign decks (collective, domain-scoped).
- **Hand**: 5 cards. Drawn from equipped deck. Play BARs from hand; played BARs go to discard; reshuffle when deck empty.

---

## 5. GM Face Advisory: ActorDeckState vs PlayerBarHandState

**Context**: ActorDeckState has `actorId`, `instanceId`, `deckCardIds`, `handCardIds` (7), `discardCardIds`. It is per-actor per-instance. The question: reuse for BARs, or create PlayerBarHandState?

**Architect (structure, blueprint)**:
- ActorDeckState is **instance-scoped**. It fits campaign/instance play: when you're in a campaign, you have deck/hand/discard for that instance.
- For **adventuring outside an instance** (personal quest runs, CYOA, game map before joining a campaign), there is no instance. ActorDeckState would need `instanceId` optional, or a "global personal" instance.
- Recommendation: **Generalize ActorDeckState** — make `instanceId` optional. When null, it represents the player's personal adventuring hand (no campaign context). When set, it's campaign/instance play. Same table, two modes.

**Regent (governance, assessment)**:
- One source of truth for deck/hand/discard reduces drift. If we have both ActorDeckState and PlayerBarHandState, we risk divergent logic.
- Recommendation: **Single model**. Extend ActorDeckState to cover both. Add `context` or use `instanceId` nullability to distinguish.

**Shaman (witness, pattern)**:
- "Actor" can mean Player or NPC. In campaign events, NPCs might have deck states. Players in campaigns have deck states. Players adventuring alone also have deck states. The pattern is: **actor + scope**.
- Recommendation: Keep `actorId` (Player or NPC). Scope = `instanceId` (campaign) or null (personal). ActorDeckState serves all.

**Synthesis (Sage)**:
- **Reuse ActorDeckState**. Make `instanceId` optional. When `instanceId` is null, `actorId` = playerId, and this is the player's personal adventuring hand. When `instanceId` is set, it's campaign play.
- **Hand size**: Change `handCardIds` from 7 to 5 for Dominion consistency, or add `handSize` config. Default 5.
- **Card semantics**: `deckCardIds`, `handCardIds`, `discardCardIds` store BAR IDs (CustomBar.id), not BarDeckCard IDs. ActorDeckState becomes the BAR hand state for any actor in any scope.

---

## 6. Schema Changes (Proposed)

### ActorDeckState (extend)

```prisma
model ActorDeckState {
  id             String    @id @default(cuid())
  actorId        String
  instanceId     String?   // null = personal adventuring; set = campaign
  deckCardIds    String    @default("[]")  // BAR IDs in deck
  handCardIds    String    @default("[]")  // BAR IDs in hand (max 5)
  discardCardIds String    @default("[]")
  handSize       Int       @default(5)
  lastDrawAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([actorId, instanceId])  // instanceId null = personal
  @@index([actorId])
  @@index([instanceId])
  @@map("actor_deck_states")
}
```

Note: For personal adventuring, use sentinel `instanceId = 'personal'` (or a dedicated Player-scoped table) so `@@unique([actorId, instanceId])` works. PostgreSQL treats NULL as distinct in unique constraints, so multiple (actorId, null) rows would be allowed — avoid null; use explicit sentinel.

### PlayerBarDeck (new, for personal decks)

```prisma
model PlayerBarDeck {
  id          String   @id @default(cuid())
  playerId    String
  name        String
  purpose     String   // adventuring | borrowed_nation | borrowed_archetype
  nationId    String?   // when borrowed from nation
  archetypeId String?  // when borrowed from archetype
  maxSize     Int      @default(10)
  barIds      String   @default("[]")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  player    Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)
  nation    Nation?    @relation(fields: [nationId], references: [id], onDelete: SetNull)
  archetype Archetype? @relation(fields: [archetypeId], references: [id], onDelete: SetNull)

  @@index([playerId])
  @@map("player_bar_decks")
}
```

Borrowed decks: `purpose = borrowed_nation`, `nationId` set; or `purpose = borrowed_archetype`, `archetypeId` set. `barIds` populated from canonical nation/archetype moves or BARs.

---

## 7. Acceptance Criteria

- [ ] New players can borrow nation deck and archetype deck. No personal deck required to start.
- [ ] Quest thread guides deck creation: create BAR → add to deck → equip → draw hand → play.
- [ ] Hand size = 5. Draw from equipped deck. Play BAR → discard → draw replacement. Reshuffle when deck empty.
- [ ] Campaign decks: collective, domain-scoped. Prompts (BarDeckCard) → answer with BAR → BarBinding → use BARs to solve objectives.
- [ ] Charge / 321: BARs go to Library. Player explicitly adds to deck in deck builder.
- [ ] ActorDeckState extended for BAR hand state (instanceId optional, hand size 5, BAR IDs).

---

## References

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — Core Objects
- [prisma/schema.prisma](../../prisma/schema.prisma) — BarDeck, BarDeckCard, BarBinding, ActorDeckState
- [src/lib/campaign-domain-deck.ts](../../src/lib/campaign-domain-deck.ts) — Domain deck logic
- [.agent/context/kotter-by-domain.md](../../.agent/context/kotter-by-domain.md) — Domain × Kotter
