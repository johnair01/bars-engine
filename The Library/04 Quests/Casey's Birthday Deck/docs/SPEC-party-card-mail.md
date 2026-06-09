# Party Card Mail Spec

## Purpose

Party Card Mail lets players send drawn oracle cards to each other, answer the card prompts, and collect returned answers into a personal deck.

The feature should feel like passing physical cards and notes around a party:

1. A player draws a card.
2. They send that card to another player with an optional note.
3. The recipient receives the card in their inbox.
4. The recipient answers the card's prompt.
5. The sender receives the answered card back.
6. The answer is saved into the sender's personal deck for that base card.

This is separate from the public "Attach A Player Card" feature. Attached player cards are party-wide variants on a base card. Card Mail is a player-to-player exchange.

The public corkboard/altar layer is specified separately in:

```text
docs/SPEC-party-shared-altar.md
```

## Core Concepts

### Player

For the local party prototype, a player is identified by signup name. In production, this should become a stable bars-engine user id.

Fields:

```json
{
  "id": "player-...",
  "name": "Wendell",
  "email": "optional@example.com",
  "wants_full_signup": true,
  "keep_party_data": true,
  "created_at": "2026-06-06T..."
}
```

### Card Thread

A card thread is one sent card conversation.

Fields:

```json
{
  "id": "thread-...",
  "base_card_id": "WU-A",
  "sender_name": "Wendell",
  "recipient_name": "Valkyrie",
  "sender_note": "This one felt like yours.",
  "status": "sent",
  "created_at": "2026-06-06T...",
  "answered_at": null,
  "answer": null
}
```

When answered:

```json
{
  "status": "answered",
  "answered_at": "2026-06-06T...",
  "answer": {
    "from_name": "Valkyrie",
    "text": "I think the answer is...",
    "private_note": ""
  }
}
```

### Inbox

The inbox is derived from card threads.

For a player, show:

- incoming unanswered cards where `recipient_name` matches the player
- returned answered cards where `sender_name` matches the player
- optionally sent pending cards where `sender_name` matches the player

### Discovery Deck

The party deck uses a Pokedex-style discovery model.

Admin can see:

- all 52 base oracle cards
- all player-created cards attached to base cards
- discovery counts and card-thread status

Players can only see the full details of cards they have discovered.

A player discovers a base card when:

- they shuffle and draw it
- another player sends it to their inbox
- they receive an answered card based on it

Before discovery, a card is represented as an unknown slot:

```text
?? - Undiscovered Card
```

The player may see deck progress, but not hidden card titles, prompts, art, or attached player cards.

Example:

```text
Discovered 7 / 52
Wake Up: 2 / 13
Clean Up: 1 / 13
Grow Up: 3 / 13
Show Up: 1 / 13
```

### Personal Deck

The personal deck is derived from answered card threads.

For a player, collect all answered threads where:

```text
sender_name === current player
status === "answered"
```

Group by `base_card_id`.

Each collected card should show:

- original base oracle card art and question
- recipient's answer
- sender's original note
- answer author
- date answered

## Data Files

Add two runtime files:

```text
data/party/valkyrie/card-threads.json
data/party/valkyrie/discovery.json
```

Initial card-thread contents:

```json
[]
```

Initial discovery contents:

```json
{}
```

Discovery file shape:

```json
{
  "Wendell": {
    "card_ids": ["WU-A", "CU-3"],
    "events": [
      {
        "card_id": "WU-A",
        "source": "draw",
        "created_at": "2026-06-06T..."
      }
    ]
  }
}
```

Do not store personal decks separately for the first pass. Build them from answered threads so there is only one source of truth.

## API

### Record Draw Discovery

When a player shuffles and draws a card, record discovery.

```text
POST /api/party/valkyrie/discovery
```

Request:

```json
{
  "player": "Wendell",
  "base_card_id": "WU-A",
  "source": "draw"
}
```

Allowed sources:

- `draw`
- `inbox`
- `returned`
- `admin_grant`

