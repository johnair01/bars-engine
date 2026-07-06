# Gap Analysis: Translate Vector Move Families

## Date

2026-07-04

## Basis

This analysis follows:

- `translate-vector-families-hostile-review.md`
- `src/lib/alchemy/vector-move-families.ts`

The hostile review found that the 20 translate families were structurally correct but not yet consistently playable.

Since then, the registry has gained:

- typed `mechanicTags`
- tuned first primitive choices for 8 high-risk vectors
- authored `mechanicOperation` procedures for those 8 vectors
- Wake Up / Open Up / Clean Up / Grow Up / Show Up variants
- explicit variant roles: `processing`, `bridge`, `action`

## Current State

### Solved

The route grammar is no longer the main weakness.

The system can now route:

```text
dissatisfied X -> neutral X -> neutral Y -> satisfied Y
```

The recommendation selector now prefers authored vector-family choices before falling back to generic primitive scoring.

The eight highest-risk translate families now have playable mechanic operations:

| Vector | Operation |
|---|---|
| `anger:neutral->fear:neutral` | Risk Before Force |
| `fear:neutral->joy:neutral` | Turn The Edge Into An Experiment |
| `joy:neutral->fear:neutral` | Map The Exposure In The Possibility |
| `neutrality:neutral->anger:neutral` | Find Where Force Belongs |
| `neutrality:neutral->fear:neutral` | Find The Field Edge |
| `neutrality:neutral->joy:neutral` | Find The Live Part |
| `joy:neutral->sadness:neutral` | Find The Care In The Joy |
| `neutrality:neutral->sadness:neutral` | Find What Matters In The Field |

### Still Missing

The remaining weakness is not "can the system pick a route?"

It is:

```text
Can the system recommend a move that feels like a real practice rep?
```

## Gap 1: 12 Translate Families Still Have No Mechanic Operation

These families have tags, primitive preferences, expressions, and completion signals, but no concrete procedure.

| Vector | Current Mechanic | Gap |
|---|---|---|
| `anger:neutral->sadness:neutral` | Desire/boundary reveals care and distance | Needs care-under-boundary operation that is not always repair |
| `anger:neutral->joy:neutral` | Desire becomes playable participation | Needs anti-manipulation/anti-cuteness operation |
| `anger:neutral->neutrality:neutral` | Force enters whole-field perspective | Needs field-mapping operation; current first primitive may still be too handoff-shaped |
| `sadness:neutral->anger:neutral` | Care reveals desire/boundary/obstruction | Needs desire/claim operation, not only protect/refuse |
| `sadness:neutral->fear:neutral` | Care reveals vulnerability/risk | Needs vulnerability-to-threshold operation |
| `sadness:neutral->joy:neutral` | Meaning reopens vitality | Needs anti-bypass participation operation |
| `sadness:neutral->neutrality:neutral` | Care settles into whole-field acceptance | Needs acceptance/container operation |
| `fear:neutral->anger:neutral` | Risk reveals boundary/action | Needs protection-without-control operation |
| `fear:neutral->sadness:neutral` | Threat reveals care/contact | Needs care-under-threat operation that is not always repair |
| `fear:neutral->neutrality:neutral` | Alertness becomes stable orientation | Needs orientation/settling operation; current first primitive may still over-index exit |
| `joy:neutral->anger:neutral` | Aliveness meets obstacle/desire | Needs desire/obstacle operation |
| `joy:neutral->neutrality:neutral` | Aliveness settles into coherence | Needs aliveness-to-ground operation that is not productivity |

### Risk

These 12 families can still produce recommendations that sound correct but feel underpowered.

The registry can name the vector, but the player may still get a generic primitive rather than a concrete move.

## Gap 2: The App Does Not Yet Surface Mechanic Operations

The `mechanicOperation` data exists in the registry, but the recommendation service still primarily returns:

```text
edge
primitiveMatch
translated primitive move
```

It does not yet expose:

- mechanic operation title
- operation steps
- five practice variants
- whether a recommendation is processing, bridge, or action
- player output/completion criteria from the vector operation

### Risk

The system may have the right practice data but still show the player the older generic primitive translation.

That means the grammar is improved internally, but the player experience may not improve enough.

## Gap 3: Blockers Do Not Yet Select A Practice Lens

The five-lens structure creates a powerful distinction:

```text
Wake Up -> Open Up -> Clean Up -> Grow Up -> Show Up
```

But blocker data does not yet decide which lens should be emphasized.

Examples:

| Blocker Type | Likely Lens |
|---|---|
| "I do not know what I feel" | Wake Up |
| "I cannot receive this charge" | Open Up |
| "This is tangled with a belief/story/defense" | Clean Up |
| "I need to hold this more maturely" | Grow Up |
| "I know what is true but need to act" | Show Up |

