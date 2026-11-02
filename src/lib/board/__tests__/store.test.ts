import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), boardSave: { findMany: vi.fn() } }))
vi.mock('@/lib/db', () => ({ db }))

import { batchIds, latestDocs, readableHeads } from '../store'

describe('batchIds', () => {
  it('keeps each batch under the byte cap and the row cap', () => {
    const heads = [{ id: 'a', bytes: 900 }, { id: 'b', bytes: 900 }, { id: 'c', bytes: 900 }, { id: 'd', bytes: 10 }]
    expect(batchIds(heads, 2000, 10)).toEqual([['a', 'b'], ['c', 'd']])
    expect(batchIds(heads, 1e9, 3)).toEqual([['a', 'b', 'c'], ['d']])
  })
  it('sends a document bigger than the cap alone, and nothing for nothing', () => {
    expect(batchIds([{ id: 'a', bytes: 10 }, { id: 'big', bytes: 5000 }, { id: 'c', bytes: 10 }], 2000))
      .toEqual([['a'], ['big'], ['c']])
    expect(batchIds([])).toEqual([])
  })
})

describe('readableHeads', () => {
  const heads = [
    { id: '1', collection: 'rows', recorded: true }, { id: '2', collection: 'rows', recorded: false },
    { id: '3', collection: 'questions', recorded: true },
  ]
  it('leaves out only recorded rows, and only when asked', () => {
    expect(readableHeads(heads, true).map(h => h.id)).toEqual(['2', '3'])
    expect(readableHeads(heads, false)).toHaveLength(3)
  })
})

describe('latestDocs', () => {
  it('reads ids and sizes first, then the documents in batches (a board past 5 MB still loads, 2026-10-31)', async () => {
    const mb = 1_000_000
    db.$queryRaw.mockResolvedValueOnce([{ id: 's1', bytes: 1.5 * mb }, { id: 's2', bytes: 1.5 * mb }, { id: 's3', bytes: 1.5 * mb }, { id: 's4', bytes: 1.5 * mb }])
    db.boardSave.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) =>
      where.id.in.map(id => ({ collection: id === 's4' ? 'steps' : 'picks', docId: 'd-' + id, data: { id } })))
    const docs = await latestDocs('council')
    expect(db.boardSave.findMany).toHaveBeenCalledTimes(4)
    expect(docs).toEqual({ picks: { 'd-s1': { id: 's1' }, 'd-s2': { id: 's2' }, 'd-s3': { id: 's3' } }, steps: { 'd-s4': { id: 's4' } } })
  })
})
