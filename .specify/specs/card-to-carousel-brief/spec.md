# Card-to-Carousel Brief

## Purpose

Provide global admins and stewards a private, session-only route that turns a
three-card Allyship reading plus campaign context into an editable six-to-eight
slide Raise Awareness post. The feature proves a reusable compiler seam:

```text
locked card spread + accountable brief context → deterministic PostV1 → composer
```

It does not publish, save a draft to the database, or generate AI copy.

## Product boundary

- Route: `/admin/campaigns/[campaignId]/brief`.
- Access: signed-in global `admin` or `steward`; all other visitors redirect.
- Campaign context: load the canonical `Campaign.id`, name, and
  `allyshipDomain`; the domain is the default and may be overridden locally.
- State: browser-session only. No new Prisma model or migration.
- Output: an editable `PostV1` opened in `/admin/raise-awareness`, followed by
  existing individual PNG downloads.
- Non-goals: public/player access, social publishing, reviewing other
  stewards, analytics, AI copy generation, and server-side draft persistence.

## Non-negotiable axis separation

The compiler must carry, but never collapse, these independent axes:

- `domain`: where the work lands.
- `face`: the Game Master operation that frames the invitation.
- `vector`: the Emotional Alchemy visual `from → to` transition.
- `goal`: the campaign situation the steward is organizing around.
- `approvedCta`: the action that is already approved.

The vector drives carousel visuals only. Neither channel labels, move names, nor
lattice terms may appear in exported media unless a steward deliberately writes
them into editable copy. A face is an operation, not an audience level;
`audienceDepth` is a distinct setting.

## Shared contracts

Before UI work, move the composer's local post types to a shared module such as
`src/lib/raise-awareness/post.ts`. The following is the minimum stable contract:

```ts
type AudienceDepth = 'curious' | 'engaged' | 'committed'
type Perspective = 'ours' | 'partner' | 'community'
type Spread = readonly [MoveCard, MoveCard, MoveCard]

interface Charge {
  flavor: 'sadness' | 'anger' | 'fear' | 'numbness' | 'restlessness'
  intensity: number // integer 1–10
}

interface SourceGate {
  perspective: Perspective
  note: string
  ownedToSay: boolean
}

interface BriefInputV1 {
  version: 1
  campaignId: string
  goal: string
  domain: AllyshipDomain
  face: Operation
  vector: { from: Channel; to: Channel }
  ownCharge: Charge // private orientation only
  audienceCharge: Charge // private orientation only
  audienceDepth: AudienceDepth
  approvedCta: string
  seriesTag: string
  source: SourceGate
}

interface BriefPayloadV1 extends BriefInputV1 {
  spread: Spread // Situation, Block, Move
  swapBudget: { situation: number; block: number; move: number }
}

interface BriefSessionV1 {
  version: 1
  brief: BriefPayloadV1
  post?: PostV1
  updatedAt: string
}
```

Use a runtime schema at the browser-session boundary. Invalid session data is
discarded and the steward starts a new brief; do not attempt recovery from an
unknown version.

## Domain APIs (not an HTTP API)

This is an internal private workflow. API-first here means pure, reusable domain
functions and explicit server/client seams, not new public REST routes.

```ts
function recommendSpread(input: ReadingInput, deck: AllyshipDeck): Spread
function replaceSpreadSlot(input: ReplaceSlotInput, deck: AllyshipDeck): Spread
function compileCarousel(brief: BriefPayloadV1): PostV1
function validateBriefForCompile(brief: BriefPayloadV1): ValidationResult
```

- Extract scoring and flavor mapping from `FindYourPath.tsx`; do not copy them
  into the new route. The existing player reading and steward route must use
  the same engine.
- A server-only campaign-context loader owns authentication and campaign lookup.
- A browser-session adapter owns serialization, restore, clear, and handoff.
- The route UI orchestrates these APIs but must not own business rules.

## Steward flow

