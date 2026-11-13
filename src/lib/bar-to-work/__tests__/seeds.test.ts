import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/between/store', () => ({ ensureHome: vi.fn() }))
vi.mock('@/lib/work/queue', () => ({ pushTicket: vi.fn() }))

import { characterExists, farmExists, why } from '../seeds'

describe('send-to-farm checks', () => {
  it('a farm exists once firstEntryAt is stamped', () => {
    expect(farmExists({ firstEntryAt: '2026-11-09T00:00:00Z' })).toBe(true)
    expect(farmExists({})).toBe(false)
    expect(farmExists(null)).toBe(false)
  })
  it('a character is an avatar, or a nation and an archetype', () => {
    expect(characterExists({ avatarConfig: '{}', nationId: null, archetypeId: null })).toBe(true)
    expect(characterExists({ avatarConfig: null, nationId: 'n', archetypeId: 'a' })).toBe(true)
    expect(characterExists({ avatarConfig: null, nationId: 'n', archetypeId: null })).toBe(false)
  })
  it('why names what is missing, and is silent when both exist', () => {
    expect(why({ hasFarm: true, hasCharacter: true })).toBeNull()
    expect(why({ hasFarm: true, hasCharacter: false })).toMatch(/character/)
    expect(why({ hasFarm: false, hasCharacter: true })).toMatch(/farm/)
  })
})
