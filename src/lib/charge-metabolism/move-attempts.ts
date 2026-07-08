import type {
  MoveAttemptDraft,
  MoveAttemptLifecycleEvent,
  MoveAttemptLifecyclePatch,
  MoveAttemptLifecycleResult,
  MoveAttemptStatus,
} from './types'

export type MoveAttemptSetLifecycleResult =
  | { success: true; attempts: MoveAttemptDraft[] }
  | { success: false; reason: string }

const TRANSITIONS: Record<MoveAttemptStatus, readonly MoveAttemptLifecycleEvent[]> = {
  recommended: ['choose', 'skip'],
  chosen: ['practice', 'abandon'],
  practiced: ['reflect', 'complete', 'needs_followup'],
  reflected: ['complete', 'needs_followup'],
  completed: [],
  skipped: [],
  abandoned: [],
  needs_followup: ['practice', 'abandon'],
}

const STATUS_FOR_EVENT: Record<MoveAttemptLifecycleEvent, MoveAttemptStatus> = {
  choose: 'chosen',
  skip: 'skipped',
  practice: 'practiced',
  reflect: 'reflected',
  complete: 'completed',
  abandon: 'abandoned',
  needs_followup: 'needs_followup',
}

function hasTrace(attempt: MoveAttemptDraft, patch: MoveAttemptLifecyclePatch): boolean {
  return Boolean(
    patch.artifactText?.trim()
    || patch.reflectionText?.trim()
    || patch.outcome?.trim()
    || attempt.artifactText?.trim()
    || attempt.reflectionText?.trim()
    || attempt.outcome?.trim(),
  )
}

function uniquePrimitiveId(
  attempt: MoveAttemptDraft,
  patch: MoveAttemptLifecyclePatch,
): string | undefined {
  const selected = patch.chosenPrimitiveId ?? attempt.chosenPrimitiveId
  if (!selected) return undefined
  return attempt.recommendedPrimitiveIds.includes(selected) ? selected : undefined
}

export function canApplyMoveAttemptEvent(
  attempt: MoveAttemptDraft,
  event: MoveAttemptLifecycleEvent,
): boolean {
  return TRANSITIONS[attempt.status].includes(event)
}

export function applyMoveAttemptEvent(
  attempt: MoveAttemptDraft,
  event: MoveAttemptLifecycleEvent,
  patch: MoveAttemptLifecyclePatch = {},
): MoveAttemptLifecycleResult {
  if (!canApplyMoveAttemptEvent(attempt, event)) {
    return {
      success: false,
      reason: `Cannot ${event} a move attempt with status ${attempt.status}.`,
    }
  }

  if (event === 'choose' && !uniquePrimitiveId(attempt, patch)) {
    return {
      success: false,
      reason: 'Choose requires a recommended primitive id.',
    }
  }

  if (event === 'complete' && !hasTrace(attempt, patch)) {
    return {
      success: false,
      reason: 'Complete requires an artifact, reflection, or outcome trace.',
    }
  }

  return {
    success: true,
    attempt: {
      ...attempt,
      status: STATUS_FOR_EVENT[event],
      ...(patch.chosenPrimitiveId ? { chosenPrimitiveId: patch.chosenPrimitiveId } : {}),
      ...(patch.artifactText !== undefined ? { artifactText: patch.artifactText } : {}),
      ...(patch.reflectionText !== undefined ? { reflectionText: patch.reflectionText } : {}),
      ...(patch.outcome !== undefined ? { outcome: patch.outcome } : {}),
    },
  }
}

export function chooseMoveAttempt(
  attempt: MoveAttemptDraft,
  chosenPrimitiveId = attempt.chosenPrimitiveId,
): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'choose', { ...(chosenPrimitiveId ? { chosenPrimitiveId } : {}) })
}

export function skipMoveAttempt(attempt: MoveAttemptDraft): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'skip')
}

export function skipMoveAttemptSet(
  attempts: readonly (MoveAttemptDraft | null | undefined)[],
): MoveAttemptSetLifecycleResult {
  const presentAttempts = attempts.filter((attempt): attempt is MoveAttemptDraft => Boolean(attempt))
  if (presentAttempts.length === 0) {
    return {
      success: false,
      reason: 'Skip requires at least one move attempt.',
    }
  }

  const skipped: MoveAttemptDraft[] = []
  for (const attempt of presentAttempts) {
    const result = skipMoveAttempt(attempt)
    if (!result.success) return result
    skipped.push(result.attempt)
  }

  return { success: true, attempts: skipped }
}

export function practiceMoveAttempt(
  attempt: MoveAttemptDraft,
  patch: Pick<MoveAttemptLifecyclePatch, 'artifactText' | 'outcome'> = {},
): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'practice', patch)
}

export function reflectMoveAttempt(
  attempt: MoveAttemptDraft,
  reflectionText: string,
): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'reflect', { reflectionText })
}

export function completeMoveAttempt(
  attempt: MoveAttemptDraft,
  patch: MoveAttemptLifecyclePatch = {},
): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'complete', patch)
}

export function abandonMoveAttempt(
  attempt: MoveAttemptDraft,
  outcome?: string,
): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'abandon', { ...(outcome ? { outcome } : {}) })
}

export function markMoveAttemptNeedsFollowup(
  attempt: MoveAttemptDraft,
  outcome?: string,
): MoveAttemptLifecycleResult {
  return applyMoveAttemptEvent(attempt, 'needs_followup', { ...(outcome ? { outcome } : {}) })
}
