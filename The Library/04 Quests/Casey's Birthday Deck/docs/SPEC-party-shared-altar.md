# Party Shared Altar Spec

## Purpose

The Shared Altar is the public social layer of the Valkyrie party.

It sits somewhere between a corkboard and a magic altar: a public space where players leave offerings, notes, memories, blessings, dares, questions, public card answers, and inspirations for future player-created cards.

The private layer remains Card Mail: drawing cards, sending them to specific friends, answering privately, and collecting returned answers. The Shared Altar is visible to everyone.

The main `/valkyrie-party` oracle page should stay focused on joining, shuffling, revealing, sending private card mail, checking the inbox, and collecting private answers. Public posting and player-created prompt attachment should live in the altar route/modal, or in an explicitly contextual composer after a card has been drawn and revealed.

## Experience Goals

- Make the room feel alive.
- Give guests a low-friction way to contribute even if they do not want to use private card mail.
- Let people witness, reply to, and emotionally react to each other.
- Create an exportable keepsake after the party.
- Let public posts inspire player-created cards and personal deck saves.

## Core Model

### Altar Post

Fields:

```json
{
  "id": "altar-post-...",
  "author_name": "Wendell",
  "anonymous": false,
  "category": "blessing",
  "tags": ["blessing", "valkyrie"],
  "title": "A blessing for the next year",
  "body": "May the next year meet you with bright doors.",
  "source": {
    "kind": "freeform",
    "base_card_id": null,
    "thread_id": null,
    "player_card_id": null
  },
  "created_at": "2026-06-07T...",
  "deleted_at": null
}
```

Public identity rule:

- If `anonymous` is true, public UI shows `Anonymous`.
- Admin cannot see hidden author identity for anonymous posts.
- Because admin cannot see anonymous author identity, anonymous posts cannot be author-deleted unless the current browser session owns a local post token.

### Categories

V1 categories:

- `blessing`
- `memory`
- `quest_dare`
- `inside_joke`
- `question`
- `public_card_answer`
- `inspiration`
- `photo`
- `other`

These are tags, not separate boards. The altar is one big shared space with filters.

`quest` and `dare` are the same party mechanic for V1. The label can read `Quest / Dare`.

Photo posts should support an attached image in a later pass:

```json
{
  "media": [
    {
      "id": "media-...",
      "type": "image",
      "url": "/api/party/valkyrie/altar/media/...",
      "alt": "Optional caption text"
    }
  ]
}
```

### Replies

Posts support threaded replies.

Reply fields:

```json
{
  "id": "altar-reply-...",
  "post_id": "altar-post-...",
  "author_name": "Valkyrie",
  "anonymous": false,
  "body": "I want this one in the keepsake.",
  "created_at": "2026-06-07T...",
  "deleted_at": null
}
```

### Reactions

Use Emotional Alchemy reactions:

```text
Triumph   - Fire
Poignance - Water
Bliss     - Wood
Excitement - Metal
Peace     - Earth
```

Stored as counts plus optional per-player events.

Reaction event:

```json
{
  "id": "reaction-...",
  "post_id": "altar-post-...",
  "player_name": "Wendell",
  "reaction": "triumph",
  "created_at": "2026-06-07T..."
}
```

V1 can allow one reaction of each type per player per post, or can simply record reaction taps as events. Prefer one reaction of each type per player per post to keep counts meaningful.

## Personal Deck Saves

Players can save altar posts into their personal deck as keepsake artifacts.

This broadens the current personal deck mechanic. The personal deck should eventually collect several artifact types:

- `answered_card`: a returned private card answer
- `altar_post`: a public altar post that touched or inspired the player
- `player_card`: a player-created card
- `drawn_card`: a card the player drew and chose to keep

V1 should add a runtime save file:

```text
data/party/valkyrie/personal-saves.json
```

Shape:

```json
[
  {
    "id": "save-...",
    "player_name": "Wendell",
    "artifact_type": "altar_post",
    "artifact_id": "altar-post-...",
    "note": "This one got me.",
    "created_at": "2026-06-07T..."
  }
]
```

The existing `My Answer Deck` should evolve into `My Keepsake Deck` once altar saves are implemented.

