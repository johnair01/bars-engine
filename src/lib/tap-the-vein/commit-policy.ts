import { MAX_TASKS_PER_DAY } from './constants'

export const ACTIVE_TTV_TASK_STATUSES = ['committed', 'in_progress'] as const

export function canCommitTtvTask(activeTaskCount: number, maxTasks = MAX_TASKS_PER_DAY): boolean {
  return activeTaskCount < maxTasks
}

export function nextHistoricalPriorityRank(maxExistingRank: number | null | undefined): number {
  return (maxExistingRank ?? 0) + 1
}


/** Same words, ignoring capitals and spacing. Used only to compare; the saved text is never changed. */
export function sameTaskWords(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
  return norm(a) === norm(b)
}

export function isAlreadyLiveToday(liveTexts: string[], text: string): boolean {
  return liveTexts.some((t) => sameTaskWords(t, text))
}
