import { describe, expect, it } from 'vitest'
import {
  ALLYSHIP_RHYTHM_FIELDS,
  CAMPAIGN_HANDOFF_FIELDS,
  ROUND_TWO_COME_BACK,
  ROUND_TWO_DAYS,
  ROUND_TWO_LANES,
  ROUND_TWO_STATES,
  roundTwoCardsFor,
  roundTwoDay,
  roundTwoDayByMove,
  roundTwoEvidence,
} from '../round-two'
import { parseRoundTwoAnalyticsEvent } from '../round-two-events'
import {
  MTGOA_ORGANIZATION_STATE,
  hasOpenParticipation,
} from '../organization-state'
import { MTGOA_MOVE_ORDER, linkableRoute, mtgoaCourseDay, nextCourseDay, shippedCourseDays } from '../course-days'

describe('Week 2 — Skillful Organizing', () => {
  it('runs the Five Move Form again as days 6 to 10', () => {
    expect(ROUND_TWO_DAYS.map((d) => d.day)).toEqual([6, 7, 8, 9, 10])
    expect(ROUND_TWO_DAYS.map((d) => d.move)).toEqual([...MTGOA_MOVE_ORDER])
  })

  it('draws six Skillful Organizing cards for every move, never a subset', () => {
    for (const day of ROUND_TWO_DAYS) {
      const cards = roundTwoCardsFor(day.move)
      expect(cards).toHaveLength(6)
      expect(cards.every((c) => c.domain === 'SKILLFUL_ORGANIZING')).toBe(true)
      expect(cards.every((c) => c.move === day.move)).toBe(true)
      // Every card carries the day's own translation of its operation.
      for (const card of cards) expect(day.cardPrompts[card.id]).toBeTruthy()
    }
  })

  it('gives each day a named practice and a do-not boundary', () => {
    for (const day of ROUND_TWO_DAYS) {
      expect(day.practice.name).toBeTruthy()
      expect(day.doNot).toBeTruthy()
      expect(day.coreQuestion).toBeTruthy()
    }
  })

  it('offers two lanes, and never makes the team lane the graduation requirement', () => {
    expect(ROUND_TWO_LANES.map((l) => l.key)).toEqual(['personal', 'local_team'])
    const team = ROUND_TWO_LANES[1]
    expect(team.body).toMatch(/owner: me/i)
    expect(ALLYSHIP_RHYTHM_FIELDS).toHaveLength(5)
    expect(CAMPAIGN_HANDOFF_FIELDS.map((f) => f.key)).toEqual([
      'purpose', 'audience', 'action', 'owner', 'terms', 'review',
    ])
  })

  it('keeps prepared distinct from made', () => {
    expect(ROUND_TWO_STATES.map((s) => s.key)).toEqual(['made', 'prepared', 'returning'])
    const prepared = ROUND_TWO_STATES.find((s) => s.key === 'prepared')!
    expect(prepared.label).not.toMatch(/complete|done|finished/i)
  })

  it('routes a failed structure back into the loop rather than calling it done', () => {
    const answers = ROUND_TWO_COME_BACK.answers
    expect(answers.map((a) => a.returnToDay)).toEqual([null, 6, 1])
    // Both return targets must actually resolve, or the answer is a dead end.
    for (const a of answers) {
      if (!a.returnToDay) continue
      expect(linkableRoute(mtgoaCourseDay(a.returnToDay)!)).toBeTruthy()
    }
  })

  it('reports only what the reader actually did', () => {
    expect(roundTwoEvidence({ day: 6, answered: 0, carried: false, state: null })).toEqual(['showed up to Day 6'])
    expect(roundTwoEvidence({ day: 10, answered: 3, carried: true, state: 'made' })).toEqual([
      'showed up to Day 10', 'worked 3 prompts', 'carried a card', 'put it in use',
    ])
  })

  it('looks each day up by number and by move', () => {
    expect(roundTwoDay(8)?.move).toBe('clean_up')
    expect(roundTwoDayByMove('show_up')?.day).toBe(10)
    expect(roundTwoDay(11)).toBeNull()
  })
})

