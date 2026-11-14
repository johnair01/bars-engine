/**
 * npc-from-321, Madi's demo (council callsheets/npc-from-321.md, last section): "News from outside".
 * Pure: the player writes one line about her outer life, a win or a setback, against one of her goals.
 * A win can count as the life step of a spirit whose quest serves that goal. A setback becomes a charge
 * she can take into a 3-2-1, and the part she meets there can be raised as her next spirit.
 */
import type { PartState } from './part-quest'

export const NEWS_KINDS = ['win', 'setback'] as const
export type NewsKind = (typeof NEWS_KINDS)[number]

export const NEWS_LINE_MAX = 280

export type NewsInput = { kind: string; line: string; lensGoalId?: string | null; daemonId?: string | null }

export function checkNews(input: NewsInput): { kind: NewsKind; line: string } | { error: string } {
  if (!(NEWS_KINDS as readonly string[]).includes(input.kind)) return { error: 'Say whether it was a win or a setback' }
  const line = (input.line ?? '').trim()
  if (!line) return { error: 'Say in one line what happened' }
  if (line.length > NEWS_LINE_MAX) return { error: `Keep it to one line (${NEWS_LINE_MAX} characters)` }
  if (input.kind === 'setback' && input.daemonId) return { error: 'Only a win counts as a step' }
  return { kind: input.kind as NewsKind, line }
}

/** A win counts as a spirit's life step only when the spirit's quest serves the same goal and the step is still open. */
export function winCountsForPart(part: PartState, questGoalId: string | null | undefined, goalId: string | null | undefined): boolean {
  if (!goalId || !questGoalId || questGoalId !== goalId) return false
  if (!part.questId || part.met) return false
  return part.steps.life !== true
}

/** Where a part stands: a spirit while its need is unmet, a person once met. */
export function partStage(part: PartState, promotedToPlayerId: string | null | undefined): 'spirit' | 'person' {
  return part.met || promotedToPlayerId ? 'person' : 'spirit'
}

/** The need, in her words, as the 3-2-1 kept it (phase2Snapshot.q5). */
export function needFromSnapshot(phase2Snapshot: string | null | undefined): string {
  try {
    const q5 = JSON.parse(phase2Snapshot ?? '')?.q5
    return typeof q5 === 'string' ? q5.trim() : ''
  } catch {
    return ''
  }
}

/** The title a setback's charge carries, so the 3-2-1 opens on her own words. */
export function setbackChargeTitle(line: string): string {
  return line.length > 80 ? line.slice(0, 77) + '...' : line
}
