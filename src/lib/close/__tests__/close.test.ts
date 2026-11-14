import { describe, expect, it } from 'vitest'
import { hullsOf, safeTonight, unsafeReasons } from '../safe'
import { renderBoard, renderChat, renderMove } from '../render'
import { MOVES, newClose, type Item } from '../types'

const ok = { reversible: true, oneLane: true, endsInPrOrRow: true, merges: false, spend: false, outreach: false, touchesFaces: false, nextOwner: true }
const NOW = new Date('2026-11-14T03:00:00Z')

function fixture(red: boolean) {
  const items: Item[] = [
    { ...ok, id: 'a', title: 'Spec the closing ritual', stage: 'done', proof: 'https://github.com/x/y/pull/1', check: 'green' },
    { ...ok, id: 'b', title: 'Ring build', stage: 'doing', proof: 'https://github.com/x/y/pull/2', check: red ? 'red' : 'green' },
    { ...ok, id: 'c', title: 'Draw the harbour', stage: 'next', proof: 'records/brief-c' },
    { ...ok, id: 'd', title: 'Send the letter', stage: 'next', proof: 'records/brief-d', outreach: true },
    { ...ok, id: 'e', title: 'No seal yet', stage: 'done' },
  ]
  const r = newClose('2026-11-14', items, '2026-11-14T02:50:00Z')
  r.sentence = 'Tired but lit.'
  r.after = { peace: { n: 4, about: 'a' }, triumph: { n: 3, about: 'a' }, wonder: { n: 5, about: 'b' } }
  r.unpacking = ['quiet', 'one clean ship', 'a surprise']
  r.picks = [{ ...ok, face: 'Shaman', text: 'Walk the harbour', minutes: 30 }]
  return r
}

describe('closing ritual', () => {
  it('leaves unsealed work out', () => {
    const h = hullsOf(fixture(false))
    expect(h.unsealed).toBe(1)
    expect([...h.wins, ...h.momentum, ...h.ready, ...h.tonight].some(i => i.id === 'e')).toBe(false)
  })

  it('refuses "safe to run tonight" when a check is red', () => {
    const red = fixture(true)
    const h = hullsOf(red)
    expect(h.tonight).toEqual([])
    expect(h.refused).toMatch(/red/)
    expect(safeTonight(red, ok)).toBe(false)
    expect(safeTonight(fixture(false), ok)).toBe(true)
    expect(renderMove(red, 'glass', NOW).text).toContain('Safe to run tonight is closed')
  })

  it('names each reason work is not safe', () => {
    expect(unsafeReasons({ ...ok, outreach: true, merges: true, nextOwner: false })).toHaveLength(3)
  })

  it('prints the same fields through the board and the chat', () => {
    for (const red of [false, true]) {
      const r = fixture(red)
      for (const m of MOVES) {
        const board = renderBoard(r, m, NOW)
        const chat = renderChat(r, m, NOW)
        expect(chat).toContain(board.lines.join('\n'))
        for (const i of board.inputs) expect(chat).toContain(i.chat)
      }
    }
  })

  it('never fills a rating for him', () => {
    const r = newClose('2026-11-14')
    expect(r.after).toEqual({})
    expect(renderMove(r, 'glass', NOW).text).toContain('Peace: not rated')
  })
})
