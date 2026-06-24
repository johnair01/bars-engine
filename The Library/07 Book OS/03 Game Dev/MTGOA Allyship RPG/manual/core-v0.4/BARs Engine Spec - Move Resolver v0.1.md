# BARs Engine Spec - Move Resolver v0.1

Status: product/app spec

Purpose: define a bars-engine module for resolving MTGOA Basic Moves, dice, stats, benefits, costs, and token updates.

Related manual artifacts:

- `Core Moves and Dice - v0.4.md`
- `Chapter 4 Prose Draft - Core Moves and Dice v0.1.md`

## Product Goal

Build an interactive move resolver that helps players move from fictional action to mechanical outcome without turning the game into a button-clicking exercise.

The app should support:

- selecting or recommending a Basic Move
- selecting a stat
- rolling 2d6 + stat
- choosing benefits
- applying costs
- updating tokens
- logging changes to Student Record, Crew Sheet, Mission Field Map, and Chronicle

## Core Principle

The app must ask for fiction before mechanics.

Bad:

- player taps "Show Up"
- app rolls
- fiction is added afterward

Good:

- player writes what their student does
- app asks what the action is trying to change
- app recommends Basic Moves
- player chooses Move and stat
- app resolves roll and updates artifacts

## User Flow

## 1. Describe The Action

Prompt:

> What does your student do?

Optional helper prompts:

- What are you trying to understand, repair, build, or change?
- Who could be affected?
- What could go wrong?

Data captured:

- action description
- acting student id
- scene id
- target person / faction / field element

## 2. Choose Basic Move

Player chooses:

- Wake Up
- Open Up
- Clean Up
- Grow Up
- Show Up

App can recommend based on intent:

- understand = Wake Up
- reveal / receive / ask for help = Open Up
- repair = Clean Up
- stay / hold pressure / receive feedback = Grow Up
- act / intervene / resource = Show Up

Player can override.

## 3. Choose Stat

Player chooses:

- Sense
- Act
- Steady
- Shape
- Tend
- Speak

App displays:

- stat rating
- owning School
- when to use this stat
- potential cost profile

If multiple stats fit, app can show:

- "Roll +Speak if you make truth public; cost may be exposure."
- "Roll +Tend if you check privately first; cost may be delay."

## 4. Roll

App rolls:

`2d6 + stat`

Store:

- die 1
- die 2
- stat
- modifiers
- total
- result band: `strong_hit`, `mixed_hit`, `miss`

Manual roll support:

- allow player to enter physical dice results

## 5. Resolve Result

### 10+

Player chooses 2 benefits from the selected Basic Move.

### 7-9

Player chooses 1 benefit.

Guide chooses or writes 1 cost.

### 6-

Guide makes a move.

Acting student gains 1 Adversity.

App asks:

> Did the student name their impact honestly?

If yes, mark 1 Growth.

## 6. Token Updates

App supports:

- add/spend Adversity
- add/spend Clarity
- add/clear Tension
- mark Growth

Token updates should always have a reason field.

Example:

```json
{
  "token": "tension",
  "delta": 1,
  "reason": "Acted from urgency instead of contact",
  "sourceMoveId": "move_uuid"
}
```

## 7. Artifact Updates

After each move, app asks:

- What changed on the Mission Field Map?
- Did Trust, Leverage, Heat, or a clock change?
- Did the Crew Sheet gain Tension, Clarity, or unresolved repair?
- Should this be added to the Chronicle?

Players can skip with `No visible update`.

The app should preserve skipped prompts for later debrief.

## Data Model Sketch

```json
{
  "id": "move_uuid",
  "sceneId": "scene_uuid",
  "studentId": "student_uuid",
  "actionDescription": "",
  "basicMove": "wake_up",
  "stat": "sense",
  "dice": {
    "die1": 0,
    "die2": 0,
    "modifier": 0,
    "total": 0,
    "entryMode": "digital"
  },
  "resultBand": "mixed_hit",
  "benefitsChosen": [],
  "costsApplied": [],
  "tokensChanged": [],
  "artifactUpdates": {
    "studentRecord": [],
    "crewSheet": [],
    "missionFieldMap": [],
    "chronicle": []
  },
  "impactNamed": false,
  "createdAt": ""
}
```

## Move Data

Each Basic Move should be stored as structured data:

```json
{
  "id": "wake_up",
  "name": "Wake Up",
  "trigger": "When you read a person, room, pattern, system, silence, or signal...",
  "questions": [],
  "benefits": [],
  "costs": []
}
```

## Interface Requirements

- Show current Student Record summary during move resolution.
- Show current tokens.
- Show selected Mission Field Map clocks.
- Keep Regent instructions and Council marginalia visually distinct.
- Allow Guide-only cost entry.
- Allow table-visible roll log.
- Allow private note field for sensitive context.
- Support undo/edit with log history.

## Voice

Regent instruction:

> Describe the action before selecting the move. The school has previously attempted the reverse. The incident produced many confident rolls and very little reality.

Council marginalia:

> If you cannot say what your student does, you are not rolling yet. You are shopping for permission.

## Future Enhancements

- AI-assisted move recommendation
- token economy dashboard
- campaign packet custom moves
- School move unlocks
- House move modifiers
- mobile table mode
- printable session log
- debrief integration
