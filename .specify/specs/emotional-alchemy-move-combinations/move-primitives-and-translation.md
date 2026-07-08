# Move Primitives and Translation Function v0.1

## Core Shift

We do not want to author every possible move combination.

We want:

```text
move primitive -> translation function -> contextual Show Up move
```

The primitive is the emotional-alchemy mechanic before it is modified by superpower, domain, orientation, subject, or blocker.

## Why This Matters

The old combinatorial path explodes:

```text
emotional vector x superpower x domain x orientation x subject x blocker
```

The primitive-first path keeps the move library small:

```text
emotional vector -> primitive -> translated expression
```

Superpower and domain do not create the move. They translate the primitive into the player's style and field of action.

## Primitive Definition

A move primitive is a repeatable mechanic that turns a transformed charge into enacted capacity.

It must define:

| Field | Meaning |
|---|---|
| Primitive ID | Stable key for routing and translation. |
| Vector Type | Stabilize, transcend, neutral translate, generative translate, mastery/integration translate. |
| Source State | Optional canonical state or channel. |
| Target State | Optional canonical state or channel. |
| Charge Mechanic | What the charge can do after the move that it could not do before. |
| Base Act | The abstract enactment before translation. |
| Inner Artifact Family | Valid internal Show Up outputs. |
| Outer Act Family | Valid external Show Up outputs. |
| Completion Logic | How the primitive knows it has been enacted. |
| Drift To Observe Afterward | What may reveal itself after the move is done. |

## MVP Primitive Set

This is the smallest useful primitive set for the next prototype pass.

| Primitive ID | Vector Type | Base Name | Charge Mechanic | Base Act | Inner Artifact Family | Outer Act Family |
|---|---|---|---|---|---|---|
| `identify_signal` | Stabilize dissatisfied -> neutral | Identify Signal | Distorted charge becomes clean signal. | Name the signal and what it is asking for. | signal statement, self-trust note, inner permission | clarifying message, named concern, request for shared reality |
| `bound_the_ask` | Stabilize fear / neutrality around support | Bound The Ask | Uncertain need becomes askable. | Convert vague need into bounded request. | ask constraint, capacity rule, personal ask template | sent ask, scheduled ask, resource request |
| `name_care_distance` | Stabilize sadness | Name Care And Distance | Collapse becomes care plus distance. | Name what matters and what is currently distant. | care map, grief permission, one-inch commitment | message, visit, offering, support request, scheduled presence |
| `clean_exit` | Fear/Sadness -> Wonder/Poignance | Clean Exit | Threat or obligation becomes option and agency. | Create an exit, pause, refusal, or off-ramp. | inner exit, refusal rule, what-to-carry-forward note | off-ramp message, renegotiation, boundary, safe exit path |
| `interrupt_pattern` | Anger -> Triumph / clean Anger | Interrupt Pattern | Desire and boundary become precise force. | Stop the next repetition of a harmful or stuck pattern. | permission to interrupt, line statement, protected-value note | interruption question, boundary, refusal, escalation path |
| `create_sequence` | Neutrality -> Peace / Fear -> clean Fear | Create Sequence | Confusion becomes order that supports continuation. | Define next decision, owner, and checkpoint. | personal decision path, capacity-preserving rule | group sequence, role assignment, checkpoint agreement |
| `create_handoff` | Neutrality/Sadness -> Peace | Create Handoff | Overheld responsibility becomes shared structure. | Move a held task from personality into agreement. | non-glue boundary, invisible-labor inventory | handoff agreement, role/rotation, support structure |
| `restore_flow` | Sadness -> Poignance | Restore Flow | Stuck care becomes available movement. | Let care move one step without forcing resolution. | ritual, grief container, value remembrance | repair gesture, offering, witness request, shared ritual |
| `make_meaning_actionable` | Sadness/Anger -> Joy/Triumph | Make Meaning Actionable | Meaning becomes participation or action. | Turn story into a next move. | new sentence to live by, meaning arc, morale note | recap, invitation, public truth, narrative ask |
| `repair_without_performance` | Fear/Sadness -> Poignance/Peace | Repair Without Performance | Avoided impact becomes accountable contact. | Own impact without demanding soothing. | accountability script, no-defensiveness commitment | repair message, repair conversation, amended behavior |

