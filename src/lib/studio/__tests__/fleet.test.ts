import { describe, expect, it } from 'vitest'
import { GROWTH, SHIPS, intakeOf, orreryOf, pullTime, seedsOf, shareOf, stagesOf, type Pull, type Ship } from '../fleet'
import { studioPage } from '../page'

const pull = (at: string, answers: Pull['answers'], steps: Pull['steps'] = []): Pull => ({ at, answers, steps })
const orrery = () => SHIPS.find(s => s.id === 'orrery')!

describe('studio fleet', () => {
  it('reads the pull time from the ledger file name', () => {
    expect(pullTime('2026-10-25-pull-014112.json')).toBe('2026-10-25T01:41:12Z')
    expect(pullTime('2026-10-21-between-ari1-pass.json')).toBeNull()
  })

  it('sends each answer to the room whose work it is', () => {
    const p = pull('2026-10-25T01:00:00Z', {
      a: { kind: 'position', status: 'stands' }, b: { kind: 'position', status: 'overrule' },
      c: { kind: 'question', choice: 'A' }, d: { kind: 'question', choice: 'note' },
    }, [{ what: 'ticked' }, { what: 'note' }])
    expect(stagesOf(p)).toEqual(['spec', 'falsify', 'plan', 'intake', 'verify', 'falsify'])
  })

  it('lands one seed a room a run, and counts earlier runs apart', () => {
    const s = seedsOf([
      pull('2026-10-25T01:00:00Z', { a: { kind: 'position', status: 'stands' }, b: { kind: 'position', status: 'stands' } }),
      pull('2026-10-24T09:00:00Z', { c: { kind: 'question', choice: 'B' } }),
      pull('2026-10-23T09:00:00Z', { d: { kind: 'position', status: 'stands' } }),
      pull('2026-10-10T09:00:00Z', { e: { kind: 'position', status: 'stands' } }), // older than a week
    ], ['2026-10-24T20:00:00Z'])
    expect(s.run).toEqual(['build', 'plan', 'spec'])
    expect(s.earlier).toEqual([['spec']])
    expect(s.runEnds).toBe('2026-10-25T01:00:00.000Z')
  })

  it('opens the next hull on a share of the rooms, not every room', () => {
    expect(shareOf(orrery())).toEqual({ at: 2, need: 2 })
    const one: Ship = { id: 'x', name: 'x', face: 'shaman', hull: 1, rooms: [{ stage: 'intake', machine: 'bell', rung: 1 }] }
    expect(shareOf(one)).toEqual({ at: 0, need: 1 })
  })

  it('spends a seed on the lowest room, then pays for the hull with what is left', () => {
    const i = intakeOf(orrery(), SHIPS, 6)
    expect(i.spend).toBe('plan')
    expect(i.ship.rooms.find(r => r.stage === 'plan')?.rung).toBe(2)
    expect(i).toMatchObject({ opens: true, cost: 2, left: 3, held: null })
    expect(i.ship.hull).toBe(2)
    expect(orrery().hull).toBe(1) // the table is not changed
  })

  it('holds the hull when the seeds run short, the fleet lags or the ceiling is reached', () => {
    expect(intakeOf(orrery(), SHIPS, 2)).toMatchObject({ spend: 'plan', opens: false, held: 'seeds', left: 1 })
    const big = { ...orrery(), hull: 2, rooms: orrery().rooms.map(r => ({ ...r, rung: 5 })) }
    expect(intakeOf(big, SHIPS, 9)).toMatchObject({ opens: false, held: 'fleet' })
    const top = { ...big, hull: GROWTH.maxHull }
    expect(intakeOf(top, [top], 20).held).toBe('max')
  })

  it('builds the Orrery world from the real seeds, with the store capped', () => {
    const w = orreryOf({ run: ['plan', 'spec'], earlier: [['spec', 'build', 'verify'], ['plan']], runEnds: 'x' }, new Date('2026-10-25T02:00:00Z'))
    expect(w.landed).toEqual({ loom: true, foundry: false, chart: true })
    expect(w.carried).toBe(3) // verify is the Twin Lantern's, not the Orrery's
    expect(w).toMatchObject({ spent: true, opens: true, cost: 2 })
    expect(orreryOf({ run: [], earlier: [], runEnds: '' })).toMatchObject({ carried: 0, spent: false, opens: false, held: 'seeds' })
    const full = orreryOf({ run: ['spec', 'plan', 'build'], earlier: Array.from({ length: 6 }, () => ['spec', 'plan', 'build']), runEnds: '' })
    expect(full.carried).toBe(GROWTH.storeCap - 3)
  })

  it('serves a game page with no list or panel markup, and escapes the world', () => {
    const w = orreryOf({ run: ['spec'], earlier: [], runEnds: '</script><script>alert(1)' })
    const html = studioPage(w)
    expect(html).toContain('/studio/altitude.js')
    expect(html).toContain('window.FLEET=')
    expect(html).not.toMatch(/<(ul|ol|table)\b/)
    expect(html).not.toContain('</script><script>alert')
  })
})
