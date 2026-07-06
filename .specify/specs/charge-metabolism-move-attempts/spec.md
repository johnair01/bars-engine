# Spec: Charge Metabolism Move Attempts

## Purpose

Create the missing product layer that connects charge intake, emotional vectors, Show Up primitive recommendations, player practice, and completion reflection across BARS Engine.

This spec solves the gap surfaced during Emotional Alchemy move-combination planning:

- The Allyship Deck does not yet ask for guided dissatisfaction, desired target, and blocker.
- Daily Charge does not yet infer an emotional vector.
- BAR Tune captures element, altitude, and move type, but not desired state or route.
- 321 metabolizes stuckness, but does not consistently hand off into Show Up primitives.
- Quest completion records action, but not always the emotional vector or primitive practiced.
- Move libraries exist, but are not clearly separated from move recommendations.
- Player access rules are unclear across public supporters, logged-in players, stewards, admins, and creators.
- There is no canonical "move attempt" object for recommended move, chosen move, completed move, reflection, and outcome.

## Product Decision

This belongs inside BARS Engine.

Emotional Alchemy is the charge-metabolism intelligence layer inside BARS Engine. The Allyship Deck, Daily Charge, BARs, Quests, 321, and the Alchemy Engine are surfaces that can invoke it.

This is not a separate product yet. It may later become a standalone Emotional Alchemy trainer, deck, course, or daily practice product after the core BARS loop is proven.

MVP persistence is service-first. The recommendation service produces typed move-attempt drafts and context snapshots before any new database model is introduced. A persisted `MoveAttempt` model should be added only after the service contract is stable enough to wire across multiple surfaces.

MVP host is the Allyship Deck. The first player-facing loop should be a deck-native "Work this card" experience that uses the drawn card as translation context, asks for a guided dissatisfaction entry, desired charge, blocker, and internal/external orientation, then produces a service-backed move-attempt draft.

## Product Correction: Guided Dissatisfaction Intake

The MVP should not make beginner players type canonical emotional states.

Most players enter Emotional Alchemy through dissatisfaction, not through a clean channel label. The product should therefore begin with recognizable dissatisfaction patterns, infer the emotional channel, reveal the neutral emotion as "the charge doing its job," and only then ask where the player wants the charge to move.

Beginner intake:

```text
felt dissatisfaction
-> inferred channel
-> confirmation / teaching moment
-> desired satisfaction selected from structured options
-> optional blocker context
-> internal/external orientation
-> translated Show Up primitive
```

Advanced players may later receive a direct channel/state selector, but it should not be the default entry path.

The emotional vector is resolved by:

```text
present dissatisfaction state -> desired satisfaction state
```

The blocker does not resolve the vector. The blocker points to where the work needs to be done and how the existing card move should be modified.

Blocker context can be:

- a self-sabotage belief
- an allyship-domain need: Gather Resources, Skillful Organizing, Direct Action, or Raise Awareness
- omitted when the vector is clear enough

Typed input remains important for:

- optional blocker detail/context
- practice trace/artifact
- reflection
- outcome
- optional "in my words" labeling

Typed input should not be the primary mechanism for the canonical present/desired vector in the beginner deck loop.

## Core Model

```text
Charge Intake
-> Emotional Vector
-> Route / Primitive Recommendation
-> Player Move Attempt
-> Practice / Artifact
-> Reflection / Outcome
-> BAR, Quest, insight, action, or relationship change
```

## Definitions

### Charge Intake

The moment a player or campaign field captures live energy.

Examples:

- A BAR is captured.
- A daily charge is spent.
- A deck card is drawn and creates friction.
- A 321 session names stuckness.
- A quest completion reveals an unresolved emotional residue.
- A public supporter offers help in a campaign field.

### Emotional Vector

The movement from present charge to desired charge.

Minimum fields:

- present channel
- present altitude
- desired channel
- desired altitude
- target intent: satisfied, neutral, or metabolizable dissatisfaction

For the beginner Allyship Deck loop, desired charge should be selected from fixed satisfaction states. Neutral and metabolizable dissatisfaction targets remain available to advanced or non-deck surfaces, but they are not the default desired-state intake for this MVP.

Optional context:

- blocker kind
- blocker detail
- domain need
- self-sabotage belief

### Move Recommendation

The system's candidate move set produced from the vector and context.

For beginner dissatisfaction-to-satisfaction intake, the system should recommend a route hand, not one card with multiple steps.

```text
Card 1: Metabolize Current Dissatisfaction
Card 2: Translate Into Target Channel, when needed
Card 3: Transcend Target Channel Into Satisfaction
```

