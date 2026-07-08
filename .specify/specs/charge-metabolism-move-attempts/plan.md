# Plan: Charge Metabolism Move Attempts

## Strategy

Build the product spine before wiring more surfaces.

The MVP should create a service and data contract that can be invoked by one surface first, then expanded to Deck, Daily Charge, BAR Tune, 321, and Quest completion.

Chosen first surface: Allyship Deck. The implementation should still avoid hard-coding Deck as the only path because Daily Charge is the second host.

## Phase 1: Canonical Contract

Define shared types and service boundaries:

- `MoveAttemptSource`
- `MoveAttemptStatus`
- `MoveAttemptContext`
- `CreateMoveAttemptInput`
- `MoveRecommendationInput`
- `MoveRecommendationResult`

Target files:

- `src/lib/alchemy/show-up-primitives.ts`
- new `src/lib/charge-metabolism/move-attempts.ts`
- new `src/lib/charge-metabolism/types.ts`

## Phase 2: Recommendation Service

Create a service that accepts partial or full intake context and returns:

- vector status: none, partial, full
- route summary
- metabolize recommendation
- satisfaction recommendation
- alternates
- missing fields
- recommended next question

Target files:

- new `src/lib/charge-metabolism/recommendation-service.ts`
- tests under `src/lib/charge-metabolism/__tests__/`

## Phase 3: Persistence Shape

MVP decision: service first.

The first implementation should produce typed recommendation results and move-attempt draft snapshots without adding a database model. This lets Deck, Daily Charge, BAR Tune, 321, and Quest completion agree on the same product contract before schema gravity sets in.

Future persistence options:

1. A new Prisma `MoveAttempt` model.
2. A JSON snapshot stored on `CustomBar`/Quest completion metadata for the first slice.
3. A hybrid: service first, model second.

Recommendation: add a new `MoveAttempt` model before broad UI rollout, but not before the service contract has one real host.

Prisma impact if model is chosen:

- add `MoveAttempt`
- optional relations to `Player`, `CustomBar`, `Quest`/player quest model, and 321 session if available
- indexes on `playerId`, `campaignRef`, `sourceSurface`, `status`, `barId`, `questId`

## Phase 4: First UI Host

Chosen host:

### Allyship Deck

Best for proving the intended game loop:

```text
draw card -> dissatisfaction -> channel -> desired satisfaction -> optional blocker context -> two card recommendations -> attempt(s) -> reflection
```

Adds a reusable "Work this card" panel.

Implementation correction:

- Replace beginner freeform present/desired state fields with guided fixed options.
- Start with recognizable dissatisfaction patterns.
- Infer the channel and present state from the selected dissatisfaction.
- Reveal the clean neutral channel state as the teaching moment.
- Offer fixed satisfied-state targets instead of relying on typed resolution words.
- Treat blocker as optional context that points to where the work needs to happen.
- Let blocker context select either a self-sabotage belief or an allyship-domain need.
- Keep blocker detail, trace, and reflection as typed input.
- Return two recommendations for beginner dissatisfaction-to-satisfaction vectors:
  1. metabolize the current dissatisfaction
  2. move toward the desired satisfaction
- Do not render this as one card with two steps.
Second host:

### Daily Charge

Best for repeatable daily pushups:

```text
daily charge -> vector -> move recommendation -> attempt -> reflection
```

Adds the fastest practice loop.
Later substrate:

### Alchemy Engine

Best for reuse of existing intake/action/reflection structure.

Risk: may become too quest-arc-heavy for the simple daily practice.

## Phase 5: Surface Rollout

Roll out in this order unless product priorities change:

1. First host: Allyship Deck or Daily Charge.
2. BAR Tune: add desired charge/route affordance before graduation.
3. 321: offer Show Up handoff after clarity.
4. Quest completion: enrich completion with vector/primitive/outcome.
5. Move Library: show reusable content and usage examples without implying practice completion.
6. Steward/admin reporting: inspect campaign and system-level move attempts.

## Phase 6: Access and Privacy

Implement access rules by source surface:

- personal attempts: player private by default
- campaign attempts: steward-visible
- public attempts: shallow support metadata only
- creator analytics: aggregate or content-scoped
- admin: full review/debug access

## Verification

Focused tests:

- full vector produces route-backed recommendations
- partial vector reports missing fields and next question
- recommendation can become a move attempt snapshot
- skipped recommendation does not count as completed
- completed attempt requires artifact or reflection
- public/campaign mode does not require full emotional vector
- move library entries are not counted as attempts
- deck guided intake can produce vectors from dissatisfaction + satisfaction without typed present/desired charge strings
- optional blocker context modifies recommendation without being required to resolve the vector
- dissatisfaction-to-satisfaction intake returns two recommendations: metabolize and satisfaction
- each recommendation can become its own move attempt without counting the other as completed

## Open Decisions

- Persistence timing after first host: new model vs temporary JSON snapshot.
- Whether move attempts attach to `CustomBar` at recommendation time or only after player chooses the move.
- Whether Daily Charge should always create a BAR or can create a lightweight attempt without a BAR.
- How much of the vector is visible to players versus hidden in "why this move" copy.
- Whether advanced direct-state entry ships in the first Deck version or remains hidden until the beginner loop is proven.
- Whether the player must complete the metabolize card before unlocking the satisfaction card, or whether both cards are visible immediately with sequencing guidance.
