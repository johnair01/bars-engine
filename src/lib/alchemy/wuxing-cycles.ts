/**
 * Wuxing shēng / kè cycles over the five emotional channels.
 *
 * Client-safe: type-only imports, so client components can read the same tables
 * as wuxing.ts instead of keeping a copy.
 */

import type { EmotionChannel } from './types'
import moveTable from '../quest-grammar/move-table.json'

// Both cycles come from the move table, a copy of six-faces-council schema/move-table.json
// (src/lib/quest-grammar/__tests__/move-table.test.ts keeps them in step).
// shēng 生: joy(Wood) → anger(Fire) → neutrality(Earth) → fear(Metal) → sadness(Water) → joy(Wood)
// kè 克:    joy(Wood) → neutrality(Earth) → sadness(Water) → anger(Fire) → fear(Metal) → joy(Wood)
export const SHENG_CYCLE = moveTable.cycles.sheng as Record<EmotionChannel, EmotionChannel>
export const KE_CYCLE = moveTable.cycles.ke as Record<EmotionChannel, EmotionChannel>
