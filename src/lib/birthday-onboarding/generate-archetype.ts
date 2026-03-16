import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'

const archetypeSchema = z.object({
  description: z.string(),
  content: z.string(),
  shadowSignposts: z.string(),
  moves: z.array(z.string()).min(2).max(4),
})

export async function generateArchetypeContent(
  archetypeName: string,
  centralConflict: string,
  primaryQuestion: string,
  vibe: string,
) {
  const result = await generateObject({
    model: getOpenAI()('gpt-4o-mini'),
    schema: archetypeSchema,
    system: `You generate content for player-created archetypes in an emotional alchemy CYOA game.
Archetypes are playbooks — they define a character's emotional pattern and moves.
Available moves (pick 2-4): "Renew Vitality", "Activate Hope", "Reopen Sensitivity",
"Achieve Breakthrough", "Declare Intention", "Mobilize Grief", "Stabilize Coherence",
"Integrate Gains", "Consolidate Energy", "Reveal Stakes", "Deepen Value",
"Reclaim Meaning", "Commit to Growth", "Step Through", "Temper Action".
Keep descriptions sharp and personal — 1-2 sentences each.`,
    prompt: `Archetype name: ${archetypeName}
Central conflict: ${centralConflict}
Primary question: ${primaryQuestion}
Vibe: ${vibe}

Generate archetype content and select 2-4 appropriate moves.`,
  })
  return result.object
}
