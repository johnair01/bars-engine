# Stats and Dice Interface - Source Review v0.4

Status: design recommendation

Purpose: decide how players touch the dice, what stats measure, and how the source games should influence the MTGOA engine.

## Design Problem

The old draft made the Basic Move categories into stats:

- Wake Up
- Open Up
- Clean Up
- Grow Up
- Show Up

That is clean, but it causes a problem.

Those names describe **what kind of allyship move is happening**, not the character's actual capacity or style.

The stronger architecture is:

- **Basic Moves** = what kind of move the fiction triggered
- **Stats** = which School-taught discipline the character is using to make the move
- **House / Role / Belief / School moves** = specialized permissions, bonuses, costs, and options that slot into the Basic Moves

This keeps Wake Up, Open Up, Clean Up, Grow Up, and Show Up as the spine without making them do every job.

## Source Findings

## Dungeon World

Best lesson: use fiction-first move triggers and a simple roll ladder.

The useful pieces:

- a move triggers because of what a character does in the fiction
- the default roll is 2d6 plus a relevant modifier
- 10+ is clean success
- 7-9 is success with cost, compromise, exposure, or hard choice
- 6- means the GM / Guide makes a move and the player marks growth currency
- custom moves can be written for classes, places, monsters, fronts, and situations

MTGOA should borrow this as the core moment-to-moment action engine.

Why:

- it is fast
- players understand it quickly
- it makes partial success normal
- it keeps the table in conversation
- it supports custom campaign moves
- it makes mistakes productive instead of dead-ending the story

Main caution:

Dungeon World stats are inherited from D&D. MTGOA should not import Strength / Dexterity / Constitution / Intelligence / Wisdom / Charisma. Allyship needs capacities that match the emotional, relational, strategic, and material work of the game.

## Kids on Bikes

Best lesson: make character strengths feel tactile and let failure become future leverage.

The useful pieces:

- each character has different die sizes across six stats
- higher dice make strengths feel materially different at the table
- players can solve the same problem with different stats if the fiction supports it
- adversity tokens come from failed rolls and can be spent later
- planned actions and snap decisions feel different
- relationship questions build playable social context before the first scene

MTGOA should borrow:

- multiple possible approaches to a problem
- Adversity Tokens as failure-earned leverage
- relationship prompts during character creation
- the distinction between planned downtime action and pressured episode action
- maybe a light polyhedral "training die" layer, if we want the game to feel more like a deluxe nerd artifact

MTGOA should probably not use the full Kids on Bikes resolution engine as the core.

Why:

- target numbers put more math and judgment load on the Guide
- exploding dice are fun but swingy
- "roll against a difficulty" is less directly aligned with the allyship rhythm of benefit, cost, impact, and repair
- it is harder to write clean move text around many possible target numbers

## Hearts Blazing

Best lesson: episodes, spotlight, and ensemble drama can be mechanically shaped without needing every moment to be a roll.

The useful pieces:

- cards create episodes
- the episode has a threshold
- players bid toward the outcome
- player roles create ensemble identity
- hidden motives and frailty create drama
- episode structure has beginning, middle, and wrap
- commercial breaks create pacing and safety moments

MTGOA should borrow Hearts Blazing mostly at the episode layer, not the stat layer.

Useful adaptations:

- episode cards for campaign packet pacing
- spotlight prompts for who opens a scene
- commercial break as a pause, safety, or reflection procedure
- role-based moves for the five-person ensemble
- frailty-like prompts through self-sabotaging beliefs

Main caution:

Hearts Blazing can get messy in setup and is not naturally one-shot friendly. MTGOA should keep the card layer optional or campaign-facing, not required for every basic roll.

## Foundations

Best lesson: prompts can build a world that changes over time.

The useful pieces:

- cards generate history, map changes, and durable consequences
- the map is a living artifact
- prompts alter what already exists
- worldbuilding is procedural rather than purely authored

MTGOA should borrow Foundations for:

- campaign packet creation
- world-in-crisis setup
- mission clocks and faction changes
- downtime world updates
- "what changed because of the episode?" prompts

Foundations should not drive character stat resolution.

## Recommended Core Dice Interface

