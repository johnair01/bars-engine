import { describe, expect, it } from 'vitest'
import { describeIdentifier, resolveWaPlayer } from '../lookup'

const row = { id: 'p1' }
const none = async () => null

describe('resolveWaPlayer', () => {
  it('finds by id first', async () => {
    const r = await resolveWaPlayer('p1', { byId: async () => row, byEmail: none })
    expect(r).toEqual({ player: row, via: 'id' })
  })
  it('falls back to email', async () => {
    const r = await resolveWaPlayer('a@b.co', { byId: none, byEmail: async () => row })
    expect(r).toEqual({ player: row, via: 'email' })
  })
  it('reports a miss', async () => {
    const r = await resolveWaPlayer('x', { byId: none, byEmail: none })
    expect(r).toEqual({ player: null, via: 'none' })
  })
})

describe('describeIdentifier', () => {
  it('masks an email', () => {
    expect(describeIdentifier('wendell@example.com')).toBe('email(w***@example.com) len=19')
  })
  it('shortens an id', () => {
    expect(describeIdentifier('cm1234567890abcdef')).toBe('id(cm12…cdef) len=18')
  })
})
