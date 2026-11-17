import { describe, expect, it } from 'vitest'
import { parseTzOffset, ttvDayKey, ttvNextDay, ttvSessionDate } from '../day'

const PDT = 420 // UTC-7, as Date#getTimezoneOffset() says it

describe('the sitting day turns at 4 AM local', () => {
  it('keeps 11:59 PM and 3:59 AM on the same day', () => {
    // 2026-11-16 23:59 PDT = 2026-11-17 06:59 UTC; 2026-11-17 03:59 PDT = 10:59 UTC
    expect(ttvDayKey(new Date('2026-11-17T06:59:00Z'), PDT)).toBe('2026-11-16')
    expect(ttvDayKey(new Date('2026-11-17T10:59:00Z'), PDT)).toBe('2026-11-16')
  })
  it('turns at 4:00 AM local', () => {
    expect(ttvDayKey(new Date('2026-11-17T11:00:00Z'), PDT)).toBe('2026-11-17')
  })
  it('handles zones east of UTC', () => {
    // 2026-11-17 03:30 in UTC+9 is still the 16th
    expect(ttvDayKey(new Date('2026-11-16T18:30:00Z'), -540)).toBe('2026-11-16')
    expect(ttvDayKey(new Date('2026-11-16T19:00:00Z'), -540)).toBe('2026-11-17')
  })
  it('stores the day as UTC midnight', () => {
    expect(ttvSessionDate(new Date('2026-11-17T12:00:00Z'), PDT).toISOString()).toBe('2026-11-17T00:00:00.000Z')
    expect(ttvNextDay(ttvSessionDate(new Date('2026-11-17T12:00:00Z'), PDT)).toISOString()).toBe('2026-11-18T00:00:00.000Z')
  })
  it('reads an offset, and falls back to UTC for nonsense', () => {
    expect(parseTzOffset('420')).toBe(420)
    expect(parseTzOffset(-540)).toBe(-540)
    expect(parseTzOffset('soon')).toBe(0)
    expect(parseTzOffset('99999')).toBe(0)
    expect(parseTzOffset(null)).toBe(0)
  })
})
