# Spec: Joy / Bliss Coverage

## Purpose

Resolve the joy/bliss coverage gap in Emotional Alchemy tool recommendations before updating the registry or recommendation scoring.

Core correction:

```text
Players do not usually report "joy blockers."
Players report ordinary blockers.
The system must determine whether a joy/bliss move can metabolize that blocker.
```

Joy/bliss work is not only for someone who says, "I have a joy problem." It may be relevant when a player wants Bliss, clean Joy, participation, aliveness, delight, creativity, or a path that feels worth entering.

## Problem

Before this spec, MVP tool coverage routed joy/bliss through next-tier tools:

- Happy Apples
- Make It Real

These tools are useful, but were not proven as the default joy-native engine. Make It A Game now owns the MVP joy/bliss move while Happy Apples and Make It Real remain supporting candidates:

```text
stuck/restless joy or blocked aliveness
-> clean participation
-> bliss / real aliveness / chosen play
```

The danger is promoting a tool too early and making tests pass while the protocol still bypasses sadness, fear, anger, or practical reality.

## Product Thesis

Joy/bliss is about **participation**, not entertainment.

Updated core thesis:

```text
Joy enters when a blocker becomes playable.
```

The system should help players move toward:

- real aliveness
- chosen participation
- savoring without grasping
- creative or relational entry
- clean delight that does not bypass other charges
- a bounded form of play, creation, sharing, or growth

Anti-goal:

```text
Do not turn joy into "make it fun."
```

## Player Blocker Reality

Players are unlikely to report:

```text
"I have a joy blocker."
```

They are more likely to report:

- "This path is not fun enough."
- "None of the options feel enjoyable."
- "I know what to do, but I do not want to do it."
- "The only path forward feels dead."
- "I keep choosing the exciting option and then overcommitting."
- "I feel guilty enjoying this."
- "I am performing brightness for everyone else."
- "I do not trust good things when they arrive."
- "There are too many possible paths."
- "The work matters, but I cannot find the life in it."

The recommendation system should treat these as **blocker shapes** that may call for a joy/bliss move when the desired target is Bliss or clean Joy.

## Joy Blocker Taxonomy

These are not labels shown to players by default. They are diagnostic shapes for tool comparison.

| Shape | Player-native blocker language | Risk |
|---|---|---|
| `dead_path` | "This path has no life in it." | Move becomes duty without participation. |
| `not_fun_enough` | "I cannot move because it is not enjoyable." | Joy becomes entertainment demand. |
| `too_many_possibilities` | "Everything sounds exciting, so I cannot choose." | Aliveness scatters into overchoice. |
| `stimulation_chasing` | "I keep picking what is exciting, then losing the thread." | Novelty replaces participation. |
| `performance_brightness` | "I am being upbeat because people need me to be." | Joy becomes social labor. |
| `guilt_about_good` | "It feels wrong to enjoy this." | Bliss blocked by worthiness or loyalty bind. |
| `good_cannot_land` | "Good things are present but I cannot receive them." | Appreciation bypasses instead of metabolizing. |
| `joy_exposes_desire` | "If I admit I want this, I become exposed." | Joy reveals anger/desire or fear/risk. |
| `joy_exposes_care` | "This joy shows me what I care about." | Joy needs sadness/poignance, not more positivity. |
| `overpromise` | "When I feel alive, I say yes to too much." | Joy needs containment, sequencing, or clean no. |
| `bypass_suspected` | "I may be using excitement to avoid grief, fear, or anger." | Joy tool should hand off, not proceed. |

## Candidate Tool

### Primary Candidate: Make It A Game

Hypothesis:

The basic joy/bliss move may be to gamify the blocker: turn the dead, stuck, overwhelming, or unappealing path into a small playable challenge.

Generic name:

```text
Playable Challenge Design
```

BARS name:

```text
Make It A Game
```

Core mechanic:

```text
Convert a blocker into a small bounded game with rules, stakes, feedback, a round, and a completion signal.
```

Strength:

- directly makes joy playable
- handles dead path, not fun enough, overchoice, overpromise, and action aversion
- aligns with the game itself
- can use Happy Apples and Find The Live Part as modes

Risk:

- can trivialize serious blockers
- can become productivity disguised as play
- can become pressure/performance if challenge is too sharp
- can bypass sadness/fear/anger if handoff rules are weak

### Supporting Mode A: Happy Apples / Real Good Scan

Function:

```text
Find the real good or spark already present before designing the game.
```

Best for:

- receiving good
- guilt about good
- under-receiving
- savoring
- appreciation without forced positivity

### Supporting Mode B: Find The Live Part

Function:

