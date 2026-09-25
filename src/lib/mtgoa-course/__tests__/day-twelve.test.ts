import { describe, expect, it } from 'vitest'

import {
  DAY_TWELVE_HANDS,
  DAY_TWELVE_WEATHER,
  dayTwelveReceiptLines,
  dayTwelveSentence,
} from '../day-twelve'
import { mtgoaCourseDay } from '../course-days'
import { courseIndexDay } from '../course-index'
import { isDayReleased } from '../course-release'
import { ROUND_THREE_DOMAIN, roundThreeCardsFor, roundThreeDay } from '../round-three'

describe('Day 12 — Hold the Resource Question', () => {
  it('keeps the three resource-flow hands', () => {
    expect(DAY_TWELVE_HANDS.map((hand) => hand.key)).toEqual(['offer', 'ask_first', 'need'])
  })

  it('keeps Ask Weather as observation rather than a diagnosis', () => {
    expect(DAY_TWELVE_WEATHER).toContain('My body tightens or pulls away')
    expect(DAY_TWELVE_WEATHER).toContain('Something else is here')
  })

  it('can render a plain sentence before the reader fills anything in', () => {
    expect(dayTwelveSentence('need', '', '')).toBe('I need the resource in order to the next use or outcome.')
  })

  it('keeps a receipt private and sparse', () => {
    expect(dayTwelveReceiptLines({ hand: 'ask_first', label: 'a venue decision', weather: ['I feel the weight of the need'] })).toEqual({
      question: 'a venue decision',
      noticed: 'I feel the weight of the need',
    })
  })

  it('draws only the six Open Up × Gather Resources cards', () => {
    const cards = roundThreeCardsFor('open_up')
    expect(cards).toHaveLength(6)
    for (const card of cards) {
      expect(card.domain).toBe(ROUND_THREE_DOMAIN)
      expect(card.move).toBe('open_up')
    }
  })

  it('authors the course route and its card translations', () => {
    const day = roundThreeDay(12)
    expect(day?.title).toBe('Hold the Resource Question')
    expect(mtgoaCourseDay(12)?.courseRoute).toBe('/mastering-allyship/course/3/open-up')
    for (const card of roundThreeCardsFor('open_up')) expect(day?.cardPrompts[card.id]).toBeTruthy()
    expect(mtgoaCourseDay(12)?.status).toBe('shipped')
    expect(courseIndexDay(12)?.route).toBe('/mastering-allyship/course/3/open-up')
  })

  it('opens on Monday 31 August, after Day 11', () => {
    const beforeRelease = Date.parse('2026-08-30T12:00:00Z')
    const afterRelease = Date.parse('2026-08-31T12:00:00Z')
    expect(isDayReleased(12, beforeRelease)).toBe(false)
    expect(isDayReleased(12, afterRelease)).toBe(true)
  })
})
