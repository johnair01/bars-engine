import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'

const barSchema = z.object({
  bars: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        domain: z.enum([
          'GATHERING_RESOURCES',
          'DIRECT_ACTION',
          'RAISE_AWARENESS',
          'SKILLFUL_ORGANIZING',
        ]),
      }),
    )
    .min(3)
    .max(5),
})

export interface CampaignBarInput {
  birthdayPersonName: string
  vibeWords: string[]
  desiredFeeling: string
  primaryGoal: string
  secondaryGoals: string[]
  domainType: string
}

export async function generateCampaignBars(input: CampaignBarInput) {
  const result = await generateObject({
    model: getOpenAI()('gpt-4o-mini'),
    schema: barSchema,
    system: `You generate Brave Acts of Resistance (BARs) — specific, courageous commitments to act.
A BAR is concrete, personal, and tied to a real-world action. Not vague goals.
Generate 3-5 BARs seeded from a birthday campaign's vibe and goals.
BARs should feel joyful, meaningful, and achievable within a birthday event timeframe.`,
    prompt: `Birthday person: ${input.birthdayPersonName}
Vibe words: ${input.vibeWords.join(', ')}
Desired feeling: ${input.desiredFeeling}
Primary goal: ${input.primaryGoal}
Secondary goals: ${input.secondaryGoals.join('; ')}
Domain: ${input.domainType}

Generate 3-5 BARs for this birthday campaign.`,
  })
  return result.object.bars
}
