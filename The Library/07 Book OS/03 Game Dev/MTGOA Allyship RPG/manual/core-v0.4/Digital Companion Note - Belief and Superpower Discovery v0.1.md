# Digital Companion Note - Belief and Superpower Discovery v0.1

Status: digital companion concept note

Purpose: define the handbook-linked digital experience where players discover their self-sabotaging Belief, choose a safe play distance, and identify an allyship superpower before completing the Chapter 6 Student Record.

Related artifacts:

- [[Chapter 6 Prose Draft - Beliefs Shadows and Superpowers v0.2]]
- [[Chapter 6 Editorial Source Gap Spec - Beliefs and Superpowers v0.1]]
- [[BARs Engine Spec - Character Creator App v0.1]]
- [[../../../02 Index/KEYTERM-ALLYSHIP-SUPERPOWERS|KEYTERM-ALLYSHIP-SUPERPOWERS]]

## Product Role

This is the digital doorway for Chapter 6.

The printed or PDF handbook can teach the concept. The digital companion can help a player interact with the concept gently, choose language, and leave with a usable character artifact.

The tool should answer:

1. How close do I want to play this material?
2. Which self-sabotaging Belief becomes active under pressure?
3. Which superpower feels like my student's gift?
4. How does the Belief distort the superpower?
5. What does clean use look like?
6. What move do I want to practice first?

The experience should feel like an admission interview with a careful ship office, not a quiz that diagnoses the user.

## Digital Handbook Link

In the digital RPG handbook, Chapter 6 should include a callout:

> Want help choosing your Belief and superpower? Open the Belief and Superpower Discovery tool. It will not diagnose you, sort you permanently, or ask for confession. It will help you choose what you want to make playable.

Suggested link text:

**Open the Belief and Superpower Discovery Tool**

Suggested placement:

- after `Choose Your Distance`
- again after `The Seven Superpowers`
- again at `Completing The Student Record`

## UX Principles

- **Consent before depth**: ask distance before asking Belief questions.
- **Fiction before analysis**: turn answers into character language, not personal interpretation.
- **Choice over diagnosis**: recommendations are invitations, not results.
- **Editable output**: every generated sentence can be rewritten by the player.
- **Playable artifact**: the final screen creates Student Record fields, not a personality report.
- **Safe exit**: users can skip, randomize, save partial work, or keep the result at mythic distance.

## Flow

## 1. Welcome

Player-facing copy:

> This tool helps you choose a self-sabotaging Belief and allyship superpower for your student. It is not a diagnosis. It is not a confession booth. It is a way to decide what kind of pressure you want to make playable.

Primary actions:

- Start
- Skip and choose manually
- Roll randomly

## 2. Choose Your Distance

The player chooses:

| Distance | Digital Description |
|---|---|
| **Close** | This may echo something personally resonant. Keep it chosen and bounded. |
| **Masked** | Put emotional truth behind invented character context. |
| **Mythic** | Make the pattern archetypal, magical, symbolic, or genre-heightened. |

The tool stores:

- `belief_distance`

The UI should remind:

> Choose only what you want to make playable.

## 3. Belief Discovery

Offer three paths:

1. **Choose directly**
2. **Roll 1d6**
3. **Answer prompts**

Belief options:

- I'm Not Good Enough
- I'm Not Ready
- I Don't Belong
- I'm Insignificant
- I'm Not Worthy
- I'm Not Capable

Prompt mode asks:

- When help is needed, what fear makes your student hesitate?
- When your student receives attention, what story tries to shrink them?
- When your student acts powerfully, what consequence do they expect?
- When someone trusts your student, what do they immediately try to prove?
- When your student fails, what sentence gets louder?
- When the crew needs your student, what part of them wants to hide?

The tool may recommend one or two Beliefs with language:

> This answer might point toward...

It should never say:

> You are...

## 4. Belief Translation

After choosing a Belief, the tool helps translate it into the chosen distance.

Fields:

- `belief`
- `belief_mask`
- `belief_pressure_story`

Examples:

Close:

> My student struggles to receive care without earning it.

Masked:

> My student trained in a guild where every blessing became debt.

Mythic:

> My student was raised under a star-temple that revoked names from children it deemed unworthy.

## 5. Superpower Discovery

Offer three paths:

1. **Choose directly**
2. **Use common pairing**
3. **Answer power prompts**

Superpower options:

- Connector
- Strategist
- Disruptor
- Escape Artist
- Catalyst
- Alchemist
- Storyteller

Common pairing support:

| Belief | Common Superpower |
|---|---|
| I Don't Belong | Connector |
| I'm Not Ready | Strategist |
| I'm Not Worthy | Disruptor |
| I'm Not Capable | Escape Artist or Catalyst |
| I'm Not Good Enough | Alchemist |
| I'm Insignificant | Storyteller |

