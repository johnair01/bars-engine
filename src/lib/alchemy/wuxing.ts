/**
 * Wuxing (五行) emotional channel routing.
 *
 * Maps the Five Elements to emotional channels and encodes the two cycles:
 *   生 shēng (generation) — the nourishing/produce cycle → translate upward
 *   克 kè (control/destruction) — the overcoming cycle → never raises; depends on the start
 *
 * Element mapping (canonical — matches src/lib/quest-grammar/elements.ts):
 *   Wood  (木) = joy / delight ("love of the game"; vitality; jouissance)
 *   Fire  (火) = anger (obstacle present OR boundary violated)
 *   Earth (土) = neutrality (whole-system perspective)
 *   Metal (金) = fear (risk/opportunity detected; excitement = fear as opportunity)
 *   Water (水) = sadness (something I care about is distant or misaligned)
 *
 * Note: Metal=fear, Water=sadness is an intentional departure from traditional
 * Chinese medicine mapping (which has Metal=grief, Water=fear). This system
 * uses the Emotional Alchemy ontology, not the TCM convention.
 */

import type { EmotionChannel } from './types'
import type { AlchemyAltitude } from './types'
import moveTable from '../quest-grammar/move-table.json'
import { SHENG_CYCLE, KE_CYCLE } from './wuxing-cycles'

export type SceneType = 'transcend' | 'generate' | 'control'

// Both cycles and what each family does to satisfaction come from the move table, a copy of six-faces-council
// schema/move-table.json (src/lib/quest-grammar/__tests__/move-table.test.ts keeps them in step).

const ALTITUDE_ORDER = moveTable.states as AlchemyAltitude[]

const FAMILY: Record<SceneType, keyof typeof moveTable.families> = {
  transcend: 'transcend',
  generate: 'generative',
  control: 'control',
}

export interface MoveResolution {
  targetChannel: EmotionChannel
  targetAltitude: AlchemyAltitude
  /** Human-readable vector label, e.g. "fear:dissatisfied→sadness:neutral" */
  vector: string
}

/**
 * Resolve where a move takes a player given their current state and chosen scene type.
 *
 * Transcend: same channel, two steps (dissatisfied → neutral → satisfied); from satisfied there is no step
 * Generate:  shēng target channel, +1 (satisfied is the ceiling)
 * Control:   kè target channel; depends on the start: satisfied holds, neutral pulls back, dissatisfied holds
 */
export function resolveMoveDestination(
  channel: EmotionChannel,
  altitude: AlchemyAltitude,
  sceneType: SceneType,
): MoveResolution {
  const family = moveTable.families[FAMILY[sceneType]]
  const targetChannel =
    family.channel === 'sheng' ? SHENG_CYCLE[channel] : family.channel === 'ke' ? KE_CYCLE[channel] : channel
  const targetAltitude = ((family.state as Record<string, string | null>)[altitude] ?? altitude) as AlchemyAltitude
  return {
    targetChannel,
    targetAltitude,
    vector: `${channel}:${altitude}→${targetChannel}:${targetAltitude}`,
  }
}

/** The channel a generate move from `channel` would target. */
export function shengTarget(channel: EmotionChannel): EmotionChannel {
  return SHENG_CYCLE[channel]
}

/** The channel a control move from `channel` would target. */
export function keTarget(channel: EmotionChannel): EmotionChannel {
  return KE_CYCLE[channel]
}

export { SHENG_CYCLE, KE_CYCLE, ALTITUDE_ORDER }
