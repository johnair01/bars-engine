import { describe, expect, it } from 'vitest'
// The scroll (public/calrunia/scroll.js, Still B): an invitation is a scroll you seal; three ribbons answer it.
import { answerOutcome, calendar, cleanLine, LINE_MAX, markOf, RIBBONS, sealedInvitation, sendable, shelfScrolls, whenFor, whenWords, WHEN_CHIPS } from '../../../../public/calrunia/scroll.js'
import { mayWrite, merge, roomSummary, type Doc, type Who } from '@/lib/between/rules'

const A = 'playerA', B = 'playerB'
const member = (playerId: string): Who => ({ playerId, member: true, invited: false })
const room = (extra: Doc = {}): Doc => ({ v: 1, kind: 'room', startedBy: A, phase: 'between', members: { [A]: {}, [B]: {} }, invitations: {}, ...extra })
// Thursday 22 October 2026, 14:00 local
const THU = new Date(2026, 9, 22, 14, 0, 0).getTime()

describe('scroll: when', () => {
  it('the chips are the still\'s, in its order', () => {
    expect(WHEN_CHIPS.map(c => c[1])).toEqual(['tonight', 'tomorrow eve', 'this weekend', 'pick a day'])
  })
  it('tonight, tomorrow eve, this weekend and a picked day', () => {
    expect(new Date(whenFor('tonight', THU)!).getHours()).toBe(19)
    const tm = new Date(whenFor('tomorrow', THU)!)
    expect([tm.getDate(), tm.getHours()]).toEqual([23, 18])
    const we = new Date(whenFor('weekend', THU)!)
    expect([we.getDay(), we.getDate(), we.getHours()]).toEqual([6, 24, 15])
    const d = new Date(whenFor('day', THU, { y: 2026, m: 10, d: 3 })!)
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([10, 3, 19])
  })
  it('late tonight is soon; a Saturday evening\'s weekend is Sunday; a past day is refused', () => {
    const late = new Date(2026, 9, 22, 21, 10).getTime()
    expect(whenFor('tonight', late)! - late).toBeLessThanOrEqual(30 * 60e3)
    const satEve = new Date(2026, 9, 24, 18, 0).getTime()
    expect(new Date(whenFor('weekend', satEve)!).getDay()).toBe(0)
    expect(whenFor('day', THU, { y: 2026, m: 9, d: 1 })).toBeNull()
  })
  it('the paper says when in words', () => {
    expect(whenWords(whenFor('tonight', THU), THU)).toBe('tonight')
    expect(whenWords(whenFor('tomorrow', THU), THU)).toBe('tomorrow evening')
    expect(whenWords(whenFor('weekend', THU), THU)).toBe('this Saturday')
    expect(whenWords(null, THU)).toBe('whenever you can')
  })
  it('the calendar drawn on the paper starts on Sunday and greys the past', () => {
    const [oct] = calendar(THU, 1)
    expect(oct.name).toBe('October')
    expect(oct.weeks[0].slice(0, 4)).toEqual([null, null, null, null]) // 1 October 2026 is a Thursday
    const days = oct.weeks.flat().filter(Boolean) as { d: number; past: boolean; today: boolean }[]
    expect(days.find(x => x.d === 21)!.past).toBe(true)
    expect(days.find(x => x.d === 22)!.today).toBe(true)
    expect(days.find(x => x.d === 22)!.past).toBe(false)
  })
})

describe('scroll: sealed and sent, through the room\'s own invitation rules (no new table)', () => {
  it('a sealed scroll is a sit invitation the rules accept', () => {
    const inv = sealedInvitation(A, whenFor('tonight', THU), '  I saved you   the plum cushion. ', THU)
    expect(inv.note).toBe('I saved you the plum cushion.')
    expect(mayWrite(member(A), room(), { table: 'garden' }, 'update', { invitations: { s1: inv } }, null).ok).toBe(true)
    expect(cleanLine('x'.repeat(400)).length).toBe(LINE_MAX)
  })
  it('it arrives on their shelf sealed, and only they answer it', () => {
    const g = room({ invitations: { s1: sealedInvitation(A, 5, 'tea?', 4) } })
    const shelf = shelfScrolls([{ ...roomSummary(B, 'g1', g, []), personName: 'Alex' }])
    expect(shelf.sealed).toEqual([{ room: 'g1', name: 'Alex', style: null, started: true, id: 's1', when: 5, note: 'tea?', at: 4 }])
    expect(shelfScrolls([roomSummary(A, 'g1', g, [])]).sealed).toEqual([])
    expect(mayWrite(member(A), g, { table: 'garden' }, 'update', { invitations: { s1: { answer: 'yes' } } }, null).ok).toBe(false)
  })
})

describe('scroll: the three ribbons', () => {
  it('Yes opens the doorway; Another time and No roll it up and keep it on the shelf', () => {
    expect(RIBBONS.map(r => r[1])).toEqual(['Yes', 'Another time', 'No'])
    expect(answerOutcome('yes')).toMatchObject({ doorway: true, keepsake: false, write: 'yes' })
    expect(answerOutcome('later')).toMatchObject({ doorway: false, keepsake: true, rollUp: true, write: 'later' })
    expect(answerOutcome('no')).toMatchObject({ doorway: false, keepsake: true, rollUp: true, write: 'no' })
    expect(answerOutcome('maybe' as 'no').ok).toBe(false)
  })
  it('each answer is written as the room\'s answer; No carries no reason', () => {
    for (const [ans] of RIBBONS) {
      const g = room({ invitations: { s1: sealedInvitation(A, 5, 'tea?', 4) } })
      const data = { invitations: { s1: { answer: answerOutcome(ans as 'yes').write as string, answeredAt: 9 } } } as Doc
      expect(mayWrite(member(B), g, { table: 'garden' }, 'update', data, null).ok).toBe(true)
      expect(mayWrite(member(B), g, { table: 'garden' }, 'update', { invitations: { s1: { answer: ans, why: 'busy' } } }, null).ok).toBe(false)
      const after = merge(g, data)
      const shelf = shelfScrolls([roomSummary(B, 'g1', after, [])])
      expect(shelf.sealed).toEqual([])
      expect(shelf.keepsakes.map(k => k.answer)).toEqual(ans === 'yes' ? [] : [ans])
    }
  })
  it('a yes counts as sitting together, the doorway\'s existing mechanics', () => {
    const g = merge(room({ invitations: { s1: sealedInvitation(A, 5, '', 4) } }), { invitations: { s1: { answer: 'yes', answeredAt: 6 } } })
    expect(roomSummary(B, 'g1', g, [], { now: 10 }).lastSatTogether).toBe(5)
  })
})

describe('scroll: who it can go to, and the seal', () => {
  it('only rooms with a second person, not closed', () => {
    const rs = [{ id: 'a', phase: 'between', person: B }, { id: 'b', phase: 'spark', person: null }, { id: 'c', phase: 'closed', person: B }]
    expect(sendable(rs).map(r => r.id)).toEqual(['a'])
  })
  it('the seal carries your mark', () => {
    expect(markOf('wendell')).toBe('W')
    expect(markOf('')).toBe('✶')
  })
})
