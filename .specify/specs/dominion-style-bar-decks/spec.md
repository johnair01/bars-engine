# Spec: Dominion-Style BAR Decks

## Summary

BAR scarcity follows a Dominion-style deck-building model: Library (full collection) → Decks (purpose-built, equipped) → Hand (5 cards, drawn from deck). You borrow from affinity groups (nation, archetype) until you create your own deck via a quest thread. Campaign decks are collective, domain-scoped, and prompt-driven: answer prompts with BARs, add to deck, use BARs (moves) to solve campaign objectives.

## Resolved Design Decisions

| Question | Decision |
|----------|---------|
| Hand size | 5 (Dominion) |
| Default deck | Borrow from affinity groups. Gameplay = deck creation. Quest thread guides players to create their own BARs deck. |
| Campaign deck | Collective. Each domain has its own deck. Decks = prompts; cards emerge from answering prompts with BARs. |
| Charge / 321 | Library first; player chooses to add to deck. |
| Deck Track Architecture | **4 tracks** (not 3, not 5). See §Resolved below. |

## Resolved Design Decision: Deck Track Architecture

**Decision date:** 2026-04-17
**Hexagram:** #54 — The Marrying Maiden (New Ventures)
**Active face:** Regent

**Decision:** Collapse to **4 tracks**, not 3 or 5. Merge vault and personal adventuring deck into a single lifetime track.

### The 4 Tracks

| Track | Scope | Lifetime | Governance | Schema anchor |
|-------|-------|----------|-------------|---------------|
| **Library** | Personal + vault | Lifetime (owned) | Player owns; persists across campaigns | `CustomBar.creatorId` |
| **Deck** (campaign + personal) | Instance + personal | Ongoing | Campaign-scoped OR personal-adventuring | `ActorDeckState` (instanceId sentinel) |
| **Session** | Event-bounded | Ephemeral | Time-bounded; expires when event ends | `eventId` on session state |
| **Collective** | Cross-campaign | Reputation | Earned authority; travels with player identity | `nationKey` + `archetypeKey` |

### Why 4 Not 3

The 3-model collapses session into deck — but session has different governance (time-bounded, event-scoped). Merging creates ambiguity about when cards expire.

### Why 4 Not 5

Vault and personal adventuring deck have **identical governance** (lifetime, player-owned). Merging reduces concepts without losing distinction.

### UX Presentation

Users see **3 views** (Library, Deck, Session). Schema has 4 tracks for governance clarity.

### Hexagram Interpretation

The Marrying Maiden: commitment before clarity. The system grows into the structure.

## 1. Affinity Decks (Borrowed)

New players **borrow** decks from affinity groups. No personal deck required to start.

- **Nation deck**: BARs derived from Nation's moves. Provides default deck of prompts/moves.
- **Archetype deck**: BARs derived from Archetype's moves. Playbook provides default deck.
- **Borrowing**: Use nation or archetype deck when adventuring without a personal deck. These are shared/canonical.

## 2. Deck Creation (Core Gameplay)

**Gameplay is about deck creation.** A quest thread guides players to:
1. Create BARs (from 321, charge capture) → Library
2. Add BARs from Library to a deck (when deck has space)
3. Build a personal deck mixing nation + archetype BARs
4. Equip the deck for adventuring

**Quest thread**: "Create your first BAR" → "Add it to your deck" → "Draw your hand" → "Play a BAR to complete a quest."

## 3. Campaign Decks (Collective, Domain-Scoped)

Campaign decks are **collective** and **domain-scoped**.

- **BarDeck** (Instance): One per Instance. Contains **BarDeckCard** (suit = domain, rank 1-13).
- **BarDeckCard**: `suit` = GATHERING_RESOURCES | RAISE_AWARENESS | DIRECT_ACTION | SKILLFUL_ORGANIZING.
- **BarBinding**: Links a BarDeckCard to a CustomBar when player answers the prompt with a BAR.

**Flow**: Draw BarDeckCard (prompt) → Answer with BAR (or select from Library) → BarBinding adds BAR to campaign deck → Use BARs as moves to solve campaign objectives.

## 4. Library, Decks, Hand

- **Library**: All BARs you've created. Charge captures, 321 outcomes go here first.
- **Decks**: Purpose-built. Personal decks (adventuring). Campaign decks (collective, domain-scoped).
- **Hand**: 5 cards. Drawn from equipped deck. Play BARs → discard → reshuffle when empty.

## 5. GM Face Advisory: ActorDeckState vs PlayerBarHandState

**Architect:** ActorDeckState is instance-scoped. Make `instanceId` optional for personal adventuring. One model, two modes.

**Regent:** Single model reduces drift. Extend ActorDeckState for both use cases.

**Shaman:** "Actor" means Player or NPC. Scope = instanceId (campaign) or null (personal).

**Synthesis:** Reuse ActorDeckState. Make `instanceId` optional (use sentinel `'personal'`). Hand size = 5. Store BAR IDs (CustomBar.id).

## 6. Schema Changes (Proposed)

### ActorDeckState (extend)

```prisma
model ActorDeckState {
  id              String    @id @default(cuid())
  actorId         String
  instanceId      String?   // null = personal; set = campaign; use sentinel 'personal'
  deckCardIds     String    @default("[]")  // BAR IDs in deck
  handCardIds     String    @default("[]")  // BAR IDs in hand (max 5)
  discardCardIds  String    @default("[]")
  handSize        Int       @default(5)
  lastDrawAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([actorId, instanceId])
  @@index([actorId])
  @@index([instanceId])
  @@map("actor_deck_states")
}
```

### PlayerBarDeck (new)

```prisma
model PlayerBarDeck {
  id          String   @id @default(cuid())
  playerId    String
  name        String
  purpose     String   // adventuring | borrowed_nation | borrowed_archetype
  nationId    String?
  archetypeId String?
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

## 7. Acceptance Criteria

- [ ] New players can borrow nation deck and archetype deck.
- [ ] Quest thread guides deck creation: create BAR → add to deck → equip → draw hand → play.
- [ ] Hand size = 5. Reshuffle when deck empty.
- [ ] Campaign decks: collective, domain-scoped. Prompts → answer with BAR → BarBinding → solve objectives.
- [ ] 4-track architecture: Library, Deck, Session, Collective — with 3-view UX.
- [ ] ActorDeckState extended: instanceId sentinel 'personal', hand size 5, BAR IDs.

## References

- `prisma/schema.prisma` — BarDeck, BarDeckCard, BarBinding, ActorDeckState
- `src/lib/campaign-domain-deck.ts` — Domain deck logic
- `docs/ITD_dominion_master.md` — Dominion + revenue research