## Translation Function

The translation function turns one primitive into a contextual Show Up move.

```text
translatePrimitive(
  primitive,
  orientation,
  subject,
  superpower,
  domain,
  blocker,
  cardContext
) -> move card
```

## Translation Responsibilities

| Input | What It Modifies |
|---|---|
| Primitive | Supplies the actual emotional-alchemy mechanic. |
| Orientation | Chooses internal artifact or external act. |
| Subject | Names whether the move serves self, other, or collective. |
| Superpower | Changes style of expression and drift language. |
| Domain | Changes output form. |
| Blocker | Changes friction, scale, and completion conditions. |
| Card Context | Adds operation/face/deck flavor without replacing the primitive. |

## Translation Rules

1. The primitive owns the mechanic.
2. The superpower owns the style.
3. The domain owns the output type.
4. Orientation owns inner vs outer completion.
5. Subject owns who/what the move serves.
6. Blocker owns friction and scale.
7. Reflection owns drift detection after the fact.

## Example Translation: `bound_the_ask`

Base primitive:

```text
Uncertain need becomes askable.
Convert vague need into bounded request.
```

Internal translation:

| Axis | Value |
|---|---|
| Orientation | Internal |
| Subject | Self |
| Superpower | Strategist |
| Domain | Gather Resources |
| Blocker | The ask is too vague. |
| Output | Ask constraint / personal ask template |

Generated move:

```text
Create a reusable ask constraint:
one resource, one reason, one time window, one next step.

Done when the template is written and tied to a specific trigger:
"When I need support for ___, I ask ___ for ___ by ___."
```

External translation:

| Axis | Value |
|---|---|
| Orientation | External |
| Subject | Other / collective |
| Superpower | Strategist |
| Domain | Gather Resources |
| Blocker | The ask is too vague. |
| Output | Sent or scheduled resource request |

Generated move:

```text
Send one bounded ask:
one resource, one reason, one time window, one next step.

Done when the ask is sent or scheduled to a named person.
```

Same primitive. Different orientation. Different completion.

## Example Translation: `clean_exit`

Base primitive:

```text
Threat or obligation becomes option and agency.
Create an exit, pause, refusal, or off-ramp.
```

Internal translation:

```text
Name the cage, name the clean exit, and name what you carry forward.

Done when you have a written refusal rule or inner exit commitment you can use when the pressure returns.
```

External translation:

```text
Communicate one pause, refusal, renegotiation, or off-ramp.

Done when the off-ramp is communicated, or prepared with a safety reason for not sending yet.
```

## MVP Development Target

Build the first recommendation system around primitives, not cards.

MVP should support:

1. Select emotional vector.
2. Pick or infer primitive.
3. Ask orientation: internal or external.
4. Apply superpower translation.
5. Apply domain translation.
6. Apply blocker scaling.
7. Return one playable move.
8. Capture completion and reflection.

## What We Do Not Need Yet

- We do not need all 28 superpower-domain combinations.
- We do not need bespoke cards for every vector.
- We do not need shadow prevention before the move.
- We do not need perfect diagnosis.
- We do not need a final deck taxonomy.

## Next Proof Work

Use the v2 hostile review proof set, but rewrite it as primitive translations:

| Existing Prototype | Primitive | Proof |
|---|---|---|
| MP02 Internal / External | `bound_the_ask` | Same primitive generates inner ask template and outer bounded ask. |
| MP08 Internal / External | `clean_exit` | Same primitive generates inner exit and external off-ramp. |
| MP19 Internal / External | `create_handoff` | Same primitive generates non-glue boundary and outer handoff agreement. |
| MP05 External | `interrupt_pattern` | Disruptor/Raise Awareness translates interruption into a consent-aware question. |
| MP12 External | `interrupt_pattern` | Disruptor/Direct Action translates interruption into stopping the next repetition. |

This proves the architecture:

```text
primitive first, translation second, card third
```