Response:

```json
{
  "ok": true,
  "discovery": {
    "player": "Wendell",
    "card_ids": ["WU-A"]
  }
}
```

### Get Discovery Deck

```text
GET /api/party/valkyrie/discovery?player=Wendell
```

Response:

```json
{
  "ok": true,
  "player": "Wendell",
  "discovered_count": 7,
  "total_cards": 52,
  "cards": [
    {
      "id": "WU-A",
      "state": "discovered",
      "card": {}
    },
    {
      "id": "WU-2",
      "state": "undiscovered",
      "card": null
    }
  ]
}
```

The endpoint should only include full card details for discovered cards unless the requester is admin.

### Admin Deck Map

```text
GET /api/party/valkyrie/admin/deck-map?admin_token=...
```

Response includes:

- all base cards
- all player-created attached cards
- discovery counts by card
- thread counts by card

This is the host's full table view.

### Create Card Thread

```text
POST /api/party/valkyrie/card-threads
```

Request:

```json
{
  "base_card_id": "WU-A",
  "sender_name": "Wendell",
  "recipient_name": "Valkyrie",
  "sender_note": "This one felt like yours."
}
```

Validation:

- `base_card_id` must exist in the base party deck.
- `sender_name` is required.
- `recipient_name` is required.
- `sender_name` and `recipient_name` may match, but the UI should gently discourage self-send unless intentional.
- successful send records discovery for `recipient_name` with `source: "inbox"`

Response:

```json
{
  "ok": true,
  "thread": { "...": "..." }
}
```

### Get Inbox

```text
GET /api/party/valkyrie/inbox?player=Wendell
```

Response:

```json
{
  "ok": true,
  "incoming": [],
  "returned": [],
  "sent_pending": []
}
```

Definitions:

- `incoming`: `recipient_name === player && status === "sent"`
- `returned`: `sender_name === player && status === "answered"`
- `sent_pending`: `sender_name === player && status === "sent"`

Each item should include the resolved base card summary:

```json
{
  "thread": {},
  "card": {
    "id": "WU-A",
    "title": "The First Noticing",
    "rank": "Ace",
    "suit": { "code": "WU", "name": "Wake Up" },
    "prompt": "What have you been noticing..."
  }
}
```

### Answer Card Thread

```text
POST /api/party/valkyrie/card-threads/:threadId/answer
```

Request:

```json
{
  "from_name": "Valkyrie",
  "answer_text": "I think the answer is...",
  "private_note": ""
}
```

Validation:

- thread must exist
- thread must have `status: "sent"`
- `from_name` should match `recipient_name`
- `answer_text` is required

Response:

```json
{
  "ok": true,
  "thread": { "...": "..." }
}
```

### Get Personal Deck

```text
GET /api/party/valkyrie/personal-deck?player=Wendell
```

Response:

```json
{
  "ok": true,
  "cards": [
    {
      "base_card_id": "WU-A",
      "base_card": {},
      "answers": [
        {
          "thread_id": "thread-...",
          "from_name": "Valkyrie",
          "answer_text": "I think...",
          "sender_note": "This one felt like yours.",
          "answered_at": "2026-06-06T..."
        }
      ]
    }
  ]
}
```

## UI

### Revealed Card Actions

When a player reveals a card, add:

- `Send this card`
- recipient selector
- optional note field
- send button

After send:

- show confirmation: `Sent to {recipient}`
- keep the card visible
- allow shuffle again

### Inbox Panel

Add a panel near the player controls:

```text
Inbox
- 2 cards to answer
- 1 returned answer
- 3 waiting for replies
```

Clicking opens an inbox modal or full-width panel.

Inbox tabs:

- `To Answer`
- `Returned`
- `Sent`

### Answer Flow

In `To Answer`:

1. Player selects a thread.
2. UI shows the card face using the same oracle art/front.
3. UI shows sender note.
4. UI shows the card prompt.
5. Player writes an answer.
6. Submit updates the thread to `answered`.

