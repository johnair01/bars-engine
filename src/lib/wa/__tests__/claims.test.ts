import { beforeEach, describe, expect, it } from 'vitest'
import { PRESENCE_TTL_MS, RATE_LIMIT, allow, parseClaim, presenceCounts, recordPresence } from '../claims'

const uuid = 'abcd1234-ef56'
beforeEach(() => { (globalThis as any).__waBridge = undefined })

describe('wa claims', () => {
  it('accepts a well-formed claim and shortens the room id', () => {
    const c = parseClaim({ uuid, room: '/_/global/world.example.org/maps/Lantern-Walk.tmj', tile: { x: 3, y: 4 }, event: 'press' })
    expect(c).toEqual({ uuid, room: 'maps/lantern-walk.tmj', tile: { x: 3, y: 4 }, event: 'press' })
  })
  it('rejects bad uuid, event, tile and room', () => {
    expect(parseClaim({ uuid: 'x', room: 'a/b', event: 'enter' })).toBeNull()
    expect(parseClaim({ uuid, room: 'a/b', event: 'win' })).toBeNull()
    expect(parseClaim({ uuid, room: 'a/b', event: 'enter', tile: { x: 1.5, y: 2 } })).toBeNull()
    expect(parseClaim({ uuid, room: '../../etc', event: 'enter' })).toBeNull()
    expect(parseClaim(null)).toBeNull()
  })
  it('rate limits one uuid', () => {
    for (let i = 0; i < RATE_LIMIT.max; i++) expect(allow(uuid, 1000)).toBe(true)
    expect(allow(uuid, 1000)).toBe(false)
    expect(allow(uuid, 1000 + RATE_LIMIT.windowMs + 1)).toBe(true)
  })
  it('counts visitors per room and expires them', () => {
    recordPresence({ uuid, room: 'a/b' }, 0)
    recordPresence({ uuid: 'zzzzzzzz1', room: 'a/b' }, 0)
    expect(presenceCounts(10)).toEqual({ 'a/b': 2 })
    expect(presenceCounts(PRESENCE_TTL_MS + 1)).toEqual({})
  })
})
