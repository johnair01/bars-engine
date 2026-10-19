/**
 * Wuxing shēng / kè cycles over the five emotional channels.
 *
 * Client-safe: type-only imports, so client components can read the same tables
 * as wuxing.ts instead of keeping a copy.
 */

import type { EmotionChannel } from './types'

// Generation (shēng 生) cycle: Wood→Fire→Earth→Metal→Water→Wood
// In Emotional Alchemy channels (see elements.ts):
//   joy(Wood) → anger(Fire) → neutrality(Earth) → fear(Metal) → sadness(Water) → joy(Wood)
export const SHENG_CYCLE: Record<EmotionChannel, EmotionChannel> = {
  joy:        'anger',
  anger:      'neutrality',
  neutrality: 'fear',
  fear:       'sadness',
  sadness:    'joy',
}

// Control/destruction (kè 克) cycle: Wood→Earth→Water→Fire→Metal→Wood
// In Emotional Alchemy channels:
//   joy(Wood) → neutrality(Earth) → sadness(Water) → anger(Fire) → fear(Metal) → joy(Wood)
export const KE_CYCLE: Record<EmotionChannel, EmotionChannel> = {
  joy:        'neutrality',
  neutrality: 'sadness',
  sadness:    'anger',
  anger:      'fear',
  fear:       'joy',
}
