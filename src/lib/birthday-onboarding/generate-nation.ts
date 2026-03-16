import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'

const nationSchema = z.object({
  description: z.string(),
  wakeUp: z.string(),
  cleanUp: z.string(),
  growUp: z.string(),
  showUp: z.string(),
})

export async function generateNationContent(nationName: string, element: string, vibeText: string) {
  const result = await generateObject({
    model: getOpenAI()('gpt-4o-mini'),
    schema: nationSchema,
    system: `You generate lore content for player-created nations in an emotional alchemy game.
Nations are tied to one of five elements (metal=fear, water=sadness, wood=joy, fire=anger, earth=neutrality).
WAVE stages: Wake Up (notice), Clean Up (correct), Grow Up (learn), Show Up (act).
Keep descriptions evocative, 1-3 sentences each. Match the nation's vibe.`,
    prompt: `Nation name: ${nationName}
Element: ${element}
Player's description: ${vibeText}

Generate nation lore content.`,
  })
  return result.object
}
