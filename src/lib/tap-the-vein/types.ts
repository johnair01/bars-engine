import type { LensDomainKey } from '@/lib/lenses/domains'
import type { LensGoalTrace } from '@/lib/lenses/lineage'

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
}

export type TtvLensGoalOption = {
  id: string
  title: string
  domain: LensDomainKey
  cadence: string
  parentGoalId: string | null
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
}
