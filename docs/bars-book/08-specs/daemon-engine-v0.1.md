# Daemon Engine v0.1

Purpose: Convert stalled momentum into structured daemons — playable shadow entities.

Provenance note: captured from a set of BARs by Naval, then housed here as a formal spec for BARs / daemon gameplay development.

See also: `KEYTERM-RESEARCH.md`, `KEYTERM-DAEMON-CAPTURE`

---

## 0. Core Premise

Daemons are not creatures in the wild.

They are:

> emergent patterns of charge that appear when a player is not making momentum toward a meaningful goal.

Daemons are generated through introspection, not exploration.

---

## 1. Trigger Condition — Daemon Spawn

A daemon is generated when:

- player has an active goal or quest
- player experiences hesitation, avoidance, confusion, or overcomplication
- player is not taking action

### Detection Heuristic

```pseudo
if (goal_active == true) AND (action_taken == false) AND (emotional_charge > threshold):
    trigger DaemonSpawn
```

---

## 2. Input System — Charge Capture

Before a daemon exists, charge must be captured.

### Capture Template

```md
## Goal
What was I trying to do?

## Block
Where did I stop?

## Thought
What story appeared?

## Emotion
What did I feel? Which emotional channel?

## Behavior
What did I do instead?

## Cost
What did it cost me?
```

### Output

- structured charge
- candidate daemon seed

---

## 3. Game Master Routing

Each daemon must be interpreted through a Game Master Face.

The player selects the GM Face before daemon creation.

| GM Face | Role in Daemon Creation |
|---|---|
| Shaman / Magenta | What is the raw energy or symbol? |
| Challenger / Red | Where is the friction or avoidance? |
| Regent / Amber | What rule or structure is being violated? |
| Architect / Orange | What system failure is present? |
| Diplomat / Green | What relational pattern is involved? |
| Sage / Teal | What developmental pattern is emerging? |

### Rule

A daemon is incomplete without GM interpretation.

---

## 4. Daemon Construction

A daemon is a functional structure, not merely a metaphor.

### Daemon Template

```md
# Daemon — {{Name}}

## Origin Goal
What momentum was interrupted?

## Emotional Channel
Fire / Water / Wood / Earth / Metal

## GM Face Lens
Selected GM perspective

---

## Core Function

### Strategy
What is the daemon trying to accomplish?

### Pressure Managed
What discomfort is it regulating?

### Tradeoff
What does it sacrifice?

---

## Behavior Loop
Trigger -> Action -> Outcome -> Reinforcement

---

## System Effects

- Energy impact
- Perception distortion
- Action modification

---

## False Promise
What does it claim will happen?

## Actual Result
What actually happens?

---

## Transformation Path
What GM-guided move converts this into a useful force?

---

## Evolution Form
What does this become when integrated?
```

---

## 5. Functional Taxonomy

Functions are not labels.

They are control strategies over momentum.

Each daemon must resolve to one primary function.

### 1. Momentum Deferral

Delays action to avoid risk.

Signature: “I’ll do it later.”

Energy: conserved short-term, lost long-term.

### 2. Premature Optimization

Overthinks to avoid execution.

Signature: “I need a better system first.”

Energy: trapped in cognition.

### 3. Risk Inflation

Exaggerates consequences.

Signature: “If I do this, it could go badly.”

Energy: redirected into fear.

### 4. Identity Protection

Avoids actions that threaten self-image.

Signature: “If I fail, what does that mean about me?”

Energy: locked in self-concept.

### 5. Displacement

Switches to lower-priority tasks.

Signature: “Let me do something else first.”

Energy: misallocated.

### 6. Overextension

Commits beyond capacity.

Signature: “I’ll just do everything.”

Energy: rapidly depleted.

### Constraint

Each daemon must map to one of these.

Hybridization is allowed only after validation.

---

## 6. Gameplay Integration

### When a Daemon is Active

- increases energy cost of actions
- introduces delay or friction
- modifies available moves

### Player Moves

1. Ignore -> daemon strengthens
2. Engage -> create BAR
3. Transform -> daemon becomes ally

---

## 7. Transformation Loop

1. Capture charge
2. Select GM Face
3. Construct daemon
4. Identify function
5. Choose counter-move
6. Take action
7. Reflect -> create BAR
8. Mint vibeulon

---

## 8. Validation System

A daemon is validated when:

- two or more players recognize the pattern
- behavior loop is reproducible
- function is clearly identified

### Output

Validated daemons enter:

`08 Source Library/Bestiary Index.md`

---

## 9. Failure Modes

### Over-abstraction

If daemon cannot be observed in behavior, discard.

### Over-personalization

If only one person understands it, refine.

### Lack of Function

If it does not alter momentum, invalid.

---

## 10. Minimal Example

