import { describe, expect, it } from 'vitest'
import { CLEAN_UP_PRACTICES, MTGOA_COURSE_DAYS, MTGOA_COURSE_LENGTH, mtgoaCourseDayNumber, mtgoaCourseRoute, WAKE_UP_PRACTICES } from '../course-days'
import {
  COURSE_ANSWER_PERSISTENCE_ENABLED,
  createCourseAnswerEnvelope,
  disabledCourseAnswerPersistence,
} from '../answer-persistence'

describe('MTGOA course foundation', () => {
  it('begins with the canonical Wake Up → Open Up → Clean Up sequence', () => {
    expect(MTGOA_COURSE_DAYS.map((day) => day.move)).toEqual(['wake_up', 'open_up', 'clean_up'])
    expect(MTGOA_COURSE_DAYS.map((day) => day.output)).toEqual(['awareness', 'experience', 'insight'])
  })

  it('draws from all 24 canonical cards for Day 1 and Day 3', () => {
    expect(WAKE_UP_PRACTICES).toHaveLength(24)
    expect(CLEAN_UP_PRACTICES).toHaveLength(24)
  })

  it('uses one stable course route pattern for six five-move rounds', () => {
    expect(MTGOA_COURSE_LENGTH).toBe(30)
    expect(mtgoaCourseRoute(1, 'wake_up')).toBe('/mastering-allyship/course/1/wake-up')
    expect(mtgoaCourseRoute(6, 'show_up')).toBe('/mastering-allyship/course/6/show-up')
    expect(mtgoaCourseDayNumber(6, 'show_up')).toBe(30)
  })

  it('keeps private course answers non-persistent while the feature is off', async () => {
    const answer = createCourseAnswerEnvelope('day-1', { awareness: 'I notice hesitation.' }, '2026-08-19T00:00:00.000Z')
    expect(COURSE_ANSWER_PERSISTENCE_ENABLED).toBe(false)
    await expect(disabledCourseAnswerPersistence.save(answer)).resolves.toBeUndefined()
    await expect(disabledCourseAnswerPersistence.load('day-1')).resolves.toBeNull()
  })
})
