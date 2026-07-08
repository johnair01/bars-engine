# Emotional Alchemy Move Combinations

## Problem
Players can name a current felt state and a desired next state, but the system cannot yet return a concrete sequence of emotional alchemy moves between them.

Example: a player feels restless and wants peace. In the ontology, restlessness is `joy:dissatisfied` and peace is `neutrality:satisfied`. The system should be able to suggest a path such as:

1. Stabilize restlessness into usable joy.
2. Translate joy into neutrality.
3. Transcend neutrality into peace.

These repeated moves are the "pushups" of emotional alchemy mastery.

Important nuance: "desired state" does not always mean a final satisfied state. Satisfied states are the obvious desired outcomes, but the game also needs to support:

- **Satisfaction targets:** e.g. peace, bliss, triumph, poignance, excitement/wonder.
- **Neutral targets:** Anger, Sadness, Joy, Neutrality, and Fear as the emotions doing their job; useful when the player needs clean signal before completion.
- **More metabolizable dissatisfied targets:** e.g. moving from numb apathy into honest grief, or from scattered restlessness into clean frustration, when the new dissatisfaction is more workable than the old one.

The route planner should therefore treat the destination as a **target practice state**, not necessarily as a "better feeling" in a simplistic hedonic sense.

## Hostile Review Integration

The first prototype proved the shape of the feature but exposed five design risks:

- The API promised "any current state to any desired state" while the graph only routed upward altitude movement.
- `stabilize` reused transcend move IDs and names, blurring different felt practices.
- The planner duplicated canonical Wuxing and move data instead of deriving from shared graph definitions.
- Some count fields were hardcoded claims rather than computed facts.
- Tests covered the restlessness-to-peace anecdote but not the all-pairs routing contract.

This spec now treats those risks as implementation requirements, not later polish.

## Requirements
- Represent the canonical state space as 5 channels x 3 altitudes = 15 emotional states.
- Provide canonical feeling labels for each state, including `restlessness` and `peace`.
- Count the directed source/target combination space from graph definitions, not hardcoded totals.
- Model two connected graphs:
  - **Doctrine graph:** canonical states, Wuxing cycles, canonical move families, and existing scene-resolution vectors.
  - **Practice graph:** actual repeatable exercises/edges a player can practice over time.
- Expose legal direct practice moves:
  - `stabilize`: same channel, dissatisfied to neutral.
  - `transcend`: same channel, neutral to satisfied.
  - `generate`: sheng cycle, same altitude.
  - `control`: ke cycle, same altitude.
- Keep `stabilize` as a first-class practice operation with its own IDs/names/copy. It may carry canonical lineage metadata, but it must not masquerade as a transcend move.
- Return route results with explicit routing mode:
  - `growth`: routes toward more regulated or more metabolizable targets without forcing satisfied completion.
  - `mastery`: may use controlled descent if the graph defines a safe practice edge for it.
- Classify target intent so "desired" is not collapsed into "satisfied":
  - `satisfaction`: destination is a satisfied state.
  - `stabilization`: destination is a neutral state, meaning the emotion is doing its job without distortion or forced completion.
  - `metabolizable_dissatisfaction`: destination is a dissatisfied state that is easier to work with than the current one.
- Support multiple path suggestions so the game can offer player choice.
- Include route metadata for product use: `routeType`, `whyThisRoute`, `risk`, `bestWhen`, and `blockerPrompt`.
- Preserve the existing `resolveMoveDestination` behavior for threshold scenes until UI/server callers are intentionally migrated.
- Report the distinction between:
  - 25 theoretical channel pairs (5 x 5).
  - 15 canonical channel-pair move families (5 transcend, 5 generate, 5 control).
  - 30 current scene-resolution vectors (existing `wuxing.ts` altitude deltas).
  - 40 mastery-practice direct edges (horizontal translate plus vertical altitude steps).
- Treat the `40` practice-edge count as provisional until the mastery graph explicitly includes or rejects controlled descent.

