import { describe, expect, it } from 'vitest'

import { pickRow, rowsOfList } from '../look-row.mjs'

const LIST = 'between-hearth-frame'
const ids = [`${LIST}-01`, `${LIST}-02`, `${LIST}-03`, 'other-look-09']
const row = (extra = {}) => ({ n: 1, list: LIST, ...extra })

describe('rowsOfList', () => {
  it('keeps only the rows of the named list, oldest first', () => {
    expect(rowsOfList(ids, LIST)).toEqual([`${LIST}-01`, `${LIST}-02`, `${LIST}-03`])
  })

  it('counts the list id itself as one of its rows', () => {
    expect(rowsOfList([LIST, `${LIST}-02`], LIST)).toEqual([LIST, `${LIST}-02`])
  })
})

describe('pickRow', () => {
  it('picks the newest row when nothing is answered', () => {
    const docs = { [`steps/${LIST}-01`]: row(), [`steps/${LIST}-02`]: row(), [`steps/${LIST}-03`]: row() }
    expect(pickRow({ ids, docs, list: LIST }).row).toBe(`${LIST}-03`)
  })

  it('steps back past an answered newest row to the newest one still open', () => {
    const docs = {
      [`steps/${LIST}-01`]: row(),
      [`steps/${LIST}-02`]: row({ done: true, note: 'Yes' }),
      [`steps/${LIST}-03`]: row({ done: true, note: 'Yes' }),
    }
    expect(pickRow({ ids, docs, list: LIST }).row).toBe(`${LIST}-01`)
  })

  it('treats a note without done as an answer, so the row keeps its picture', () => {
    const docs = { [`steps/${LIST}-01`]: row({ note: 'the mantel reads flat' }) }
    const got = pickRow({ ids, docs, list: LIST })
    expect(got.row).toBeNull()
    expect(got.why).toContain('every row in')
  })

  it('posts nothing when every row of the list is answered', () => {
    const docs = { [`steps/${LIST}-01`]: row({ done: true }), [`steps/${LIST}-02`]: row({ note: 'Yes' }) }
    const got = pickRow({ ids: [`${LIST}-01`, `${LIST}-02`], docs, list: LIST })
    expect(got.row).toBeNull()
    expect(got.why).toContain('needs a fresh one')
  })

  it('posts nothing when the list has no rows at all', () => {
    const got = pickRow({ ids: ['other-look-09'], docs: {}, list: LIST })
    expect(got.row).toBeNull()
    expect(got.why).toBe(`the board holds no step in the list ${LIST}`)
  })

  it('ignores another list that shares the prefix', () => {
    const docs = { [`steps/${LIST}-01`]: row({ done: true }), 'steps/between-hearth-frame-notes-01': row() }
    expect(pickRow({ ids: [`${LIST}-01`, 'between-hearth-frame-notes-01'], docs, list: LIST }).row).toBeNull()
  })

  it('skips a row whose document the store did not send back', () => {
    const docs = { [`steps/${LIST}-01`]: row() }
    expect(pickRow({ ids, docs, list: LIST }).row).toBe(`${LIST}-01`)
  })
})