The authored UX is retained, but the build must not make its form state the
source of truth.

1. **Wake** collects goal and the steward's private charge.
2. **Clean** collects editable visual vector, audience charge, and audience
   depth. Private charges are never rendered, exported, logged, or sent to a
   server action.
3. **Grow** selects one of the six Game Master operations.
4. **Show** runs the campaign reading and collects the approved CTA.
5. **Spread** presents Situation / Block / Move. A directed swap changes only
   the selected slot; maximum two swaps per slot. Manual pick is filtered to
   that position's move bias and current domain, never the full deck.
6. **Source gate** requires perspective, non-empty approved-source note, and
   an affirmative owned-to-say confirmation before compilation.
7. **Compile** creates the outline and opens the composer with the prefilled
   `PostV1`. Returning to the brief must preserve composer edits in the same
   browser session.

The initial screen can be a minimal staged form; visual parity with the handoff
is not a prerequisite for proving the compiler seam.

## Reading rules

The spread positions retain existing semantics and move biases:

- Situation: `wake_up`
- Block: `clean_up`
- Move: one of `show_up`, `grow_up`, or `open_up`

The selected face supplies the reading face bias. Campaign context supplies the
domain default. Audience charge maps to the existing flavor move. The exact
`from → to` visual vector is always steward-editable; it must not be inferred
as a hidden fact from a card.

Locking a spread validates that the three positions are distinct and satisfy
their position biases. A swap reason is optional provenance, never media copy.

## Deterministic compiler

The compiler may use only actual `MoveCard` fields. It must not depend on
nonexistent `action` or `applications` fields.

| Slide | Source | Compiler use |
|---|---|---|
| 1 · Hook | audience charge + depth | seeded felt tension; steward edits before export |
| 2 · Cost | Situation `failureModes` | names the relevant stuck pattern |
| 3 · Insight | Situation `campaignQuestion` | reframes the question for the room |
| 4 · Reframe | Block `failureModes` + `remediation` | names the trap and reopening move |
| 5 · Practice | Move `submovePrompt` + `remediation` | concrete Notice · Land · Choose practice |
| 6 · Invitation | `approvedCta` | verbatim; no generated claim |
| 7 · Domain example | Move `optimizesFor` | optional; enabled by default |
| 8 · Closing CTA | `approvedCta` | optional; disabled by default |

The compiler outputs a seven-slide post by default: the six required slides plus
the enabled domain example. Slide 8 is disabled by default. A steward may remove
the optional seventh slide, so every emitted post remains within the composer's
five-to-eight-slide constraint. Every emitted string remains editable in the
composer. Source-gate data and private charges remain session provenance only.

## Acceptance criteria

- A non-admin/non-steward cannot access the brief or consume a stored brief
  session.
- A known fixture brief produces a deterministic valid `PostV1` with 6–8
  editable slides.
- The compiler never emits `ownCharge`, `audienceCharge`, source note,
  perspective, face, or vector labels into media by default.
- Directed swap changes only the selected position; its limit is enforced; a
  filtered manual pick cannot select an out-of-bias card.
- Compilation is blocked until the source gate is complete.
- Brief → composer → return to brief preserves the exact edited `PostV1` in a
  single browser session and creates no database record.
- The existing deck reader continues to return the same spread for the same
  reading input after the shared engine extraction.

## Verification fixtures

Add fixture tests for:

1. known `BriefPayloadV1` → expected slide roles/content sources;
2. a directed swap leaves the other two card IDs unchanged;
3. no private or provenance fields occur in compiled slide text/caption;
4. invalid/expired-version session data is cleared safely;
5. global admin/steward gate accepts the intended roles and denies an ordinary
   player.

## Dependencies

- Existing deck types/data and Find Your Path reading behavior.
- The Raise Awareness composer and its current 5–8 slide/PNG contract (pending
  merge of the composer-frame PR where applicable).
- `Campaign` database model for read-only context only.
