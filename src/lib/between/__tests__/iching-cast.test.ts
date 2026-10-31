import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// BAR intake, build 1 (Six-faces-council pass bar-intake-1): the page's port of council/iching/cast.py.
import { castFromTosses, lineOf } from '../../../../public/between/iching/cast.js'

const root = join(__dirname, '../../../..')
const table = JSON.parse(readFileSync(join(root, 'public/between/iching/hexagrams.json'), 'utf8'))
// `python3 council/iching/cast.py --json --seed <s> bar-intake` for seeds 1, 7, 39, 2026 and 31: Python's random cannot be
// replayed here, so the fixture keeps its tosses and the port must build the same cast from them.
const casts = JSON.parse(readFileSync(join(__dirname, 'fixtures/iching-casts.json'), 'utf8'))

describe('three-coin cast (port of council/iching/cast.py)', () => {
  it('builds the same cast as cast.py, field for field, from the same tosses', () => {
    expect(casts.length).toBe(5)
    for (const want of casts) expect(castFromTosses(want.tosses, table, want.agent)).toEqual(want)
  })

  it('covers casts with and without changing lines', () => {
    expect(casts.some((c: { changing_lines: number[] }) => c.changing_lines.length === 0)).toBe(true)
    expect(casts.some((c: { changing_lines: number[] }) => c.changing_lines.length > 1)).toBe(true)
  })

  it('reads the first workorder\'s cast: Impasse, no changing lines', () => {
    const c = castFromTosses([[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 2]], table)
    expect(c.n).toBe(39)
    expect(c.shows).toBe('The direct route is closed and you have asked nobody.')
    expect('becomes' in c).toBe(false)
  })

  it('marks old lines as changing and young lines as still', () => {
    expect(lineOf([2, 2, 2])).toMatchObject({ value: 6, yang: false, changing: true })
    expect(lineOf([3, 3, 3])).toMatchObject({ value: 9, yang: true, changing: true })
    expect(lineOf([2, 2, 3])).toMatchObject({ value: 7, yang: true, changing: false })
  })

  it('refuses anything that is not six tosses of three coins', () => {
    expect(() => castFromTosses([[2, 2, 2]], table)).toThrow()
    expect(() => castFromTosses(Array(6).fill([2, 2, 4]), table)).toThrow()
  })
})