Use this as the default:

**When a character makes a risky allyship move and the outcome is uncertain, choose the Basic Move category, name the approach, and roll 2d6 + the relevant stat.**

Outcome ladder:

- **10+**: the move lands; choose 2 benefits from that Basic Move.
- **7-9**: the move lands with friction; choose 1 benefit and accept 1 cost.
- **6-**: the move reveals a truth; the Guide makes a move, the situation changes, and you gain 1 Adversity.

If you name your impact honestly after a 6-, also mark Growth.

This keeps the Dungeon World engine and the existing v0.2 MTGOA benefit/cost model.

## Recommended Stat Model

Stats should be School-owned approaches, not move categories.

Draft six-stat set:

| Stat | Owning School | Use It When You... | Allyship Question |
|---|---|---|---|
| **Sense** | School of the Body | read the room, notice emotion, track consent, feel the field | What is happening beneath the stated story? |
| **Act** | School of the Line | intervene, interrupt, follow through, take visible action | What needs to happen now? |
| **Steady** | School of the Oath | stay present, regulate, keep commitments, hold a line | What can you remain with without collapsing or performing? |
| **Shape** | School of the Pattern | organize, design, map systems, build containers | What structure would make right action easier? |
| **Tend** | School of the Bridge | repair, support, resource, care, reduce burden | What does care require materially or relationally? |
| **Speak** | School of the Horizon | name truth, ask the hard question, translate perspective | What needs to be said, and how cleanly can it be said? |

Starting spread:

- +2 to one stat
- +1 to two stats
- 0 to two stats
- -1 to one stat

Maximum stat: +3.

Minimum stat: -2.

## Why Six Stats

Six stats gives enough build variety without becoming fussy.

It also echoes:

- Dungeon World's six-stat familiarity
- Kids on Bikes' six-stat spread
- MTGOA's six Faces / Schools

The stats are owned by the Schools, but they are not locked to a student's Home School.

That is important.

Each School teaches mastery through its owned stat:

- Body teaches mastery through Sense.
- Line teaches mastery through Act.
- Oath teaches mastery through Steady.
- Pattern teaches mastery through Shape.
- Bridge teaches mastery through Tend.
- Horizon teaches mastery through Speak.

But character building should not collapse into "my Home School is my only good stat." A Body student can be great at Speak because they learned to translate sensation into language. A Horizon student can be weak at Sense because they overuse abstraction. A Line student can have Tend as their strongest stat because their direct action is rooted in care.

The School owns the curriculum. The character owns their relationship to it.

## Move Categories vs Stats

The same Basic Move can use different stats depending on how the character approaches it.

Examples:

### Wake Up

- roll +Sense when you read the emotional field
- roll +Shape when you trace a system pattern
- roll +Speak when you ask the question that makes the hidden thing visible

### Open Up

- roll +Steady when you name a limit before crossing it
- roll +Tend when you ask for support or receive care cleanly
- roll +Speak when you reveal a truth that makes honest contact possible

### Clean Up

- roll +Tend when you repair harm through care or resource
- roll +Speak when you make an honest apology or public correction
- roll +Shape when you change the structure that caused the harm

### Grow Up

- roll +Steady when you receive feedback without collapsing
- roll +Sense when you notice your pattern in real time
- roll +Act when you act before you feel ready

### Show Up

- roll +Act when you intervene directly
- roll +Tend when you move a needed resource
- roll +Shape when you organize a durable response
- roll +Speak when you raise awareness with consent

Rule of thumb:

The player describes the action. The table identifies the Basic Move. The Guide confirms the stat based on what the character is actually doing.

## Preventing Stat Fishing

Players should be allowed to solve problems creatively, but not to force their best stat onto every roll.

Use this table rule:

**If the stat is not obvious, ask: what are we seeing on screen?**

Examples:

- If you are comforting someone, that is probably Tend.
- If you are naming the avoided truth, that is probably Speak.
- If you are holding your ground while people pressure you, that is probably Steady.
- If you are building an organizing plan, that is probably Shape.
- If you are interrupting harm in motion, that is probably Act.
- If you are noticing what no one has said, that is probably Sense.

