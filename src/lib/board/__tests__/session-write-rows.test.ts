import { describe, expect, it } from 'vitest'
import { holdOf, sessionWrite } from '../session-write'

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

const row = { kind: 'positions', pass: 'worklist-api-slice-a', lane: 'claude', faces: ['architect'], auto: true,
              pos: 'A probe position.', why: 'test' }

describe('sessionWrite rows (worklist-api)', () => {
  it('writes a valid row, born unrecorded, as a whole document', async () => {
    const db = fakeDb()
    const r = await sessionWrite(db as never, [{ collection: 'rows', docId: 'wl-probe', data: row }])
    expect(r).toEqual({ written: ['rows/wl-probe'], same: 0, refused: [] })
    expect(db.rows[0]).toMatchObject({ collection: 'rows', docId: 'wl-probe', data: row, recordedAt: null, record: null })
  })

  it('refuses a malformed row and writes nothing', async () => {
    const db = fakeDb()
    const r = await sessionWrite(db as never, [
      { collection: 'rows', docId: 'wl-bad', data: { kind: 'questions', pass: 'p', faces: ['sage'], q: 'No options?' } },
      { collection: 'rows', docId: 'wl-nopass', data: { ...row, pass: '' } },
      { collection: 'rows', docId: 'wl-upd', mode: 'update', data: row },
    ])
    expect(r.written).toEqual([])
    expect(r.refused).toHaveLength(3)
    expect(r.refused[0]).toMatch(/options/)
    expect(db.rows).toHaveLength(0)
  })

  it('skips a rerun of the same row', async () => {
    const db = fakeDb()
    await sessionWrite(db as never, [{ collection: 'rows', docId: 'wl-probe', data: row }])
    const r = await sessionWrite(db as never, [{ collection: 'rows', docId: 'wl-probe', data: { ...row } }])
    expect(r).toEqual({ written: [], same: 1, refused: [] })
  })

  it('keeps steps born recorded', async () => {
    const db = fakeDb()
    await sessionWrite(db as never, [{ collection: 'steps', docId: 's1', data: { do: 'x' } }])
    expect(db.rows[0].recordedAt).toBeInstanceOf(Date)
  })

  it('refuses a look whose pictures are not in the content store (the seal), and writes one that has them', async () => {
    const aboard = 'a'.repeat(64), lost = 'b'.repeat(64)
    const missing = async (shas: string[]) => shas.filter(s => s !== aboard)
    const look = (sha: string) => ({ kind: 'questions', pass: 'homeport-1', faces: ['regent'], q: 'Does it read?', look: true,
      options: [{ v: 'A', label: 'Yes' }], still: `https://bars-engine.vercel.app/board/stills/sha/${aboard}.jpg`,
      href: `https://bars-engine.vercel.app/board/look?t=x&i=sha%2F${sha}.png` })
    const db = fakeDb()
    const r = await sessionWrite(db as never, [
      { collection: 'rows', docId: 'hp-ok', data: look(aboard) },
      { collection: 'rows', docId: 'hp-lost', data: look(lost) },
    ], false, missing)
    expect(r.written).toEqual(['rows/hp-ok'])
    expect(r.refused).toHaveLength(1)
    expect(r.refused[0]).toMatch(/^rows\/hp-lost: refused: hold not aboard \(1 of 2/)
    expect(db.rows).toHaveLength(1)
  })

  it('names each hash a row carries once', () => {
    const h = 'c'.repeat(64)
    expect(holdOf({ still: `/board/stills/sha/${h}.jpg`, examples: [{ src: `sha/${h}.jpg` }], href: 'i=sha%2F' + 'd'.repeat(64) + '.png' }))
      .toEqual([h, 'd'.repeat(64)])
    expect(holdOf({ still: 'stills/94a1067981bd2ba3.jpg' })).toEqual([])
  })
})