describe('Week 2 course routing', () => {
  it('makes days 1 to 10 walkable, with round 2 on the canonical course route', () => {
    expect(shippedCourseDays().map((d) => d.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(linkableRoute(mtgoaCourseDay(6)!)).toBe('/mastering-allyship/course/2/wake-up')
    expect(linkableRoute(mtgoaCourseDay(10)!)).toBe('/mastering-allyship/course/2/show-up')
    // Round 1 keeps its short campaign aliases.
    expect(linkableRoute(mtgoaCourseDay(1)!)).toBe('/wake-up')
  })

  it('hands Day 5 forward into Week 2, and stops at the round-3 boundary', () => {
    const afterShowUp = nextCourseDay(5)
    expect(afterShowUp?.day.number).toBe(6)
    expect(afterShowUp?.route).toBe('/mastering-allyship/course/2/wake-up')

    const afterDayTen = nextCourseDay(10)
    expect(afterDayTen?.day.number).toBe(11)
    expect(afterDayTen?.route).toBeNull()
    expect(mtgoaCourseDay(11)!.domain).toBeNull()
  })
})

describe('public organization state', () => {
  it('publishes approved Book Launch routes with a steward and no generic volunteer claim', () => {
    expect(hasOpenParticipation()).toBe(true)
    expect(MTGOA_ORGANIZATION_STATE.activeWorkstreams).toHaveLength(1)
    expect(MTGOA_ORGANIZATION_STATE.activeWorkstreams[0]?.ownerLabel).toMatch(/Wendell/)
    expect(MTGOA_ORGANIZATION_STATE.participationPaths.map((p) => p.id)).toEqual([
      'five-copy-handoff', 'organization-introduction', 'podcast-invitation',
    ])
    expect(MTGOA_ORGANIZATION_STATE.localTeams.status).not.toBe('open')
  })

  it('says plainly what is not true, so a reader is not left guessing', () => {
    const absent = MTGOA_ORGANIZATION_STATE.notCurrentlyTrue.join(' ').toLowerCase()
    expect(absent).toMatch(/no public ambassador program/)
    expect(absent).toMatch(/no local team is open/)
    expect(absent).toMatch(/no reward, referral credit, or free-copy promise/)
  })

  it('promises no reward while the terms are undecided', () => {
    expect(MTGOA_ORGANIZATION_STATE.recognition.status).not.toBe('open')
    expect(MTGOA_ORGANIZATION_STATE.recognition.eligibleActions).toHaveLength(0)
    expect(MTGOA_ORGANIZATION_STATE.recognition.notRequired.join(' ')).toMatch(/sales or conversion target/i)
  })

  it('carries the dates every public state page has to show', () => {
    expect(MTGOA_ORGANIZATION_STATE.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(MTGOA_ORGANIZATION_STATE.nextReviewAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('points at /nonprofit rather than paraphrasing legal status', () => {
    expect(MTGOA_ORGANIZATION_STATE.relatedSurfaces.some((s) => s.href === '/nonprofit')).toBe(true)
  })
})

describe('Week 2 analytics boundary', () => {
  it('records position, card and receipt state', () => {
    expect(parseRoundTwoAnalyticsEvent({ event: 'week_two_state_chosen', day: 10, state: 'made' }))
      .toEqual({ event: 'week_two_state_chosen', day: 10, state: 'made' })
  })

  it('drops the campaign map, the 3-2-1 and the artifact', () => {
    const parsed = parseRoundTwoAnalyticsEvent({
      event: 'week_two_started',
      day: 8,
      story: 'only I can do this',
      i: 'what the part said',
      owner: 'my colleague Sam',
    })
    expect(parsed).toEqual({ event: 'week_two_started', day: 8 })
  })

  it('rejects unknown events, out-of-round days and foreign card ids', () => {
    expect(parseRoundTwoAnalyticsEvent({ event: 'week_two_reward_claimed' })).toBeNull()
    expect(parseRoundTwoAnalyticsEvent({ event: 'week_two_viewed', day: 3 })).toEqual({ event: 'week_two_viewed' })
    expect(parseRoundTwoAnalyticsEvent({ event: 'week_two_card_carried', cardId: 'GROW-RA-SAGE' }))
      .toEqual({ event: 'week_two_card_carried' })
  })
})
