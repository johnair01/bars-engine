# Composited Move Strategy

## Date

2026-07-05

## Purpose

Memorialize the emerging strategy for routing from an abstract Emotional Alchemy move library to a concrete player recommendation.

The key distinction:

```text
Abstract moves are grammar.
Tools are engines.
Player context is fuel.
Recommendations are composed reps.
```

The player should not usually receive a raw abstract move. The player should receive a playable, composited move.

## Core Model

```text
emotional route edge
+ submove / WAVE lens
+ tool capability
+ satisfaction spirit
+ blocker/story context
+ domain/superpower expression
= playable recommendation
```

## Definitions

### Abstract Move

An abstract move is the emotional transformation pattern.

Examples:

- Find The Care In The Joy
- Risk Before Force
- Find Where Force Belongs
- Find The Live Part
- Name Care And Distance
- Restore Flow

Abstract moves define:

- emotional vector
- move role: metabolize / translate / transcend
- mechanic tags
- supported submoves
- compatible tool families
- expected outputs
- completion signals
- failure modes

They are not necessarily player-ready by themselves.

### Submove

A submove is the WAVE lens used to perform a move.

```text
Wake Up -> Open Up -> Clean Up -> Grow Up -> Show Up
```

Current roles:

| Submove | Role | Function |
|---|---|---|
| Wake Up | processing | Identify what is happening. |
| Open Up | processing | Become available to more of the charge. |
| Clean Up | processing | Untangle story, belief, defense, or shadow. |
| Grow Up | bridge | Right-size maturity, capacity, and stance. |
| Show Up | action | Produce a concrete action/artifact in the world. |

### Tool

A tool is the method used to perform a submove.

Examples:

- 321
- Happy Apples
- Rose Tool
- Focusing
- Grounding
- Ask Script
- Field Map
- Ritual Container

A tool without a move is inert. A move without a tool is too abstract. A move plus tool plus context becomes a playable rep.

### Satisfaction Spirit

The satisfaction spirit is the emotional quality the tool is used in service of.

Examples:

- peace
- poignance
- triumph
- bliss
- wonder / excitement

The same tool changes depending on the satisfaction spirit.

Example:

```text
Use 321 in the spirit of peace:
slow enough to see, not force.
```

This differs from:

```text
Use 321 in the spirit of triumph:
clear enough to claim, not collapse.
```

## Routing Flow

```text
1. Resolve player context
   want, desired satisfaction, blocker, blocker story, present dissatisfaction, selected submove

2. Resolve emotional route
   present dissatisfaction -> neutral present -> neutral target -> desired satisfaction

3. Pick current edge
   usually the first unresolved edge unless the player selects a later edge

4. Pick abstract move family
   vector family / mechanic operation

5. Pick submove
   player-selected Wake/Open/Clean/Grow/Show should win

6. Pick tool
   tool must support the submove and move role

7. Compose move
   inject blocker/story/domain/superpower/satisfaction spirit into the protocol

8. Return playable recommendation
```

## Why This Matters

Earlier recommendation shapes risked returning:

```text
Try Identify Signal.
```

or:

```text
Find The Care In The Joy.
```

Those are not enough. They name the move, but they do not tell the player how to perform it.

The composited strategy returns:

```text
Wake Up with 321

Why:
Your frustration is trying to reveal the blocker to peaceful communication.

Do:
Use 321 to speak with the frustrated part.

Done when:
You can name the blocker in one sentence.
```

## Example

Player context:

```text
I am blocked on reaching out to the homies about Mastering the Game of Allyship.
I currently feel frustrated.
I want to feel peace about communicating this thing I care about.
I need to wake up to what the blocker is.
```

Resolved route:

```text
anger:dissatisfied -> anger:neutral
anger:neutral -> neutrality:neutral
neutrality:neutral -> neutrality:satisfied
```

Composited recommendation:

```text
Current edge:
anger:dissatisfied -> anger:neutral

Submove:
Wake Up

Tool:
321

Satisfaction spirit:
Peace

Protocol:
1. 3rd person: "The frustrated part wants ___."
2. 2nd person: "Frustrated part, what are you protecting?"
3. 1st person: "I am frustrated because ___."
4. Ask: "What is blocking peaceful communication?"
5. Complete: "The blocker is ___."

Completion:
You can name the blocker in one sentence without needing to solve it yet.
```

## Tool Capability Model

Tools should declare what they can actually do.

Proposed shape:

```ts
interface ToolCapability {
  toolId: string
  supportedSubmoves: VectorMovePracticeLens[]
  supportedMoveRoles: VectorMoveFamilyRole[]
  bestFor: string[]
  weakFor: string[]
}
```

Example capability table:

| Tool | Wake | Open | Clean | Grow | Show |
|---|---|---|---|---|---|
| 321 | strong | strong | strong | strong | medium |
| Happy Apples | weak | strong | medium | strong | weak |
| Focusing | strong | strong | medium | medium | weak |
| Rose Tool | medium | strong | strong | medium | weak |
| Ask Script | weak | weak | weak | medium | strong |
| Field Map | strong | medium | medium | strong | strong |

This prevents tool sprawl because tools do not need to pretend to do everything.

## MVP Tool Strategy

Start with 321 as the first canonical tool.

Reason:

321 can plausibly cover all five WAVE submoves:

| Lens | 321 Use |
|---|---|
| Wake Up | Identify the part, charge, or voice. |
| Open Up | Contact and receive the part. |
| Clean Up | Dialogue with story, projection, belief, or defense. |
| Grow Up | Become the part and integrate its intelligence from a larger stance. |
| Show Up | Ask the integrated part what action wants to happen. |

But even for 321, the protocol must be composed by context. It should not be offered as a generic standalone tool.

## Product Rule

Player-selected submove should win.

The system may suggest a lens, but it should not silently infer it as truth from blocker/story text.

Required intake field:

```text
What kind of help do you need right now?

- Wake Up: identify what is happening
- Open Up: become available to the charge
- Clean Up: untangle story/belief/defense
- Grow Up: hold this with more maturity/capacity
- Show Up: take action
```

## Implementation Implications

Next useful implementation layer:

1. Add a canonical tool registry.
2. Add 321 as the first tool.
3. Add tool capability matching against submove and move role.
4. Compose a tool protocol into the recommendation payload.
5. Update move attempts to snapshot selected tool and protocol output.

Do not build a broad tool library yet.

Do not generate full card copy yet.

First prove:

```text
vector family + selected submove + 321 + satisfaction spirit
= concrete playable rep
```

## Non-Goals For This Pass

- Do not let the system silently infer WAVE lens from blocker/story as the source of truth.
- Do not expand Happy Apples, Rose Tool, Focusing, or other tools yet.
- Do not write every possible domain/superpower/tool/card combination.
- Do not collapse abstract moves and tools into the same object.
- Do not treat emotional processing as lesser than action; track role explicitly.

## Success Criteria

The strategy is working when the app can return:

```text
Move:
Find The Care In The Joy

Submove:
Open Up

Tool:
321

Satisfaction spirit:
Poignance

Protocol:
Use 321 to dialogue with the care inside the joy.

Output:
A named care and received message.

Completion:
The care inside the joy can be named without forcing repair or action.
```

At that point, the move has teeth.
