import { describe, expect, it } from 'vitest'

import {
  DAY_ELEVEN_ACCESS,
  DAY_ELEVEN_ACCESS_STANDARD,
  DAY_ELEVEN_COLUMNS,
  DAY_ELEVEN_INFORMATION_NEEDS,
  DAY_ELEVEN_LINES,
  dayElevenLedger,
  dayElevenBlankLedgerText,
  dayElevenLedgerText,
  dayElevenReceiptHeadline,
  dayElevenStewardEmailText,
  dayElevenUnlabelled,
  dayElevenWritten,
} from '../day-eleven'
import type { DayElevenEntry } from '../day-eleven'
import { mtgoaCourseDay } from '../course-days'
import { courseIndexDay } from '../course-index'
import { isDayReleased } from '../course-release'
import { ROUND_THREE_DOMAIN, roundThreeCardsFor, roundThreeDay } from '../round-three'

/**
 * Day 11 — Wake Up · What Is Already in Your Hand.
 *
 * The carousel is published, so its three vocabularies are fixed and this suite
 * pins them: eight starting-hand prompts, four access labels, three columns.
 *
 * @see .specify/specs/mtgoa-day11-starting-hand/design_handoff/
 */

const entries = (...rows: Array<Partial<DayElevenEntry> & { key: string }>): DayElevenEntry[] =>
  DAY_ELEVEN_LINES.map((line) => {
    const row = rows.find((r) => r.key === line.key)
    return {
      key: line.key,
      id: row?.id ?? line.key,
      text: row?.text ?? '',
      access: row?.access ?? null,
      askStatus: row?.askStatus ?? null,
      includeInEmail: row?.includeInEmail ?? false,
    }
  })

describe('the published vocabularies', () => {
  it('keeps the eight starting-hand resource piles', () => {
    expect(DAY_ELEVEN_LINES.map((l) => l.prompt)).toEqual([
      'people who trust your judgment.',
      'groups you belong to.',
      'skills and tools you can offer.',
      'rooms you can convene.',
      'problems you already understand.',
      'material support you can move.',
      'time and energy you can realistically give.',
      'something else you have access to.',
    ])
  })

  it('keeps the bounded campaign facts rather than collecting a freewrite', () => {
    expect(DAY_ELEVEN_INFORMATION_NEEDS).toContain('What the campaign most needs this week')
    expect(DAY_ELEVEN_INFORMATION_NEEDS).toContain('Whether someone can think through the fit with me')
    expect(DAY_ELEVEN_INFORMATION_NEEDS).toContain('I have enough information for now')
  })

  it('keeps the four access labels verbatim', () => {
    expect(DAY_ELEVEN_ACCESS.map((a) => a.label)).toEqual([
      'I can offer this.',
      'I can ask whether it is available.',
      'I have a possible connection.',
      'This is not mine to offer.',
    ])
  })

  it('keeps the three columns and their standard', () => {
    expect(DAY_ELEVEN_COLUMNS.map((c) => c.label)).toEqual(['Move now', 'Ask first', 'Keep visible'])
    expect(DAY_ELEVEN_ACCESS_STANDARD).toBe('A resource is not owed because you can reach it.')
  })

  it('routes every access label into exactly one column', () => {
    const columns = new Set(DAY_ELEVEN_COLUMNS.map((c) => c.key))
    for (const access of DAY_ELEVEN_ACCESS) expect(columns.has(access.column)).toBe(true)
    // Both "ask" answers put a question before an offer, so both land in Ask first.
    expect(DAY_ELEVEN_ACCESS.filter((a) => a.column === 'ask_first').map((a) => a.key)).toEqual([
      'ask',
      'connection',
    ])
  })
})

