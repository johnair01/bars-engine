# Hostile Review: 20 Translate Vector Families

## Date

2026-07-03

## Review Target

The 20 neutral-to-neutral translate families in:

```text
src/lib/alchemy/vector-move-families.ts
```

These families route:

```text
neutral X -> neutral Y
```

They are meant to become Emotional Alchemy Show Up move families, not generic reflections.

## Executive Finding

The translate registry is a strong architectural move, but the current 20 families are still only halfway alive.

They mostly answer:

```text
What relationship exists between source emotion and target emotion?
```

They do not yet consistently answer:

```text
What does the player actually do to translate this clean charge into the next clean charge?
```

That gap matters because vector routing can now confidently select a family. If the selected family is vague, the system will become more confidently vague.

## What Is Working

- The 20 ordered translate pairs are all present.
- Each family has a route role, source channel, target channel, mechanic, primitive preferences, expressions, completion signal, and failure mode.
- The core grammar is cleaner than the old generic primitive scorer.
- Translate-into-sadness is much stronger than the rest because it has a clearer theory: reveal care, distance, contact, repair, or tenderness.
- The first primitive is now intentionally authored and locked by tests.

## Major Findings

### 1. Several Families Name The Destination But Not The Mechanism

Weak pattern:

```text
Let X reveal Y.
```

That is a useful ontology sentence, but it is not a playable move.

Examples:

- `neutrality:neutral->joy:neutral`: "Let whole-field seeing reveal aliveness and participation."
- `neutrality:neutral->anger:neutral`: "Let whole-field seeing reveal desire, obstruction, or force."
- `joy:neutral->fear:neutral`: "Let possibility reveal exposure, edge, or risk."
- `sadness:neutral->fear:neutral`: "Let care reveal stakes, vulnerability, and risk."

These are true, but they are not yet mechanics. The player still needs a concrete operation:

- scan for the missing thing
- choose a constraint
- mark a threshold
- convert a felt signal into an ask
- test a small exposure
- create a boundary condition
- contact the care underneath

### 2. `repair_without_performance` Is Overused As A Sadness Magnet

Translate-into-sadness currently leans on `repair_without_performance` across multiple source channels:

- `anger -> sadness`
- `fear -> sadness`
- `joy -> sadness`
- `neutrality -> sadness`

This is sometimes right, especially when the sadness target involves impact, contact, or rupture.

But it is not always right. Sadness is not only repair. Sadness is also:

- tenderness
- longing
- honoring
- release
- receiving
- beauty
- distance
- belonging
- grief
- devotion

If every route into sadness becomes repair, the system will accidentally moralize sadness: "you must have harmed someone." That is too narrow.

### 3. `create_handoff` Is Doing Too Much Neutrality Work

Neutrality translations often prefer `create_handoff`:

- `anger -> neutrality`
- `sadness -> neutrality`
- `joy -> neutrality`
- `neutrality -> anger`
- `neutrality -> fear`
- `neutrality -> joy`

This makes sense when the blocker is overheld responsibility or invisible labor. It is weak when the actual movement is settling, sequencing, witnessing, orienting, or holding the whole field.

The danger: neutrality becomes project management.

Clean neutrality is not always a handoff. Sometimes it is:

- witnessing without collapse
- seeing the field
- sequencing
- pausing
- right-sizing
- creating a container
- letting timing emerge

### 4. Fear Translations Are Under-Theorized

Fear has two different clean functions that are currently blurred:

- discernment: identify risk, edge, unknown, threat, threshold
- threshold work: approach, scout, test, retreat, or enter

Examples:

- `anger -> fear` should often be "temper force by locating risk before acting."
- `sadness -> fear` should often be "care exposes what is vulnerable."
- `joy -> fear` should often be "possibility creates exposure."
- `neutrality -> fear` should often be "field view reveals the relevant edge."

The registry currently tends to say "ask/bound/scout" but does not distinguish risk-identification from threshold-engagement.

This suggests we may need either:

- a stronger `identify_edge` / `locate_threshold` primitive, or
- better family mechanics that make `bound_the_ask` and `clean_exit` less blunt.

### 5. Joy Translations Risk Becoming Productivity Or Enthusiasm

