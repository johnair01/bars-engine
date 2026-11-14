import { describe, expect, it } from 'vitest'
import { answeredGold, dayWord, openedMeta, parseScrollWrite, strandWords, toShelfScroll, weekWords } from '../council-scroll'

const gold = (id: string, meta: Record<string, unknown>, description = 'sample words') => ({
  id,
  title: 'A nugget',
  description,
  status: 'active',
  strandMetadata: JSON.stringify({ source: 'unchosen-gold', scrollId: 'sc1', ...meta }),
})
const scroll = (meta: Record<string, unknown>) => ({
  id: 'sc1',
  title: 'The council’s scroll',
  description: '',
  status: 'active',
  strandMetadata: JSON.stringify(meta),
})

describe('council scroll on the shelf', () => {
  it('names days and weeks in words, never dates', () => {
    expect(dayWord('2026-11-03')).toBe('Tuesday')
    expect(dayWord('nope')).toBe('')
    expect(weekWords('2026-10-26')).toBe('the week of 26 October')
    expect(weekWords(undefined)).toBe('this week')
  })

  it('names a strand by its title, else by its id in words', () => {
    expect(strandWords({ strand: 'harbour', strandTitle: 'Lantern Harbour' })).toBe('Lantern Harbour')
    expect(strandWords({ strand: 'money-block' })).toBe('Money block')
  })

  it('keeps the read’s order, drops unknown ids and caps at five', () => {
    const g = [
      gold('g2', { fate: 'offered', kind: 'ask', day: '2026-10-29', reason: 'r2', move: 'Do the thing.' }),
      gold('g1', { fate: 'carried', kind: 'idea', day: '2026-10-27', reason: 'r1', strand: 'harbour', strandTitle: 'Lantern Harbour' }),
      gold('g3', { fate: 'kept', kind: 'returning', day: '2026-10-31', reason: 'r3' }),
    ]
    const s = toShelfScroll(scroll({ weekOf: '2026-10-26', goldIds: ['g1', 'gone', 'g2', 'g3'], compostLine: 'The rest fed the bin.' }), g)
    expect(s.opened).toBe(false)
    expect(s.week).toBe('the week of 26 October')
    expect(s.gold.map(n => n.id)).toEqual(['g1', 'g2', 'g3'])
    expect(s.gold[0]).toMatchObject({ kind: 'carried', day: 'Tuesday', what: 'an idea', went: 'Taken into Lantern Harbour' })
    expect(s.gold[1]).toMatchObject({ kind: 'offered', what: 'an ask', move: 'Do the thing.', answer: null })
    expect(s.gold[2]).toMatchObject({ kind: 'kept', what: 'something that came back' })
    expect(JSON.stringify(s)).not.toContain('"strand"')
    const many = Array.from({ length: 7 }, (_, i) => gold('x' + i, { fate: 'kept', kind: 'idea', day: '2026-10-27' }))
    expect(toShelfScroll(scroll({ goldIds: many.map(m => m.id) }), many).gold).toHaveLength(5)
  })

  it('opens once and writes nothing else', () => {
    const now = new Date('2026-11-03T22:00:00Z')
    expect(openedMeta({ weekOf: 'w' }, now)).toEqual({ weekOf: 'w', openedAt: '2026-11-03T22:00:00.000Z' })
    expect(openedMeta({ openedAt: 'earlier' }, now)).toBeNull()
  })

  it('takes a ribbon only on an unanswered offered nugget; No composts with no reason', () => {
    const now = new Date('2026-11-03T22:00:00Z')
    expect(answeredGold({ fate: 'carried' }, 'yes', now)).toHaveProperty('error')
    expect(answeredGold({ fate: 'offered', answer: 'later' }, 'yes', now)).toHaveProperty('error')
    expect(answeredGold({ fate: 'offered', answer: null }, 'later', now)).toEqual({
      meta: { fate: 'offered', answer: 'later', answeredAt: '2026-11-03T22:00:00.000Z' },
    })
    expect(answeredGold({ fate: 'offered' }, 'no', now)).toMatchObject({ status: 'composted' })
  })

  it('reads only the two writes the shelf may make', () => {
    expect(parseScrollWrite({ scrollId: 's', open: true })).toEqual({ scrollId: 's', open: true })
    expect(parseScrollWrite({ goldId: 'g', answer: 'no' })).toEqual({ goldId: 'g', answer: 'no' })
    expect(parseScrollWrite({ goldId: 'g', answer: 'maybe' })).toBeNull()
    expect(parseScrollWrite({ scrollId: 's', open: false })).toBeNull()
    expect(parseScrollWrite(null)).toBeNull()
  })
})
