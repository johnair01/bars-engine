# Spec: Allyship Deck Practice Page

## Purpose

Create a deck-only product lane inside BARS Engine where the Allyship Deck is useful without full app signup. Deck owners can draw cards, work a card on a limited practice route, complete a real output, and export or share it. Full BARS Engine integration is visible as a deeper "coming soon" doorway, not the primary path.

Core product rule:

```text
The deck is complete enough to use alone.
BARS Engine is the deeper ecology.
```

The Allyship Deck should feel like a standalone deck product. BARS Engine is the archive, quest engine, and ecology layer, not the required first destination.

## Deck-Only Product Lane

Current state:

- `/deck` is gated by `checkAccess('deck-digital')`.
- `/deck/sales` and `/deck/preview` are public.
- The root app layout renders global navigation for authenticated users.
- Deck journal actions use `getCurrentPlayer()`.

Revised direction:

```text
draw card
-> Help me take action / Go deeper
-> card-specific practice page
-> recommended tools based on card + blocker + orientation + emotional vector
-> complete a deck-native output
-> export/copy/share now
-> optionally see BARS Engine save/integration as coming soon
```

### Product Access States

Define explicit product access states:

| State | Meaning |
|---|---|
| `anonymous` | No signed-in player; can view public sales/preview routes. |
| `deck_owner` | Has `deck-digital`; does not have `app-access`; can use deck routes only. |
| `bars_player` | Has `app-access`; can use full BARS surfaces plus the deck. |
| `admin` | Bypasses product gates. |

Add a single resolver, for example:

```ts
type ProductAccessState = 'anonymous' | 'deck_owner' | 'bars_player' | 'admin'

type ProductAccess = {
  state: ProductAccessState
  canUseDeck: boolean
  canUseBars: boolean
  isDeckOnly: boolean
  isAdmin: boolean
  playerId: string | null
}

async function resolveProductAccess(): Promise<ProductAccess>
```

Rules:

- `deck-digital` remains the deck entitlement.
- `app-access` remains the deeper BARS Engine capability.
- Admins bypass both gates.
- A deck-only user may still have a `Player` record, but product behavior treats them as deck-only.

### Deck-Only Route Allowlist

Use an allowlist for deck-only users. Do not rely on hiding links.

Deck-only users may access:

- `/deck`
- `/deck/practice/[cardId]`
- `/deck/sales`
- `/deck/preview`
- `/redeem`
- login/logout/account-light surfaces needed for deck ownership

If a deck-only user manually visits deeper BARS routes, show a deck-friendly boundary page:

```text
This is part of deeper BARS Engine integration.
You can use and share the Allyship Deck now.
Full BARS quest integration is coming soon.
```

Provide:

- return to deck
- learn about BARS Engine / coming soon
- optional upgrade or waitlist CTA if available later

### Deck-Only Shell

Deck-only users should not see global BARS app navigation.

Hide for deck-only users:

- NOW
- VAULT
- EVENTS
- PLAY
- + BAR
- campaign/admin/deeper app links

Show deck-local navigation:

- Draw
- Browse
- Find Your Path
- Practice
- Redeem / Account
- BARS integration coming soon notice

## Product Thesis

An Allyship Deck card is a **move lens**. It gives the player a kind of allyship move to practice:

- WAVE move: Wake Up, Open Up, Clean Up, Grow Up, Show Up
- Operation: Shaman, Challenger, Regent, Architect, Diplomat, Sage
- Domain: Gather Resources, Raise Awareness, Direct Action, Skillful Organizing
- Subject: self, other, collective/campaign

The card does not know the player's live blocker. The practice page collects enough context to choose a tool and compose the rep.

## Core Helper

Add a pure helper:

```ts
getDeckCardToolAffinities(card: MoveCard): DeckCardToolAffinity[]
```

The helper maps card metadata to tool-family preferences without reading player input.

### Helper Contract