## Private-To-Public Boundary

Mechanically, the system may allow a player to publish a private card/mail artifact to the public altar.

Social rule:

```text
Do not publish someone else's private answer without permission.
```

V1 relies on orientation and social norms. Do not add a consent gate yet.

Orientation copy should clearly say:

```text
Private card answers are for the people in that exchange. Do not repost someone else's private answer to the public altar unless they have said yes.
```

## Admin Powers

Admin can:

- delete any public altar post
- delete any public reply
- export the full board after the party

Admin cannot:

- see the original author of anonymous posts
- unmask anonymous replies

Admin export should include anonymous labels exactly as public UI saw them.

## Deletion Rules

Players can delete their own posts.

For named posts:

- local prototype can match `author_name === current player`
- production should use stable user ids

For anonymous posts:

- local prototype should create a `local_owner_token` saved client-side
- server stores a hash/token reference, not the visible author
- the same browser session can delete its anonymous post
- admin can delete any post

If owner tokens are too much for the first implementation pass, V1 can allow:

- named author deletion by matching player name
- admin deletion
- anonymous posts are only admin-deletable

## Data Files

Add:

```text
data/party/valkyrie/altar-posts.json
data/party/valkyrie/altar-replies.json
data/party/valkyrie/altar-reactions.json
data/party/valkyrie/personal-saves.json
```

Initial contents:

```json
[]
```

## API

### List Altar Posts

```text
GET /api/party/valkyrie/altar?category=blessing
```

Response:

```json
{
  "ok": true,
  "posts": [
    {
      "post": {},
      "replies": [],
      "reactions": {
        "triumph": 2,
        "poignance": 1,
        "bliss": 3,
        "excitement": 0,
        "peace": 4
      }
    }
  ]
}
```

If `category` is absent, return all undeleted posts.

### Create Altar Post

```text
POST /api/party/valkyrie/altar
```

Request:

```json
{
  "author_name": "Wendell",
  "anonymous": false,
  "category": "blessing",
  "tags": ["blessing"],
  "title": "A blessing",
  "body": "May the next year...",
  "source": {
    "kind": "freeform",
    "base_card_id": null,
    "thread_id": null,
    "player_card_id": null
  }
}
```

### Reply To Post

```text
POST /api/party/valkyrie/altar/:postId/replies
```

Request:

```json
{
  "author_name": "Valkyrie",
  "anonymous": false,
  "body": "Yes, this one."
}
```

### React To Post

```text
POST /api/party/valkyrie/altar/:postId/reactions
```

Request:

```json
{
  "player_name": "Wendell",
  "reaction": "peace"
}
```

Allowed reactions:

- `triumph`
- `poignance`
- `bliss`
- `excitement`
- `peace`

### Delete Post

```text
DELETE /api/party/valkyrie/altar/:postId
```

Request body:

```json
{
  "player_name": "Wendell",
  "admin_token": ""
}
```

Allowed if:

- admin token is valid, or
- post is named and `author_name === player_name`, or
- future owner token matches

Delete should soft-delete with `deleted_at`, not remove rows.

### Save To Personal Deck

```text
POST /api/party/valkyrie/personal-saves
```

Request:

```json
{
  "player_name": "Wendell",
  "artifact_type": "altar_post",
  "artifact_id": "altar-post-...",
  "note": "I want to keep this."
}
```

### Export Board

```text
GET /api/party/valkyrie/admin/altar-export?admin_token=...
```

Response:

```json
{
  "ok": true,
  "exported_at": "2026-06-07T...",
  "party": {},
  "posts": [],
  "replies": [],
  "reactions": [],
  "personal_save_counts": []
}
```

The export should be JSON for V1. A later pass can produce HTML/PDF keepsake output.

## UI

### Routes And Surfaces

The altar should have three surfaces:

- `/valkyrie-party/altar`: the full altar page
- modal/overlay from `/valkyrie-party`: for quick posting, replying, and saving without leaving the oracle
- optional big-screen board mode for the room

The main app page should not include a standalone `Attach A Player Card` composer or `Post A Player Board Note` composer. Those actions only appear when the altar knows why the player is there.

### Smart Altar Context

