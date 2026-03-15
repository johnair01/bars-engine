import { generateText } from 'ai'
import { getOpenAI } from '@/lib/openai'
import { db } from '@/lib/db'
import { resolveMoveDestination } from '@/lib/alchemy/wuxing'
import type { EmotionChannel, AlchemyAltitude } from '@/lib/alchemy/types'
import type { SceneType } from '@/lib/growth-scene/types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

export interface GenerateThresholdEncounterOpts {
  hexagramId?: number
  gmFace?: string
  nationSlug?: string
  archetypeSlug?: string
  barCandidateSeeds?: string[]
  beatMode?: 'minimal' | 'canonical'
}

export async function generateThresholdEncounter(
  playerId: string,
  sceneType: SceneType,
  opts: GenerateThresholdEncounterOpts = {},
) {
  const state = await db.alchemyPlayerState.findUnique({
    where: { playerId },
    select: { channel: true, altitude: true },
  })
  if (!state) {
    return { error: 'No alchemy state found. Complete a check-in first.' }
  }

  const channel = state.channel as EmotionChannel
  const altitudeFrom = state.altitude as AlchemyAltitude
  const resolution = resolveMoveDestination(channel, altitudeFrom, sceneType)
  const { vector } = resolution

  const beatMode = opts.beatMode ?? 'canonical'
  const gmFace = opts.gmFace ?? 'shaman'

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt({
    emotionalVector: vector,
    sceneType,
    gmFace,
    hexagramId: opts.hexagramId,
    nationSlug: opts.nationSlug,
    archetypeSlug: opts.archetypeSlug,
    barCandidateSeeds: opts.barCandidateSeeds,
    beatMode,
  })

  let tweeSource: string
  try {
    const result = await generateText({
      model: getOpenAI()('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: beatMode === 'minimal' ? 800 : 1800,
    })
    tweeSource = result.text
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `AI generation failed: ${msg}` }
  }

  // Extract StoryData JSON from twee source
  const storyDataMatch = tweeSource.match(/:: StoryData\s*\n([\s\S]*?)(?=\n:: |\s*$)/)
  let storyData = '{}'
  if (storyDataMatch) {
    const raw = storyDataMatch[1].trim()
    try {
      JSON.parse(raw) // validate
      storyData = raw
    } catch { /* use default */ }
  }

  const encounter = await db.thresholdEncounter.create({
    data: {
      playerId,
      vector,
      sceneType,
      gmFace,
      hexagramId: opts.hexagramId ?? null,
      nationSlug: opts.nationSlug ?? null,
      archetypeSlug: opts.archetypeSlug ?? null,
      beatMode,
      tweeSource,
      storyData,
      status: 'active',
    },
  })

  return { encounter, vector, tweeSource, storyData }
}
