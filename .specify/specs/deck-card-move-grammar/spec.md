# Deck, Card & Move Grammar — Spec

**Slug**: `deck-card-move-grammar`
**Ambiguity**: 0.18
**Status**: Ready for Phase 1 implementation
**Synthesized**: 2026-03-18 via strand (Researcher + Architect)

---

## Telos

bars-engine is a deck-building game. The highest-leverage move in the system is: do inner work → turn it into a playable card. The full loop is:

**Charge → BAR → Deck → Action → Charge → BAR → ∞**

A player's emotional charge produces a BAR. The BAR can be promoted to a card in their personal deck. Playing that card produces an action in the world. The action generates a new charge. The new charge produces a new BAR. The deck evolves as the player does.

The grammar of each card is shaped by three compounding lenses:
- **Nation** — cultural register and vocabulary (Pyrakanth speaks in volcanic metaphor; Meridia in tidal)
- **Face** — developmental stage lens (Challenger, Regent, Sage — active only for agents/admin currently)
- **Archetype** — AQAL type character (Danger Walker, Bold Heart — stable personality grammar)

A Challenger-Pyrakanth-BoldHeart card is different from a Challenger-Meridia-DangerWalker card. But the system does not store N×M×P rows. It composes them at render time from TypeScript constants.

---

## Structural Clarity: Two Deck Layers

The codebase already has `BarDeck` / `BarDeckCard` / `ActorDeckState` models. These serve the **campaign GM tool** — a pool of domain quest cards drawn by the game for the campaign gameboard. This is a *campaign-scoped* draw deck.

The new `PlayerDeck` / `PlayerCard` layer is the **personal card inventory** that evolves through a player's inner work. These are separate concerns. Neither replaces the other.

| Layer | Models | Owner | Purpose |
|-------|--------|-------|---------|
| Campaign deck | `BarDeck`, `BarDeckCard`, `ActorDeckState` | GM / system | Domain quest pool for gameboard draw |
| Personal deck | `PlayerDeck`, `PlayerCard` (new) | Player | Player's evolving card hand from inner work |

---

## Existing Infrastructure (confirmed)

### Fully present and usable

| What | Where |
|------|-------|
| 8 archetype grammar profiles | `/src/lib/archetype-influence-overlay/profiles.ts` |
| `applyArchetypeOverlay()` | `/src/lib/archetype-influence-overlay/index.ts` |
| `FACE_MOVE_TYPES` (6 faces × 2 moves) | `/src/lib/face-move-bar.ts` |
| `Nation` model with wakeUp/cleanUp/growUp/showUp fields | `prisma/schema.prisma` |
| `Archetype` model with move phase fields | `prisma/schema.prisma` |
| `NationMove` model (full move registry with DMS-1 tier system) | `prisma/schema.prisma` |
| `PlayerMoveEquip` (4-slot hand) | `prisma/schema.prisma` |
| `MoveUse` (daily tracking) | `prisma/schema.prisma` |
| `QuestMoveLog` (audit trail) | `prisma/schema.prisma` |
| `DaemonMoveCreation` | `prisma/schema.prisma` |
| `QuestProposal` (co-design review flow) | `prisma/schema.prisma` |
| Domain deck draw logic | `/src/lib/campaign-domain-deck.ts` |
| 4 allyship domains | `/src/lib/allyship-domains.ts` |
| 8 Kotter stages × domain matrix | `/src/lib/kotter.ts` |
| 15 canonical emotional alchemy moves | `/src/lib/quest-grammar/move-engine.ts` |
| Nation affinities & elemental moves | `/src/lib/elemental-moves.ts` |

### Present but not wired

| What | Gap |
|------|-----|
| `applyArchetypeOverlay()` | Not called from charge capture or quest generation |
| `Nation.wakeUp/cleanUp/growUp/showUp` | Not used to shape move grammar |
| `NationMove.archetypeId` FK | No archetype-specific move pools defined |

### Missing entirely

| What | Needed for |
|------|-----------|
| `PlayerCard` / `PlayerDeck` models | Personal deck |
| Move grammar resolver (Nation×Face×Archetype) | Card text composition |
| Starter deck templates | Onboarding + beginner play |
| BAR→Card promotion pathway | Core game loop |
| `CustomBar.promotedCardId` field | Idempotency on promotion |
| `QuestProposal.proposalType` / `cardEffect` fields | Co-design for cards |

---

## Move Grammar System

### Three Composable Layers

The grammar compounds at render time, not storage time:

```
BaseFaceMove (Face-scoped template sentence)
  + NationFlavorProfile (cultural register, verb palette, metaphor field)
  + ArchetypeInfluenceProfile (already exists in /src/lib/archetype-influence-overlay/)
  ↓
resolveMoveSentence() → rendered card body text
```

