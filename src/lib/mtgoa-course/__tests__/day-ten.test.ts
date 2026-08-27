import { describe, expect, it } from 'vitest'

import {
  DAY_TEN_HANDOFF_FIELDS,
  DAY_TEN_LANES,
  DAY_TEN_LEARNINGS,
  DAY_TEN_PLACEMENTS,
  DAY_TEN_RETURN_DOORS,
  DAY_TEN_RHYTHM_FIELDS,
  DAY_TEN_STARTERS,
  dayTenAttestation,
  dayTenHandoffText,
  dayTenLens,
  dayTenReceiptHeadline,
  dayTenReminderLine,
  dayTenRhythmText,
  dayTenStateChip,
} from '../day-ten'
import { linkableRoute, mtgoaCourseDay } from '../course-days'
import { roundTwoCardsFor } from '../round-two'
import { parseRoundTwoAnalyticsEvent } from '../round-two-events'

describe('Day 10 — Show Up · The Campaign Handoff', () => {
  it('offers two lanes on the wire keys Week 2 analytics already accepts', () => {
    expect(DAY_TEN_LANES.map((l) => l.key)).toEqual(['personal', 'local_team'])
    for (const lane of DAY_TEN_LANES) {
      expect(parseRoundTwoAnalyticsEvent({ event: 'week_two_lane_chosen', day: 10, lane: lane.key }))
        .toEqual({ event: 'week_two_lane_chosen', day: 10, lane: lane.key })
    }
  })

  it('says who can use each lane, and asks for standing before the shared one', () => {
    const [personal, shared] = DAY_TEN_LANES
    expect(personal.whoCanUse).toMatch(/future you/i)
    expect(shared.whoCanUse).toMatch(/agreed to receive/i)
    expect(shared.caution).toMatch(/owner: me/i)
    // Nothing on this page sends the artifact anywhere, so neither lane may say it does.
    for (const lane of DAY_TEN_LANES) expect(lane.whatHappens).not.toMatch(/we (will )?send|submitted to/i)
  })

  it('gives every starter a lane and a place the work can land', () => {
    expect(DAY_TEN_STARTERS).toHaveLength(5)
    for (const starter of DAY_TEN_STARTERS) {
      expect(DAY_TEN_LANES.some((l) => l.key === starter.lane)).toBe(true)
      expect(starter.blurb).toMatch(/lands in/i)
    }
    expect(DAY_TEN_STARTERS.filter((s) => s.lane === 'personal').map((s) => s.key)).toEqual(['rhythm'])
  })

  it('keeps four distinct truth states, and placed is the only one that asks for a word', () => {
    expect(DAY_TEN_PLACEMENTS.map((p) => p.key)).toEqual(['placed', 'prepared', 'returned', 'put_down'])
    const prepared = DAY_TEN_PLACEMENTS.find((p) => p.key === 'prepared')!
    expect(prepared.label).not.toMatch(/complete|done|finished/i)
    // Each reaches the analytics validator, so the four stay distinguishable in aggregate.
    for (const placement of DAY_TEN_PLACEMENTS) {
      expect(parseRoundTwoAnalyticsEvent({ event: 'week_two_state_chosen', day: 10, state: placement.key }))
        .toEqual({ event: 'week_two_state_chosen', day: 10, state: placement.key })
    }
  })

  it('attests to what the lane actually claims', () => {
    expect(dayTenAttestation('personal')).toMatch(/first instance/i)
    expect(dayTenAttestation('local_team')).toMatch(/agreed to receive/i)
    expect(dayTenAttestation(null)).toBe(dayTenAttestation('personal'))
  })

  it('names the state on the receipt, and says who a placed structure is for', () => {
    expect(dayTenStateChip('placed', 'personal')).toBe('Placed for future me')
    expect(dayTenStateChip('placed', 'local_team')).toBe('Placed with others')
    expect(dayTenStateChip('prepared', null)).toBe('Prepared')
    expect(dayTenStateChip('put_down', null)).toBe('Put down')
    expect(dayTenStateChip(null, null)).toBe('No state chosen')
  })

  it('gives every state its own receipt headline, and stays neutral without one', () => {
    const headlines = DAY_TEN_PLACEMENTS.map((p) => dayTenReceiptHeadline(p.key))
    expect(new Set(headlines).size).toBe(DAY_TEN_PLACEMENTS.length)
    expect(headlines).not.toContain(dayTenReceiptHeadline(null))
  })

  it('routes a placement that exposed an earlier move to a day that resolves', () => {
    expect(DAY_TEN_RETURN_DOORS.map((d) => d.day)).toEqual([6, 7, 8, 9])
    for (const door of DAY_TEN_RETURN_DOORS) {
      expect(linkableRoute(mtgoaCourseDay(door.day)!)).toBeTruthy()
    }
  })

  it("carries this day's reading of every Show Up organizing card", () => {
    const cards = roundTwoCardsFor('show_up')
    expect(cards).toHaveLength(6)
    for (const card of cards) expect(dayTenLens(card)).toBeTruthy()
  })

  it('builds both artifacts from the reader’s own words, with a blank mark for empty fields', () => {
    const blank = { who: '', why: '', line: '' }
    const rhythm = dayTenRhythmText({ practice: 'Recommend one book a week' }, blank)
    expect(rhythm).toContain('The practice: Recommend one book a week')
    expect(rhythm).toContain('The place: —')
    expect(rhythm).not.toContain('BOOK HANDOFF RHYTHM')

    const withBook = dayTenRhythmText({}, { who: 'my team lead', why: '', line: '' })
    expect(withBook).toContain('BOOK HANDOFF RHYTHM')
    expect(withBook).toContain('Who I will consider: my team lead')

    const handoff = dayTenHandoffText({ owner: 'me' })
    expect(handoff).toContain('Owner: me')
    expect(handoff).toContain('Purpose: —')
  })

  it('offers every field as optional, and names the return in both artifacts', () => {
    expect(DAY_TEN_RHYTHM_FIELDS.map((f) => f.key)).toEqual(['practice', 'place', 'support', 'boundary', 'return'])
    expect(DAY_TEN_HANDOFF_FIELDS.map((f) => f.key)).toEqual(['purpose', 'whom', 'action', 'owner', 'terms', 'return'])
  })

  it('hands the reader a reminder line to keep in their own system', () => {
    expect(dayTenReminderLine('March 3')).toBe(
      'On March 3, I will ask: Did this make the next useful handoff easier, harder, or clearer?',
    )
    expect(dayTenReminderLine('')).toContain('[date]')
  })

  it('lets a reader learn that the work should stay unstructured', () => {
    expect(DAY_TEN_LEARNINGS.map((l) => l.key)).toEqual(['easier', 'harder', 'no'])
    expect(DAY_TEN_LEARNINGS[2].body).toMatch(/complete game/i)
  })
})