The first card works the charge the player actually has. Translate cards move between clean emotional channels. The final card works the satisfaction the player selected. This prevents the system from pretending one Show Up move can usually carry a full dissatisfied -> satisfied transformation.

Minimum fields:

- route hand summary
- route hand recommendations: route edge, role, primitive id, translated move copy, reason
- compatibility recommendations: metabolize and satisfaction where available
- alternate recommendations
- confidence or ambiguity flag

### Move Attempt

The actual player-facing practice instance.

A move attempt can be recommended, chosen, skipped, completed, abandoned, or reflected on.

Minimum fields:

- source surface
- actor/player
- optional BAR, quest, deck card, 321 session, or campaign context
- vector snapshot
- recommended primitive ids
- recommendation role: metabolize, translate, transcend, satisfaction, or single
- chosen primitive id
- translated move text
- orientation: internal or external
- subject: self, other, group, system, campaign, or world
- superpower/profile context
- domain/card context
- blocker
- status
- artifact/reflection/outcome

### Move Library

Reusable move content.

The library is not the same as a recommendation. A recommendation may use library content, but recommendations are contextual and per-attempt.

Move library tiers:

- canonical grammar
- GM-authored moves
- allyship deck moves
- nation/archetype/superpower moves
- book-extracted moves
- player-named or daemon-generated candidate moves

## Surfaces and Responsibilities

| Surface | Primary Role | Required Upgrade |
|---|---|---|
| Allyship Deck | Card-driven move ritual | Ask guided dissatisfaction, confirm channel, ask desired satisfaction, optionally ask blocker context, then recommend a route hand of translated Show Up cards |
| Daily Charge | Repeatable practice loop | Infer vector and create a lightweight move attempt |
| BAR Capture | Raw charge entry | Create charge intake; do not require full vector |
| BAR Tune | Make charge playable | Add desired charge/route affordance before graduation |
| 321 / Clean Up | Metabolize stuckness | Hand off to Show Up primitive when charge becomes actionable |
| Quest Completion | Record enacted movement | Store vector/primitive practiced, not just completion text |
| Alchemy Engine | Guided metabolism arc | Use move attempts as its action/reflection persistence layer |
| Move Library | Browse/review reusable moves | Separate reusable content from contextual recommendations |
| Campaign/Public Support | Low-friction support moves | Use simplified role/domain moves without full emotional inventory |

## Access Model

### Public Supporter

Gets simple campaign/domain moves.

Allowed:

- pick a role
- submit a concrete support artifact
- receive a simple next move

Not required:

- full emotional vector
- player profile
- move library browsing

### Logged-In Player

Gets personalized move recommendations.

Allowed:

- capture and tune charge
- draw deck cards
- receive vector-based move recommendations
- complete and reflect on move attempts
- browse unlocked or public move library entries

### Steward

Gets campaign-field move visibility.

Allowed:

- see campaign-captured BARs and move attempts for stewarded campaigns
- assign or suggest campaign moves
- convert support artifacts into quests or campaign provenance

### Creator

Gets composition tools.

Allowed:

- create and curate move sets
- attach moves to decks, campaigns, or domains
- see usage signals for their own published move content

### Admin / GM

Gets full system access.

Allowed:

- review move proposals
- promote/reject candidate moves
- inspect move-attempt telemetry
- tune canonical grammar and recommendation rules

## Functional Requirements

### FR1: Move Attempt Lifecycle

The system must support a canonical move attempt lifecycle:

```text
recommended -> chosen -> practiced -> reflected -> completed
recommended -> skipped
chosen -> abandoned
practiced -> needs_followup
```

### FR2: Recommendation Is Not Completion

A recommendation must not count as metabolized charge.

Charge is metabolized only when the player creates an artifact, takes an action, completes an internal practice with a recorded trace, or reflects on the attempt.

### FR2a: Dissatisfaction-to-Satisfaction Produces A Route Hand

When the player enters through a dissatisfied state and selects a satisfied target, the system must return a player-facing route hand:

- Metabolize card: present dissatisfied channel -> present neutral channel.
- Translate card: present neutral channel -> target neutral channel, only when current and target channels differ.
- Transcend card: target neutral channel -> target satisfied channel.

These are separate recommendations and may become separate move attempts. The UI must not collapse them into one card with multiple steps.

Beginner route hands should usually contain 1-3 cards depending on starting altitude and whether the target channel differs from the current channel.

The current Wu Xing graph-search planner remains available for advanced/mastery modes, but the beginner Allyship Deck loop should use direct route-hand grammar:

