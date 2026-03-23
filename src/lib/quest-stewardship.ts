/**
 * Quest Stewardship + Role Resolution Engine v0 (GB)
 *
 * Resolves quest lifecycle state, stewards, and RACI roles from
 * BarResponse (GA) + PlayerQuest records — no additional schema required.
 */

import type { BarRoles } from '@/lib/bar-raci'

/** The dominant lifecycle state of a quest, derived from BarResponse + PlayerQuest data. */
export type QuestLifecycleState = 'proposed' | 'active' | 'completed'

/** Intents that designate a player as a steward (Responsible). */
export const STEWARD_INTENTS = ['take_quest', 'join'] as const
export type StewardIntent = (typeof STEWARD_INTENTS)[number]

export interface StewardPlayer {
  playerId: string
  name: string
  intent: string
  /** True when the player has a PlayerQuest entry with status='assigned'. */
  confirmed: boolean
}

/** Steward resolution: confirmed (have PlayerQuest) vs candidates (BarResponse only). */
export interface StewardResolution {
  confirmed: StewardPlayer[]
  candidates: StewardPlayer[]
}

/** Combined quest role resolution — the primary output of GB. */
export interface QuestRoleResolution {
  questId: string
  state: QuestLifecycleState
  stewards: StewardResolution
  roles: BarRoles
}

/**
 * Derive the dominant lifecycle state from raw counts.
 * Priority: completed > active > proposed.
 */
export function deriveQuestState(opts: {
  completedPlayerQuestCount: number
  assignedPlayerQuestCount: number
  stewardIntentResponseCount: number
}): QuestLifecycleState {
  if (opts.completedPlayerQuestCount > 0) return 'completed'
  if (opts.assignedPlayerQuestCount > 0) return 'active'
  return 'proposed'
}
