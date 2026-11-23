import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { foldVoice, parse, serialize, VoiceExportError, type VoiceEvent, type VoiceFiles } from '../export'

const DIR = path.join(process.cwd(), 'content', 'voice')
const read = (f: string) => fs.readFileSync(path.join(DIR, f), 'utf8')
const seeded = (): VoiceFiles =>
  parse({ lexicon: read('lexicon.yaml'), bank: read('bank.jsonl'), chart: read('chart.yaml'), screens: read('screens.yaml') })

let seq = 0
const ev = (docId: string, data: VoiceEvent['data']): VoiceEvent => ({ docId, seq: ++seq, data: { at: '2026-11-17T19:02:11Z', ...data } })
const W = { marked_by: 'wendell' }
const SLIP = ev('slip--s1', { kind: 'slip', id: 's1', line: 'Pull the one that fits', screen: 'tap-the-vein/ribbons', file: 'src/lib/tap-the-vein/paths.ts', stops: [], redrafts: [] })

describe('seeded content/voice files', () => {
  it('round-trip byte for byte', () => {
    const f = seeded()
    const s = serialize(f)
    expect(s.lexicon).toBe(read('lexicon.yaml'))
    expect(s.chart).toBe(read('chart.yaml'))
    expect(s.screens).toBe(read('screens.yaml'))
    expect(s.bank).toBe(read('bank.jsonl'))
  })
  it('holds the seed the spec names', () => {
    const f = seeded()
    const byWord = new Map(f.lexicon.words.map((w) => [w.word, w]))
    for (const w of ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage', 'wake up', 'open up', 'clean up', 'grow up', 'show up', 'bar', 'charge']) {
      expect(byWord.get(w)?.plain, w).not.toBe('')
      expect(byWord.get(w)?.drafted_by).toBe('seed:glossary')
    }
    for (const w of ['ribbon', 'face', 'sitting', 'pull']) expect(byWord.get(w)?.plain, w).toBe('')
    expect(f.lexicon.words.every((w) => w.status === 'proposed' && w.marked_by === null)).toBe(true)
    expect(f.bank).toEqual([])
    expect(Object.keys(f.chart.faders)).toEqual(['length', 'figure', 'warmth', 'address'])
    expect(f.chart.set_by).toBeNull()
  })
})

