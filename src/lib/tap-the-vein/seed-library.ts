/**
 * The seed library: commitments he sets aside to draw from later.
 *
 * Wendell, on board position `ttv-fruit-is-his` (2026-10-16): "We should also be able to defer those into a seed
 * library that can be drawn from". Design: six-faces-council `docs/seed-library.md`.
 *
 * A set-aside task takes status `resting`, the design ontology's work disposition for something kept but not active.
 * Resting is not composting: a composted task is released and owes nothing, a resting one stays his to draw back.
 * While it rests it is not live for the day, not counted and not carried. It does come back to be seen: Wendell,
 * overruling `sl-no-pressure` (2026-10-16), "We need a mechanics to pull in tasks that are resting and use spaced
 * repetition to get it back into the board". A resting seed resurfaces on a widening ladder of days (3, 7, 14, 30, 60,
 * then every 90). Resurfacing is being seen, not being drawn: only he draws it back, and only then does it become a
 * commitment again (the ontology's "reactivation requires a new explicit decision"). Passing a resurfaced seed by, or
 * choosing "Keep resting", climbs it one rung; silence never composts it. He can also let it go, with no reason.
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

const REST_PREFIX = 'Set aside to the seed library'
const KEEP_PREFIX = 'Kept resting'

export function restNote(day: string): string {
  return `${REST_PREFIX} on ${day}.`
}

export function keepNote(day: string, nextDay: string): string {
  return `${KEEP_PREFIX} on ${day}; it comes back on ${nextDay}.`
}

export function drawNote(day: string, fromDay: string): string {
  return fromDay === day
    ? `Drawn from the seed library on ${day}.`
    : `Drawn from the seed library on ${day}; set aside from ${fromDay}.`
}

/**
 * The spaced-resurfacing ladder, in days. Rung 0 comes back three days after it was set aside; each pass climbs one
 * rung and waits longer. The last rung repeats, so a seed never stops coming back while it rests.
 */
export const RESURFACE_LADDER_DAYS = [3, 7, 14, 30, 60, 90] as const
/** A resurfaced seed shows for its day and the two after, so a morning he skips does not lose it. */
export const RESURFACE_WINDOW_DAYS = 3
/** At most this many seeds come back on one day, the longest-waiting first; the rest wait for a later day. */
export const RESURFACE_PER_DAY = 3

export function intervalDays(rung: number): number {
  return RESURFACE_LADDER_DAYS[Math.min(Math.max(rung, 0), RESURFACE_LADDER_DAYS.length - 1)]
}

/** YYYY-MM-DD plus n days, in UTC. */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export type Resurfacing = {
  /** How many times it has come back and been passed by or kept resting. */
  rung: number
  /** The day it comes back (or came back, while its window is open), YYYY-MM-DD. */
  dueDay: string
  /** Its window is open today. */
  due: boolean
}

/**
 * Where a resting seed stands on the ladder today. Pure, from the day it was set aside and the days he chose
 * "Keep resting": each keep climbs one rung from that day, and a window that closes with no move climbs one rung
 * from its due day. Nothing here composts, draws or counts it.
 */
export function resurfacing(restDay: string, keepDays: string[], today: string): Resurfacing {
  let rung = 0
  let dueDay = addDays(restDay, intervalDays(0))
  const climbPast = (day: string) => {
    while (addDays(dueDay, RESURFACE_WINDOW_DAYS - 1) < day) {
      rung += 1
      dueDay = addDays(dueDay, intervalDays(rung))
    }
  }
  for (const k of [...keepDays].filter((d) => d >= restDay).sort()) {
    climbPast(k)
    rung += 1
    dueDay = addDays(k, intervalDays(rung))
  }
  climbPast(today)
  return { rung, dueDay, due: dueDay <= today }
}

/** A library note, read back: the day it was written and whether it set the seed aside or kept it resting. */
export type LibraryNote = { body: string; createdAt: Date }

/** The day it was last set aside and the keeps since, from its library notes; the fallback is the day it was updated. */
export function libraryDays(notes: LibraryNote[], fallback: Date): { restDay: string; keepDays: string[] } {
  const sorted = [...notes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  let restDay = fallback.toISOString().slice(0, 10)
  let keepDays: string[] = []
  for (const n of sorted) {
    const day = n.createdAt.toISOString().slice(0, 10)
    if (n.body.startsWith(REST_PREFIX)) {
      restDay = day
      keepDays = []
    } else if (n.body.startsWith(KEEP_PREFIX)) {
      keepDays.push(day)
    }
  }
  return { restDay, keepDays }
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
  /** The day it was last set aside, YYYY-MM-DD. */
  restDay: string
  /** Its place on the resurfacing ladder. */
  rung: number
  /** The day it comes back, YYYY-MM-DD. */
  dueDay: string
  /** It is one of today's resurfaced seeds (at most RESURFACE_PER_DAY). */
  resurfaced: boolean
}

type Row = {
  id: string
  originalText: string
  updatedAt: Date
  lensGoalId: string | null
  barId: string | null
  questId: string | null
  dailySession: { sessionDate: Date }
  notes?: LibraryNote[]
}

/** Library entries, most recently set aside first, each placed on the ladder for `today` (YYYY-MM-DD, UTC). */
export function toSeedLibrary(rows: Row[], today: string = new Date().toISOString().slice(0, 10)): SeedLibraryEntry[] {
  const placed = rows.map((r) => {
    const { restDay, keepDays } = libraryDays(r.notes ?? [], r.updatedAt)
    return { r, restDay, place: resurfacing(restDay, keepDays, today) }
  })
  const shown = new Set(
    placed
      .filter((p) => p.place.due)
      .sort((a, b) => a.place.dueDay.localeCompare(b.place.dueDay) || a.restDay.localeCompare(b.restDay) || a.r.id.localeCompare(b.r.id))
      .slice(0, RESURFACE_PER_DAY)
      .map((p) => p.r.id),
  )
  return placed
    .map(({ r, restDay, place }) => ({
      id: r.id,
      text: r.originalText,
      fromDay: r.dailySession.sessionDate.toISOString().slice(0, 10),
      restedAt: r.updatedAt.toISOString(),
      lensGoalId: r.lensGoalId,
      barId: r.barId,
      questId: r.questId,
      restDay,
      rung: place.rung,
      dueDay: place.dueDay,
      resurfaced: shown.has(r.id),
    }))
    .sort((a, b) => b.restedAt.localeCompare(a.restedAt))
}

/** Today's resurfaced seeds, in the order they came back. */
export function resurfacedToday(library: SeedLibraryEntry[]): SeedLibraryEntry[] {
  return library
    .filter((e) => e.resurfaced)
    .sort((a, b) => a.dueDay.localeCompare(b.dueDay) || a.restDay.localeCompare(b.restDay) || a.id.localeCompare(b.id))
}
