# Hexagram + Campaign Goal Alignment — Design Note

## Why This Is Compelling

The I Ching provides:
- **Tone and imagery** — hexagram name, tone, text
- **Trigrams** — upper and lower trigram from hexagram structure
- **Archetypes** — trigrams connect to archetypes (playbook names map to trigrams: Bold Heart→Heaven, Devoted Guardian→Earth, etc.; Game Master faces map to trigrams: shaman→Earth, challenger→Fire, etc.)
- **Available moves** — with trigrams come elements; with elements come the canonical moves (Transcend, Generative, Control). Each move has primaryWaveStage (wakeUp, cleanUp, growUp, showUp). So the hexagram structurally determines which moves are in play.
- **Alignment** — already wired to kotterStage, nation, playbook via `getAlignmentContext`

The campaign provides:
- **Goal** — e.g. Bruised Banana Residency, people showing up
- **Stage action** — what the stage asks (creating urgency, building coalition, etc.) — but **not** the stage name

The generative question:
> *How does [stage action] directly tie to people showing up in the campaign goal?*

This produces quests that:
1. Feel aligned (hexagram tone + imagery)
2. Are actionable (concrete, not abstract)
3. Increase throughput (focused on campaign goal)
4. Avoid jargon (no "Rally the Urgency" in titles)

## Example

**Stage 1 action:** Creating urgency.  
**Campaign goal:** Bruised Banana Residency — people showing up.  
**Hexagram:** #24 Return — "The turning point. What was dormant stirs."

**Generated quest (good):**  
*"Name one person who could show up—and what would make this moment matter to them."*

**Generated quest (bad):**  
*"Rally the Urgency"* (uses stage name)

## Implementation Sketch

```ts
// In generateCampaignThroughputQuest or extend compileQuestWithAI
const campaignGoal = await getCampaignGoal(campaignRef)  // e.g. "Bruised Banana Residency"
const stageAction = getStageAction(period)               // e.g. "creating urgency"
const hexagram = await getHexagram(hexagramId)
const structure = getHexagramStructure(hexagram.id)      // { upper, lower } trigrams

// Derive archetypes and moves from trigrams
const archetypesFromTrigrams = getArchetypesForTrigrams(structure.upper, structure.lower)
const movesFromTrigrams = getMovesForTrigrams(structure.upper, structure.lower)  // canonical moves keyed by element

const prompt = `
Hexagram ${hexagram.id}: ${hexagram.name} — ${hexagram.tone}
${hexagram.text}

Trigrams: ${structure.upper} over ${structure.lower}
Archetypes in play: ${archetypesFromTrigrams.join(', ')}
Available moves: ${movesFromTrigrams.map(m => m.name).join(', ')}

Campaign goal: ${campaignGoal}
Stage action: ${stageAction}

Generate a quest that answers: How does ${stageAction} directly tie to people showing up in ${campaignGoal}?
- Use the hexagram's imagery for tone.
- Privilege moves from the hexagram's trigrams.
- Output a concrete, actionable title (no Kotter stage names).
- Output a 1–2 sentence description.
`
```

## Throughput Definition

**Throughput** = actions that move the campaign forward:
- People showing up (attendance, signups)
- Resources gathered (donations, commitments)
- Visibility increased (sharing, inviting)

Each generated quest should be answerable with: *"Completing this moves the campaign forward because ___."*
