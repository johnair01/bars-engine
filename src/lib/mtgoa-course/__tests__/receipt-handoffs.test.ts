import { describe, expect, it } from 'vitest'
import { askingLine, linkableRoute, mtgoaCourseDay, nextCourseDay } from '../course-days'
import { wakeUpNextDayHref } from '@/lib/wake-up/outbound'
import { openUpNextDayHref } from '@/lib/open-up/outbound'
import { cleanUpNextDayHref } from '@/lib/clean-up/outbound'
import { growUpNextDayHref } from '@/lib/grow-up/outbound'

/**
 * Every shipped day's receipt reads its forward handoff from the spine. These
 * assert the chain those receipts render, so a day that stops resolving can
 * never leave a live link pointing at it.
 */
describe('course receipt handoffs', () => {
  it('walks the whole of round 1 as live links', () => {
    expect(nextCourseDay(1)?.route).toBe('/open-up')
    expect(nextCourseDay(2)?.route).toBe('/clean-up')
    expect(nextCourseDay(3)?.route).toBe('/grow-up')
    expect(nextCourseDay(4)?.route).toBe('/show-up')
  })

  it('hands Week 2 forward through the authored Week 3 days, then stops', () => {
    const afterWeekTwo = nextCourseDay(10)
    expect(afterWeekTwo?.day.title).toBe('Wake Up')
    expect(afterWeekTwo?.day.question).toBeTruthy()
    // Day 11 ships, so Day 10's receipt links straight at it.
    expect(afterWeekTwo?.route).toBe('/mastering-allyship/course/3/wake-up')
    expect(linkableRoute(mtgoaCourseDay(11)!)).toBe('/mastering-allyship/course/3/wake-up')

    // Day 12 ships, so Day 11's receipt links straight at it.
    const afterDayEleven = nextCourseDay(11)
    expect(afterDayEleven?.day.question).toBeTruthy()
    expect(afterDayEleven?.route).toBe('/mastering-allyship/course/3/open-up')
    expect(linkableRoute(mtgoaCourseDay(12)!)).toBe('/mastering-allyship/course/3/open-up')

    // Day 13 ships, so Day 12's receipt links straight at it.
    const afterDayTwelve = nextCourseDay(12)
    expect(afterDayTwelve?.day.question).toBeTruthy()
    expect(afterDayTwelve?.route).toBe('/mastering-allyship/course/3/clean-up')
    expect(linkableRoute(mtgoaCourseDay(13)!)).toBe('/mastering-allyship/course/3/clean-up')

    // Day 14 ships, so Day 13's receipt links straight at it.
    const afterDayThirteen = nextCourseDay(13)
    expect(afterDayThirteen?.day.question).toBeTruthy()
    expect(afterDayThirteen?.route).toBe('/mastering-allyship/course/3/grow-up')
    expect(linkableRoute(mtgoaCourseDay(14)!)).toBe('/mastering-allyship/course/3/grow-up')

    // Day 15 is unwritten, so Day 14's receipt reads "coming next" rather than a link.
    const afterDayFourteen = nextCourseDay(14)
    expect(afterDayFourteen?.route).toBeNull()
  })

  it('carries attribution through every handoff without leaking an answer', () => {
    const search = new URLSearchParams({ utm_source: 'ig', utm_campaign: 'launch', belief: 'I am not ready' })
    const hrefs = [
      wakeUpNextDayHref(search, nextCourseDay(1)!.route!),
      openUpNextDayHref(search, nextCourseDay(2)!.route!),
    ]
    for (const href of hrefs) {
      expect(href).toContain('utm_source=ig')
      expect(href).toContain('utm_campaign=launch')
      expect(href).not.toContain('belief')
      expect(href).not.toContain('ready')
    }
  })

  it('routed Day 3 forward the moment Grow Up shipped, with no page edit', () => {
    // Day 3's receipt hardcodes nothing. Flipping grow_up to `shipped` in
    // course-days.ts is the entire change that turned its "coming next" into a link.
    expect(cleanUpNextDayHref(new URLSearchParams(), nextCourseDay(3)!.route!)).toBe('/grow-up')
  })

  it('lowers only the first letter, so a standalone "I" survives', () => {
    // "Which capacity am I willing to practice?" — a blanket toLowerCase() reads "am i".
    expect(askingLine(mtgoaCourseDay(4)!)).toBe('Grow Up asks: which capacity am I willing to practice?')
    expect(askingLine(mtgoaCourseDay(2)!)).toBe('Open Up asks: what energy is trying to get through?')
  })

  it('carries attribution through Day 4’s handoff too', () => {
    const search = new URLSearchParams({ utm_source: 'ig', belief: 'insig' })
    const href = growUpNextDayHref(search, nextCourseDay(4)!.route!)
    expect(href).toContain('utm_source=ig')
    expect(href).not.toContain('belief')
  })

  it('hands Day 5 forward into round 2 with round 2’s own question', () => {
    const afterShowUp = nextCourseDay(5)
    expect(afterShowUp?.day.number).toBe(6)
    expect(afterShowUp?.day.title).toBe('Wake Up')
    // Day 6 re-asks Wake Up of the campaign structure, not of the reader — so it
    // must not inherit Day 1's wording.
    expect(afterShowUp?.day.question).toBe('What structure is actually running this work now?')
    // Week 1 hands straight into Week 2 on the canonical course route.
    expect(afterShowUp?.route).toBe('/mastering-allyship/course/2/wake-up')
  })

  it('ends the course rather than inventing a Day 31', () => {
    expect(nextCourseDay(30)).toBeNull()
  })
})