When the current player opens the altar, the UI should load context from:

- `discovery`: cards this player has drawn or otherwise discovered
- `card_threads`: cards this player has been sent, tagged into, answered, or received back
- `personal_saves`: altar posts, player cards, and answers this player has saved
- current route/modal context, such as `?base_card_id=SU-8` or `?source_post_id=altar-post-...`

The altar should use that context to offer sensible actions:

- If the player has drawn/revealed a card: `Post my answer to the altar`
- If the player has drawn/revealed a card: `Make a public variant for this card`
- If the player is viewing an altar post: `Save to my deck`
- If the player is viewing an altar post: `Send this as a card`
- If the player is viewing an altar post: `Turn this into a player card`
- If the player is tagged in a post or thread: show the tagged item in their altar context tray
- If there is no card/post context: show only freeform altar offering options

The important rule: attaching a prompt should only show up when there is a meaningful base card or altar post to attach it to.

### Opening Options

When someone opens the altar without a specific source context, offer a small set of starting options:

- Leave a blessing
- Share a memory
- Offer a quest / dare
- Post a public card answer
- Add a photo
- Ask a question
- Add an inside joke
- Offer care or appreciation

### Public Altar Space

The full altar page should include:

- category filter chips
- create post button
- post composer
- reaction buttons
- reply thread
- save to my deck
- send this as a card

The public altar should be one big flowing space, not separate columns per category.

### Composer

Fields:

- category
- title
- body
- anonymous toggle
- optional tag chips

Post types can include:

- blessing
- memory
- quest / dare
- question
- public answer
- inspiration
- photo

### Public Card Answer

When viewing a drawn/revealed card, add:

```text
Post my answer to the altar
```

This creates an altar post with:

```json
{
  "source": {
    "kind": "drawn_card_answer",
    "base_card_id": "WU-A"
  },
  "category": "public_card_answer"
}
```

### Altar Post To Player Card

Each altar post can offer:

```text
Turn this into a player card
```

This should open a contextual player-card composer. It should not use a standalone composer on the main oracle page.

- title from post title
- prompt/body from post body
- source kind `altar_post`

If the altar post is linked to a `base_card_id`, use that as the target card. If it is not linked to a base card, ask the player to choose from cards they have already discovered. Admin can choose any base card.

### Drawn Card To Player Card

After a player draws and reveals a base card, the revealed-card action tray may offer:

```text
Make a public variant for this card
```

This opens the altar overlay with:

```json
{
  "source": {
    "kind": "drawn_card",
    "base_card_id": "SU-8"
  }
}
```

The composer creates a player card attached to that base card. It is visible to everyone who later draws that same base card.

### Save To My Deck

Each altar post has:

```text
Save to my deck
```

This stores a `personal-saves.json` row.

The personal deck UI should be renamed:

```text
My Keepsake Deck
```

Sections:

- answered cards
- saved altar posts
- saved player-created cards

## Exportable Keepsake

V1 export is JSON.

Future keepsake export should render:

- party title/date
- schedule
- public altar posts
- replies
- emotional alchemy reaction counts
- optionally anonymized attribution
- selected card art if posts are linked to base cards

The keepsake should preserve the feeling of an altar after the party is over.

## First Implementation Pass

1. Add altar JSON files.
2. Add API helpers/endpoints.
3. Add full `/valkyrie-party/altar` route with filters.
4. Add post composer.
5. Add replies.
6. Add Emotional Alchemy reactions.
7. Add save-to-personal-deck for altar posts.
8. Rename `My Answer Deck` to `My Keepsake Deck`.
9. Add admin delete.
10. Add admin JSON export.
11. Add orientation copy for private-to-public norms.
12. Add contextual altar overlay entry points from drawn/revealed cards and altar posts.

## Open Questions

- Should the first keepsake export be JSON only, or should we immediately add a simple HTML export?
- Should anonymous post deletion use local owner tokens in V1?
- Should replies support reactions too, or only top-level posts?
- Should altar posts be searchable, or are category filters enough for the party?
- Should altar posts linked to oracle cards count as discovery events?
- Should photo uploads be stored locally for party-day prototype only, or should they immediately use durable storage?
