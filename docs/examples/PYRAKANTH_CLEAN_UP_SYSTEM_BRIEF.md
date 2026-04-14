# Pyrakanth Clean-Up Flow — System Brief

This brief describes a playable **choose-your-own-adventure (CYOA) flow** designed using the BARS Engine. It integrates one *nation* (Pyrakanth), one *trigram archetype* (The Truth Seer, Fire Li), one *game-master lens* (Challenger), and one *basic move* (Clean Up) to create a ritualised experience for metabolising anger. The accompanying Twine script (`cyoa-flow-pyrakanth-clean-up.twee`) contains the nodes and links for the flow.

## System overview

The BARS Engine uses four developmental "moves" — **Wake Up**, **Clean Up**, **Grow Up** and **Show Up** — to transform emotional energy into insight and action. These moves are customised by the five nations of the Wuxing emotional alchemy system (anger = fire, sadness = water, joy = wood, fear = metal, neutral = earth) and by six game-master lenses representing developmental stages (e.g., Challenger, Sage). Trigram archetypes add a behavioural flavour to how the moves are expressed.

In this flow, the player begins with a feeling of anger (Pyrakanth). They choose the **Clean Up** move, which in Pyrakanth is known as **Burn Offering** — burning away stuck energy to reveal what is essential. They elect to work with the **Challenger** lens (red developmental level) which emphasises claiming power, taming fire and confronting destructive impulses. The behavioural archetype is **The Truth Seer (Fire Li)**, whose way of cleaning up is the *Purifying Flame* — burning away impurities to reveal what is essential.

The result is a guided ritual that leads the player through acknowledging their anger, choosing how to release it, witnessing the truth beneath it, creating a Behaviour-Action-Reflection (BAR) commitment, and ending with an epiphany about what must change.

## Player state model

A structured player state object is used to track progress. In code-like form:

```json
{
  "emotion": "anger",
  "nation": "Pyrakanth",
  "archetype": "TruthSeer",
  "game_master": "Challenger",
  "move": "CleanUp",
  "dissatisfaction_state": "",
  "release_path": "",
  "epiphany_type": "",
  "bar_text": ""
}
```

During the flow the state is updated:

* **emotion** and **nation** are fixed for this adventure.
* **dissatisfaction_state** is recorded when the player names their anger.
* **release_path** stores which release method the player chooses (Confront, Transform, Sacrifice).
* **epiphany_type** records whether the ember revealed a need for change, a boundary, a passion, or a lie.
* **bar_text** holds the final BAR commitment written by the player.

## Branching logic axes

The system uses four axes to modulate narrative and choice:

| Axis | Influence on choices and narrative |
|---|---|
| **Nation (Pyrakanth)** | Sets the **emotional tone** (anger) and provides national moves like *Burn Offering*. Choices emphasise purifying anger through heat and catharsis. |
| **Game Master (Challenger)** | Governs the **framing**; the Challenger pushes the player to claim power, confront their fire and transform destructive impulses into purposeful action. Choices are direct and demanding. |
| **Archetype (Truth Seer)** | Determines **behavioural style**; the Truth Seer sees and speaks truth. Their clean-up move is *Purifying Flame* — cutting away impurities to reveal essence. Narrative asks the player to name truths and purge lies. |
| **Move (Clean Up)** | Defines **purpose of the scene**; the goal is to metabolise anger by releasing, purifying and integrating shadow. Choices focus on recognising the root of anger, choosing a release method, witnessing what remains and converting insight into action. |

## Choice grammar

Each choice node in the Twine flow contains:

- **Scene context**: descriptive text that evokes the Pyrakanth landscape and the Challenger's presence.
- **Prompt**: an invitation to reflect or act (e.g., "Where in your body do you feel this anger?").
- **Choices**: two or more options, each labelled with the action taken (e.g., "Confront", "Transform", "Sacrifice").
- **Tags**: implicit in the narrative; each choice corresponds to a release path and eventually an epiphany type.

## Example nodes and state transitions

### Intake and move selection

* `Start` asks the player to name their anger. This sets `dissatisfaction_state`.
* `ChooseMove` presents four moves and instructs the player to select **Clean Up**. This sets `move`.
* `ChooseGM` confirms the **Challenger** lens. This sets `game_master`.

### Guided Clean-Up ritual

* `IntroMove` explains the ritual (three phases: reveal anger, offer it, witness what remains). It invites readiness.
* `RevealRoot` asks introspective questions and offers three paths describing how anger behaves (erupting outward, imploding inward, simmering). This stage does not yet diverge the state significantly — all paths lead to `Offering`.

### Release methods

In `Offering` the player chooses how to release anger:

| Choice | State change |
|---|---|
| **Confront** | Sets `release_path = "Confront"`; emphasises speaking truth. |
| **Transform** | Sets `release_path = "Transform"`; emphasises physical expression. |
| **Sacrifice** | Sets `release_path = "Sacrifice"`; emphasises surrender. |

Each choice leads to a node that asks the player to check how they feel after releasing. Regardless of feeling lighter (`AfterReleaseGood`) or heavy (`AfterReleaseHeavy`), the flow converges to `Witness`.

### Epiphany and BAR generation

In `Witness` the player observes an ember and chooses which truth it reveals:

| Choice | State change |
|---|---|
| **A change I must make** | Sets `epiphany_type = "Change"`. |
| **A boundary I must set** | Sets `epiphany_type = "Boundary"`. |
| **A passion I had forgotten** | Sets `epiphany_type = "Passion"`. |
| **A lie I was believing** | Sets `epiphany_type = "Lie"`. |

The flow then leads to `GenerateBAR`, where the player writes a personal Behaviour-Action-Reflection (BAR). This sets `bar_text`. Finally, `CompleteReflection` concludes the ritual and offers a loop back to the start.

## Open questions / future work

- **Scalability**: How should the system handle multiple nations, archetypes and moves simultaneously? Designing matrixed flows for all combinations will require modularisation of narrative content.
- **Feedback loops**: The Clean-Up flow currently assumes a linear progression. Future designs might allow revisiting previous steps or escalating stakes if the release is incomplete.
- **Integration with game mechanics**: How will the BAR created here interact with other game systems (e.g., experience points, achievements, or community sharing)?
- **Automated content generation**: This flow was manually crafted. Developing templates and grammars to programmatically generate similar flows could help cover the remaining combinations (e.g., other nations or moves).
