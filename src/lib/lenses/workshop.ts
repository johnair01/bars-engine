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


export const LENS_GOAL_TITLE_MAX = 200

/** The row change for a single-goal edit from the Observatory (mm-goal-edit). */
export function lensGoalEditData(
  action: 'rename' | 'park' | 'resume' | 'retire',
  title?: string,
):
  | { data: { title: string } | { status: 'parked' | 'active' } | { status: 'archived'; archivedAt: Date } }
  | { error: string } {
  switch (action) {
    case 'rename': {
      const next = (title ?? '').trim()
      if (!next) return { error: 'A goal needs a name.' }
      if (next.length > LENS_GOAL_TITLE_MAX) return { error: `Keep the name under ${LENS_GOAL_TITLE_MAX} characters.` }
      return { data: { title: next } }
    }
    case 'park':
      return { data: { status: 'parked' } }
    case 'resume':
      return { data: { status: 'active' } }
    case 'retire':
      return { data: { status: 'archived', archivedAt: new Date() } }
    default:
      return { error: 'Unknown edit.' }
  }
}

/**
 * The domain that tomorrow's free-write prompt should ask about: the first lens,
 * in intake order, with no locked or parked year draft and no year goal yet.
 * Null once every lens has been visited (mm-intake-one-a-morning).
 */
export function nextUnvisitedDomain(
  domainKeys: readonly string[],
  drafts: Array<{ domain: string | null; status: string }>,
  yearGoals: Array<{ domain: string; status: string }>,
): string | null {
  const visited = new Set<string>()
  for (const draft of drafts) {
    if (draft.domain && (draft.status === 'locked' || draft.status === 'parked' || draft.status === 'skipped')) {
      visited.add(draft.domain)
    }
  }
  for (const goal of yearGoals) visited.add(goal.domain)
  return domainKeys.find((key) => !visited.has(key)) ?? null
}