## Obsidian Context
- `The Library/02 Index/KEYTERM-EA-Channels.md`: five channels x three altitudes = fifteen canonical states.
- `The Library/02 Index/KEYTERM-EMOTIONAL-ALCHEMY.md`: EA is a state ontology, need generator, and move generator; current code resolves Transcend +1, Generate +1, Control -1.
- `The Library/02 Index/KEYTERM-EA-MOVE-MATRIX.md`: names the move matrix and reveals a counting ambiguity: "25 valid pairs" in title, but the tables encode 15 channel-pair families and 30 concrete altitude vectors.
- `The Library/05 Research/Emotional Alchemy/Emotional Alchemy - Missing Move Detection.md`: dissatisfied states are signals for missing moves, not just symptoms to regulate.
- `The Library/05 Research/Emotional Alchemy/Emotional Alchemy Move Families.md`: frames Transcend as within-channel completion and Translate as moving charge into a more useful channel.
- `The Library/02 Index/KEYTERM-ALLYSHIP-SUPERPOWERS.md`: canonical superpower axis; superpowers are separate from team Role, House/domain, and belief.
- `src/lib/superpowers/types.ts`: code-backed superpower list and campaign definitions.
- `.specify/specs/emotional-alchemy-move-combinations/source-inventory.md`: grounded inventory for emotional vectors, superpowers, domains, ensemble roles, and scenario boundaries.
- `.specify/specs/emotional-alchemy-move-combinations/golden-scenarios-and-move-prototypes.md`: first clean-axis design test bench with 12 golden scenarios, separate axis tables, and 20 move card prototypes.
- `.specify/specs/emotional-alchemy-move-combinations/hostile-review-golden-prototypes.md`: hostile review of the first 20 prototypes, including mechanics, axis bleed, and remediation standard.
- `.specify/specs/emotional-alchemy-move-combinations/hostile-review-golden-prototypes-v2.md`: corrected hostile review using inner/outer Show Up and enacted-capacity criteria.
- `.specify/specs/emotional-alchemy-move-combinations/move-primitives-and-translation.md`: primitive-first architecture for generating contextual Show Up moves without authoring every superpower/domain combination.
- `.specify/specs/emotional-alchemy-move-combinations/primitive-translation-proofs.md`: proof set showing primitive translations for MP02, MP08, MP19, MP05, and MP12.
- `.specify/specs/emotional-alchemy-move-combinations/primitive-data-schema.md`: MVP TypeScript schema and validation rules for primitive implementation.

## Allyship Axis Boundaries

When emotional vectors become Show Up move recommendations, the system must not hallucinate or freely invent the third-axis examples. The library distinguishes:

- **Superpowers:** Connector, Strategist, Disruptor, Escape Artist, Catalyst/Coach, Alchemist, Storyteller.
- **Domains:** Direct Action, Raising Awareness / Impact Storytelling, Skillful Organizing, Gathering Resources / Fundraising.
- **Ensemble roles:** Spark, Anchor, Builder, Scout, Witness.
- **Scenarios:** concrete situations inside a domain, superpower, recipient, and co-conspirator context.

Therefore the move-recommendation grammar should treat a recommendation as:

```text
emotional vector -> move primitive -> translation function -> candidate Show Up move
```

Where the translation function applies:

```text
orientation + subject + superpower + domain + blocker + card/context
```

Domains and superpowers may combine, but they are not interchangeable. "Storytelling" can appear as a domain expression, while **Storyteller** is the superpower. "Skillful Organizing" is a domain, while **Strategist** may be a natural superpower fit for that domain. "Team coordination" or "repair" are not superpowers by default; they are scenario or practice-context language unless a library source elevates them.

Show Up is not synonymous with external action. Emotional Alchemy Show Up can be internal or external:

- **Internal Show Up:** self-allyship, inner commitment, values bridge, self-trust artifact, inner boundary, personal plan, or embodied permission.
- **External Show Up:** ask, message, agreement, boundary, handoff, interruption, resource movement, repair, public truth, or witnessed action.

The test is whether transformed capacity is enacted. Internal does not automatically mean Clean Up, and external does not automatically mean Show Up.

## User Stories
- As a player, I can enter "restless" as current and "peaceful" as desired and receive a few concrete moves that route me there.
- As a player, I can choose a neutral target such as clean Anger, Sadness, Joy, Neutrality, or Fear when a satisfied state feels too far away.
- As a player, I can route toward a more workable dissatisfaction when the first step is not feeling better, but making the charge clearer.
- As a designer, I can inspect how many emotional state combinations exist and which direct practice moves connect them.
- As the game loop, I can turn a desired state into a sequence of repeatable practice moves and later attach blockers to each step.
- As a designer, I can generate move examples only from library-backed superpowers, domains, ensemble roles, and scenarios without mixing their categories.

## Acceptance Criteria
- The planner reports 15 states and 210 ordered non-self source/target combinations.
- Count reports derive from exported graph definitions.
- Route results classify target intent as `satisfaction`, `stabilization`, or `metabolizable_dissatisfaction`.
- `planPracticeRoutes(joy:dissatisfied, neutrality:satisfied, { mode: 'growth' })` returns a path whose first suggestion is:
  - `joy:dissatisfied -> joy:neutral`
  - `joy:neutral -> neutrality:neutral`
  - `neutrality:neutral -> neutrality:satisfied`
- `planPracticeRoutes(joy:dissatisfied, neutrality:neutral, { mode: 'growth' })` can stop at clean Neutrality without forcing the extra step into peace.
- Routes to dissatisfied targets require a `metabolizable_dissatisfaction` explanation rather than presenting the result as simple improvement.
- The planner can return at least three unique suggestions for the restlessness-to-peace route when available.
- Growth-mode all-pairs tests document reachable and unreachable state pairs.
- Mastery-mode all-pairs tests either prove all 210 non-self pairs are routable or snapshot explicit unreachable reasons.
- Tests cover state counts, direct move counts, label lookup, route metadata, stabilize/transcend identity separation, and the restlessness-to-peace example.
- The existing threshold scene resolver behavior remains unchanged.

## Non-goals
- No database migration.
- No UI changes in this slice.
- No replacement of existing threshold encounter scene routing yet.
