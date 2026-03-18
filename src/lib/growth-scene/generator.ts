import { db } from '@/lib/db'
import { selectScene } from '@/lib/alchemy/select-scene'
import { resolveMoveDestination } from '@/lib/alchemy/wuxing'
import type { SceneDsl, SceneChoice, SceneCard, SceneType } from '@/lib/growth-scene/types'
import type { AlchemyAltitude, EmotionChannel } from '@/lib/alchemy/types'

export interface GenerateSceneOpts {
  archetypeSlug?: string
  nationSlug?: string
  campaignPhase?: string
  sceneType?: SceneType // defaults to 'transcend'
  /** Active daemon channel for scene scoring (IE-6) */
  daemonChannel?: string
  /** Active daemon altitude for scene scoring (IE-6) */
  daemonAltitude?: string
}

/**
 * Generates a GrowthScene for a player from their current alchemy state.
 * Uses Wuxing routing to resolve targetChannel and altitudeTo based on sceneType.
 * Returns the persisted scene + compiled SceneDsl.
 */
export async function generateScene(playerId: string, opts: GenerateSceneOpts = {}) {
  const state = await db.alchemyPlayerState.findUnique({
    where: { playerId },
    select: { channel: true, altitude: true },
  })

  if (!state) {
    return { error: 'No alchemy state found for player. Set channel + altitude first.' }
  }

  const channel = state.channel as EmotionChannel
  const altitudeFrom = state.altitude as AlchemyAltitude
  const sceneType: SceneType = opts.sceneType ?? 'transcend'

  // Wuxing routing: determines targetChannel + altitudeTo
  const resolution = resolveMoveDestination(channel, altitudeFrom, sceneType)
  const { targetChannel, targetAltitude: altitudeTo, vector } = resolution

  const template = await selectScene(playerId, {
    archetypeSlug: opts.archetypeSlug,
    nationSlug: opts.nationSlug,
    campaignPhase: opts.campaignPhase,
    sceneType,
    channel: targetChannel, // scene content lives in destination channel
    altitudeFrom,
    daemonChannel: opts.daemonChannel,
    daemonAltitude: opts.daemonAltitude,
  })
  if (!template) {
    return { error: `No scene template available for ${vector}` }
  }

  // Compile Scene DSL from template
  const cards: SceneCard[] = [
    { text: template.situation },
    { text: template.friction },
    { text: template.invitation },
  ]

  let choices: SceneChoice[] = []
  try {
    choices = JSON.parse(template.choices)
  } catch {
    choices = [{ key: 'continue', label: 'Continue', isGrowth: true }]
  }

  const dsl: SceneDsl = {
    scene_id: template.id,
    vector,
    sceneType,
    channel,
    altitudeFrom,
    altitudeTo,
    targetChannel,
    cards,
    choices,
    advice: template.advice,
  }

  // Persist the GrowthScene
  const scene = await db.growthScene.create({
    data: {
      playerId,
      vector,
      templateId: template.id,
      sceneDsl: JSON.stringify(dsl),
      status: 'active',
    },
  })

  return { scene, dsl }
}
