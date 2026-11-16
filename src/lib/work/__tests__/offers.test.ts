import { describe, expect, it } from 'vitest'
import { movable, pickTarget } from '../offers'

const row = (lane: string, status: 'live' | 'quiet' | 'dry', claims24h = 0) => ({ lane, status, claims24h })

describe('suggested lane moves', () => {
  it('offers Freebuff when it is live, as the row words it', () => {
    expect(pickTarget('claude', [row('claude', 'quiet'), row('freebuff', 'live', 1)])).toBe('freebuff')
  })
  it('does not offer a quiet or dry Freebuff; it offers the live lane instead', () => {
    expect(pickTarget('freebuff', [row('claude', 'live', 3), row('freebuff', 'quiet')])).toBe('claude')
    expect(pickTarget('claude', [row('claude', 'quiet'), row('freebuff', 'dry')])).toBeNull()
  })
  it('never offers Zo or DeepAI, and never the quiet lane itself', () => {
    expect(pickTarget('claude', [row('claude', 'quiet'), row('zo', 'live', 9), row('deepai', 'live', 9)])).toBeNull()
  })
  it('moves only ready cards nobody placed by hand', () => {
    expect(movable({ state: 'ready', basis: {} })).toBe(true)
    expect(movable({ state: 'held', basis: {} })).toBe(false)
    expect(movable({ state: 'claimed', basis: {} })).toBe(false)
    expect(movable({ state: 'ready', basis: { steered: { to: 'claude', by: 'owner' } } })).toBe(false)
  })
})
