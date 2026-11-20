import { describe, expect, it } from 'vitest'
import { EMPTY_PACKET } from '../seed-packet'
import { isPlayerId, parsePacket } from '../packet-record'

describe('the packet record', () => {
  it('round-trips a packet through JSON', () => {
    const p = { ...EMPTY_PACKET, seed: 'Gather Resource' as const, family: 'joy' as never }
    expect(parsePacket(JSON.stringify(EMPTY_PACKET))).toEqual(EMPTY_PACKET)
    // a family outside the walk's five is refused, not repaired
    expect(parsePacket(JSON.stringify({ ...p, family: 'nonsense' }))).toBeNull()
  })
  it('keeps a full packet', () => {
    const full = { seed: 'own', own: 'help him move', family: 'neutrality', soil: 'Flowing', weather: ['a', 'b'], water: 'rest', stone: { belief: 'x', set: true } }
    expect(parsePacket(full)).toEqual(full)
  })
  it('refuses what the walk could not have made', () => {
    expect(parsePacket(null)).toBeNull()
    expect(parsePacket('not json')).toBeNull()
    expect(parsePacket([])).toBeNull()
    expect(parsePacket({ ...EMPTY_PACKET, seed: 'Nope' })).toBeNull()
    expect(parsePacket({ ...EMPTY_PACKET, soil: 'Mud' })).toBeNull()
    expect(parsePacket({ ...EMPTY_PACKET, weather: 'x' })).toBeNull()
    expect(parsePacket({ ...EMPTY_PACKET, own: 'a'.repeat(2001) })).toBeNull()
    expect(parsePacket({ ...EMPTY_PACKET, stone: { belief: 'x' } })).toBeNull()
  })
  it('accepts only plain player ids', () => {
    expect(isPlayerId('npc-1')).toBe(true)
    expect(isPlayerId('a b')).toBe(false)
    expect(isPlayerId('')).toBe(false)
    expect(isPlayerId(7)).toBe(false)
  })
})
