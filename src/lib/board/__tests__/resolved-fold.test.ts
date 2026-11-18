import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { foldRecords, foldResolved } from '../data'

describe('foldResolved', () => {
  it('files a legacy singular answer under the list its store key names', () => {
    const folded = foldResolved({
      'positions--p-legacy': { id: 'p-legacy', kind: 'position', savedAt: '2026-11-01T00:00:00.000Z', status: 'stands' },
      'questions--q-new': { id: 'q-new', kind: 'questions', savedAt: '2026-11-02T00:00:00.000Z', decision: 'A' },
    })
    expect(Object.keys(folded).sort()).toEqual(['positions', 'questions'])
    expect(folded.positions['p-legacy']).toMatchObject({ status: 'stands' })
    expect(folded.positions['p-legacy'].savedAt).toBeUndefined()
    expect(folded).not.toHaveProperty('position')
  })
})

describe('foldRecords', () => {
  it('files a legacy resolved record under the list its name names', () => {
    const body = (status: string) => JSON.stringify({ status })
    const folded = foldRecords({
      'rec-legacy': { kind: 'resolved', name: 'position/p-legacy', body: body('stands') },
      'rec-new': { kind: 'resolved', name: 'positions/p-new', body: body('falls') },
    })
    expect(Object.keys(folded)).toEqual(['positions'])
    expect(folded.positions['p-legacy']).toMatchObject({ status: 'stands' })
    expect(folded.positions['p-new']).toMatchObject({ status: 'falls' })
    expect(folded).not.toHaveProperty('position')
  })
})
