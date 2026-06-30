import { MAX_TASKS_PER_DAY } from './constants'

export const ACTIVE_TTV_TASK_STATUSES = ['committed', 'in_progress'] as const

export function canCommitTtvTask(activeTaskCount: number, maxTasks = MAX_TASKS_PER_DAY): boolean {
  return activeTaskCount < maxTasks
}

export function nextHistoricalPriorityRank(maxExistingRank: number | null | undefined): number {
  return (maxExistingRank ?? 0) + 1
}

