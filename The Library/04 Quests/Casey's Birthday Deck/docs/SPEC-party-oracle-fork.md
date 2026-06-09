# Party Oracle Fork

This adds a birthday-party copy of the Oracle experience for Valkyrie.

## Routes

- `/oracle` keeps the original Casey oracle/editor flow.
- `/valkyrie-party` opens the party experience.
- `/party/valkyrie` is an alias for the same party experience.

## Data Files

The Valkyrie party metadata lives at:

```text
data/party/valkyrie/deck.json
```

The base 52-card oracle deck is derived from Casey's canonical deck:

```text
data/deck.json
```

At runtime, the party API applies a Valkyrie text transform to Casey's deck data:

- `Casey` -> `Valkyrie`
- `Casey's` / `Casey’s` -> `Valkyrie's` / `Valkyrie’s`
- simple pronoun cleanup for common `he/him/his` strings
- card art, image paths, crop data, suit data, prompts, and flavor structure are preserved

This keeps the party page visually and structurally close to `/oracle` while avoiding a second hand-maintained 52-card JSON file.

Runtime party data is separate:

```text
data/party/valkyrie/added-cards.json
data/party/valkyrie/signups.json
data/party/valkyrie/messages.json
```

This lets the host keep Casey's canonical deck clean while guests add party-layer cards during play.

## Player-Created Card Layer

Player-created cards do not replace or globally join the base shuffle pool. They attach to a specific base oracle card with:

```json
{
  "base_card_id": "WU-A",
  "title": "A player title",
  "prompt": "A player prompt",
  "flavor": "Optional flavor text"
}
```

When a player draws `WU-A`, the interface shows the original oracle card and any player-created cards attached to `WU-A`. The player can choose the original or one of the attached cards.

This preserves the ritual of drawing from the 52-card deck while letting the party build visible local meaning around each card.

## Card Mail And Personal Answer Decks

The next interaction layer is specified in:

```text
docs/SPEC-party-card-mail.md
```

That spec covers sending drawn cards to another player, answering card prompts through an inbox, returning answered cards to the sender, and collecting those answers into a personal deck.

The public Shared Altar/corkboard layer is specified in:

```text
docs/SPEC-party-shared-altar.md
```

## Admin Schedule Editing

The schedule and party information can be edited through the party page by opening the admin schedule panel. The local API requires an admin token for writes.

Default local token:

```text
valkyrie-admin
```

For deployment, set:

```text
PARTY_ADMIN_TOKEN=<private token>
```

The admin editor updates:

- party location
- host note
- schedule rows

## Forking For Another Party

1. Copy `data/party/valkyrie/deck.json` to a new folder, for example `data/party/alex/deck.json`.
2. Change `deck_slug`, `deck_name`, `for`, `theme`, and `party`.
3. Add a transform like `valkyrieText()` in `dev/api.mjs`, or generalize it to accept `{ fromName, toName, pronouns }`.
4. Add matching API constants in `dev/api.mjs`.
5. Copy `routes/valkyrie-party.tsx` or generalize it to accept a party slug.
6. Add the new path in `dev/main.tsx`.

The current implementation is a local party prototype. Full bars-engine account creation is captured as signup intent with `wants_full_signup`; production wiring should hand that record to the real auth/onboarding flow.
