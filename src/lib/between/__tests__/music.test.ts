import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { moodOf, MOODS, CHORDS, BELLS, MUSIC_VERSIONS, BED_URL } from '../../../../public/between/music.js'

// The hollow's music (bt-music-ours, bt-music-bus; his answer on bt-music-form, "Both, and you pick by ear"): two versions,
// the code pad and one CC0 bed, chosen with ?music=, following the room, on their own gain and remembered switch.
const pub = path.resolve(__dirname, '../../../../public')
describe('the hollow music', () => {
  it('follows the room', () => {
    expect(moodOf({ sitting: false, together: false, close: false })).toBe('away')
    expect(moodOf({ sitting: true, together: false, close: false })).toBe('alone')
    expect(moodOf({ sitting: true, together: true, close: false })).toBe('together')
    expect(moodOf({ sitting: true, together: true, close: true })).toBe('close')
  })
  it('swells together and thins while close, with no bells over the words', () => {
    expect(MOODS.together.pad).toBeGreaterThan(MOODS.alone.pad)
    expect(MOODS.alone.pad).toBeGreaterThan(MOODS.away.pad)
    expect(MOODS.close.pad).toBeLessThan(MOODS.away.pad)
    expect(MOODS.close.bell).toBe(0)
  })
  it('stays in C, so the code and the bed can sound together', () => {
    const c = new Set([0, 2, 4, 5, 7, 9, 11])
    for (const n of [...CHORDS.flat(), ...BELLS]) expect(c.has(n % 12)).toBe(true)
  })
  it('ships the bed with its licence record', () => {
    expect(MUSIC_VERSIONS).toEqual(['code', 'bed', 'both'])
    expect(existsSync(path.join(pub, BED_URL))).toBe(true)
    expect(readFileSync(path.join(pub, 'between/music/CREDITS.md'), 'utf8')).toContain('CC0')
  })
  it('has no music unless asked for, and its own remembered switch', () => {
    const amb = readFileSync(path.join(pub, 'between/ambient.js'), 'utf8')
    expect(amb).toContain('if (!MUSIC_VERSIONS.includes(version)) version = null;')
    expect(amb).toContain('localStorage.setItem("between.music"')
  })
})