describe('foldVoice', () => {
  it('writes one desk bank line for a keep, with the ring from the slip', () => {
    const out = foldVoice(seeded(), [
      SLIP,
      ev('ring--r1', { kind: 'ring', slip: 's1', word: 'pull', on: 'old', ...W }),
      ev('keep--s1', { kind: 'keep', slip: 's1', redraft: null, text: 'Choose the one you will do today', ...W }),
    ])
    expect(out.bank).toHaveLength(1)
    expect(out.bank[0]).toMatchObject({ id: 'vb-2026-11-17-001', old: 'Pull the one that fits', new: 'Choose the one you will do today', source: 'desk', ring: ['pull'], marked_by: 'wendell', slip: 's1', screen: 'tap-the-vein/ribbons' })
  })
  it('writes one pencil bank line and none for an unchanged line', () => {
    const out = foldVoice(seeded(), [
      ev('pencil--p1', { kind: 'pencil', old: 'a', new: 'b', screen: 'x', file: 'f.ts', look_row: 'row-1', ...W }),
      ev('pencil--p2', { kind: 'pencil', old: 'same', new: 'same', screen: 'x', file: 'f.ts', look_row: 'row-1', ...W }),
    ])
    expect(out.bank).toHaveLength(1)
    expect(out.bank[0]).toMatchObject({ source: 'pencil', look_row: 'row-1', slip: null })
  })
  it('stones a word with his plain meaning', () => {
    const out = foldVoice(seeded(), [ev('stone--ribbon', { kind: 'stone', word: 'ribbon', pick: 'plain', plain: 'A strip of cloth you tie around a gift.', ...W })])
    const r = out.lexicon.words.find((w) => w.word === 'ribbon')!
    expect(r).toMatchObject({ status: 'stoned', marked_by: 'wendell', plain: 'A strip of cloth you tie around a gift.', at: '2026-11-17' })
  })
  it('bans a word on "off"', () => {
    const out = foldVoice(seeded(), [ev('stone--face', { kind: 'stone', word: 'face', pick: 'off', ...W })])
    expect(out.lexicon.words.find((w) => w.word === 'face')).toMatchObject({ status: 'banned', marked_by: 'wendell' })
  })
  it('adds a same-as word to the target entry\'s struck_for', () => {
    const out = foldVoice(seeded(), [ev('stone--cord', { kind: 'stone', word: 'cord', pick: 'same-as', target: 'ribbon', ...W })])
    expect(out.lexicon.words.find((w) => w.word === 'ribbon')!.struck_for).toEqual(['cord'])
    expect(out.lexicon.words.find((w) => w.word === 'cord')).toBeUndefined()
  })
  it('refuses a plain stone with no plain meaning, naming the docId', () => {
    expect(() => foldVoice(seeded(), [ev('stone--ribbon', { kind: 'stone', word: 'ribbon', pick: 'plain', plain: '  ', ...W })])).toThrow(VoiceExportError)
    expect(() => foldVoice(seeded(), [ev('stone--ribbon', { kind: 'stone', word: 'ribbon', pick: 'plain', ...W })])).toThrow(/stone--ribbon/)
  })
  it('sets the chart from a bench event and marks it his', () => {
    const out = foldVoice(seeded(), [ev('bench--1', { kind: 'bench', faders: { length: 1, warmth: 9 }, ...W })])
    expect(out.chart.set_by).toBe('wendell')
    expect(out.chart.faders.length.value).toBe(1)
    expect(out.chart.faders.warmth.value).toBe(9)
    expect(out.chart.faders.figure.value).toBe(2)
    expect(() => foldVoice(seeded(), [ev('bench--2', { kind: 'bench', faders: { length: 11 }, ...W })])).toThrow(/bench--2/)
  })
  it('ignores every event not marked by him', () => {
    const before = serialize(seeded())
    const out = serialize(
      foldVoice(seeded(), [
        SLIP,
        ev('keep--s1', { kind: 'keep', slip: 's1', redraft: null, text: 'x' }),
        ev('keep--s2', { kind: 'keep', slip: 's1', redraft: null, text: 'y', marked_by: 'agent' }),
        ev('pencil--p1', { kind: 'pencil', old: 'a', new: 'b', screen: 's', file: 'f', look_row: null, marked_by: null }),
        ev('stone--ribbon', { kind: 'stone', word: 'ribbon', pick: 'plain', plain: 'p' }),
        ev('bench--1', { kind: 'bench', faders: { length: 0 } }),
      ]),
    )
    expect(out).toEqual(before)
  })
  it('hatch, sitting and read change nothing', () => {
    const before = serialize(seeded())
    const out = serialize(
      foldVoice(seeded(), [
        SLIP,
        ev('hatch--s1', { kind: 'hatch', slip: 's1', ring: ['pull'], ...W }),
        ev('sitting--1', { kind: 'sitting', id: '1', slips: ['s1'], ended: 'rest', ...W }),
        ev('read--1', { kind: 'read', line: 'l', reader: 'r', stopped_at: 2, acted: false }),
      ]),
    )
    expect(out).toEqual(before)
  })
  it('refuses a keep whose slip has no event', () => {
    expect(() => foldVoice(seeded(), [ev('keep--zz', { kind: 'keep', slip: 'zz', redraft: null, text: 'x', ...W })])).toThrow(/keep--zz/)
  })
  it('later event with the same docId replaces the earlier', () => {
    const out = foldVoice(seeded(), [
      SLIP,
      ev('keep--s1', { kind: 'keep', slip: 's1', redraft: null, text: 'first', ...W }),
      ev('keep--s1', { kind: 'keep', slip: 's1', redraft: null, text: 'second', ...W }),
    ])
    expect(out.bank.map((b) => b.new)).toEqual(['second'])
  })
  it('is byte-identical on a rerun, and a second fold of the same events changes nothing', () => {
    const events = [
      SLIP,
      ev('keep--s1', { kind: 'keep', slip: 's1', redraft: null, text: 'Choose the one you will do today', ...W }),
      ev('pencil--p1', { kind: 'pencil', old: 'a', new: 'b', screen: 'x', file: 'f.ts', look_row: 'row-1', at: '2026-11-18T08:00:00Z', ...W }),
      ev('stone--ribbon', { kind: 'stone', word: 'ribbon', pick: 'plain', plain: 'A cloth strip.', ...W }),
    ]
    const a = serialize(foldVoice(seeded(), events))
    const b = serialize(foldVoice(seeded(), [...events].reverse()))
    expect(b).toEqual(a)
    const again = serialize(foldVoice(parse(a), events))
    expect(again).toEqual(a)
    expect(a.bank.trim().split('\n').map((l) => JSON.parse(l).id)).toEqual(['vb-2026-11-17-001', 'vb-2026-11-18-001'])
  })
})
