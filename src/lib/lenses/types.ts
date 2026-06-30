import type { LensDomainKey } from './domains'

export type LensCadence = 'year' | 'quarter' | 'month' | 'week'
export type LensWorkshopStatus = 'draft' | 'locked' | 'parked' | 'skipped'
export type LensGoalStatus = 'draft' | 'active' | 'parked' | 'skipped' | 'superseded' | 'archived' | 'complete'
export type LensAlignmentType = 'progress' | 'maintenance' | 'recovery'

export type LensWorkshopOption = {
  stableKey?: string
  tempKey?: string
  text: string
}

export type LensWorkshopUnit = {
  domain: LensDomainKey
  freewrite: string
  options: LensWorkshopOption[]
  keptIndexes: number[]
  status: LensWorkshopStatus
}

export type SaveYearFrameInput = {
  vagueMovement: string
  feelings: string[]
  units: LensWorkshopUnit[]
}

export type SaveLensDescentInput = {
  parentGoalId: string
  cadence: Exclude<LensCadence, 'year'>
  freewrite: string
  options: LensWorkshopOption[]
  keptIndexes: number[]
  status: LensWorkshopStatus
  alignmentType: LensAlignmentType
}

export type LensGoalDTO = {
  id: string
  stableKey: string
  domain: LensDomainKey
  cadence: LensCadence
  title: string
  satisfactionPayoff: string | null
  metric: string | null
  status: string
  alignmentType: string
  keepOrder: number
  parentGoalId: string | null
  supersededById: string | null
  archivedAt: string | null
}

export type LensDescentParentDTO = LensGoalDTO & {
  nextCadence: Exclude<LensCadence, 'year'> | null
  childCount: number
}

export type LensWorkshopDraftDTO = {
  id: string
  domain: LensDomainKey | null
  cadence: LensCadence
  parentGoalId: string | null
  freewrite: string | null
  options: LensWorkshopOption[]
  keptOrder: number[]
  status: string
  vagueMovement: string | null
  feelings: string[]
}

export type LensesOnboardingState = {
  playerName: string
  superpower: string | null
  superpowerOrientation: string | null
  yearlyLensId: string | null
  goals: LensGoalDTO[]
  drafts: LensWorkshopDraftDTO[]
}

export type LensesDescentState = {
  playerName: string
  parents: LensDescentParentDTO[]
  drafts: LensWorkshopDraftDTO[]
}