```text
Find the live part of the field before choosing the game mechanic.
```

Best for:

- dead path
- too many possibilities
- not fun enough
- stimulation chasing
- participation discernment

### Supporting Mode C: Game Container

Function:

```text
Protect aliveness with scope, rules, timebox, no-list, and completion marker.
```

Best for:

- overpromise
- scattered excitement
- too many options
- sustainable bliss
- clean participation that needs boundaries

Strength:

- directly targets clean Joy and Bliss
- handles "path has no life" and "too many possibilities"
- can create action, play, invitation, creation, or savoring without forcing productivity

Risk:

- can become Show Up-biased if "participation" means premature action
- can bypass sadness/fear/anger if it does not include handoff rules
- may duplicate Happy Apples unless the distinction is clear

## Candidate Tool Protocol Requirements

The primary candidate must be prototyped with:

- Wake Up mode
- Open Up mode
- Clean Up mode
- Grow Up mode
- Show Up mode
- metabolize joy support
- transcend joy support
- handoff rules when sadness/fear/anger is primary
- concrete outputs
- completion criteria
- when-not-to-use notes

Every protocol must produce inspectable output, such as:

- real-good list
- aliveness signal
- false-joy pattern
- participation option list
- chosen participation form
- savoring note
- invitation
- creation seed
- bounded play container
- clean no to overpromise
- handoff note to another channel/tool

## Seven Hostile Joy Cases

Use these to test whether Make It A Game can metabolize the blocker without bypassing sadness, fear, anger, neutrality, consent, or practical reality.

### Case 1: Dead Path

```text
I know the next responsible step, but it feels dead. I cannot find any life in it.
Desired: Bliss / clean participation.
```

Question:

- Can the tool find real aliveness without pretending the duty is fun?

### Case 2: Not Fun Enough

```text
I keep stalling because the available path is not enjoyable enough.
Desired: Bliss.
```

Question:

- Can the tool metabolize "not fun" without rewarding avoidance?

### Case 3: Too Many Possibilities

```text
There are too many exciting paths, so I keep circling instead of entering one.
Desired: Bliss or Peace.
```

Question:

- Can the tool choose participation without overcommitting?

### Case 4: Performing Brightness

```text
I am being upbeat because the group needs morale, but I do not actually feel connected to the joy.
Desired: clean Joy or Poignance.
```

Question:

- Can the tool distinguish real joy from social performance and hand off to sadness if needed?

### Case 5: Guilt About Good

```text
Something good is happening, but it feels wrong to enjoy it while others are struggling.
Desired: Bliss or Poignance.
```

Question:

- Can the tool receive good without becoming selfishness or guilt recruitment?

### Case 6: Joy Exposes Desire

```text
When I imagine the path I actually want, I feel alive and then immediately afraid of wanting it.
Desired: Bliss, Wonder, or Triumph.
```

Question:

- Can the tool let joy reveal desire/risk and hand off to fear or anger when appropriate?

### Case 7: Overpromise

```text
When I feel inspired, I say yes to too much and then lose trust with myself and others.
Desired: Bliss or Peace.
```

Question:

- Can the tool contain aliveness without killing it?

## Comparison Questions

For each hostile case:

1. Which Make It A Game mode is needed?
2. Does the tool handle metabolize joy?
3. Does the tool handle transcend joy?
4. Does the proposed game bypass sadness?
5. Does the proposed game bypass fear?
6. Does the proposed game bypass anger?
7. Does the proposed game become productivity or forced fun?
8. What output does the player produce?
9. What is the completion signal?
10. Would this recommendation feel playable inside the Allyship Deck?

## Decision Gate

Do not update the registry or recommendation scoring until:

- Make It A Game is prototyped with modes
- all seven hostile cases are reviewed
- comparison table exists
- one of these outcomes is selected:
  - add Make It A Game as MVP
  - keep Happy Apples / Find The Live Part as separate tools
  - add Make It A Game later but keep joy/bliss yellow for now
  - keep joy/bliss marked yellow and do more research

## Acceptance Criteria

- Joy blocker taxonomy exists.
- Two candidate tool prototypes exist.
- Seven hostile cases are generated.
- Candidate outputs are compared.
- Bypass risks are documented.
- A recommendation is made before registry/scoring changes.

## Open Questions

- Is Bliss best treated as "savored participation," "completed participation," or "aliveness with enough container"?
- Is Happy Apples a full joy tool or only an Open Up / receive-good subtool?
- Does Find The Live Part risk becoming productivity in disguise?
- What is the clean handoff rule from joy to sadness, fear, or anger?
- Should joy/bliss tools be MVP before operation-aware protocol modifiers exist?