### Data: TypeScript Constants, Not DB Rows

Grammar content belongs in version-controlled TypeScript, not the database. The `applyArchetypeOverlay()` pattern already proves this works.

**`/src/lib/move-grammar/index.ts`** — types:
```ts
interface BaseFaceMove {
  faceKey: FaceKey            // shaman | challenger | regent | architect | diplomat | sage
  moveTypeKey: FaceMoveType   // from face-move-bar.ts
  templateSentence: string    // with named slots: {PLAYER}, {ACTION}, {NATION_REGISTER}, {OUTCOME}
  slots: MoveSlot[]
}

interface NationFlavorProfile {
  nationKey: string           // slugified Nation.name or Nation.id
  register: string            // 'volcanic' | 'tidal' | 'crystalline' | ...
  verbPalette: string[]       // inserted into NATION_REGISTER slot
  metaphorField: string       // used in body text
  moveTypeInflections: Record<FaceMoveType, string>  // per-move flavor override
}
```

**`/src/lib/move-grammar/resolver.ts`** — `resolveMoveSentence(faceKey, moveTypeKey, nationKey, archetypeKey): string`

This function: fetches `BaseFaceMove` → applies `NationFlavorProfile.moveTypeInflections` → applies `ArchetypeInfluenceProfile.prompt_modifiers`. No DB query. Returns a string.

### Nation Profiles to Seed

From `/src/lib/elemental-moves.ts`:
- **Argyra** (Heaven, Wind) — crystalline, reflective, precise
- **Pyrakanth** (Fire, Thunder) — volcanic, combustive, urgent
- **Virelune** (Water, Lake) — tidal, adaptive, depth-seeking
- **Meridia** (Lake, Heaven) — expansive, bridging, harmonizing
- **Lamenth** (Mountain, Earth) — grounded, patient, immovable

### Face Move Base Templates to Author

12 total (6 faces × 2 move types each). Source material: `/src/lib/face-move-bar.ts` `FACE_MOVE_TYPES` and the face-move-sentences spec. These get authored as `BaseFaceMove` constants in `/src/lib/move-grammar/base-moves.ts`.

---

## Card Data Model

### `PlayerCard` — new Prisma model

```prisma
model PlayerCard {
  id             String   @id @default(cuid())
  playerId       String
  sourceBarId    String?  // provenance; null for starter deck cards
  deckId         String

  // Content (snapshot at promotion time)
  title          String
  bodyText       String   @db.Text

  // Grammar keys (for resolver)
  faceKey        String?  // shaman | challenger | ... — null for most player cards
  archetypeKey   String?  // bold-heart | danger-walker | ...
  nationKey      String?  // slugified nation name

  // Move type (existing vocabulary)
  moveType       String?  // wake_up | clean_up | grow_up | show_up

  // Gameplay
  playCost       Int      @default(1)
  playEffect     String   // JSON: CardPlayEffect
  allyshipDomain String?

  // Lifecycle
  status         String   @default("in_deck")  // in_deck | in_hand | played | archived
  promotedAt     DateTime @default(now())
  playedAt       DateTime?

  player    Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)
  sourceBar CustomBar? @relation("BarPromotedToCard", fields: [sourceBarId], references: [id], onDelete: SetNull)
  deck      PlayerDeck @relation(fields: [deckId], references: [id], onDelete: Cascade)

  @@index([playerId, status])
  @@index([deckId])
  @@map("player_cards")
}
```

### `PlayerDeck` — new Prisma model

```prisma
model PlayerDeck {
  id             String   @id @default(cuid())
  playerId       String
  instanceId     String?  // null = personal; non-null = campaign-specific
  templateKey    String?  // which DeckTemplate seeded this deck

  drawPileIds    String   @default("[]")  // JSON: PlayerCard.id[] (ordered)
  handIds        String   @default("[]")  // JSON: PlayerCard.id[] (in hand)
  discardIds     String   @default("[]")  // JSON: PlayerCard.id[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  player   Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)
  instance Instance?  @relation(fields: [instanceId], references: [id], onDelete: SetNull)
  cards    PlayerCard[]

  @@unique([playerId, instanceId])
  @@index([playerId])
  @@map("player_decks")
}
```

### `playEffect` JSON Shape

```ts
interface CardPlayEffect {
  type: 'charge_generate' | 'quest_unlock' | 'bar_create' | 'domain_shift' | 'face_activate'
  magnitude: number        // 1–5 intensity
  target: 'self' | 'community' | 'instance'
  questId?: string
  faceKey?: string
}
```

### Add to `CustomBar`

```prisma
promotedCardId  String?  // soft ref to PlayerCard.id; set when BAR has been promoted
```

