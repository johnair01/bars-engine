import { describe, expect, it } from 'vitest'

import {
  DAY_RELEASE_ISO,
  MTGOA_RELEASE_TIME_ZONE,
  isDayReleased,
  isRoundStarted,
  latestReleasedDay,
  nextDayRelease,
  releaseLabel,
  releasedDays,
} from '../course-release'
import {
  COURSE_PROGRESS_STORAGE_KEY,
  EMPTY_COURSE_PROGRESS,
  dayGate,
  isDayReachable,
  isFirstDayOfRound,
  parseCourseProgress,
  resumeDay,
  serializeCourseProgress,
  withDayCompleted,
} from '../course-progress'
import type { CourseProgress } from '../course-progress'

const SATURDAY = Date.parse('2026-08-22T12:00:00Z') // before week 2 opens
const SUNDAY = Date.parse('2026-08-23T05:00:00Z') // one hour after it opens

const progressOf = (...completed: number[]): CourseProgress => ({ version: 1, completed })

describe('the release calendar', () => {
  it('drips one day per day through week 2, Sunday to Thursday', () => {
    expect(DAY_RELEASE_ISO[6]).toBe('2026-08-23T04:00:00Z')
    expect(DAY_RELEASE_ISO[7]).toBe('2026-08-24T04:00:00Z')
    expect(DAY_RELEASE_ISO[8]).toBe('2026-08-25T04:00:00Z')
    expect(DAY_RELEASE_ISO[9]).toBe('2026-08-26T04:00:00Z')
    expect(DAY_RELEASE_ISO[10]).toBe('2026-08-27T04:00:00Z')
    expect(MTGOA_RELEASE_TIME_ZONE).toBe('America/New_York')
  })

  it('opens a day at midnight Eastern, and not a second before', () => {
    expect(isDayReleased(6, Date.parse('2026-08-23T03:59:59Z'))).toBe(false)
    expect(isDayReleased(6, Date.parse('2026-08-23T04:00:00Z'))).toBe(true)
  })

  /**
   * The reason the dates are written out per day. Computing them as a start plus
   * twenty-four hours would drift by an hour across a daylight-saving boundary
   * and rename the weekday on the board.
   */
  it('writes every date as its own instant rather than a start plus an offset', () => {
    for (const day of [6, 7, 8, 9, 10]) {
      expect(DAY_RELEASE_ISO[day]).toMatch(/^2026-08-\d{2}T04:00:00Z$/)
    }
  })

  it('treats week 1 as long live and gives days 11 to 30 no date at all', () => {
    for (const day of [1, 2, 3, 4, 5]) expect(isDayReleased(day, SATURDAY)).toBe(true)
    for (const day of [11, 20, 30]) {
      expect(DAY_RELEASE_ISO[day] ?? null).toBeNull()
      // A day with no date never opens, however far the clock is wound on.
      expect(isDayReleased(day, Date.parse('2099-01-01T00:00:00Z'))).toBe(false)
    }
  })

  it('reports the days live at a given moment, and the newest of them', () => {
    expect(releasedDays(SATURDAY)).toEqual([1, 2, 3, 4, 5])
    expect(latestReleasedDay(SATURDAY)).toBe(5)

    expect(releasedDays(SUNDAY)).toEqual([1, 2, 3, 4, 5, 6])
    expect(latestReleasedDay(SUNDAY)).toBe(6)

    // Thursday, once the whole of week 2 has landed.
    expect(latestReleasedDay(Date.parse('2026-08-27T05:00:00Z'))).toBe(10)
  })

  it('counts a week as started from its first day, so the board draws its cards', () => {
    expect(isRoundStarted(2, SATURDAY)).toBe(false)
    expect(isRoundStarted(2, SUNDAY)).toBe(true)
    expect(isRoundStarted(1, SATURDAY)).toBe(true)
    expect(isRoundStarted(3, Date.parse('2099-01-01T00:00:00Z'))).toBe(false)
  })

  it('names the next day still to come, and nothing once every dated day is live', () => {
    expect(nextDayRelease(SATURDAY)).toEqual({ day: 6, at: Date.parse('2026-08-23T04:00:00Z') })
    expect(nextDayRelease(SUNDAY)).toEqual({ day: 7, at: Date.parse('2026-08-24T04:00:00Z') })
    expect(nextDayRelease(Date.parse('2026-08-28T05:00:00Z'))).toBeNull()
  })

  it('labels tomorrow as tomorrow, this week by weekday, and further out by date', () => {
    const daySix = Date.parse('2026-08-23T04:00:00Z')
    // Saturday looking at Sunday.
    expect(releaseLabel(daySix, SATURDAY)).toBe('opens tomorrow')
    // Wednesday looking at Sunday — still inside the week, so a weekday reads.
    expect(releaseLabel(daySix, Date.parse('2026-08-19T12:00:00Z'))).toBe('opens Sunday')
    // Far enough out that a weekday tells a reader nothing useful.
    expect(releaseLabel(daySix, Date.parse('2026-08-01T12:00:00Z'))).toBe('opens August 23')
    // Already live.
    expect(releaseLabel(daySix, SUNDAY)).toBe('live')
  })
})

