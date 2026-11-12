import { describe, expect, it } from 'vitest'
import { MAX_RECORD_BYTES, recordErrors } from '../records'
import { sessionWrite } from '../session-write'

/** An in-memory boardSave: just enough of Prisma for sessionWrite (findFirst newest, create). */
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

const record = { kind: 'callsheet', path: 'council/callsheets/store-only-pr-checks.md',
                 body: '# Callsheet: store-only PR checks\n\nThe build\'s check brief.' }

describe('sessionWrite records (store-only)', () => {
  it('writes a valid record, born recorded, and reads it back byte for byte', async () => {
    const db = fakeDb()
    const r = await sessionWrite(db as never, [{ collection: 'records', docId: 'store-only-pr-checks', data: record }])
    expect(r).toEqual({ written: ['records/store-only-pr-checks'], same: 0, refused: [] })
    expect(db.rows[0]).toMatchObject({ collection: 'records', docId: 'store-only-pr-checks', data: record })
    expect(db.rows[0].recordedAt).toBeInstanceOf(Date)
    const back = await sessionWrite(db as never, [{ collection: 'records', docId: 'store-only-pr-checks', mode: 'update', data: {} }])
    expect(back.written).toEqual([])
  })

  it('refuses a rerun of the same record with same, not written', async () => {
    const db = fakeDb()
    await sessionWrite(db as never, [{ collection: 'records', docId: 'store-only-pr-checks', data: record }])
    const r = await sessionWrite(db as never, [{ collection: 'records', docId: 'store-only-pr-checks', data: { ...record } }])
    expect(r).toEqual({ written: [], same: 1, refused: [] })
  })

  it('refuses what the validator refuses', async () => {
    const db = fakeDb()
    const r = await sessionWrite(db as never, [
      { collection: 'records', docId: 'rec-no-kind', data: { path: record.path, body: record.body } },
      { collection: 'records', docId: 'rec-no-path', data: { kind: 'pass', body: record.body } },
      { collection: 'records', docId: 'rec-no-body', data: { kind: 'ledger', path: record.path } },
      { collection: 'records', docId: 'rec-body-object', data: { kind: 'ledger', path: record.path, body: { lines: 1 } } },
      { collection: 'records', docId: 'rec-slash/id', data: record },
    ])
    expect(r.written).toEqual([])
    expect(r.refused).toHaveLength(5)
    expect(db.rows).toHaveLength(0)
  })

  it('accepts the rows and resolved kinds the backfill posts (store-only FR-004)', async () => {
    const db = fakeDb()
    const rowsDoc = { kind: 'rows', path: 'council/callsheets/rows/store-only-1.json', body: '[{"id": "a"}]' }
    const resolvedDoc = { kind: 'resolved', path: 'board/board_data.json',
                          name: 'positions/build', body: '{"decision": "stands"}', updated: '2026-10-02' }
    const r = await sessionWrite(db as never, [
      { collection: 'records', docId: 'rows-store-only-1', data: rowsDoc },
      { collection: 'records', docId: 'resolved-positions-build', data: resolvedDoc },
    ])
    expect(r.refused).toEqual([])
    expect(r.written).toEqual(['records/rows-store-only-1', 'records/resolved-positions-build'])
    expect(db.rows.map(x => x.data)).toEqual([rowsDoc, resolvedDoc])
  })

  it('accepts a record whose path names board/, refuses one naming neither prefix', async () => {
    expect(recordErrors({ kind: 'resolved', path: 'board/board_data.json', body: 'x' })).toEqual([])
    expect(recordErrors({ kind: 'callsheet', path: 'docs/x.md', body: 'x' }))
      .toEqual(['a record names the main path it came from (council/... or board/...)'])
  })

  it('refuses a body over the 1 MB cap', async () => {
    const errors = recordErrors({ kind: 'callsheet', path: record.path, body: 'x'.repeat(MAX_RECORD_BYTES + 1) })
    expect(errors.some(e => e.includes('1 MB'))).toBe(true)
    expect(recordErrors({ kind: 'callsheet', path: record.path, body: 'x'.repeat(MAX_RECORD_BYTES) })).toEqual([])
  })
})
