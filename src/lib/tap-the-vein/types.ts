import type { LensDomainKey } from '@/lib/lenses/domains'
import type { LensGoalTrace } from '@/lib/lenses/lineage-types'

export type TtvTaskDTO = {
  id: string
  text: string
  status: string
  carryCount: number
  compostReason: string | null
  campaignId: string | null
  visibility: string | null
  questId: string | null
  barId: string | null
  lensGoalId: string | null
  lensGoalTitle: string | null
  lensGoalDomain: LensDomainKey | null
  lensGoalTrace: LensGoalTrace | null
  priorityRank: number | null
  completedAt: string | null
  createdAt: string
  /** TTV-CHARGE: player's own read of how charged this commitment is. */
  chargeLevel: TtvChargeLevel | null
  chargeNote: string | null
  /** ISO timestamp while blocked; null once the blocker is cleared. */
  blockedAt: string | null
}

/** Ordered heaviest → lightest; the shrink direction is downward. */
export const TTV_CHARGE_LEVELS = ['high', 'medium', 'low'] as const
export type TtvChargeLevel = (typeof TTV_CHARGE_LEVELS)[number]

export const TTV_NOTE_KINDS = ['context', 'blocker', 'unblock', 'charge'] as const
export type TtvNoteKind = (typeof TTV_NOTE_KINDS)[number]

export type TtvTaskNoteDTO = {
  id: string
  kind: TtvNoteKind
  body: string
  chargeLevel: TtvChargeLevel | null
  createdAt: string
}

// `TtvTaskWorkspace` lives in @/actions/tap-the-vein, alongside the `TtvTaskDTO`
// that most consumers import. This module and the actions module each declare a
// `TtvTaskDTO`; they have drifted (`lensGoalDomain` is `LensDomainKey` here and
// `string` there), so a workspace type here would not accept the actions' DTO.
// Worth unifying — out of scope for the charge/blocker slice.

export type TtvLensGoalOption = {
  id: string
  title: string
  domain: LensDomainKey
  cadence: string
  parentGoalId: string | null
}

/** One line from the brainstorm dump, persisted so commit can show the field. */
export type TtvBrainstormCandidate = {
  text: string
  fate: 'raw' | 'play' | 'composted'
}

export type TtvToday = {
  sessionId: string
  sessionDate: string
  status: string
  rawEntry: string
  wordCount: number
  committedTaskCount: number
  tasks: TtvTaskDTO[]
  lensGoals: TtvLensGoalOption[]
  /** Survives the brainstorm modal closing — the fix for "pull from memory". */
  brainstormCandidates: TtvBrainstormCandidate[]
}
