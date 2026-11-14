import { describe, expect, it } from 'vitest'

import { pickRow, rowsOfList } from '../look-row.mjs'

const LIST = 'between-hearth-frame'
// The ids the board really holds: a row of this list is `<list>-look-<n>`.
const ids = [`${LIST}-look-01`, `${LIST}-look-02`, `${LIST}-look-03`, `${LIST}-notes-01`, 'between-dais-freeze-look-01']
const row = (extra = {}) => ({ n: 1, list: LIST, ...extra })

describe('rowsOfList', () => {
  it('offers the ids that start with the list, oldest first', () => {
    expect(rowsOfList(ids, LIST)).toEqual([`${LIST}-look-01`, `${LIST}-look-02`, `${LIST}-look-03`, `${LIST}-notes-01`])
  })

  it('counts the list id itself as one of its rows', () => {
    expect(rowsOfList([LIST, `${LIST}-look-02`], LIST)).toEqual([LIST, `${LIST}-look-02`])
  })

  it('leaves out another list entirely', () => {
    expect(rowsOfList(ids, 'between-dais-freeze-look')).toEqual(['between-dais-freeze-look-01'])
  })
})

describe('pickRow', () => {
  it('picks the newest row when nothing is answered', () => {
    const docs = { [`steps/${LIST}-look-01`]: row(), [`steps/${LIST}-look-02`]: row() }
    expect(pickRow({ ids: [`${LIST}-look-01`, `${LIST}-look-02`], docs, list: LIST }).row).toBe(`${LIST}-look-02`)
  })

  it('steps back past an answered newest row to the newest one still open', () => {
    const docs = {
      [`steps/${LIST}-look-01`]: row(),
      [`steps/${LIST}-look-02`]: row({ done: true, note: 'Yes' }),
      [`steps/${LIST}-look-03`]: row({ done: true, note: 'Yes' }),
    }
    expect(pickRow({ ids, docs, list: LIST }).row).toBe(`${LIST}-look-01`)
  })

  it('treats a note without done as an answer, so the row keeps its picture', () => {
    const docs = { [`steps/${LIST}-look-01`]: row({ note: 'the mantel reads flat' }) }
    const got = pickRow({ ids: [`${LIST}-look-01`], docs, list: LIST })
    expect(got.row).toBeNull()
    expect(got.why).toContain('every row in')
  })

  it('posts nothing when every row of the list is answered', () => {
    const docs = { [`steps/${LIST}-look-01`]: row({ done: true }), [`steps/${LIST}-look-02`]: row({ note: 'Yes' }) }
    const got = pickRow({ ids: [`${LIST}-look-01`, `${LIST}-look-02`], docs, list: LIST })
    expect(got.row).toBeNull()
    expect(got.why).toContain('needs a fresh one')
  })

  it('posts nothing when the list has no rows at all', () => {
    const got = pickRow({ ids: ['between-dais-freeze-look-01'], docs: {}, list: LIST })
    expect(got.row).toBeNull()
    expect(got.why).toBe(`the board holds no step in the list ${LIST}`)
  })

  it('ignores a neighbour whose id starts with the list but whose row names another list', () => {
    const docs = { [`steps/${LIST}-notes-01`]: { n: 1, list: `${LIST}-notes` } }
    expect(pickRow({ ids: [`${LIST}-notes-01`], docs, list: LIST }).row).toBeNull()
  })

  it('skips a row whose document the store did not send back', () => {
    const docs = { [`steps/${LIST}-look-01`]: row() }
    expect(pickRow({ ids, docs, list: LIST }).row).toBe(`${LIST}-look-01`)
  })
})