describe('the ledger', () => {
  it('counts only lines the reader actually wrote', () => {
    const state = entries({ key: 'people', text: '  ' }, { key: 'rooms', text: 'the Tuesday standup' })
    expect(dayElevenWritten(state).map((e) => e.key)).toEqual(['rooms'])
  })

  it('holds a written line off the ledger until it is labelled', () => {
    const state = entries({ key: 'rooms', text: 'the Tuesday standup' })
    expect(dayElevenUnlabelled(state).map((e) => e.key)).toEqual(['rooms'])
    const ledger = dayElevenLedger(state)
    expect(ledger.move_now).toHaveLength(0)
    expect(ledger.ask_first).toHaveLength(0)
    expect(ledger.keep_visible).toHaveLength(0)
  })

  it('sorts each labelled line into the column its access implies', () => {
    const state = entries(
      { key: 'people', text: 'Dana', access: 'offer' },
      { key: 'groups', text: 'the co-op', access: 'ask' },
      { key: 'skills', text: 'grant editing', access: 'connection' },
      { key: 'rooms', text: 'the church hall', access: 'not_mine' },
    )
    const ledger = dayElevenLedger(state)
    expect(ledger.move_now.map((e) => e.text)).toEqual(['Dana'])
    expect(ledger.ask_first.map((e) => e.text)).toEqual(['the co-op', 'grant editing'])
    expect(ledger.keep_visible.map((e) => e.text)).toEqual(['the church hall'])
  })

  it('leaves empty columns out of the copyable text', () => {
    const state = entries({ key: 'people', text: 'Dana', access: 'offer' })
    const text = dayElevenLedgerText(state)
    expect(text).toContain('MOVE NOW')
    expect(text).toContain('Dana')
    expect(text).not.toContain('ASK FIRST')
    expect(text).not.toContain('KEEP VISIBLE')
  })

  it('produces nothing to copy when the reader wrote nothing', () => {
    expect(dayElevenLedgerText(entries())).toBe('')
  })

  it('keeps the blank ledger useful without a browser session', () => {
    const blank = dayElevenBlankLedgerText()
    expect(blank).toContain('RESOURCE LEDGER')
    expect(blank).toContain('Material support you can move')
    expect(blank).toContain('Ask / transfer status')
  })

  it('puts only the explicitly selected resource in the steward email draft', () => {
    const state = entries(
      { key: 'people', text: 'Dana', access: 'ask', includeInEmail: true },
      { key: 'groups', text: 'the co-op', access: 'ask', includeInEmail: false },
    )
    const email = dayElevenStewardEmailText(state, ['What the campaign most needs this week'])
    expect(email).toContain('Dana')
    expect(email).not.toContain('the co-op')
    expect(email).toContain('What the campaign most needs this week')
  })
})

describe('the receipt headline', () => {
  it('claims no count when the hand is empty', () => {
    expect(dayElevenReceiptHeadline(entries())).toBe('You read the ledger through.')
  })

  it('says so when nothing is the reader’s to offer', () => {
    const state = entries({ key: 'rooms', text: 'the church hall', access: 'not_mine' })
    expect(dayElevenReceiptHeadline(state)).toBe('1 in hand. None of it is yours to offer today.')
  })

  it('names when a resource needs permission or a campaign fact', () => {
    const state = entries({ key: 'groups', text: 'the co-op', access: 'ask' })
    expect(dayElevenReceiptHeadline(state)).toBe('1 in hand. 1 needs a question or permission first.')
  })

  it('counts the hand and the lines ready to move', () => {
    const state = entries(
      { key: 'people', text: 'Dana', access: 'offer' },
      { key: 'groups', text: 'the co-op', access: 'ask' },
    )
    expect(dayElevenReceiptHeadline(state)).toBe('2 in hand. 1 you can move on now.')
  })
})

describe('the day in the spine', () => {
  it('draws from the six Wake Up · Gathering Resources cards', () => {
    const cards = roundThreeCardsFor('wake_up')
    expect(cards).toHaveLength(6)
    for (const card of cards) {
      expect(card.domain).toBe(ROUND_THREE_DOMAIN)
      expect(card.move).toBe('wake_up')
    }
  })

  it('translates every one of those six cards for this day', () => {
    const day = roundThreeDay(11)
    expect(day).not.toBeNull()
    for (const card of roundThreeCardsFor('wake_up')) {
      expect(day?.cardPrompts[card.id], `no Day 11 prompt for ${card.id}`).toBeTruthy()
    }
  })

  it('is day 11, round 3, on the canonical course route', () => {
    const day = mtgoaCourseDay(11)
    expect(day?.round).toBe(3)
    expect(day?.move).toBe('wake_up')
    expect(day?.domain).toBe('GATHERING_RESOURCES')
    expect(day?.status).toBe('shipped')
    expect(day?.courseRoute).toBe('/mastering-allyship/course/3/wake-up')
  })

  it('leaves day 15 unauthored, so nothing links to it', () => {
    for (const number of [15]) {
      expect(mtgoaCourseDay(number)?.status, `day ${number}`).toBe('unauthored')
      expect(courseIndexDay(number)?.route, `day ${number}`).toBeNull()
    }
  })

  it('carries the authored headline into the course index', () => {
    expect(courseIndexDay(11)?.headline).toBe('What is already in your hand?')
    expect(courseIndexDay(11)?.route).toBe('/mastering-allyship/course/3/wake-up')
  })

  it('opens Week 3 on Sunday 30 August, after Day 10', () => {
    const beforeRelease = Date.parse('2026-08-29T12:00:00Z')
    const afterRelease = Date.parse('2026-08-30T12:00:00Z')
    expect(isDayReleased(11, beforeRelease)).toBe(false)
    expect(isDayReleased(11, afterRelease)).toBe(true)
    expect(isDayReleased(10, beforeRelease)).toBe(true)
  })
})