Power prompts:

- What does your student notice before other people do?
- What kind of problem makes your student come alive?
- What kind of help feels energizing instead of draining?
- What do people rely on your student for, even when they do not name it?
- What does your student do when the room is stuck?
- What kind of pressure makes your student's gift go sideways?

The tool should show each superpower with:

- core gift
- mundane expression
- mythic expression
- shadow / overuse
- common Belief pairings

## 6. Escape Artist / Catalyst Split

If the chosen Belief is **I'm Not Capable**, the tool should present a branch:

| Branch | Question | Superpower |
|---|---|---|
| **Way Out** | When pressure rises, do you find exits, routes, options, and ways out of traps? | Escape Artist |
| **Way In** | When pressure rises, do you help others practice, improve, and become more capable? | Catalyst |

Player-facing copy:

> These two gifts share the same root ache and move in opposite directions. Escape Artist says, "There is another way out." Catalyst says, "There is another way in."

The player may still choose any superpower.

## 7. Wound Distortion And Clean Use

The tool prompts:

> When my Belief drives my superpower, I tend to...

and:

> When my superpower is clean, I can...

It should offer editable suggestions based on the chosen pairing.

Examples:

Disruptor + I'm Not Worthy:

- Wound Distortion: When Mara feels unworthy, she tests authority until someone proves they should not have had power over her anyway.
- Clean Use: Mara can interrupt false legitimacy while protecting the people the room would punish first.

Catalyst + I'm Not Capable:

- Wound Distortion: When pressure makes me feel helpless, I improve everyone else so I do not have to name what I need to practice.
- Clean Use: I can build capability beside others without making their growth carry my self-worth.

## 8. First Growth Move

The tool asks:

> Which clean action do you want to practice first?

Options:

- **Open Up** by naming what the Belief is making hard.
- **Clean Up** by repairing harm your Wound Move created.
- **Grow Up** by staying with the discomfort your gift usually avoids.
- **Show Up** by using your gift cleanly in a scene where the old pattern would be easier.

The tool generates:

- `first_growth_move`

## 9. Power Move To Earn

The tool shows the suggested Power Move from the pairing and lets the player rename it.

Fields:

- `desired_power_move`
- `power_move_cost`

Default:

- Core Power Move costs 3 Adversity.

The tool should frame this as aspiration:

> You do not begin with this fully unlocked. You are naming the version of your gift you want to become trustworthy with.

## 10. Campaign Hooks

The tool asks at least three:

- Who aboard the ship has already seen your power cleanly?
- Who has only seen the wound version?
- What kind of mission would tempt your Wound Move?
- What kind of care would make your Growth Move possible?
- Which House is most likely to notice your Wound Move?
- Which School might train your clean use?
- What would your Power Move look like if you were no longer trying to prove or hide anything?

The Guide view should summarize:

- temptation hook
- care/support hook
- witness/relationship hook
- likely House Heat
- likely School training hook

## 11. Final Output

The final screen produces a Student Record block:

```md
Belief And Superpower

Distance:
Belief:
Superpower:
Power Expression:
Wound Distortion:
Clean Use:
First Growth Move:
Power Move To Earn:

Campaign Hooks:
- Temptation:
- Care / Support:
- Witness / Relationship:
- House Heat:
- School Training:
```

The player can:

- copy to character sheet
- save to campaign room
- export as markdown
- revise answers
- keep private fields hidden from other players
- share Guide hooks only

## Privacy And Table Safety

The tool should distinguish between:

- **Player-private notes**
- **Table-visible character text**
- **Guide hooks**

Default:

- Belief, superpower, clean use, and first growth move are table-visible.
- Personal explanation is never required.
- Raw prompt answers should remain private unless the player shares them.
- Guide hooks should be player-approved before saving to a shared campaign.

## Data Fields

Recommended fields:

- `belief_distance`
- `belief`
- `belief_mask`
- `belief_pressure_story`
- `superpower_archetype`
- `power_expression`
- `wound_distortion`
- `clean_use`
- `first_growth_move`
- `desired_power_move`
- `power_move_cost`
- `temptation_hook`
- `care_hook`
- `witness_hook`
- `house_heat_hook`
- `school_training_hook`
- `visibility_settings`

## Open Questions

- Should the digital tool include a quiz score, or should recommendations stay soft and prompt-based?
- Should players be able to generate multiple possible pairings before choosing one?
- Should the tool include sample completed students beyond Mara Venn?
- Should private prompt answers be stored at all, or discarded after generating the Student Record?
- Should this live inside the full character creator or as a standalone Chapter 6 companion link?

## Recommendation

Build this as a standalone linked handbook tool first.

It can later become Module 9 / 9A of the full BARs Engine character creator.

The standalone version should prioritize safety, clarity, and a beautiful final Student Record over comprehensive automation.
