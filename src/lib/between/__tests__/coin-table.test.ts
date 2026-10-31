import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// BAR intake, build 1 (Six-faces-council pass bar-intake-1): what the coin table offers, writes and reads.
import { castFromTosses } from '../../../../public/between/iching/cast.js'
import { FACES, hand, offers, sealSave, workorder } from '../../../../public/between/iching/workorder.js'

const root = join(__dirname, '../../../..')
const table = JSON.parse(readFileSync(join(root, 'public/between/iching/hexagrams.json'), 'utf8'))
const BAR = { id: 'ttv-cmvvan71s001412hdijdu74gg', do: 'Put an I Ching into the Between space and the Nook', ttvDate: '2026-10-30' }
const IMPASSE = [[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 2]]

describe('the coin table', () => {
  it('lays the six game masters bottom up by altitude', () => {
    expect(FACES.map((f: { name: string }) => f.name)).toEqual(['Shaman', 'Challenger', 'Regent', 'Architect', 'Diplomat', 'Sage'])
  })

  it('offers the council\'s answer first and marked, and two others', () => {
    for (let i = 0; i < 6; i++) {
      const o = offers({ id: 'ttv-other', do: 'x' }, i)
      expect(o.options.length).toBe(3)
      expect(o.options.map((x: { council: boolean }) => x.council)).toEqual([true, false, false])
    }
    expect(offers(BAR, 0).options[0].text).toMatch(/walks to the low table/)
  })

  it('writes the first BAR\'s workorder with its cast and six kept lines', () => {
    const cast = castFromTosses(IMPASSE, table, BAR.id)
    const kept = [0, 1, 2, 3, 4, 5].map(i => offers(BAR, i).options[0].text)
    const wo = workorder(BAR, cast, kept, '2026-10-31T06:00:00.000Z')
    expect(wo.cast).toMatchObject({ n: 39, name: 'Impasse', changing: [], becomes: null })
    expect(wo.front).toMatchObject({ project: 'The Between', face: 'Architect', move: 'Claude Takes It', needs: 'nothing until the look' })
    expect(wo.lines.map((l: { face: string }) => l.face)).toEqual(['Shaman', 'Challenger', 'Regent', 'Architect', 'Diplomat', 'Sage'])
    expect(wo.md).toContain('hexagram 39, Impasse')
    expect(wo.md).toContain('"Put an I Ching into the Between space and the Nook"')
    expect(() => workorder(BAR, cast, kept.slice(0, 5))).toThrow()
  })

  it('marks the lines the coins left moving', () => {
    const tosses = IMPASSE.map(t => [...t]); tosses[1] = [3, 3, 3]
    const cast = castFromTosses(tosses, table, BAR.id)
    const wo = workorder(BAR, cast, Array(6).fill('kept'))
    expect(wo.lines.map((l: { moving: boolean }) => l.moving)).toEqual([false, true, false, false, false, false])
    expect(wo.cast.becomes).not.toBeNull()
  })

  it('seals the way Hand it to Claude does: aiBack, not automated, out of the hand', () => {
    const cast = castFromTosses(IMPASSE, table, BAR.id)
    const wo = workorder(BAR, cast, Array(6).fill('kept'), '2026-10-31T06:00:00.000Z')
    const s = sealSave(BAR, wo)
    expect(s).toMatchObject({ board: 'council', collection: 'steps', docId: BAR.id, mode: 'update' })
    expect(s.data.inHand).toBeNull()
    expect(s.data.aiBack).toMatchObject({ automate: false, at: '2026-10-31T06:00:00.000Z', from: 'coin-table' })
    expect(s.data.aiBack.workorder.cast.n).toBe(39)
    expect(JSON.stringify(s).length).toBeLessThan(256 * 1024)
  })

  it('reads his hand as the board does: held, not done, not handed, not set aside, not blocking', () => {
    const steps = {
      a: { do: 'held', inHand: '2026-10-30T01:00:00Z' },
      b: { do: 'newer', inHand: '2026-10-31T01:00:00Z', ttv: { date: '2026-10-30' } },
      c: { do: 'done', inHand: '2026-10-30T01:00:00Z', done: true },
      d: { do: 'handed', inHand: '2026-10-30T01:00:00Z', aiBack: { text: 'x' } },
      e: { do: 'away', inHand: '2026-10-30T01:00:00Z', discardedUntil: '2026-11-05T00:00:00Z' },
      f: { do: 'blocking', inHand: '2026-10-30T01:00:00Z', blocking: true },
      g: { do: 'not held' },
    }
    expect(hand({ steps }, '2026-10-31T06:00:00Z').map((c: { id: string }) => c.id)).toEqual(['b', 'a'])
    expect(hand({ steps }, '2026-10-31T06:00:00Z')[0].ttvDate).toBe('2026-10-30')
  })
})