If two stats both make sense, the player chooses which one they are leaning on, and the Guide names a different possible cost for each.

Example:

"You can roll +Speak to call this out publicly, but the cost may be exposure. Or you can roll +Tend to check in privately first, but the cost may be delay."

## Planned Action and Snap Decision

Borrow this distinction from Kids on Bikes, but keep it lightweight.

### Episode Rolls

During an episode, when pressure is active, roll normally.

### Downtime Actions

During downtime, if there is no meaningful uncertainty, do not roll.

If there is uncertainty but the character has time, support, and tools, choose one:

- take the safe result: gain 1 benefit and accept 1 mild cost
- roll normally for a chance at 10+

This prevents downtime from becoming a chain of low-stakes rolls.

## Adversity Tokens

Keep Adversity.

Adversity is not XP. Growth is XP.

Adversity is short-term leverage earned by failed or costly action.

Gain 1 Adversity when:

- you roll 6-
- you name your Cost before paying it
- a Belief wound move meaningfully complicates your action
- the Guide offers Adversity for accepting a harder truth, ugly choice, or delayed consequence

Spend 1 Adversity to:

- add +1 to your own roll after rolling
- add +1 to another player's roll if your character can help
- ask one honest question about the scene
- introduce a useful but costly resource
- activate a move that requires Adversity

Adversity can turn a miss into a partial or a partial into a 10+, but the player must narrate what previous failure taught them.

## Growth

Growth remains the long-term advancement currency.

Gain Growth when:

- you name impact after a miss
- you act against your self-sabotaging belief
- you complete a School training prompt
- you repair meaningful harm
- you receive feedback without disappearing
- you teach another student something earned through play

This separates two jobs:

- **Adversity** = tactical currency
- **Growth** = advancement currency

## Optional Polyhedral Layer

If we want more tactile dice texture, add School Dice later.

Do not put this in the first playtest unless the base engine feels too plain.

Possible version:

Each School Rank grants a School Die:

| Rank | School Die |
|---|---|
| Initiate | d4 |
| Practitioner | d6 |
| Adept | d8 |
| Steward | d10 |
| Integrator | d12 |
| Keeper | d20 |

When your School training clearly applies to a roll, roll your School Die alongside 2d6.

Do not add it to the total.

Instead:

- on 4+, gain 1 Clarity
- on the die's maximum value, choose 1 extra category benefit
- on 1, the School's shadow appears or you take 1 Tension

This borrows the tactile appeal of Kids on Bikes without replacing the core 2d6 move ladder.

Design note:

This is exciting, but it may be too much for one-shot play. Treat it as an advanced rule or campaign rule until tested.

## Cards Recommendation

Use cards for episodes, not basic rolls.

Cards can handle:

- episode prompt
- spotlight student
- faction pressure
- school trial prompt
- downtime event
- world change after the mission

Cards should not decide whether a specific allyship move succeeds.

That job belongs to the dice.

## Current Recommendation

For v0.4 playtest, use:

- 2d6 + stat
- six School-owned approach stats: Sense, Act, Steady, Shape, Tend, Speak
- Wake Up / Open Up / Clean Up / Grow Up / Show Up as Basic Move categories
- category-specific benefit and cost lists
- Adversity as tactical miss currency
- Growth as advancement currency
- cards only for episode and campaign pacing
- no School Dice in the first playtest unless the table specifically wants a crunchier campaign mode

## Open Questions

1. Are the stat names emotionally right?
2. Is **Act** the right name for direct intervention, or should it be **Intervene**, **Strike**, or **Follow Through**?
3. Should **Speak** and **Act** be combined, or do public truth and direct intervention deserve separate stats?
4. Should **Tend** include resource movement, or should resource movement belong to Shape / Act?
5. Does the game need a tactile polyhedral layer to feel premium, or is 2d6 plus cards enough?

## Next Draft Needed

Create:

`Core Moves and Dice - v0.4.md`

It should include:

- final stat list
- stat assignment rules
- roll procedure
- Wake Up move
- Open Up move
- Clean Up move
- Grow Up move
- Show Up move
- benefit lists by category
- cost lists by category
- Adversity rules
- guidance for choosing the right stat
