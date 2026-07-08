# Emotional Vector Move Inventory

## Date

2026-07-03

## Purpose

Create the missing move inventory layer for beginner Emotional Alchemy route hands.

The route grammar is now strong:

```text
dissatisfied X -> neutral X -> satisfied X
```

and cross-channel satisfaction routes use:

```text
dissatisfied X -> neutral X -> neutral Y -> satisfied Y
```

The remaining gap is not primarily routing or scoring. It is inventory:

```text
Which move families exist for each emotional vector?
```

## Library Check

### Existing Sources Found

The library already contains several partial move inventories:

| Source | What It Contains | Useful For | Limitation |
|---|---|---|---|
| `The Library/02 Index/KEYTERM-EA-CHANNEL-*.md` | Channel mechanics for stabilize/transcend by emotion | Best source for same-channel vector semantics | Does not provide 20 direct neutral-to-neutral translate move families |
| `The Library/02 Index/KEYTERM-EA-MOVE-MATRIX.md` | Wuxing generate/control/transcend matrix | Good graph ontology and legacy route reference | Not the beginner route-hand inventory; includes graphable descents and cycle-only translation |
| `The Library/08 Source Library/Personal Development and Coaching/Emotional Alchemy/.../Downloads 4.17/Emotional_Alchemy_Move_List.txt` | Inner/external move names for five channels and five satisfaction states | Useful seed names for move cards | Channel-level, not vector-specific |
| `The Library/08 Source Library/Personal Development and Coaching/Emotional Alchemy/.../Downloads/Emotional_Alchemy_Deck_With_Types.csv` | Candidate emotional card names by element | Useful naming pool | Not mapped to vector grammar or mechanics |
| `The Library/manuscripts/EMOTIONAL_ALCHEMY_TRANSLATOR.md` | Emotion-to-channel/altitude mapping and 15 canonical moves | Useful translation ontology | Still uses older 15-move/Wuxing framing |
| `The Library/manuscripts/appendices/APPENDIX_D_EMOTIONAL_ALCHEMY_PRACTICES.md` | Happy Apples, Grounding, Rose Tool | Support/portal techniques | Not direct emotional vector moves |
| `The Library/08 Source Library/.../Emotional_Technique_Affinity_Model.txt` | Technique classification model | Helps distinguish alchemy moves vs support techniques | No vector inventory |
| `The Library/08 Source Library/.../Emotional_Alchemy_TaiChi_Forms.txt` | 12 gesture grammar and embodied forms | Good embodied mechanic pool | Not yet mapped to route-hand vectors |

### Conclusion

We do have source material. We do **not** yet have the exact registry needed by the route-hand planner:

```text
5 metabolize families
5 transcend families
20 neutral-to-neutral translate families
= 30 beginner vector move families
```

## Canonical Inventory Shape

Each move family should eventually include:

- vector id
- route role: `metabolize`, `translate`, or `transcend`
- source channel
- target channel
- core mechanic
- 3-5 concrete move cards
- internal expression
- external expression
- completion signal
- failure mode
- source links

## A. Metabolize Families

These move families make the current dissatisfied charge usable.

| Vector | Current Source | Core Mechanic | Seed Move Names | Coverage |
|---|---|---|---|---|
| `anger:dissatisfied -> anger:neutral` | `KEYTERM-EA-CHANNEL-ANGER.md` | Identify desire and obstruction; make vague heat legible | Draw the Line Within; Defend or Dismantle; The Sacred No; Ember of Boundaries | Good |
| `sadness:dissatisfied -> sadness:neutral` | `KEYTERM-EA-CHANNEL-SADNESS.md` | Identify care and distance | Feel It Fully; Let It Ache; The Thing You Cared For; Softening | Good |
| `fear:dissatisfied -> fear:neutral` | `KEYTERM-EA-CHANNEL-FEAR.md` | Identify risk and edge | Locate the Risk; See the Knife; Sharpen the Signal; Accepting the Unknown | Good |
| `joy:dissatisfied -> joy:neutral` | `KEYTERM-EA-CHANNEL-JOY.md` | Identify aliveness and desired participation | Follow the Spark; Let Yourself Want; Choose Delight; Slow Joy | Partial |
| `neutrality:dissatisfied -> neutrality:neutral` | `KEYTERM-EA-CHANNEL-NEUTRALITY.md` | Distinguish clean neutrality from shutdown; identify the field | Return to Center; Set It Down; The Pause That Opens; Trust the Soil | Good |

## B. Transcend Families

These move families let a clean emotional signal complete into satisfaction.

