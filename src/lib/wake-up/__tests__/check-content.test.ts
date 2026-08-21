import { describe, expect, it } from 'vitest'
import {
  WAKE_UP_CARD_IDS,
  WAKE_UP_PRACTICES,
  WAKE_UP_QUESTIONS,
  WAKE_UP_RESERVATIONS,
  wakeUpEvidence,
} from '../check-content'
import { parseWakeUpAnalyticsEvent } from '../events'
import { wakeUpBookHref, wakeUpDeckHref, wakeUpNextDayHref } from '../outbound'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'

describe('Wake Up Check content', () => {
  it('asks the six unpacking questions in the foundation note’s order', () => {
    expect(WAKE_UP_QUESTIONS.map((question) => question.key)).toEqual([
      'creation', 'satisfaction', 'direction', 'dissatisfaction', 'worldview', 'reservation',
    ])
    expect(WAKE_UP_QUESTIONS.map((question) => question.number)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('gives every text question a stem and every choice question its choices', () => {
    for (const question of WAKE_UP_QUESTIONS) {
      if (question.kind === 'text') expect(question.placeholder).toBeTruthy()
      else expect(question.choices?.length).toBeGreaterThan(0)
      expect(question.receiptLabel).toBeTruthy()
    }
  })

  it('offers the book’s six self-sabotaging beliefs, unranked', () => {
    expect(WAKE_UP_RESERVATIONS).toHaveLength(6)
    expect(WAKE_UP_QUESTIONS[5].choices).toEqual(WAKE_UP_RESERVATIONS)
  })

  it('draws from all 24 canonical Wake Up cards, never a subset', () => {
    expect(WAKE_UP_PRACTICES).toHaveLength(24)
    expect(WAKE_UP_CARD_IDS.size).toBe(24)
    expect(WAKE_UP_PRACTICES.every((card) => card.move === 'wake_up')).toBe(true)
  })

  it('reports only what the visitor actually did', () => {
    expect(wakeUpEvidence({ answered: 0, drew: false, carried: false })).toEqual(['showed up to Day 1'])
    expect(wakeUpEvidence({ answered: 4, drew: true, carried: true })).toEqual([
      'showed up to Day 1', 'unpacked 4 of 6', 'drew from the Wake Up suit', 'carried a card',
    ])
  })
})

describe('Wake Up Check analytics boundary', () => {
  it('accepts an aggregate event', () => {
    expect(parseWakeUpAnalyticsEvent({ event: 'wake_up_check_started', route: 'book_promo' })).toEqual({
      event: 'wake_up_check_started', route: 'book_promo',
    })
  })

  it('drops free text, unknown keys and out-of-range positions', () => {
    const parsed = parseWakeUpAnalyticsEvent({
      event: 'wake_up_question_advanced',
      questionNumber: 3,
      creation: 'I want to speak up in standups',
      worldview: 'people who speak up get punished',
      note: 'anything',
    })
    expect(parsed).toEqual({ event: 'wake_up_question_advanced', questionNumber: 3 })

    expect(parseWakeUpAnalyticsEvent({ event: 'wake_up_question_advanced', questionNumber: 9 }))
      .toEqual({ event: 'wake_up_question_advanced' })
  })

  it('rejects unknown events and non-canonical card ids', () => {
    expect(parseWakeUpAnalyticsEvent({ event: 'wake_up_answers_submitted' })).toBeNull()
    expect(parseWakeUpAnalyticsEvent({ event: 'wake_up_card_carried', cardId: 'NOT-A-CARD' }))
      .toEqual({ event: 'wake_up_card_carried' })
  })
})

describe('Wake Up Check outbound links', () => {
  it('forwards only attribution, never an answer', () => {
    const search = new URLSearchParams({ utm_source: 'ig', creation: 'private text' })
    for (const href of [wakeUpBookHref(search), wakeUpDeckHref(search), wakeUpNextDayHref(search, '/open-up')]) {
      expect(href).toContain('utm_source=ig')
      expect(href).not.toContain('creation')
      expect(href).not.toContain('private')
    }
  })

  it('takes the next day’s route from the spine rather than a literal', () => {
    const tomorrow = nextCourseDay(1)
    expect(tomorrow?.route).toBe('/open-up')
    expect(wakeUpNextDayHref(new URLSearchParams(), tomorrow!.route!)).toBe('/open-up')
  })
})