Enables idempotency check ("already in deck") without a join.

---

## Deck Composition

### Starter Deck Templates — TypeScript Constants

```ts
// /src/lib/deck-templates/index.ts
interface DeckTemplate {
  key: string  // 'domain:gathering_resources' | 'archetype:bold-heart' | 'onboarding'
  label: string
  category: 'domain' | 'archetype' | 'nation' | 'onboarding'
  cardSeed: CardSeedEntry[]
}

interface CardSeedEntry {
  title: string
  bodyText: string        // pre-resolver; resolver runs at assembly time
  faceKey: FaceKey | null
  archetypeKey: string | null
  nationKey: string | null
  moveType: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  playCost: number
  playEffect: CardPlayEffect
  allyshipDomain: string | null
}
```

### Starter Deck Files to Author

```
/src/lib/deck-templates/starters/
  onboarding.ts              — beginner deck, no archetype/nation required
  domain-gathering-resources.ts
  domain-direct-action.ts
  domain-raise-awareness.ts
  domain-skillful-organizing.ts
  archetype-bold-heart.ts
  archetype-danger-walker.ts
  archetype-truth-seer.ts
  archetype-still-point.ts
  archetype-subtle-influence.ts
  archetype-devoted-guardian.ts
  archetype-decisive-storm.ts
  archetype-joyful-connector.ts
```

### `assemblePlayerDeck()` Logic

1. Fetch `Player.archetypeId`, `Player.nationId`, domain preference
2. Select matching templates (archetype + domain; fall back to onboarding if no archetype)
3. For each `CardSeedEntry`, call `resolveMoveSentence()` to compound grammar into `bodyText`
4. Create `PlayerDeck` + `PlayerCard` rows
5. Shuffle `drawPileIds`; set `handIds` to first 5

**Trigger**: Campaign join flow (`/src/app/invite/[token]/`) after archetype/nation are set.

---

## BAR→Card Promotion Pathway

```
/bars/[id] (BarDetailClient)
  → "Promote to Card" button (when: status='active' && !promotedCardId)
  → modal or /bars/[id]/promote page
  → PromoteBarToCardForm
  → promoteBarToCard() server action
  → PlayerCard created; CustomBar.promotedCardId set
  → redirect to /hand
```

### Fields

| Field | Required | Source | UI |
|-------|----------|--------|----|
| `title` | Yes | `bar.title` (editable) | Text input |
| `bodyText` | Yes | `bar.description` (editable) | Textarea |
| `moveType` | Yes | `bar.moveType` if set, else player picks | 4-button selector |
| `faceKey` | Optional | Null for most player cards | 6-button selector (collapsed by default) |
| `archetypeKey` | Auto | From `Player.archetypeId` | Read-only display |
| `nationKey` | Auto | From `Player.nationId` | Read-only display |
| `playCost` | Optional | Default 1 | Number input (1–3) |
| `allyshipDomain` | Recommended | `bar.allyshipDomain` if set | 4-button selector |

### Validations

1. `bar.creatorId === playerId` OR admin
2. `bar.promotedCardId` is null
3. `bar.status === 'active'`
4. `moveType` is one of four canonical values
5. Player has an active `PlayerDeck` (auto-create if missing with onboarding template)

---

## Co-Design Infrastructure

### Extend `QuestProposal` (not a new model)

```prisma
// Add to QuestProposal:
proposalType  String  @default("quest")  // quest | card
cardEffect    String?                    // JSON CardPlayEffect when proposalType=card
```

When `proposalType='card'` and `reviewStatus='approved'`, admin approval calls `promoteBarToCard()` instead of publishing a quest. The approved card enters a **shared community deck template** that gets incorporated into `assemblePlayerDeck()` alongside the static starter templates.

### Community Deck Assembly

In `assemblePlayerDeck()`, after loading static templates: query approved `QuestProposal` rows with `proposalType='card'` matching the player's archetype/domain, add them to the seed pool. Community content compounds with starter content.

---

## Community Context

Portland community's non-AI allergy: all grammar resolution is deterministic TypeScript. `resolveMoveSentence()` has no LLM call. Starter deck templates are authored text. The deck builds through player inner work, not AI generation. AI is an optional layer for BAR generation, not for card grammar.

---

## What Is NOT Changing

- `BarDeck` / `BarDeckCard` / `ActorDeckState` — untouched
- `QuestProposal` existing fields and review flow — extended, not replaced
- `CustomBar` existing fields — one field added
- All existing face move types — unchanged
- `applyArchetypeOverlay()` — called by resolver, not rewritten
- All 15 canonical emotional alchemy moves — unchanged
- Domain deck draw logic — unchanged
