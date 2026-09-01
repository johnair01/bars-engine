import { describe, expect, it } from 'vitest'
import {
  CLEAN_UP_PRACTICES,
  GROW_UP_PRACTICES,
  GROW_UP_RAISE_AWARENESS_PRACTICES,
  SHOW_UP_RAISE_AWARENESS_PRACTICES,
  MTGOA_COURSE_DAYS,
  MTGOA_COURSE_LENGTH,
  MTGOA_MOVE_ORDER,
  SHOW_UP_PRACTICES,
  WAKE_UP_PRACTICES,
  linkableRoute,
  mtgoaCourseDay,
  mtgoaCourseDayNumber,
  mtgoaCourseRoute,
  nextCourseDay,
  shippedCourseDays,
} from '../course-days'
import {
  COURSE_ANSWER_PERSISTENCE_ENABLED,
  createCourseAnswerEnvelope,
  disabledCourseAnswerPersistence,
} from '../answer-persistence'

describe('MTGOA course foundation', () => {
  it('runs the Five Move Form six times for thirty days', () => {
    expect(MTGOA_COURSE_LENGTH).toBe(30)
    expect(MTGOA_COURSE_DAYS).toHaveLength(30)
    expect(MTGOA_COURSE_DAYS.map((day) => day.number)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    )
  })

  it('begins with the canonical Wake Up → Open Up → Clean Up → Grow Up → Show Up sequence', () => {
    expect(MTGOA_COURSE_DAYS.slice(0, 5).map((day) => day.move)).toEqual([...MTGOA_MOVE_ORDER])
    expect(MTGOA_COURSE_DAYS.slice(0, 3).map((day) => day.output)).toEqual([
      'awareness', 'experience', 'insight',
    ])
  })

  it('uses one stable course route pattern for six five-move rounds', () => {
    expect(mtgoaCourseRoute(1, 'wake_up')).toBe('/mastering-allyship/course/1/wake-up')
    expect(mtgoaCourseRoute(1, 'grow_up')).toBe('/mastering-allyship/course/1/grow-up')
    expect(mtgoaCourseRoute(6, 'show_up')).toBe('/mastering-allyship/course/6/show-up')
    expect(mtgoaCourseDayNumber(1, 'grow_up')).toBe(4)
    expect(mtgoaCourseDayNumber(6, 'show_up')).toBe(30)
  })

  it('draws from all 24 canonical cards for every move', () => {
    for (const suit of [WAKE_UP_PRACTICES, CLEAN_UP_PRACTICES, GROW_UP_PRACTICES, SHOW_UP_PRACTICES]) {
      expect(suit).toHaveLength(24)
    }
  })

  it('gives each round its own domain and questions, and invents none for rounds 4-6', () => {
    // Round 1 is Raise Awareness; round 2 is Skillful Organizing and re-asks the same
    // five moves of a different field, so Day 6 must not inherit Day 1's question.
    expect(mtgoaCourseDay(1)!.domain).toBe('RAISE_AWARENESS')
    expect(mtgoaCourseDay(6)!.domain).toBe('SKILLFUL_ORGANIZING')
    expect(mtgoaCourseDay(6)!.question).toBe('What structure is actually running this work now?')
    expect(mtgoaCourseDay(1)!.question).not.toBe(mtgoaCourseDay(6)!.question)

    // Round 3 is Gather Resources. Days 11 and 12 are written; its remaining
    // three siblings are not. Rounds 4-6 stay undecided.
    expect(mtgoaCourseDay(11)!.domain).toBe('GATHERING_RESOURCES')
    expect(mtgoaCourseDay(11)!.question).toBe('What can I actually reach?')
    expect(mtgoaCourseDay(12)!.status).toBe('shipped')
    expect(mtgoaCourseDay(12)!.question).toBe('What energy is trying to get through?')

    for (const number of [16, 21, 26, 30]) {
      expect(mtgoaCourseDay(number)!.domain).toBeNull()
      expect(mtgoaCourseDay(number)!.status).toBe('unauthored')
    }
  })

  it('gives Day 4 exactly six Grow Up × Raise Awareness gates, one per Game Master', () => {
    expect(GROW_UP_RAISE_AWARENESS_PRACTICES).toHaveLength(6)
    expect(GROW_UP_RAISE_AWARENESS_PRACTICES.map((card) => card.id).sort()).toEqual([
      'GROW-RA-ARCHITECT', 'GROW-RA-CHALLENGER', 'GROW-RA-DIPLOMAT',
      'GROW-RA-REGENT', 'GROW-RA-SAGE', 'GROW-RA-SHAMAN',
    ])
  })

  it('gives Day 5 exactly six Show Up × Raise Awareness cards, one per Game Master', () => {
    expect(SHOW_UP_RAISE_AWARENESS_PRACTICES).toHaveLength(6)
    expect(SHOW_UP_RAISE_AWARENESS_PRACTICES.map((card) => card.id).sort()).toEqual([
      'SHOW-RA-ARCHITECT', 'SHOW-RA-CHALLENGER', 'SHOW-RA-DIPLOMAT',
      'SHOW-RA-REGENT', 'SHOW-RA-SAGE', 'SHOW-RA-SHAMAN',
    ])
  })

  it('only offers a route for a day that actually resolves', () => {
    // Rounds 1 and 2 are complete. Round 1 resolves on its short campaign
    // aliases; round 2 on the canonical course route, which the Week 2 spec
    // reserves until a public navigation convention is approved.
    expect(shippedCourseDays().map((day) => day.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(shippedCourseDays().slice(0, 5).map((day) => linkableRoute(day))).toEqual([
      '/wake-up', '/open-up', '/clean-up', '/grow-up', '/show-up',
    ])
    expect(linkableRoute(mtgoaCourseDay(6)!)).toBe('/mastering-allyship/course/2/wake-up')
    expect(linkableRoute(mtgoaCourseDay(11)!)).toBe('/mastering-allyship/course/3/wake-up')
    expect(linkableRoute(mtgoaCourseDay(12)!)).toBe('/mastering-allyship/course/3/open-up')
    // Day 13 is still unauthored, so nothing past Day 12 resolves.
    expect(linkableRoute(mtgoaCourseDay(13)!)).toBeNull()
  })

  it('links tomorrow once that day ships', () => {
    const afterWakeUp = nextCourseDay(1)
    expect(afterWakeUp?.day.title).toBe('Open Up')
    expect(afterWakeUp?.route).toBe('/open-up')
  })

  it('names tomorrow without linking at an unfinished page', () => {
    const afterCleanUp = nextCourseDay(3)
    expect(afterCleanUp?.day.title).toBe('Grow Up')
    expect(afterCleanUp?.route).toBe('/grow-up')

    const afterGrowUp = nextCourseDay(4)
    expect(afterGrowUp?.day.title).toBe('Show Up')
    expect(afterGrowUp?.route).toBe('/show-up')

    // Day 10 now hands forward into Week 3.
    const afterWeekTwo = nextCourseDay(10)
    expect(afterWeekTwo?.day.number).toBe(11)
    expect(afterWeekTwo?.route).toBe('/mastering-allyship/course/3/wake-up')

    // Day 12 now ships too; Day 13 remains the first Week 3 day still unwritten.
    const afterDayEleven = nextCourseDay(11)
    expect(afterDayEleven?.day.number).toBe(12)
    expect(afterDayEleven?.route).toBe('/mastering-allyship/course/3/open-up')

    const afterDayTwelve = nextCourseDay(12)
    expect(afterDayTwelve?.day.number).toBe(13)
    expect(afterDayTwelve?.route).toBeNull()

    expect(nextCourseDay(30)).toBeNull()
  })

  it('keeps private course answers non-persistent while the feature is off', async () => {
    const answer = createCourseAnswerEnvelope('day-1', { awareness: 'I notice hesitation.' }, '2026-08-19T00:00:00.000Z')
    expect(COURSE_ANSWER_PERSISTENCE_ENABLED).toBe(false)
    await expect(disabledCourseAnswerPersistence.save(answer)).resolves.toBeUndefined()
    await expect(disabledCourseAnswerPersistence.load('day-1')).resolves.toBeNull()
  })

  it('drops names of real people from any answer envelope', () => {
    const envelope = createCourseAnswerEnvelope('day-4', {
      rooms: ['close friends'],
      names: ['Alex', 'Jordan'],
      who: 'Alex',
      rep: 'recommend',
    }, '2026-08-21T00:00:00.000Z')
    expect(envelope.answers).toEqual({ rooms: ['close friends'], rep: 'recommend' })
  })
})