```ts
type ToolRating = 'strong' | 'medium' | 'weak' | 'not_recommended'

type EmotionalAlchemyToolId =
  | 'charge_dialogue_321'
  | 'felt_thread'
  | 'bar_capture'
  | 'story_turnaround'
  | 'put_it_on_the_board'
  | 'clean_line'
  | 'return_to_body'
  | 'one_true_next_move'
  | 'happy_apples'
  | 'make_it_real'

type DeckCardToolAffinity = {
  toolId: EmotionalAlchemyToolId
  rating: ToolRating
  reasons: string[]
  source: {
    move: BasicMove
    operation: Operation
    domain: AllyshipDomain
    outputBar: OutputBar
  }
}
```

### Helper Rules

The helper should score from card structure only:

1. **Move fit**: Wake/Open/Clean/Grow/Show maps to WAVE capability ratings.
2. **Operation fit**: Shaman favors noticing tools; Challenger favors inquiry/action tools; Regent favors stewardship tools; Architect favors mapping/amplification tools; Diplomat favors relational tools; Sage favors integration tools.
3. **Domain fit**: domains bias expression, not emotional routing.
4. **Output fit**: output BAR type biases artifact shape.

The helper must not infer:

- emotional vector
- diagnosis
- safety state
- player readiness
- whether the card should be internal or external

Those are decided by the practice page intake.

## User Stories

### P1: Deck Owner Uses the Deck Without Full App Access

As a deck owner, I want to use the deck without entering the whole BARS Engine app, so buying the deck feels like a clear, bounded product commitment.

Acceptance:

- I can open the deck if I have `deck-digital`.
- I do not see full BARS app navigation unless I also have `app-access`.
- If I try to enter deeper app routes, I see a friendly coming-soon boundary.

### P2: Drawn Card Offers Practice Choices

As a player who draws a card, I want to choose whether to act quickly or go deeper, so the deck can meet me at the level of effort I have available.

Primary CTAs:

- **Help me take action**
- **Go deeper**

Secondary CTAs:

- Save image
- Copy practice result
- Save/send to BARS, shown as coming soon for deck-only users

### P3: Card Practice Page

As a player, I want a page designed around the card I drew, so I can work the card without leaving the deck experience.

The page should show:

- card title and visual identity
- move, operation, domain
- primary/campaign question based on orientation
- recommended practice path
- tool recommendation
- expected output
- completion/reflection area

### P4: Quick Action Mode

As a player with limited time, I want the card to help me take one concrete action.

Quick Action should:

- ask minimal intake
- prefer Show Up-capable tools
- produce an action, ask, boundary, message, map, ritual, or internal commitment
- allow completion without creating a BARS object

### P5: Go Deeper Mode

As a player with a real blocker, I want the card to help me metabolize the charge before acting.

Go Deeper should:

- collect current dissatisfaction
- collect desired satisfaction
- optionally collect blocker/story/domain need
- select a tool based on card + vector + blocker + orientation
- produce an inspectable output
- optionally show BARS handoff state

### P6: Save / Export Without BARS

As a deck owner, I want to save or share my card practice now, even before full BARS integration exists.

Active v1 persistence/export:

- card-only image
- card + public-safe practice summary
- copyable practice text

Private reflection text must be excluded from social/image export by default.

### P7: BARS Integration Notice

As a deck owner, I want to understand that BARS Engine integration is coming later, so the boundary feels like a roadmap rather than a broken feature.

Copy direction:

```text
You can save/share this practice now.
Full BARS quest integration is coming soon.
```

Save to BARS should appear after output exists, not before.

For deck-only users, Save to BARS is disabled or waitlist-style. For full BARS users, existing save behavior can remain active where already supported.

## UX Model

### Entry Points

1. Drawn card footer
2. Card detail overlay
3. Browse card detail
4. Find Your Path result
5. Shared/social card landing page

### CTA Language

Replace or demote immediate "Send to BARS" as the primary action.

Recommended card actions:

| CTA | Meaning |
|---|---|
| Help me take action | Quick action, low intake, action/artifact first |
| Go deeper | Emotional vector + blocker + tool recommendation |
| Save image | Export the card/practice as an image |
| Copy result | Save practice result outside BARS |
| Save to BARS | Coming soon for deck-only users; active only for full BARS users where supported |

