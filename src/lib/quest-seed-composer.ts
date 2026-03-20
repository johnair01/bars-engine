/**
 * Quest Seed Composer — assembles player context before quest generation.
 * Spec: .specify/specs/individuation-engine/plan.md (IE-1)
 *
 * No DB writes. All reads wrapped in try/catch; failures return null for that field.
 */

import { db } from '@/lib/db'
import { getArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay'
import type { ArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay/types'
import { getActiveInstance } from '@/actions/instance'
import { queryActiveDaemonChannelAltitude } from '@/lib/daemon-active-state'

export type SceneType = 'transcend' | 'generate' | 'control'

export interface QuestSeedContext {
  archetypeProfile: ArchetypeInfluenceProfile | null
  daemonChannel: string | null
  daemonAltitude: string | null
  /** Current Kotter stage from the active instance. Phase 1 proxy for NationFaceEra. */
  kotterStage: number
  /** Always null until Phase 3 (NationFaceEra model). */
  activeFaceKey: string | null
  sceneType: SceneType | null
  chargeBarId: string
}

/**
 * Assembles a QuestSeedContext for quest generation.
 * Reads: player archetype, active daemon state, active instance kotter stage,
 * and sceneType from the BAR's inputs JSON.
 */
export async function buildQuestSeedInput(
  playerId: string,
  barId: string
): Promise<QuestSeedContext> {
  const context: QuestSeedContext = {
    archetypeProfile: null,
    daemonChannel: null,
    daemonAltitude: null,
    kotterStage: 1,
    activeFaceKey: null,
    sceneType: null,
    chargeBarId: barId,
  }

  // Archetype profile — prefer immutable stamp on charge BAR (IE-10), else player playbook
  try {
    const barRow = await db.customBar.findUnique({
      where: { id: barId },
      select: { archetypeKey: true },
    })
    const stamped = barRow?.archetypeKey?.trim()
    if (stamped) {
      context.archetypeProfile = getArchetypeInfluenceProfile(stamped) ?? null
    } else {
      const player = await db.player.findUnique({
        where: { id: playerId },
        select: { archetypeId: true },
      })
      if (player?.archetypeId) {
        const archetype = await db.archetype.findUnique({
          where: { id: player.archetypeId },
          select: { name: true },
        })
        if (archetype?.name) {
          context.archetypeProfile = getArchetypeInfluenceProfile(archetype.name) ?? null
        }
      }
    }
  } catch (e) {
    console.warn('[buildQuestSeedInput] archetype lookup failed', e)
  }

  // Daemon state
  try {
    const daemon = await queryActiveDaemonChannelAltitude(playerId)
    if (daemon) {
      context.daemonChannel = daemon.channel
      context.daemonAltitude = daemon.altitude
    }
  } catch (e) {
    console.warn('[buildQuestSeedInput] daemon state lookup failed', e)
  }

  // Kotter stage from active instance
  try {
    const instance = await getActiveInstance()
    if (instance?.kotterStage) {
      context.kotterStage = instance.kotterStage
    }
  } catch (e) {
    console.warn('[buildQuestSeedInput] instance lookup failed', e)
  }

  // Scene type from BAR inputs JSON
  try {
    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { inputs: true },
    })
    if (bar?.inputs) {
      const parsed = JSON.parse(bar.inputs) as { sceneType?: string }
      if (['transcend', 'generate', 'control'].includes(parsed.sceneType ?? '')) {
        context.sceneType = parsed.sceneType as SceneType
      }
    }
  } catch (e) {
    console.warn('[buildQuestSeedInput] BAR inputs parse failed', e)
  }

  return context
}