# Daemon — The System Tinkerer

## Origin Goal

Ship feature.

## Emotional Channel

Metal / Fear.

## GM Face

Architect.

## Function

Premature Optimization.

## Strategy

Delay execution by improving system design.

## Pressure Managed

Fear of producing low-quality work.

## Tradeoff

No output is produced.

## Behavior Loop

uncertainty -> redesign system -> feel productive -> avoid shipping

## System Effects

- blocks completion
- consumes cognitive energy

## Transformation

Ship ugly version first.

---

## 11. Next Steps

- Create three real daemons from recent behavior.
- Validate with another player.
- Integrate into quest system.
- Track recurrence frequency.

---

## Meta

Daemons are not enemies.

They are:

> misapplied strategies attempting to regulate emotional pressure at the cost of momentum.

---

# Addendum — Belief-Bound Daemon System v0.2

## 12. Belief Binding Layer

### Premise

Every daemon is anchored to a self-sabotaging belief.

The belief is:

- stable
- repeatable
- cross-contextual

The daemon is:

- situational
- reactive
- behaviorally expressed

Belief -> Function -> Daemon -> Behavior -> Outcome

The belief is the core logic.

The daemon is the runtime process that enforces it.

---

## 13. Core Belief Set

Each daemon must bind to one of the following:

1. I am not good enough.
2. I am not worthy.
3. I am not capable.
4. I am not significant.
5. I do not belong.
6. I am not ready.

---

## 14. Belief -> Function Mapping

Beliefs do not directly create behavior.

They select functions — strategies.

| Belief | Primary Functions | Typical Strategy |
|---|---|---|
| Not Good Enough | Premature Optimization, Overextension | compensate through perfection or excess |
| Not Worthy | Momentum Deferral, Suppression | avoid receiving or acting |
| Not Capable | Risk Inflation, Deferral | avoid attempting |
| Not Significant | Amplification, Overextension | demand attention / overperform |
| Do Not Belong | Shielding, Distortion | withdraw or reinterpret social signals |
| Not Ready | Premature Optimization, Deferral | delay until the perfect moment |

### Required Field

```md
## Bound Belief
```

---

## 15. Daemon Resolution States

### 1. Active / Unseen

- belief is unconscious
- behavior is automatic
- player loses energy and momentum

### 2. Defeated / Conscious Interruption

- belief is seen
- behavior is interrupted once
- quest can be completed

### 3. Allied / Integrated Function

- belief no longer controls behavior
- function is retained but redirected
- grants ongoing advantage

---

## 16. Transformation Mechanics

### Defeat Condition

A daemon is defeated when the player correctly identifies:

- belief
- function

AND takes one aligned action despite it.

### Ally Condition

A daemon becomes an ally when:

- player successfully transforms the function three or more times
- across different contexts

---

## 17. Ally Benefits

Each allied daemon grants mechanical bonuses:

- reduced energy cost for related actions
- resistance to the same belief trigger
- increased regeneration under pressure

### Example

# Allied Daemon — The System Tinkerer

## Original Function

Premature Optimization

## Belief

I am not good enough

## Ally Form

Iterative Builder

## Bonus

- can ship low-fidelity work without energy penalty
- gains energy on iteration cycles

---

## 18. Gameplay Loop Integration

### When Belief is Triggered

1. Emotional charge increases.
2. Function activates.
3. Daemon behavior emerges.
4. Player loses momentum.

### Player Intervention

- identify belief
- identify function
- choose GM-guided move
- take action

### Outcome

- success -> daemon weakened
- repetition -> daemon allied

---

## Why This Matters

Before:

- functions felt abstract
- daemons felt aesthetic

Now:

- belief = root cause
- function = strategy
- daemon = enforcer

This gives the system causal integrity.

## Game Masters as Operators on Belief Transformation

| GM Face | Role |
|---|---|
| Shaman | surfaces the belief — what spirit is speaking? |
| Challenger | forces action despite belief |
| Regent | defines rule that belief violates |
| Architect | maps system pattern across contexts |
| Diplomat | sees relational origin of belief |
| Sage | integrates belief into developmental arc |

The Game Masters are not flavor.

They are operators on belief transformation.

## Playable Loop

1. Feel the charge.
2. Name the belief.
3. See the pattern.
4. Act anyway.
5. Gain power from repetition.

## Constraint

Do not let players invent infinite beliefs.

Variation lives in the daemons, not the beliefs.

## Final Frame

This is a system where suffering becomes structured, hesitation becomes data, and growth becomes mechanically trackable.

Daemons are delivery systems for self-sabotaging beliefs.

## Next Moves

1. Generate six daemons, one per belief, to test coverage.
2. Build a Daemon Creation UI flow.
3. Create a quest type: Face the Belief.