After submit:

- thread leaves recipient's `To Answer`
- thread appears in sender's `Returned`
- thread appears in sender's personal deck

### Returned Answer Flow

In `Returned`:

- show the original card
- show recipient answer
- show CTA: `Add to personal deck`

For first pass, this CTA can be informational because answered threads are already part of the derived personal deck.

### Personal Deck View

Add `My Answer Deck` panel.

Show:

- grouped cards by base oracle card
- count of answers collected per card
- click a group to browse all answers

Card group label example:

```text
WU-A - The First Noticing
3 answers collected
```

### Discovery Deck View

Add `My Discovered Cards`.

Rules:

- show 52 slots
- discovered cards show title, suit, rank, and thumbnail/card back state
- undiscovered cards show locked/unknown state
- attached player-created cards are only visible beneath a base card after that base card is discovered

This should feel like a collection screen, not a browse-all deck. The player is not browsing the oracle; they are seeing what they have encountered.

### Admin Deck Map View

Admin can open `Deck Map`.

Rules:

- show all 52 cards
- show attached player-created cards under each base card
- show how many players have discovered each card
- show how many card-mail threads have been sent from each card
- allow schedule/admin tools to live in the same admin area

## Privacy And Party Semantics

For the party prototype, assume party data is visible to the host/admin in JSON files.

UI rules:

- Admin can see the whole deck map.
- Players cannot browse undiscovered card details.
- Players discover cards by drawing, receiving, or getting a returned answer.
- Inbox should only show threads for the current player.
- Personal deck should only show answers collected by the current player.
- Public player-created cards are visible to a player only after the attached base card is discovered.

Production rules:

- Replace name matching with stable user ids.
- Require authenticated access for inbox and personal deck.
- Let users export or delete their party data.

## Edge Cases

- Recipient has not signed up yet: allow sending by typed name, but mark as `unclaimed`.
- Recipient later signs up with the same name: thread becomes visible in their inbox.
- Duplicate names: local prototype cannot fully solve this; production must use user ids.
- Sender changes display name: local prototype keeps historical sender name.
- Base card is edited later: inbox should resolve the latest base card copy/art unless a snapshot field is added.
- Player answers their own card: allow, but label it clearly.
- Undiscovered card is sent to player: receiving it should discover it.
- Player-created card is attached to an undiscovered base card: hide it from that player until base card discovery.
- Admin opens deck map: admin can see everything regardless of discovery.

## First Implementation Pass

1. Add `data/party/valkyrie/card-threads.json`.
2. Add `data/party/valkyrie/discovery.json`.
3. Add card-thread and discovery helpers in `dev/api.mjs`.
4. Add endpoints:
   - `POST /api/party/valkyrie/card-threads`
   - `GET /api/party/valkyrie/inbox?player=...`
   - `POST /api/party/valkyrie/card-threads/:threadId/answer`
   - `GET /api/party/valkyrie/personal-deck?player=...`
   - `POST /api/party/valkyrie/discovery`
   - `GET /api/party/valkyrie/discovery?player=...`
   - `GET /api/party/valkyrie/admin/deck-map?admin_token=...`
5. Record discovery when a player draws a card.
6. Record discovery when a player receives a sent card.
7. Add `Send this card` UI to revealed cards.
8. Add inbox summary panel.
9. Add inbox modal with answer flow.
10. Add personal deck panel grouped by base card.
11. Add discovery deck panel with locked unknown slots.
12. Add admin deck map.
13. Verify with two local player names.

## Open Design Questions

- Should returned answers appear as literal cards with a special back, or as entries beneath the original card?
- Should the sender be able to send one drawn card to multiple recipients at once?
- Should answers be editable after submit?
- Should the recipient be able to attach a player-created card as their answer instead of plain text?
- Should there be a host/admin view that sees all unanswered threads during the party?
- Should discovery be per party only, or follow players into their full bars-engine account later?
- Should discovering a player-created attached card count separately from discovering its base card?
