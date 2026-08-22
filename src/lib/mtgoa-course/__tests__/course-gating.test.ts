import { describe, expect, it } from 'vitest'

import {
  MTGOA_RELEASE_TIME_ZONE,
  ROUND_RELEASE_ISO,
  isRoundReleased,
  nextRoundRelease,
  releaseLabel,
  releasedRounds,
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
  it('opens week 2 at midnight Eastern on Sunday, and not before', () => {
    expect(ROUND_RELEASE_ISO[2]).toBe('2026-08-23T04:00:00Z')
    expect(MTGOA_RELEASE_TIME_ZONE).toBe('America/New_York')

    expect(isRoundReleased(2, Date.parse('2026-08-23T03:59:59Z'))).toBe(false)
    expect(isRoundReleased(2, Date.parse('2026-08-23T04:00:00Z'))).toBe(true)
  })

  it('treats week 1 as long open and gives weeks 3 to 6 no date at all', () => {
    expect(isRoundReleased(1, SATURDAY)).toBe(true)
    for (const round of [3, 4, 5, 6]) {
      expect(ROUND_RELEASE_ISO[round]).toBeNull()
      // A round with no date never opens, however far the clock is wound on.
      expect(isRoundReleased(round, Date.parse('2099-01-01T00:00:00Z'))).toBe(false)
    }
  })

  it('reports the rounds open at a given moment', () => {
    expect(releasedRounds(SATURDAY)).toEqual([1])
    expect(releasedRounds(SUNDAY)).toEqual([1, 2])
  })

  it('names the next pending release, and nothing once every dated round is open', () => {
    expect(nextRoundRelease(SATURDAY)).toEqual({ round: 2, at: Date.parse('2026-08-23T04:00:00Z') })
    expect(nextRoundRelease(SUNDAY)).toBeNull()
  })

  it('names a pending release by weekday and date, the same however early it is read', () => {
    const at = Date.parse('2026-08-23T04:00:00Z')
    // No `now` argument at all: the server and the browser must agree, so the
    // label cannot depend on how far away the date is.
    expect(releaseLabel(at)).toBe('opens Sunday, August 23')
  })
})

describe('the day-by-day unlock', () => {
  const gateFor = (day: number, round: number, progress: CourseProgress, roundReleased = true) =>
    dayGate({ day, round, shipped: true, roundReleased, progress })

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
    expect(dayGate({ day: 11, round: 3, shipped: false, roundReleased: true, progress: progressOf(10) }))
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
        roundReleased: number <= 5 ? true : week2,
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
