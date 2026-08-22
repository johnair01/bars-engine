import { describe, expect, it } from 'vitest'

import {
  courseIndexWeeks,
  courseStartRoute,
  writtenDayCount,
  writtenStateLine,
} from '../course-index'
import {
  MTGOA_COURSE_LENGTH,
  MTGOA_COURSE_ROUNDS,
  MTGOA_MOVES_PER_ROUND,
  MTGOA_MOVE_ORDER,
  linkableRoute,
  mtgoaCourseDay,
} from '../course-days'

describe('the course index', () => {
  it('lays out six weeks of five days, numbered one to thirty in move order', () => {
    const weeks = courseIndexWeeks()
    expect(weeks).toHaveLength(MTGOA_COURSE_ROUNDS)

    const numbers = weeks.flatMap((week) => week.days.map((day) => day.number))
    expect(numbers).toEqual(Array.from({ length: MTGOA_COURSE_LENGTH }, (_, i) => i + 1))

    for (const week of weeks) {
      expect(week.days).toHaveLength(MTGOA_MOVES_PER_ROUND)
      expect(week.days.map((day) => day.move)).toEqual([...MTGOA_MOVE_ORDER])
    }
  })

  it('labels every one of the thirty days with its day number and move', () => {
    const days = courseIndexWeeks().flatMap((week) => week.days)
    expect(days).toHaveLength(MTGOA_COURSE_LENGTH)
    for (const day of days) {
      expect(day.moveLabel).toBeTruthy()
      expect(day.headline.trim()).toBeTruthy()
      expect(day.output.trim()).toBeTruthy()
    }
  })

  it('names each week its range, and its domain only where one is authored', () => {
    const weeks = courseIndexWeeks()
    expect(weeks[0]).toMatchObject({ label: 'Week 1', domainLabel: 'Raise Awareness', range: 'Days 1–5' })
    expect(weeks[1]).toMatchObject({ label: 'Week 2', domainLabel: 'Skillful Organizing', range: 'Days 6–10' })
    // Rounds 3–6 are undecided. The page must not invent a field for them.
    for (const week of weeks.slice(2)) expect(week.domainLabel).toBeNull()
    expect(weeks[5].range).toBe('Days 26–30')
  })

  /**
   * The invariant the page exists to hold: a day is a doorway here only when the
   * spine says it resolves. Anything else advertises a 404 to a cold visitor.
   */
  it('carries a route for exactly the days the spine says have shipped', () => {
    for (const day of courseIndexWeeks().flatMap((week) => week.days)) {
      const spineDay = mtgoaCourseDay(day.number)
      expect(spineDay).not.toBeNull()
      expect(day.route).toBe(linkableRoute(spineDay!))
      expect(day.status).toBe(spineDay!.status)
      if (day.status !== 'shipped') expect(day.route).toBeNull()
    }
  })

  it('marks a week written only when one of its days can actually be opened', () => {
    for (const week of courseIndexWeeks()) {
      expect(week.written).toBe(week.days.some((day) => day.route !== null))
    }
  })

  it('starts at day 1 wherever day 1 currently answers', () => {
    const dayOne = mtgoaCourseDay(1)
    expect(courseStartRoute()).toBe(linkableRoute(dayOne!))
  })

  it('counts the written days in the state line from the spine', () => {
    const line = writtenStateLine()
    const written = writtenDayCount()
    expect(written).toBe(courseIndexWeeks().flatMap((w) => w.days).filter((d) => d.route).length)

    if (written === MTGOA_COURSE_LENGTH) {
      expect(line).toBe('All thirty days are written.')
      return
    }
    expect(line).toMatch(/^[A-Z]/)
    expect(line).toContain('of the thirty days are written')
    expect(line).toContain('are on the board below')
  })

  it('reads the state line as a sentence at the counts the course passes through', () => {
    // Sanity on the spelling table the line is built from, at today's count and
    // at the two boundaries a growing course crosses.
    expect(writtenStateLine()).not.toContain('undefined')
    expect(writtenStateLine()).not.toMatch(/\d/)
  })

  /**
   * Week 1's headlines are transcribed from five shipped components rather than
   * imported from them. This is the guard on that copy going stale unnoticed.
   */
  it('gives week 1 the headline each of its days opens with', () => {
    const [weekOne] = courseIndexWeeks()
    expect(weekOne.days.map((day) => day.headline)).toEqual([
      'Before you decide whether to act, notice what comes alive.',
      'There is energy here to work with.',
      'Something has your attention. Until you work it, it works you.',
      'Choose a capacity to practise.',
      'A handoff leaves your hands.',
    ])
  })

  it('takes week 2 headlines from the authored round-two days', () => {
    const weekTwo = courseIndexWeeks()[1]
    expect(weekTwo.days.map((day) => day.headline)).toEqual([
      'See the campaign that is actually there',
      'Let the structure be felt',
      'Clear the story designing the system',
      'Practice the capacity to organize',
      'Build one structure someone can use',
    ])
  })
})
