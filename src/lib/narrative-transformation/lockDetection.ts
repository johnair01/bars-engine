/**
 * Lock detection heuristics (v0)
 * Spec: .specify/specs/narrative-transformation-engine/spec.md — identity / emotional / action / possibility
 *
 * Maps to registry LockType suffix _lock for compatibility with transformation-move-registry.
 */

import type { LockType } from '@/lib/transformation-move-registry/types'

const IDENTITY_PATTERNS: RegExp[] = [
  /I(?:'m|\s+am)\s+(?:a|an)\s+/i,
  /people\s+like\s+me/i,
  /that(?:'s| is)\s+who\s+I\s+am/i,
  /\bI(?:'m|\s+am)\s+just\s+/i,
  /\bI\s+always\s+(?:am|was)\s+/i,
]

const EMOTIONAL_PATTERNS: RegExp[] = [
  /\b(feel|feeling|felt)\b/i,
  /\b(afraid|scared|fear|anxious|anxiety|ashamed|shame|angry|rage|sad|grief|overwhelmed)\b/i,
  /\b(emotion|heart|gut)\b/i,
]

const ACTION_PATTERNS: RegExp[] = [
  /\b(can't|cannot|cant)\s+(?:even\s+)?(?:move|act|start|bring)\b/i,
  /\bstuck\b/i,
  /\bprocrastinat/i,
  /\bfrozen\b/i,
  /\bwon't\s+(?:do|act|take)\b/i,
]

const POSSIBILITY_PATTERNS: RegExp[] = [
  /\bno\s+way\b/i,
  /\bimpossible\b/i,
  /\bnever\s+(?:going\s+to|gonna)\s+work\b/i,
  /\bpointless\b/i,
  /\bwhy\s+bother\b/i,
  /\bit\s+won't\s+matter\b/i,
]

function scoreAgainst(text: string, patterns: RegExp[]): number {
  let s = 0
  for (const re of patterns) {
    if (re.test(text)) s += 1
  }
  return s
}

/** Preference when two lock types tie (earlier = wins on equal score) */
const LOCK_ORDER: LockType[] = [
  'emotional_lock',
  'identity_lock',
  'action_lock',
  'possibility_lock',
]

/**
 * Classify dominant lock from free text. Returns undefined when signals are too weak.
 */
export function detectLockType(fullText: string): LockType | undefined {
  const t = fullText.trim()
  if (t.length < 4) return undefined

  const scores: Record<LockType, number> = {
    identity_lock: scoreAgainst(t, IDENTITY_PATTERNS),
    emotional_lock: scoreAgainst(t, EMOTIONAL_PATTERNS),
    action_lock: scoreAgainst(t, ACTION_PATTERNS),
    possibility_lock: scoreAgainst(t, POSSIBILITY_PATTERNS),
  }

  const bestScore = Math.max(...Object.values(scores))
  if (bestScore < 1) return undefined

  for (const lock of LOCK_ORDER) {
    if (scores[lock] === bestScore) return lock
  }
  return undefined
}
