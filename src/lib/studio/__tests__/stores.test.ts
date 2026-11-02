import { describe, expect, it } from 'vitest'
import { FLOOR_CAP, dayOf, demoStores, placementId, purseOf, storesWorldOf, type StoresPull } from '../stores'
import { stagesOf } from '../fleet'
import { needsWorkStage } from '../shaman'

const now = new Date('2026-10-31T02:00:00Z') // 2026-10-30 in Portland
const board = {
  questions: [{ id: 'q-done', q: 'Which gourd?' }],
  positions: [{ id: 'p-stands', pos: 'Crop the chamber on a phone.' }],
}
const pull = (at: string, stem: string, rest: Partial<StoresPull>): StoresPull =>
  ({ at, stem, answers: {}, steps: [], needs_work: [], ...rest })
const pulls: StoresPull[] = [
  pull('2026-10-29T18:00:00Z', '2026-10-29-pull-180000', {
    answers: { 'q-done': { kind: 'question', choice: 'A' }, 'p-stands': { kind: 'position', status: 'stands' },
               'q-open': { kind: 'question', choice: 'B' } },
    steps: [{ id: 's-tick', what: 'ticked', do: 'Look at the shelf' }, { id: 's-dep', what: 'deprecated', do: 'A second gourd' },
            { id: 's-note', what: 'note', do: 'ignored' }],
    needs_work: ['questions/q-open: B. Build it', 'steps/s-done: note "x"'],
  }),
  pull('2026-10-30T20:00:00Z', '2026-10-30-pull-200000', { needs_work: ['questions/q-today: today is not closed yet'] }),
]

describe("the Stores' world", () => {
  it('closes the newest Pacific day before today, one of each kind in turn', () => {
    expect(dayOf(now.toISOString())).toBe('2026-10-30')
    const w = storesWorldOf({ pulls, board, doneKeys: ['2026-10-29-pull-180000#steps/s-done'], placed: {}, now })
    expect(w.run).toBe('run-2026-10-29')
    expect(w.things.map(t => t.kind)).toEqual(['jar', 'husk', 'seed', 'thread', 'jar'])
    expect(w.things.map(t => t.words)).toEqual(['Which gourd?', 'A second gourd', 'Crop the chamber on a phone.', 'B. Build it', 'Look at the shelf'])
    expect(w.beads).toBe(purseOf(5))
  })
  it('starts a placed thing in its place and charges the bowl for it', () => {
    const first = storesWorldOf({ pulls, board, doneKeys: [], placed: {}, now })
    const jar = first.things[0], husk = first.things[1]
    const placed = {
      [placementId(first.run, jar.id)]: { to: 'shelf' },
      [placementId(first.run, husk.id)]: { to: 'compost' },
    }
    const w = storesWorldOf({ pulls, board, doneKeys: [], placed, now })
    expect(w.things[0].st).toBe('shelf')
    expect(w.things[1].st).toBe('compost')
    expect(w.beads).toBe(first.beads - 1 + 1)
  })
  it('has nothing to close when only today left things', () => {
    const w = storesWorldOf({ pulls: [pulls[1]], board, doneKeys: [], placed: {}, now })
    expect(w.things).toEqual([])
    expect(w.run).toBe('')
  })
  it('keeps a placement id a docId: no slash, at most 200 characters', () => {
    const id = placementId('run-2026-10-29', '2026-10-29-pull-180000#questions/q-open' + 'x'.repeat(300))
    expect(id).not.toMatch(/[\\/]/)
    expect(id.length).toBeLessThanOrEqual(200)
  })
  it('the demo is the round mock, eight things, and saves nothing', () => {
    const d = demoStores(now)
    expect(d.things).toHaveLength(FLOOR_CAP)
    expect(d.demo).toBe(true)
  })
  it('a placement lands the close room, and its work waits there', () => {
    expect(stagesOf({ at: now.toISOString(), answers: {}, steps: [{ id: 'x', what: 'stores' }] })).toEqual(['close'])
    expect(needsWorkStage('stores/run-2026-10-29~x', 'sent up the bell line')).toBe('close')
  })
})