```text
metabolize -> direct translate -> transcend
```

### FR3: Context Snapshot

Every move attempt must preserve the recommendation context as a snapshot so later changes to libraries, player profile, cards, or primitives do not rewrite history.

### FR4: Source Surface

Every move attempt must know where it came from:

- `allyship_deck`
- `daily_charge`
- `bar_capture`
- `bar_tune`
- `shadow_321`
- `quest_completion`
- `alchemy_engine`
- `campaign_support`
- `admin_generated`

### FR5: Vector Support

Move attempts may be created with a full vector, partial vector, or no vector.

Rules:

- Full vector: present state + desired state.
- Partial vector: present charge only, desired state inferred or asked later.
- No vector: public/campaign moves and legacy completions may still create attempts with context only.

### FR5a: Beginner Vector Intake Is Structured

The default player-facing deck intake must use fixed options for the canonical emotional vector:

- dissatisfaction options map to present channel + dissatisfied altitude
- channel confirmation reveals the neutral job of the emotion
- desired target options map to fixed satisfaction states
- blocker options map to self-sabotage beliefs or allyship-domain needs

Free text may supplement the vector, but it must not be required to resolve the canonical present/desired states for the beginner loop.

### FR6: Hand Off from 321 to Show Up

When a 321 session creates sufficient clarity, the system should offer a Show Up primitive recommendation instead of ending at insight.

### FR7: BAR Tune Route Awareness

BAR Tune should eventually ask not only "what is this?" but "where is this trying to go?"

This adds desired charge and route planning without blocking quick capture.

### FR8: Quest Completion Enrichment

Quest completion should store:

- whether a move attempt was involved
- primitive practiced
- emotional vector if known
- outcome/reflection

### FR9: Library Separation

Move libraries provide reusable content. Move attempts store contextual usage.

No move library entry should be treated as proof that a player practiced the move.

### FR10: Privacy and Stewardship

Move attempts attached to personal BARs are private to the player unless shared.

Move attempts attached to campaign-captured BARs are visible to authorized campaign stewards.

Public supporter attempts should avoid deep emotional inventory by default.

## Data Model Proposal

### `MoveAttempt`

Suggested fields:

```ts
type MoveAttempt = {
  id: string
  playerId?: string | null
  campaignRef?: string | null
  stewardId?: string | null

  sourceSurface: MoveAttemptSource
  status: MoveAttemptStatus

  barId?: string | null
  questId?: string | null
  deckCardId?: string | null
  shadow321SessionId?: string | null
  alchemyArcId?: string | null

  presentState?: string | null
  desiredState?: string | null
  blockerText?: string | null
  vectorSnapshot?: Json | null
  routeSnapshot?: Json | null

  recommendedPrimitiveIds: string[]
  chosenPrimitiveId?: string | null
  translationSnapshot?: Json | null

  orientation?: 'internal' | 'external' | null
  subject?: 'self' | 'other' | 'group' | 'system' | 'campaign' | 'world' | null
  superpowerKey?: string | null
  domainKey?: string | null

  artifactText?: string | null
  reflectionText?: string | null
  outcome?: string | null

  createdAt: Date
  chosenAt?: Date | null
  practicedAt?: Date | null
  reflectedAt?: Date | null
  completedAt?: Date | null
}
```

### `MoveRecommendation`

MVP can be an in-memory/service output rather than a persisted table.

Persist the selected recommendation as a `MoveAttempt` snapshot when the player chooses or starts a move.

## Acceptance Criteria

- There is one canonical spec-defined lifecycle for move attempts.
- Every major charge-metabolism surface has a clear responsibility.
- Move library content is distinct from move attempts.
- Access levels are explicit.
- The next implementation can add a service boundary before UI wiring.
- The Emotional Alchemy primitive recommendation engine can produce recommendations that become move attempts.
- Existing BAR/Quest/321 flows are not required to change immediately, but the migration path is explicit.

## Non-Goals

- Do not build a standalone Emotional Alchemy product yet.
- Do not expose the full emotional vector matrix to players.
- Do not require full vector intake for public supporters.
- Do not migrate every legacy completion immediately.
- Do not force every captured BAR to become a move attempt at capture time.
- Do not treat recommendation as proof of metabolism.

## Related Specs

- `emotional-alchemy-move-combinations`
- `singleplayer-charge-metabolism`
- `bars-v1-intake-tune`
- `move-ecology-emergent`
- `pick-your-move-invitation-surface`
- `allyship-deck-experience`
- `transformation-move-library`
