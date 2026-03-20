/**
 * Wuxing (五行) emotional channel routing.
 *
 * Maps the Five Elements to emotional channels and encodes the two cycles:
 *   生 shēng (generation) — the nourishing/produce cycle → translate UPWARD
 *   克 kè (control/destruction) — the overcoming cycle → translate DOWNWARD
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

export type SceneType = 'transcend' | 'generate' | 'control'

// Generation (shēng 生) cycle: Wood→Fire→Earth→Metal→Water→Wood
// In Emotional Alchemy channels (see elements.ts):
//   joy(Wood) → anger(Fire) → neutrality(Earth) → fear(Metal) → sadness(Water) → joy(Wood)
const SHENG_CYCLE: Record<EmotionChannel, EmotionChannel> = {
  joy:        'anger',
  anger:      'neutrality',
  neutrality: 'fear',
  fear:       'sadness',
  sadness:    'joy',
}

// Control/destruction (kè 克) cycle: Wood→Earth→Water→Fire→Metal→Wood
// In Emotional Alchemy channels:
//   joy(Wood) → neutrality(Earth) → sadness(Water) → anger(Fire) → fear(Metal) → joy(Wood)
const KE_CYCLE: Record<EmotionChannel, EmotionChannel> = {
  joy:        'neutrality',
  neutrality: 'sadness',
  sadness:    'anger',
  anger:      'fear',
  fear:       'joy',
}

const ALTITUDE_ORDER: AlchemyAltitude[] = ['dissatisfied', 'neutral', 'satisfied']

function altitudeStep(altitude: AlchemyAltitude, delta: 1 | -1): AlchemyAltitude {
  const idx = ALTITUDE_ORDER.indexOf(altitude)
  const next = idx + delta
  if (next < 0) return 'dissatisfied'
  if (next >= ALTITUDE_ORDER.length) return 'satisfied'
  return ALTITUDE_ORDER[next]
}

export interface MoveResolution {
  targetChannel: EmotionChannel
  targetAltitude: AlchemyAltitude
  /** Human-readable vector label, e.g. "fear:dissatisfied→anger:neutral" */
  vector: string
}

/**
 * Resolve where a move takes a player given their current state and chosen scene type.
 *
 * Transcend: same channel, +1 altitude
 * Generate:  shēng target channel, +1 altitude
 * Control:   kè target channel, −1 altitude (floor: dissatisfied)
 */
export function resolveMoveDestination(
  channel: EmotionChannel,
  altitude: AlchemyAltitude,
  sceneType: SceneType,
): MoveResolution {
  switch (sceneType) {
    case 'transcend': {
      const targetAltitude = altitudeStep(altitude, 1)
      return {
        targetChannel: channel,
        targetAltitude,
        vector: `${channel}:${altitude}→${channel}:${targetAltitude}`,
      }
    }
    case 'generate': {
      const targetChannel = SHENG_CYCLE[channel]
      const targetAltitude = altitudeStep(altitude, 1)
      return {
        targetChannel,
        targetAltitude,
        vector: `${channel}:${altitude}→${targetChannel}:${targetAltitude}`,
      }
    }
    case 'control': {
      const targetChannel = KE_CYCLE[channel]
      const targetAltitude = altitudeStep(altitude, -1)
      return {
        targetChannel,
        targetAltitude,
        vector: `${channel}:${altitude}→${targetChannel}:${targetAltitude}`,
      }
    }
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