Translate-into-joy families are promising but fragile:

- `anger -> joy`: demand becomes game/participation
- `sadness -> joy`: meaning re-opens vitality
- `fear -> joy`: edge becomes curiosity/experiment
- `neutrality -> joy`: field reveals growth/participation

The risk is that joy becomes "make it fun" or "turn it into action." That misses clean joy’s job: aliveness, possibility, participation, growth, delight.

These need mechanics that protect joy from becoming:

- forced positivity
- gamified avoidance
- scattered enthusiasm
- overpromising
- productivity cosplay

### 6. Anger Translations Need Cleaner Desire Language

Translate-into-anger is generally stronger than fear/joy, but still has an issue:

- `sadness -> anger`: care reveals what must be protected
- `fear -> anger`: risk reveals boundary/action
- `joy -> anger`: aliveness meets obstacle
- `neutrality -> anger`: field reveals what needs force

These are plausible. But the actual mechanics must be desire-centered, not just boundary-centered.

Anger is not only "no." It is also:

- desire
- agency
- direction
- appetite
- claiming
- clean demand
- movement toward
- force in service of value

If all anger translations become boundaries, anger gets flattened.

### 7. Source Coverage Flags Are Too Generous In Some Places

Some entries marked `partial` are effectively stubs with better prose.

Likely overmarked as partial:

- `neutrality -> anger`
- `neutrality -> joy`
- `joy -> fear`
- `sadness -> fear`
- `anger -> fear`

These should stay `stub` until they have move-card mechanics beyond "reveal edge/risk/aliveness."

## Pair-Level Review

| Vector | Current Status | Hostile Verdict | Priority |
|---|---|---|---|
| `anger->sadness` | Strongest translate-into-sadness entry | Good mechanic, but repair is too narrow as first primitive unless impact/rupture is present | Medium |
| `anger->fear` | Stub | Needs sharper "risk check before force" mechanics; `clean_exit` first feels suspicious | High |
| `anger->joy` | Stub | Promising, but "turn demand into game" can become manipulative or cute | Medium |
| `anger->neutrality` | Partial | Good route; should prefer field-mapping/sequence over handoff by default | High |
| `sadness->anger` | Partial | Good theory; needs desire/claim mechanics, not only protect/refuse | Medium |
| `sadness->fear` | Stub | Good theory; needs vulnerability/threshold mechanics | High |
| `sadness->joy` | Partial | One of the better translate arcs; needs anti-bypass guardrails | Medium |
| `sadness->neutrality` | Partial | Solid; risk is making neutrality into containment instead of acceptance | Medium |
| `fear->anger` | Partial | Good; needs distinguish protection from control | Medium |
| `fear->sadness` | Partial | Good, but repair-first can over-moralize fear | High |
| `fear->joy` | Partial | Good arc; `clean_exit` first is probably wrong for curiosity/participation | High |
| `fear->neutrality` | Partial | Good; may need orientation primitive more than exit primitive | Medium |
| `joy->anger` | Partial | Good; needs desire/obstacle mechanics | Medium |
| `joy->sadness` | Partial | Good; repair-first is likely wrong unless joy harmed or bypassed someone | High |
| `joy->fear` | Stub | Needs exposure/possibility mechanics; `clean_exit` first is questionable | High |
| `joy->neutrality` | Partial | Good, but should not become "structure your joy into usefulness" | Medium |
| `neutrality->anger` | Stub | Needs strong "where force belongs" decision mechanic; handoff first is weak | High |
| `neutrality->sadness` | Partial | Good; repair-first may be too narrow | High |
| `neutrality->fear` | Partial | Good theory; handoff first is likely wrong unless blocker is role/need | High |
| `neutrality->joy` | Stub | Needs aliveness detection mechanics; handoff first is weak | High |

## Root Cause

We are still using a primitive set that was designed before the vector-family registry existed.

The registry now knows the emotional vector, but the primitive set is missing several vector-native primitives:

- locate threshold / identify edge
- map the field
- reveal desire
- restore participation
- name tenderness
- right-size force
- find the live part

Because those do not exist yet, the registry is forced to map nuanced translate families onto broad MVP primitives like:

- `clean_exit`
- `create_handoff`
- `repair_without_performance`
- `make_meaning_actionable`

