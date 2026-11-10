import { describe, expect, it } from 'vitest'
import { sessionWrite } from '../session-write'

function fakeDb() {
  const rows: Record<string, unknown>[] = []
  return {
    rows,
    boardSave: {
      findFirst: async ({ where }: { where: Record<string, string> }) =>
        [...rows].reverse().find(r => r.board === where.board && r.collection === where.collection && r.docId === where.docId) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => { rows.push(data); return data },
    },
  }
}

describe('sessionWrite wording of questions and positions', () => {
  it('writes the wording beside his saved answer and keeps the answer', async () => {
    const db = fakeDb()
    db.rows.push({ board: 'council', collection: 'questions', docId: 'q1', data: { choice: 'A', savedAt: '2026-11-10T01:00:00Z' } })
    const r = await sessionWrite(db as never, [{ collection: 'questions', docId: 'q1', mode: 'update', data: { q: 'Which?', options: [] } }])
    expect(r.written).toEqual(['questions/q1'])
    expect(db.rows[1].data).toMatchObject({ choice: 'A', savedAt: '2026-11-10T01:00:00Z', q: 'Which?' })
  })

  it('writes the wording of an open position with no answer, so it carries no savedAt', async () => {
    const db = fakeDb()
    const r = await sessionWrite(db as never, [{ collection: 'positions', docId: 'p1', mode: 'update', data: { pos: 'Stands.' } }])
    expect(r.written).toEqual(['positions/p1'])
    expect(db.rows[0].data).toEqual({ pos: 'Stands.' })
  })

  it('refuses any field of his answer and any mode but update', async () => {
    const db = fakeDb()
    const r = await sessionWrite(db as never, [
      { collection: 'questions', docId: 'q1', mode: 'update', data: { q: 'x', choice: 'A' } },
      { collection: 'positions', docId: 'p1', mode: 'set', data: { pos: 'x' } },
      { collection: 'questions', docId: 'q2', data: { q: 'x', savedAt: '2026-11-10T01:00:00Z' } },
    ])
    expect(r.written).toEqual([])
    expect(r.refused).toHaveLength(3)
  })
})