| Vector | Current Source | Core Mechanic | Seed Move Names | Coverage |
|---|---|---|---|---|
| `anger:neutral -> anger:satisfied` | `KEYTERM-EA-CHANNEL-ANGER.md` | Clean force; clean yes/no; proportional demand; completed movement | Own the Win; Show Your Strength; Strike the Spark; Power With, Not Power Over | Good |
| `sadness:neutral -> sadness:satisfied` | `KEYTERM-EA-CHANNEL-SADNESS.md` | Restore flow; soften; express care; witness loss; carry meaning forward | Let the Beauty Break You Open; Offer from the Heart; Love Still Present; Weep as a Wayfinder | Strong |
| `fear:neutral -> fear:satisfied` | `KEYTERM-EA-CHANNEL-FEAR.md` | Threshold approach; scout edge; convert risk into chosen experiment | Act Before You're Ready; Ride the Surge; Step to the Edge; Excitement in the Jitters | Partial |
| `joy:neutral -> joy:satisfied` | `KEYTERM-EA-CHANNEL-JOY.md` | Participation; savor; create; share aliveness without grasping | Soak in the Delight; Spread the Sparkle; Overflow is Not a Problem; Touch Without Outcome | Partial |
| `neutrality:neutral -> neutrality:satisfied` | `KEYTERM-EA-CHANNEL-NEUTRALITY.md` | Coherence; field settling; integration; right timing | Breathe into the Silence; Hold the Field; Enough for Now; Steady Through the Spiral | Good |

## C. Translate Families

These move families translate one clean emotional job into another clean emotional job.

The library has Wuxing translate routes, but the beginner route-hand planner needs **all ordered neutral-to-neutral channel pairs**, not only sheng/ke neighbors.

| Vector | Working Mechanic | Seed Move Family | Coverage |
|---|---|---|---|
| `anger:neutral -> sadness:neutral` | Let desire/boundary reveal care and distance | Repair Without Performance; name what the line protects | Needs authored cards |
| `anger:neutral -> fear:neutral` | Let force become discernment of risk/edge | Cool the Fire; identify the exposure created by action | Needs authored cards |
| `anger:neutral -> joy:neutral` | Let desire become participation/aliveness | Turn demand into chosen game | Needs authored cards |
| `anger:neutral -> neutrality:neutral` | Let force enter whole-field perspective | Put the heat on the map | Partial |
| `sadness:neutral -> anger:neutral` | Let care reveal desire, boundary, or obstruction | Protect what matters; mobilize grief | Partial |
| `sadness:neutral -> fear:neutral` | Let care reveal stakes and risk | What care makes vulnerable? | Needs authored cards |
| `sadness:neutral -> joy:neutral` | Let meaning re-open vitality | Renew Vitality; what love wants to participate in | Partial |
| `sadness:neutral -> neutrality:neutral` | Let care settle into whole-field acceptance | Hold care without forcing return | Partial |
| `fear:neutral -> anger:neutral` | Let risk reveal boundary/action | What must be protected or refused? | Partial |
| `fear:neutral -> sadness:neutral` | Let threat reveal care/contact | Repair Without Performance; what matters enough to be threatened? | Partial |
| `fear:neutral -> joy:neutral` | Let edge become curiosity and participation | Risk as experiment; scout the game | Partial |
| `fear:neutral -> neutrality:neutral` | Let alertness become stable orientation | Set down the alarm; map known/unknown | Partial |
| `joy:neutral -> anger:neutral` | Let aliveness meet obstacle/desire | Where does growth need a line? | Partial |
| `joy:neutral -> sadness:neutral` | Let delight reveal tenderness/care | Repair Without Performance; what joy makes you care about? | Partial |
| `joy:neutral -> fear:neutral` | Let possibility reveal edge/risk | What possibility asks exposure? | Needs authored cards |
| `joy:neutral -> neutrality:neutral` | Let aliveness settle into coherence | Let growth find ground | Partial |
| `neutrality:neutral -> anger:neutral` | Let whole-field seeing reveal desire/obstruction | What needs force now? | Needs authored cards |
| `neutrality:neutral -> sadness:neutral` | Let whole-field seeing reveal care/distance | What matters in this field? | Partial |
| `neutrality:neutral -> fear:neutral` | Let whole-field seeing reveal edge/risk | What edge matters now? | Partial |
| `neutrality:neutral -> joy:neutral` | Let whole-field seeing reveal aliveness/participation | Where does the field want to grow? | Needs authored cards |

## D. Advanced Clarification Families

These are not beginner satisfaction routes, but they are real.

They should be modeled separately as:

```text
dissatisfied X -> dissatisfied Y
```

Purpose:

```text
make vague or defended dissatisfaction more metabolizable
```

Examples:

| Vector | Use Case |
|---|---|
| `neutrality:dissatisfied -> sadness:dissatisfied` | Numbness clarifies into grief/loss |
| `neutrality:dissatisfied -> anger:dissatisfied` | Apathy clarifies into blocked desire |
| `fear:dissatisfied -> sadness:dissatisfied` | Threat scan clarifies into care/distance |
| `joy:dissatisfied -> anger:dissatisfied` | Restlessness clarifies into blocked desire |

These should not be recommended as ordinary beginner route hands unless the player chooses an advanced clarification mode.

## Product Implication

The route planner should not ask the generic primitive scorer to invent missing moves.

Better architecture:

```text
route edge
-> vector move family lookup
-> candidate move cards for that vector
-> domain/superpower/blocker translation
```

Current architecture:

```text
route edge
-> generic primitive scorer
-> best available primitive
```

The current architecture is why broad primitives keep over-winning.

## Next Implementation Step

Create a typed vector move registry:

```ts
VECTOR_MOVE_FAMILIES: Record<VectorKey, VectorMoveFamily>
```

Start with the 10 same-channel families as high-confidence entries.

Then add the 20 translate families as authored stubs with mechanics and source coverage flags.

The recommendation service should prefer vector-family candidates before falling back to generic primitive scoring.
