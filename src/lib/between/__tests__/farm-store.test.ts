import { describe, it, expect } from 'vitest'
import { asFarm, loadFarm, saveFarm, updateFarm } from '../farm-store'
import { newFarm, till } from '../farm'

/** A db with one BetweenPrivate table in memory, keyed the way the real one is. */
function fakeDb() {
  const rows = new Map<string, { data: unknown }>()
  const key = (w: { gardenId_playerId_key: { gardenId: string; playerId: string; key: string } }) => JSON.stringify(w.gardenId_playerId_key)
  const db = {
    betweenPrivate: {
      findUnique: async ({ where }: any) => rows.get(key(where)) ?? null,
      upsert: async ({ where, create, update }: any) => { rows.set(key(where), { data: rows.has(key(where)) ? update.data : create.data }) },
    },
  } as any
  return { db, rows }
}

describe('the server-side farm store', () => {
  it('reads a missing or malformed row as a new farm', async () => {
    const { db } = fakeDb()
    expect(await loadFarm(db, 'g1', 'p1')).toEqual(newFarm())
    expect(asFarm('nope')).toEqual(newFarm())
    expect(asFarm([1])).toEqual(newFarm())
  })
  it('keeps one farm per player and gives back what was saved', async () => {
    const { db } = fakeDb()
    const t = till(newFarm(), 3, 'now')
    if (!t.ok) throw new Error(t.why)
    await saveFarm(db, 'g1', 'p1', t.farm)
    expect((await loadFarm(db, 'g1', 'p1')).slots['3'].state).toBe('tilled')
    expect(Object.keys((await loadFarm(db, 'g1', 'p2')).slots)).toHaveLength(0)
  })
  it('updateFarm writes the change, and writes nothing when the change is refused', async () => {
    const { db, rows } = fakeDb()
    const next = await updateFarm(db, 'g1', 'p1', (f) => { const r = till(f, 0, 'now'); return r.ok ? r.farm : null })
    expect(next?.slots['0'].state).toBe('tilled')
    const before = JSON.stringify([...rows])
    expect(await updateFarm(db, 'g1', 'p1', (f) => { const r = till(f, 0, 'now'); return r.ok ? r.farm : null })).toBeNull()
    expect(JSON.stringify([...rows])).toBe(before)
  })
})