### Page Shape

```text
/deck/practice/[cardId]
```

Optional query params:

```text
?mode=quick
?mode=deep
?subject=self|other|collective
```

## Practice Page Flow

### Quick Action

```text
card context
-> orientation: self / other / collective
-> what is hard about moving?
-> recommend 1 action-oriented tool
-> produce output
-> complete / save image / copy result / BARS coming soon
```

### Go Deeper

```text
card context
-> orientation: self / other / collective
-> current dissatisfaction
-> desired satisfaction
-> optional blocker/story/domain need
-> tool recommendation
-> protocol
-> output
-> reflection
-> complete / save image / copy result / BARS coming soon
```

## Recommendation Composition

The practice page should call a composed service:

```ts
recommendDeckCardPractice({
  card,
  mode,
  orientation,
  subject,
  present,
  desired,
  blocker,
  story,
  selectedToolId,
})
```

Recommendation ranking:

1. emotional vector family fit
2. card move fit
3. card operation fit
4. card domain fit
5. blocker/story fit
6. orientation fit
7. output BAR fit

## Acceptance Criteria

1. `resolveProductAccess()` or equivalent exists and distinguishes `anonymous`, `deck_owner`, `bars_player`, and `admin`.
2. Deck-only users can access deck routes and cannot access deeper BARS routes.
3. Deck-only users see a deck-only shell, not the global BARS app nav.
4. `getDeckCardToolAffinities(card)` exists as a pure helper and returns at least two viable tool affinities for all 120 move cards.
5. Helper tests cover all five moves, six operations, four domains, and all 120 assembled move cards.
6. A new spec-backed practice page route is defined for `/deck/practice/[cardId]`.
7. The page supports two modes: `quick` and `deep`.
8. The page treats Save to BARS as a downstream action after output exists.
9. Deck-only users see Save to BARS as coming soon, not as a broken or required step.
10. The page can render or prepare social image export for card-only and card+summary exports.
11. Private reflection text is excluded from image/social export by default.
12. The design keeps internal and external Show Up outputs distinct.
13. The practice result can be completed without requiring BARS persistence.

## Non-Goals

- Full social sharing integrations.
- Full safety gates.
- DB persistence for anonymous practice sessions.
- New checkout system.
- Rewriting all 120 card bodies.
- Making every card its own unique tool.
- Replacing BARS Engine.
- Completing full Save to BARS integration for deck-only users.

## Risks

### Risk: The Deck Becomes a Thin Funnel

If every meaningful action immediately leaves the deck, the deck feels like a brochure for BARS rather than a playable product.

Remediation: host the first real practice on the deck page and make export/copy the active v1 save path.

### Risk: Deck-Only Is Only Cosmetic

If deck-only users have a normal Player record and see normal app nav, the product boundary fails.

Remediation: define product access states, use a deck-only shell, and enforce route allowlisting.

### Risk: BARS Coming Soon Feels Like a Dead End

If the player completes meaningful work and only sees a disabled save action, it feels bad.

Remediation: provide image export and copyable practice text now. Phrase BARS as deeper integration, not the only save path.

### Risk: The Practice Page Becomes BARS Engine in Miniature

If the page grows too much, it recreates the whole app.

Remediation: page only composes one card, one blocker, one recommended tool, and one output.

### Risk: Social Export Leaks Private Work

Players may not realize their reflection is included.

Remediation: default image export to card-only or card+public-safe summary; private details are opt-in.

### Risk: Tool Recommendations Ignore the Card

If emotional vector dominates all scoring, the drawn card feels irrelevant.

Remediation: card move/operation/domain must influence tool selection and copy, even when vector determines the emotional route.

## Open Questions

1. Should the account-light surface be a real `/account` page, a deck modal, or an existing auth/account page with deck-only copy?
2. Should image export be available before completion or only after a practice output exists?
3. Should "Help me take action" skip desired satisfaction, or still ask for the satisfaction target in one click?
4. Should the deck practice page create a lightweight local/session journal before BARS persistence?
5. Should social export use the card art only, or include generated practice text templates?