describe('the day-by-day unlock', () => {
  const gateFor = (day: number, round: number, progress: CourseProgress, dayReleased = true) =>
    dayGate({ day, round, shipped: true, dayReleased, progress })

  it('opens day 1 to a reader who has done nothing', () => {
    expect(gateFor(1, 1, EMPTY_COURSE_PROGRESS)).toEqual({ state: 'open' })
  })

  it('holds day 3 until day 2 is finished, and names the day it is waiting on', () => {
    expect(gateFor(3, 1, progressOf(1))).toEqual({ state: 'locked', needsDay: 2 })
    expect(gateFor(3, 1, progressOf(1, 2))).toEqual({ state: 'open' })
  })

  it('keeps a finished day reachable, so a reader can walk it again', () => {
    const gate = gateFor(2, 1, progressOf(1, 2))
    expect(gate).toEqual({ state: 'done' })
    expect(isDayReachable(gate)).toBe(true)
  })

  /**
   * The rule that keeps a reader who fell behind from being locked out of a
   * release they were told was coming.
   */
  it('opens day 6 the moment week 2 releases, even to a reader still on day 1', () => {
    expect(isFirstDayOfRound(6)).toBe(true)
    expect(gateFor(6, 2, EMPTY_COURSE_PROGRESS, false)).toEqual({ state: 'unreleased' })
    expect(gateFor(6, 2, EMPTY_COURSE_PROGRESS, true)).toEqual({ state: 'open' })
    // The sequence gate still applies inside the new week.
    expect(gateFor(7, 2, EMPTY_COURSE_PROGRESS, true)).toEqual({ state: 'locked', needsDay: 6 })
  })

  it('reports an unwritten day as unwritten whatever the calendar and the reader say', () => {
    expect(dayGate({ day: 11, round: 3, shipped: false, dayReleased: true, progress: progressOf(10) }))
      .toEqual({ state: 'unwritten' })
  })

  it('puts the release gate ahead of the sequence gate', () => {
    // Finished day 5, but week 2 has yet to open: the honest reason is the date.
    expect(gateFor(7, 2, progressOf(1, 2, 3, 4, 5, 6), false)).toEqual({ state: 'unreleased' })
  })

  it('only lets a reader reach open and finished days', () => {
    expect(isDayReachable({ state: 'open' })).toBe(true)
    expect(isDayReachable({ state: 'done' })).toBe(true)
    expect(isDayReachable({ state: 'unreleased' })).toBe(false)
    expect(isDayReachable({ state: 'locked', needsDay: 2 })).toBe(false)
    expect(isDayReachable({ state: 'unwritten' })).toBe(false)
  })
})

describe('the button at the top of the board', () => {
  const board = (progress: CourseProgress, week2 = false) =>
    [1, 2, 3, 4, 5, 6, 7].map((number) => ({
      number,
      gate: dayGate({
        day: number,
        round: number <= 5 ? 1 : 2,
        shipped: true,
        dayReleased: number <= 5 ? true : week2,
        progress,
      }),
    }))

  it('sends a first visit to day 1', () => {
    expect(resumeDay(board(EMPTY_COURSE_PROGRESS))).toBe(1)
  })

  it('sends a reader who finished two days to day 3', () => {
    expect(resumeDay(board(progressOf(1, 2)))).toBe(3)
  })

  /** The regression that made this function take the earliest open day. */
  it('still sends a first visit to day 1 once week 2 has opened', () => {
    expect(resumeDay(board(EMPTY_COURSE_PROGRESS, true))).toBe(1)
  })

  it('falls back to the last finished day when nothing is open', () => {
    expect(resumeDay(board(progressOf(1, 2, 3, 4, 5)))).toBe(5)
  })
})

describe('progress storage', () => {
  it('keeps day numbers and nothing else', () => {
    expect(COURSE_PROGRESS_STORAGE_KEY).toBe('mtgoa-course-progress-v1')
    const stored = serializeCourseProgress(progressOf(1, 2))
    const parsed = JSON.parse(stored)
    expect(parsed).toEqual({ version: 1, completed: [1, 2] })
    // Two keys, both structural. Whatever a reader wrote must never reach this
    // key, so the shape is asserted exhaustively rather than by sampling.
    expect(Object.keys(parsed).sort()).toEqual(['completed', 'version'])
    expect(parsed.completed.every((day: unknown) => typeof day === 'number')).toBe(true)
  })

  it('round-trips', () => {
    expect(parseCourseProgress(serializeCourseProgress(progressOf(3, 1, 2)))).toEqual(progressOf(1, 2, 3))
  })

  it('degrades anything unreadable to no progress', () => {
    for (const raw of [null, '', 'not json', '[]', '{}', '{"version":99,"completed":[1]}', '{"version":1}']) {
      expect(parseCourseProgress(raw)).toEqual(EMPTY_COURSE_PROGRESS)
    }
  })

  it('drops junk day numbers a hand-edit could introduce', () => {
    const parsed = parseCourseProgress('{"version":1,"completed":[1,"2",0,31,3.5,3,3,-4,null]}')
    expect(parsed.completed).toEqual([1, 3])
  })

  it('records a finished day once, in order', () => {
    let progress = withDayCompleted(EMPTY_COURSE_PROGRESS, 3)
    progress = withDayCompleted(progress, 1)
    expect(progress.completed).toEqual([1, 3])
    // Marking it again changes nothing, so a receipt that re-renders is harmless.
    expect(withDayCompleted(progress, 3)).toBe(progress)
    expect(withDayCompleted(progress, 0).completed).toEqual([1, 3])
    expect(withDayCompleted(progress, 31).completed).toEqual([1, 3])
  })
})
