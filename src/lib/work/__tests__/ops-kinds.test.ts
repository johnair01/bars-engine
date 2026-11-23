import { describe, expect, it } from 'vitest'
import { groupByOpsKind, isOpsKind, OPS_KINDS, opsKindOf } from '../ops-kinds'

describe('personal ops kinds', () => {
  it('holds the five he ruled', () => {
    expect(OPS_KINDS).toHaveLength(5)
    expect(isOpsKind('money')).toBe(true)
    expect(isOpsKind('game')).toBe(false)
  })
  it('names a kind from the words, money first', () => {
    expect(opsKindOf({ text: 'Send the invoice to a friend' })).toBe('money')
    expect(opsKindOf({ text: 'Book the dentist' })).toBe('body-health')
    expect(opsKindOf({ text: 'Email Madi about the link' })).toBe('outreach')
    expect(opsKindOf({ text: 'Draw the harbour' })).toBeNull()
  })
  it('lets an explicit kind win', () => {
    expect(opsKindOf({ kind: 'admin-home', text: 'pay rent' })).toBe('admin-home')
  })
  it('groups in his order, untagged last, empty groups dropped', () => {
    const g = groupByOpsKind([{ text: 'x' }, { text: 'pay the tax' }, { text: 'walk' }])
    expect(g.map(x => x.kind)).toEqual(['money', 'body-health', null])
  })
})
