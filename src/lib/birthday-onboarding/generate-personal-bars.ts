import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'

const personalBarSchema = z.object({
  bars: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(1)
    .max(2),
})

export async function generatePersonalBars(
  channel: string,
  altitude: string,
  intention: string,
  archetypeName: string,
) {
  const result = await generateObject({
    model: getOpenAI()('gpt-4o-mini'),
    schema: personalBarSchema,
    system: `You generate personal Brave Acts of Resistance (BARs) for a player.
A BAR is a specific, courageous commitment to act — concrete and achievable.
The player's emotional state informs what kind of courage is called for.
Generate 1-2 BARs that feel personal and immediately actionable.`,
    prompt: `Player emotional channel: ${channel} (altitude: ${altitude})
Player intention: ${intention}
Player archetype: ${archetypeName}

Generate 1-2 personal BARs appropriate to this emotional state and archetype.`,
  })
  return result.object.bars
}
