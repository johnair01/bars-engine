import type { LensAlignmentType, LensCadence, LensWorkshopStatus } from './types'

export const MAX_LENS_OPTIONS = 10
export const MAX_LENS_KEPT = 5
export const LENS_ALIGNMENT_TYPES: LensAlignmentType[] = ['progress', 'maintenance', 'recovery']

export function cleanLensOptions(options: string[]): string[] {
  return options.map((option) => option.trim()).filter(Boolean).slice(0, MAX_LENS_OPTIONS)
}

export function cleanLensKeptIndexes(keptIndexes: number[], options: string[]): number[] {
  const unique = Array.from(new Set(keptIndexes))
  return unique
    .filter((index) => Number.isInteger(index) && index >= 0 && index < options.length && options[index]?.trim())
    .slice(0, MAX_LENS_KEPT)
}

export function normalizeLensAlignmentType(value: string | null | undefined): LensAlignmentType {
  return LENS_ALIGNMENT_TYPES.includes(value as LensAlignmentType) ? (value as LensAlignmentType) : 'progress'
}

export function nextLensCadence(cadence: LensCadence): Exclude<LensCadence, 'year'> | null {
  switch (cadence) {
    case 'year':
      return 'quarter'
    case 'quarter':
      return 'month'
    case 'month':
      return 'week'
    case 'week':
      return null
  }
}

export function validateDescentInput(input: {
  parentGoalId: string | null | undefined
  parentCadence: LensCadence
  requestedCadence: Exclude<LensCadence, 'year'>
  status: LensWorkshopStatus
  options: string[]
  keptIndexes: number[]
}): { ok: true } | { ok: false; error: string } {
  if (!input.parentGoalId) return { ok: false, error: 'Lower-level goals need a parent goal.' }

  const expected = nextLensCadence(input.parentCadence)
  if (!expected || expected !== input.requestedCadence) {
    return { ok: false, error: 'This goal cannot be descended at that level.' }
  }

  const isParked = input.status === 'parked' || input.status === 'skipped'
  const options = cleanLensOptions(input.options)
  const kept = cleanLensKeptIndexes(input.keptIndexes, options)

  if (!isParked && kept.length === 0) {
    return { ok: false, error: 'Keep at least one child goal, or park this descent for now.' }
  }

  return { ok: true }
}

