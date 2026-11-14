import { describe, expect, it } from 'vitest'
import { DEMO_SEEDS, DEMO_SHIPS, GROWTH, SHIPS, demoFleet, fleetOf, intakeOf, orreryOf, pullTime, seedsOf, shareOf, shipWorldOf, stagesOf, type Pull, type Ship } from '../fleet'
import { FLEET_DEFAULT, studioPage } from '../page'

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

  it('sends a yes on a step to ship and a deprecated step to close', () => {
    const p = pull('2026-10-25T01:00:00Z', {}, [
      { what: 'note', note: 'Yes, ship it' }, { what: 'note', note: 'yes' }, { what: 'note', note: 'yesterday it broke' },
      { what: 'deprecated' }, { what: 'ticked', note: 'yes' }, { what: 'back to AI' },
    ])
    expect(stagesOf(p)).toEqual(['ship', 'ship', 'falsify', 'close', 'verify', 'falsify'])
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

  it('builds any ship\'s world from the seeds of its own rooms', () => {
    const seeds = { run: ['falsify', 'spec'] as const, earlier: [['falsify'], ['falsify', 'verify']], runEnds: 'x' }
    const s = { ...seeds, run: [...seeds.run], earlier: seeds.earlier.map(r => [...r]) } as Parameters<typeof shipWorldOf>[1]
    const ember = shipWorldOf('ember-comet', s)
    expect(ember).toMatchObject({ id: 'ember-comet', face: 'challenger', hull: 1, landed: 1, carried: 2, spend: 'falsify', spent: true })
    expect(ember.rooms).toEqual([{ stage: 'falsify', machine: 'forge', rung: 1, landed: true }])
    expect(ember).toMatchObject({ opens: true, cost: 2, held: null, after: { hull: 2, rungs: [2] } })
    const twin = shipWorldOf('twin-lantern', s)
    expect(twin).toMatchObject({ landed: 0, carried: 1, spent: true, opens: false, held: 'seeds', after: { hull: 1, rungs: [2] } })
    expect(shipWorldOf('jade-palace', s)).toMatchObject({ landed: 0, carried: 0, spend: null, spent: false, held: 'share' })
    expect(() => shipWorldOf('nope', s)).toThrow()
  })

  it('agrees with the Orrery\'s own world', () => {
    const s = { run: ['plan', 'spec'], earlier: [['spec', 'build', 'verify'], ['plan']], runEnds: 'x' } as Parameters<typeof shipWorldOf>[1]
    const o = orreryOf(s), w = shipWorldOf('orrery', s)
    expect(w).toMatchObject({ carried: o.carried, opens: o.opens, cost: o.cost, held: o.held, spend: 'plan' })
    expect(w.rooms.map(r => r.landed)).toEqual([true, false, true])
  })

  it('runs every ship\'s intake against the whole fleet', () => {
    const f = fleetOf({ run: ['intake', 'spec'], earlier: [], runEnds: '' }, SHIPS, new Date('2026-10-25T02:00:00Z'))
    expect(f.ships.map(s => s.id)).toEqual(SHIPS.map(s => s.id))
    expect(f.smallest).toBe(1)
    expect(f.orrery).toEqual(orreryOf({ run: ['intake', 'spec'], earlier: [], runEnds: '' }, new Date('2026-10-25T02:00:00Z')))
    expect(f.ships.find(s => s.id === 'gourd-star')).toMatchObject({ landed: 1, spent: true, held: 'seeds' })
  })

  it('holds a ship that would sail more than one class ahead of the smallest ship', () => {
    const fleet: Ship[] = SHIPS.map(s => s.id === 'ember-comet' ? { ...s, hull: 2, rooms: [{ ...s.rooms[0], rung: 4 }] } : s)
    const seeds = { run: ['falsify'], earlier: [['falsify'], ['falsify'], ['falsify']], runEnds: '' } as Parameters<typeof fleetOf>[0]
    const f = fleetOf(seeds, fleet)
    const ember = f.ships.find(s => s.id === 'ember-comet')!
    expect(ember).toMatchObject({ hull: 2, spent: true, opens: false, held: 'fleet', after: { hull: 2, rungs: [5] } })
    // the same seeds open the hull once the smallest ship has caught up
    const caught = fleetOf(seeds, fleet.map(s => ({ ...s, hull: 2 })))
    expect(caught.ships.find(s => s.id === 'ember-comet')).toMatchObject({ opens: true, held: null, after: { hull: 3 } })
  })

  it('plays a demo fleet with one ship held by the fleet rule', () => {
    const d = demoFleet()
    expect(d.ships.filter(s => s.held === 'fleet').map(s => s.id)).toEqual(['ember-comet'])
    expect(d.orrery).toMatchObject({ landed: { loom: true, foundry: true, chart: true }, carried: 3, spent: true, opens: true, cost: 2 })
    expect(d.ships.find(s => s.id === 'twin-lantern')).toMatchObject({ opens: true })
    expect(DEMO_SHIPS.find(s => s.id === 'gourd-star')!.hull).toBe(1)
    expect(DEMO_SEEDS.run).toContain('falsify')
  })

  it('serves a game page with no list or panel markup, and escapes the world', () => {
    const w = fleetOf({ run: ['spec'], earlier: [], runEnds: '</script><script>alert(1)' })
    const html = studioPage(w)
    expect(html).toContain('/studio/altitude.js')
    expect(html).toContain('window.FLEET=')
    expect(html).toContain('window.FLEET_DEMO=')
    expect(html).toContain('window.FLEET_DEFAULT=' + FLEET_DEFAULT)
    expect(FLEET_DEFAULT).toBe(true) // the fleet is the default view; ?fleet=0 opens the single-ship Orrery loop
    expect(html).not.toMatch(/<(ul|ol|table)\b/)
    expect(html).not.toContain('</script><script>alert')
  })
})