Those primitives are useful, but they are too coarse to carry all 20 translate routes.

## Remediation Strategy

Do not expand into 20 fully authored move cards immediately.

First add a small layer between vector families and primitives:

```text
vector family
-> vector mechanic tag
-> primitive or move-card seed
```

Recommended mechanic tags:

- `reveal_care`
- `reveal_desire`
- `locate_edge`
- `map_field`
- `restore_participation`
- `right_size_force`
- `name_tenderness`
- `orient_to_threshold`

Then each translate family gets a mechanic tag before it gets full card copy.

## Immediate Tuning Candidates

Change first primitive candidates for these before writing more copy:

| Vector | Current First | Suspicion | Better Direction |
|---|---|---|---|
| `anger->fear` | `clean_exit` | Exiting is not the first move; risk-location is | `bound_the_ask` or new `locate_edge` |
| `fear->joy` | `clean_exit` | Exiting blocks curiosity if chosen too early | `make_meaning_actionable` or new `restore_participation` |
| `joy->fear` | `clean_exit` | Possibility needs exposure-mapping before exit | `bound_the_ask` or new `locate_edge` |
| `neutrality->anger` | `create_handoff` | Handoff is too specific; force-location is prior | `interrupt_pattern` or new `reveal_desire` |
| `neutrality->fear` | `create_handoff` | Role handoff is not edge detection | `bound_the_ask` or new `locate_edge` |
| `neutrality->joy` | `create_handoff` | Handoff is not aliveness detection | `make_meaning_actionable` or new `restore_participation` |
| `joy->sadness` | `repair_without_performance` | Joy-to-sadness is often tenderness, not repair | `name_care_distance` or new `name_tenderness` |
| `neutrality->sadness` | `repair_without_performance` | Field-to-care is often witnessing, not repair | `name_care_distance` |

## MVP Recommendation

For the next implementation pass, do not try to perfect all 20.

Upgrade the 8 high-risk families above by:

1. changing first primitive where obviously wrong,
2. adding a `mechanicTags` field to `VectorMoveFamily`,
3. writing one concrete player operation per high-risk family,
4. adding tests for those 8 first primitive choices.

That gives us a better translate layer without exploding into full card authoring too early.

## Implementation Update

The next pass added typed `mechanicOperation` data for the 8 high-risk translate vectors.

Each authored operation now includes:

- title
- intent
- concrete steps
- player output
- completion criteria
- wake up / open up / clean up / grow up / show up variants
- an explicit role for each variant: processing, bridge, or action

Authored operations:

| Vector | Mechanic Operation |
|---|---|
| `anger:neutral->fear:neutral` | Risk Before Force |
| `fear:neutral->joy:neutral` | Turn The Edge Into An Experiment |
| `joy:neutral->fear:neutral` | Map The Exposure In The Possibility |
| `neutrality:neutral->anger:neutral` | Find Where Force Belongs |
| `neutrality:neutral->fear:neutral` | Find The Field Edge |
| `neutrality:neutral->joy:neutral` | Find The Live Part |
| `joy:neutral->sadness:neutral` | Find The Care In The Joy |
| `neutrality:neutral->sadness:neutral` | Find What Matters In The Field |

These are not full move cards yet. They are the first playable mechanic layer between vector-family routing and card/domain/superpower translation.

The five-lens structure clarifies that Emotional Alchemy Show Up moves can have inner and external expressions without confusing all inner work with Clean Up:

| Lens | Role | Purpose |
|---|---|---|
| Wake Up | Processing | Notice and identify the charge/mechanic. |
| Open Up | Processing | Receive/contact more of the charge before interpreting, fixing, or acting. |
| Clean Up | Processing | Separate clean signal from distortion, story, shadow, or defended urgency. |
| Grow Up | Bridge | Choose the maturity level, capacity, or right-sized form. |
| Show Up | Action | Make the move in the world or produce the concrete artifact/action. |

For `joy:neutral->sadness:neutral`, the operation was renamed from "Find What Joy Makes Tender" to "Find The Care In The Joy" to avoid vague tenderness language. The mechanic is specifically to locate the care inside the joy, then honor that care without collapsing joy or forcing repair.
