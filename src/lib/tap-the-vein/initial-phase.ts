import { isOutOfDay } from './seed-library'

export type TtvPhase = 'open' | 'freewrite' | 'brainstorm' | 'commit' | 'menu' | 'work' | 'seal'

type PhaseTask = { status: string; isCarried: boolean }

/**
 * Which phase the ritual opens on. A task carried in from yesterday is live in
 * today's session before the player has done anything, so it must not count as
 * "the intake already happened": a session with only carried tasks still starts
 * at the front of the flow (open, or commit once a free-write is saved).
 */
export function initialTtvPhase(session: {
  sealed: boolean
  rawEntry: string
  tasks: PhaseTask[]
}): TtvPhase {
  if (session.sealed) return 'seal'
  const live = session.tasks.filter((t) => !isOutOfDay(t.status))
  const hasOwnLive = live.some((t) => !t.isCarried)
  const hasEntry = session.rawEntry.trim().length > 0
  if (hasOwnLive) return 'work'
  if (hasEntry) return 'commit'
  return 'open'
}