### Risk

Every recommendation may default toward Show Up even when the player is actually blocked at Open Up or Clean Up.

That recreates the old confusion:

```text
action recommendation
```

when the actual needed move is:

```text
become available to the charge
```

## Gap 4: Primitive Layer Is Still Too Coarse

The hostile review named missing vector-native primitives:

- locate edge / threshold
- map field
- reveal desire
- restore participation
- name tenderness / find care
- right-size force

Mechanic tags and operations reduce the pressure, but the recommendation service still maps onto MVP primitives like:

- `bound_the_ask`
- `make_meaning_actionable`
- `create_handoff`
- `repair_without_performance`

### Risk

The primitive label may still misrepresent the move.

For example:

```text
neutrality -> joy
```

The operation is "Find The Live Part," but the primitive is still `make_meaning_actionable`.

That is usable, but not exact.

## Gap 5: Source Coverage Flags Need Recalibration

After authoring operations for the 8 high-risk families, some coverage flags may now be stale.

Likely changes:

| Vector | Current Coverage | Suggested Coverage |
|---|---|---|
| `anger:neutral->fear:neutral` | stub | partial |
| `joy:neutral->fear:neutral` | stub | partial |
| `neutrality:neutral->anger:neutral` | stub | partial |
| `neutrality:neutral->joy:neutral` | stub | partial |

But "partial" should mean:

```text
has a playable mechanic operation but not full move-card copy/source-backed card set
```

### Risk

Coverage will stop meaning anything if `stub`, `partial`, and `good` are not defined by clear criteria.

## Gap 6: Move-Card Copy Is Still Missing

The eight operations are playable mechanics, but they are not full move cards.

Missing card fields likely include:

- player-facing title
- short instruction
- long instruction
- timebox
- difficulty/intensity
- inner/external mode
- completion checkbox
- reflection prompt
- domain/superpower translation hooks
- blocker adaptation rules

### Risk

The mechanic is good enough for internal routing and early UX, but not yet good enough for a collectible move-card system.

## Gap 7: Domain And Superpower Translation Is Not Proven Against Mechanic Operations

The system can translate primitives through domain/superpower context, but it does not yet translate vector operations.

Unproven examples:

```text
Find The Live Part + Storytelling
Find The Live Part + Skillful Organizing
Find The Live Part + Direct Action
Find The Live Part + Gather Resources
```

These should be meaningfully different while preserving the same underlying vector mechanic.

### Risk

Domain/superpower translation may collapse back into generic flavor text instead of changing the move expression.

## Gap 8: Completion And Outcome Data Are Not Yet Captured Per Lens

The move attempt object can track recommendations and completion, but it does not yet clearly record:

- selected practice lens
- whether the completed work was processing, bridge, or action
- mechanic operation completed
- player output
- whether a Show Up action actually happened
- whether the vector shifted

### Risk

Players could get credit for "doing the move" without the system knowing whether they processed, bridged, or acted.

That blocks mastery tracking.

## Priority Remediation

### P0: Surface Mechanic Operations In Recommendations

Update the recommendation service so vector-family recommendations can include:

- `mechanicOperation`
- recommended practice lens
- role: processing / bridge / action
- operation output
- completion criteria

This is the fastest path from internal grammar to player-visible improvement.

### P1: Add Lens Selection From Blockers

Create a small resolver:

```ts
selectPracticeLens(input): VectorMovePracticeLens
```

Inputs:

- blocker kind
- present/desired vector
- player optional choice

Outputs:

- default lens
- explanation
- whether the result is processing, bridge, or action

### P2: Author The Remaining 12 Mechanic Operations

Do not write full card copy yet.

Bring the remaining 12 translate families up to the same standard as the first 8:

- title
- intent
- steps
- output
- completion criteria
- five practice variants

### P3: Recalibrate Coverage Flags

Define coverage criteria:

| Coverage | Meaning |
|---|---|
| `stub` | Has route semantics and tags, but no playable operation |
| `partial` | Has a playable operation, but not full source/card/domain coverage |
| `good` | Has source-backed mechanics, move seeds, and enough card-ready detail |

Then update flags accordingly.

### P4: Prototype Operation-To-Card Translation

Create card prototypes from mechanic operations before expanding into all domain/superpower combinations.

Suggested prototype set:

- Find The Care In The Joy
- Find The Live Part
- Risk Before Force
- Find Where Force Belongs

## Recommended Next Step

Implement P0 and P1 together:

```text
route edge
-> vector family
-> mechanic operation
-> selected practice lens
-> recommendation payload
```

This will let the app say:

```text
You are not ready for Show Up yet.
This route currently wants Open Up:
receive the care inside the joy before turning it into action.
```

That is the product-level payoff of the hostile review.
