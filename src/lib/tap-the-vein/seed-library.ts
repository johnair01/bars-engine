/**
 * The seed library: commitments he sets aside to draw from later.
 *
 * Wendell, on board position `ttv-fruit-is-his` (2026-10-16): "We should also be able to defer those into a seed
 * library that can be drawn from". Design: six-faces-council `docs/seed-library.md`.
 *
 * A set-aside task takes status `resting`, the design ontology's work disposition for something kept but not active.
 * Resting is not composting: a composted task is released and owes nothing, a resting one stays his to draw back.
 * While it rests it carries no pressure: it is not live for the day, not counted, not carried, and nothing brings it
 * back unasked. Only he draws it back, and only then does it become a commitment again (the ontology's "reactivation
 * requires a new explicit decision"). He can also let it go from the library, with no reason.
 *
 * Drawing moves the same task (same id, same BAR or quest) into today's session, so one id still runs from the
 * morning it was named to the thread it reaches (`ttv-one-store`). Setting aside and drawing each leave a note on the
 * task, which keeps the path.
 */

export const RESTING_STATUS = 'resting'

/** Statuses a task can be set aside from: the live ones. */
export const RESTABLE_STATUSES = new Set(['committed', 'in_progress'])

/** Statuses that are not part of the day's live work. */
export const OUT_OF_DAY_STATUSES = new Set(['composted', 'carried_over', RESTING_STATUS])

export function isOutOfDay(status: string): boolean {
  return OUT_OF_DAY_STATUSES.has(status)
}

/** The note kind left on a task when it enters or leaves the library. */
export const LIBRARY_NOTE_KIND = 'library'

export function restNote(day: string): string {
  return `Set aside to the seed library on ${day}.`
}

export function drawNote(day: string, fromDay: string): string {
  return fromDay === day
    ? `Drawn from the seed library on ${day}.`
    : `Drawn from the seed library on ${day}; set aside from ${fromDay}.`
}

export type SeedLibraryEntry = {
  id: string
  text: string
  /** The day the task was named on, YYYY-MM-DD. */
  fromDay: string
  /** When it was set aside, ISO. */
  restedAt: string
  lensGoalId: string | null
  barId: string | null
  questId: string | null
}

type Row = {
  id: string
  originalText: string
  updatedAt: Date
  lensGoalId: string | null
  barId: string | null
  questId: string | null
  dailySession: { sessionDate: Date }
}

/** Library entries, most recently set aside first. */
export function toSeedLibrary(rows: Row[]): SeedLibraryEntry[] {
  return rows
    .map((r) => ({
      id: r.id,
      text: r.originalText,
      fromDay: r.dailySession.sessionDate.toISOString().slice(0, 10),
      restedAt: r.updatedAt.toISOString(),
      lensGoalId: r.lensGoalId,
      barId: r.barId,
      questId: r.questId,
    }))
    .sort((a, b) => b.restedAt.localeCompare(a.restedAt))
}
