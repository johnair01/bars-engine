# BAR System v1 — API Contracts

## Service Layer

| Contract | Purpose |
|----------|---------|
| `getCampaignDeck(instanceId)` | Return 52 BarDeckCards for campaign |
| `getActorDeck(actorId, instanceId)` | Return actor's deck state (deck/hand/discard) |
| `getActorHand(actorId, instanceId)` | Return 7 hand cards with bindings |
| `drawDailyHand(actorId, instanceId)` | Draw 7; enforce once-per-day |
| `bindBarToCard(cardId, barId, actorId)` | Create BarBinding |
| `removeBinding(bindingId)` | Set status removed |
| `getCardBindings(cardId)` | List active bindings for card |
| `playCard(cardId, actorId, instanceId)` | Play → discard → draw; trigger downstream |
| `shuffleDeck(actorId, instanceId)` | Reshuffle only if allowed |
| `getActorBars(actorId)` | BAR library (CustomBar personal types) |
| `createPersonalBar(input)` | Create CustomBar charge_capture/insight/vibe |

---

## Server Actions (src/actions/bar-deck.ts)

All actions are server actions. Call from client components.

### getCampaignDeck(instanceId: string)

Returns 52 cards for the campaign deck. Ensures deck exists and is populated.

### getActorDeck(actorId, instanceId)

Returns `{ deckCardIds, handCardIds, discardCardIds }`. Creates state on first access.

### getActorHand(actorId, instanceId)

Returns 7 hand cards with optional bindings. Call `drawDailyHand` first if hand is empty.

### drawDailyHand(actorId, instanceId)

Draws 7 cards into hand. Once per day; returns existing hand if already drawn today.

### bindBarToCard(cardId, barId, authorActorId, instanceId?)

Creates a BarBinding. Returns `{ success, bindingId }` or `{ error }`.

### removeBinding(bindingId)

Sets binding status to `removed`.

### getCardBindings(cardId)

Returns active bindings for a card.

### playCard(cardId, actorId, instanceId)

Plays card: move to discard, draw replacement, handle shuffle card. Returns `{ success }` or `{ error }`.

### shuffleDeck(actorId, instanceId)

Reshuffles discard into deck. Only succeeds when deck empty or shuffle card played.

### getActorBars(actorId)

Returns CustomBars with type in charge_capture, insight, vibe.

### createPersonalBar(input)

Creates a personal BAR. Input: `authorActorId`, `title`, `summaryText`, `barType`, optional `campaignRef`, `emotionChannel`, `chargeIntensity`, `visibility`.

---

## Types (src/features/bar-system/types/index.ts)

- `BarDeckCard`: card shape
- `BarBinding`: binding shape
- `BoundCard`: card + optional binding
- `ActorDeckState`: deck state shape
- `CreatePersonalBarInput`: input for createPersonalBar
