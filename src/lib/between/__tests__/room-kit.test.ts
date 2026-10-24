import { describe, expect, it } from 'vitest'
// The room kit (public/calrunia/room-kit.js): one kit for the Between, the Cave of Lessons and Big Mind (rk-one-kit).
import {
  applyRoom, earnedEvents, earnedItems, ITEM_ORDER, ITEMS, liftFrom, placeOn, PORTABLE, resolvePlaced, satchelOf, SHELLS,
  shellFor, shellOf, spotOfItem, spotsFor, TAKES,
} from '../../../../public/calrunia/room-kit.js'
import { mayWrite, plantedGarden, plantedHome, type Doc, type Who } from '@/lib/between/rules'

const A = 'playerA', B = 'playerB'
const member = (playerId: string): Who => ({ playerId, member: true, invited: false })

// Stand-ins for a scene: a slot that holds what is hung on it, and a maker that names what it made.
function scene(shell: { spots: { id: string; fixed?: boolean }[] }) {
  const made: string[] = []
  const spots: Record<string, { slot: { kids: unknown[]; add(o: unknown): void; clear(): void }; item?: string | null; glow?: number }> = {}
  for (const s of shell.spots) if (!s.fixed) spots[s.id] = { slot: { kids: [], add(o) { this.kids.push(o) }, clear() { this.kids = [] } } }
  return { made, spots, make: (id: string, sp: { id: string }) => { made.push(id + '@' + sp.id); return { id } } }
}

describe('room kit: shells and items', () => {
  it('the nook is bare: five spots, one hook, one shelf, three floor, nothing pre-placed', () => {
    const n = SHELLS.nook
    expect(n.spots.map(s => s.id)).toEqual(['hook', 'shelf', 'floor-l', 'floor-c', 'floor-r'])
    expect(n.spots.map(s => s.takes)).toEqual(['hang', 'small', 'floor', 'floor', 'floor'])
    expect(n.prePlaced).toEqual({})
  })
  it('the hollow keeps today\'s lanterns and cushions as fixed, pre-placed pieces', () => {
    const now = resolvePlaced('hollow', {})
    expect(Object.keys(now).sort()).toEqual(['lantern-l', 'lantern-r', 'seat-0', 'seat-1'])
    expect(Object.values(now).every(e => e.fixed)).toBe(true)
    expect(placeOn('hollow', {}, 'seat-0', 'cushion', A).ok).toBe(false)
    expect(liftFrom('hollow', {}, 'lantern-l', A)).toMatchObject({ ok: false, why: 'fixed' })
  })
  it('every item takes a kind of spot, and every item is earned by some event', () => {
    for (const id of ITEM_ORDER) { expect(TAKES).toContain(ITEMS[id].takes); expect(ITEMS[id].earnedBy).toBeTruthy() }
    expect(shellOf('nonsense').id).toBe('nook')
    expect(shellFor({ kind: 'home' })).toBe('nook'); expect(shellFor({ kind: 'room' })).toBe('hollow'); expect(shellFor(null)).toBe('nook')
  })
})

describe('room kit: placing', () => {
  it('only the spots that fit an item light up for it', () => {
    expect(spotsFor('nook', 'lantern', {})).toEqual(['hook'])
    expect(spotsFor('nook', 'seed-pot', {})).toEqual(['shelf'])
    expect(spotsFor('nook', 'cushion', {})).toEqual(['floor-l', 'floor-c', 'floor-r'])
    expect(spotsFor('nook', 'cushion', { 'floor-c': { item: 'rug', owner: A, at: 1 } })).toEqual(['floor-l', 'floor-r'])
    expect(spotsFor('nook', 'nothing', {})).toEqual([])
  })
  it('one tap sets it down; it leaves the satchel; a wrong or full spot is refused', () => {
    const earned = ['lantern', 'cushion', 'mirror']
    const p = placeOn('nook', {}, 'hook', 'lantern', A, 5, earned)
    expect(p).toMatchObject({ ok: true, patch: { hook: { item: 'lantern', owner: A, at: 5 } }, line: 'set down a paper lantern' })
    expect(satchelOf(earned, 'nook', p.placed, A)).toEqual(['cushion', 'mirror'])
    expect(placeOn('nook', p.placed, 'hook', 'lantern', B)).toMatchObject({ ok: false, why: 'taken' })
    expect(placeOn('nook', {}, 'shelf', 'lantern', A)).toMatchObject({ ok: false, why: 'does-not-fit' })
    expect(placeOn('nook', {}, 'floor-l', 'rug', A, 1, earned)).toMatchObject({ ok: false, why: 'not-earned' })
    const twice = placeOn('nook', placeOn('nook', {}, 'floor-l', 'cushion', A).placed, 'floor-r', 'cushion', A)
    expect(twice).toMatchObject({ ok: false, why: 'already-placed' })
    expect(placeOn('nook', {}, 'window', 'cushion', A)).toMatchObject({ ok: false, why: 'no-spot' })
  })
  it('tapping a placed item sends it back to the satchel', () => {
    const p = placeOn('nook', {}, 'floor-c', 'mirror', A).placed
    const l = liftFrom('nook', p, 'floor-c', A)
    expect(l).toMatchObject({ ok: true, patch: { 'floor-c': null }, back: { item: 'mirror', owner: A }, theirs: false })
    expect(satchelOf(['mirror'], 'nook', l.placed, A)).toEqual(['mirror'])
    expect(liftFrom('nook', l.placed, 'floor-c', A)).toMatchObject({ ok: false, why: 'empty' })
  })
  it('in a shared room either person sets down; lifting theirs sends it back to their satchel, never away', () => {
    let placed = placeOn('hollow', {}, 'floor-a', 'cushion', A).placed
    placed = placeOn('hollow', placed, 'floor-b', 'cushion', B).placed // each of you has your own cushion to set down
    expect(spotOfItem('hollow', placed, 'cushion', B)).toBe('floor-b')
    const l = liftFrom('hollow', placed, 'floor-a', B)
    expect(l).toMatchObject({ ok: true, theirs: true, back: { item: 'cushion', owner: A }, line: 'sent your plum cushion back to your satchel' })
    expect(satchelOf(['cushion'], 'hollow', l.placed, A)).toEqual(['cushion'])
    expect(satchelOf(['cushion'], 'hollow', l.placed, B)).toEqual([])
  })
  it('a bad stored placement is left out, never breaks the room', () => {
    const now = resolvePlaced('nook', { hook: { item: 'cushion', owner: A }, shelf: 'nonsense', attic: 'lantern', 'floor-l': 'rug', 'floor-c': null })
    expect(now).toEqual({ 'floor-l': { item: 'rug', owner: null, at: null } })
  })
})

describe('room kit: earned through play, nothing bought', () => {
  it('each item comes from an event that already exists', () => {
    expect(earnedItems(earnedEvents())).toEqual([])
    const ev = earnedEvents({
      home: { oriented: 3, lastCheckin: 9 },
      rooms: [{ keptAgreement: true, person: null, lastSatTogether: null }, { keptAgreement: false, person: B, lastSatTogether: null }],
      spirits: [{ id: 'meet-12', born: { where: 'Big Mind' } }],
    })
    expect(ev).toEqual({ keptAgreement: true, letGo: true, satWith: true, mirror: true, oriented: true, checkin: true })
    // the blank scroll lives on the shelf, not in the satchel (part 2, Still B)
    expect(earnedItems(ev)).toEqual(['lantern', 'seed-pot', 'cushion', 'mirror', 'rug'])
    expect(earnedItems(earnedEvents({ home: { oriented: 1 } }))).toEqual(['mirror'])
    // the first minute gives the mirror at its beat, before the doorway opens (Still C)
    expect(earnedItems(earnedEvents({ home: {} }))).toEqual([])
    expect(earnedItems(earnedEvents({ home: { minute: { ember: 5 } } }))).toEqual(['mirror'])
    expect(earnedItems(earnedEvents({ home: { minute: { skip: { ember: 5 } } } }))).toEqual(['mirror'])
    expect(earnedEvents({ spirits: [{ id: 'cave-3', born: { where: 'Cave of Lessons' } }] }).letGo).toBe(false)
  })
})

describe('room kit: applyRoom sets a room on a scene, as applyStyle sets a style', () => {
  it('hangs each placed item on its spot, and only remakes what changed', () => {
    const sc = scene(SHELLS.nook)
    const h = { spots: sc.spots, make: sc.make, rain: { visible: true } }
    const r = applyRoom(h, { shell: 'nook', style: 'moonlit', placed: { hook: { item: 'lantern', owner: A }, 'floor-c': { item: 'mirror', owner: A } } })
    expect(r.style.id).toBe('moonlit'); expect(h.rain.visible).toBe(false)
    expect(sc.made).toEqual(['lantern@hook', 'mirror@floor-c'])
    expect(sc.spots.hook.item).toBe('lantern'); expect(sc.spots.hook.glow).toBe(1); expect(sc.spots['floor-c'].glow).toBe(0)
    applyRoom(h, { shell: 'nook', style: 'ember-rain', placed: { hook: { item: 'lantern', owner: A } } })
    expect(sc.made).toEqual(['lantern@hook', 'mirror@floor-c']) // the lantern stayed; nothing new was made
    expect(sc.spots['floor-c'].item).toBe(null); expect(sc.spots['floor-c'].slot.kids).toEqual([])
    expect(h.rain.visible).toBe(true)
    applyRoom({}, { shell: 'nook', placed: { hook: 'lantern' } }) // a scene with no handles is left alone
  })
  it('the hollow shell leaves its pre-placed pieces to the scene', () => {
    const sc = scene(SHELLS.hollow)
    applyRoom({ spots: sc.spots, make: sc.make }, { shell: 'hollow', placed: { stool: { item: 'seed-pot', owner: B } } })
    expect(sc.made).toEqual(['seed-pot@stool'])
    expect(Object.keys(sc.spots)).not.toContain('lantern-l')
  })
  it('portability: a Cave of Lessons alcove and a Big Mind seat list their own spots and use the kit unchanged', () => {
    for (const shell of Object.values(PORTABLE)) {
      const sc = scene(shell)
      const small = spotsFor(shell, 'seed-pot', {}), floor = spotsFor(shell, 'rug', {})
      const placed = { ...(small[0] ? placeOn(shell, {}, small[0], 'seed-pot', A).patch : {}), ...(floor[0] ? placeOn(shell, {}, floor[0], 'rug', A).patch : {}) }
      const r = applyRoom({ spots: sc.spots, make: sc.make }, { shell, placed })
      expect(Object.keys(r.placed).length).toBeGreaterThan(0)
      expect(sc.made.length).toBe(Object.values(r.placed).filter(e => !e.fixed).length)
    }
    expect(resolvePlaced(PORTABLE['bigmind-seat'], {}).mat).toMatchObject({ item: 'cushion', fixed: true })
  })
})

describe('room kit: the store keeps placements in the garden doc', () => {
  const room = (): Doc => ({ ...plantedGarden(A, { setup: { who: 'Ari', kind: 'Friendship' } }, 1)!, members: { [A]: { joinedAt: 1 }, [B]: { joinedAt: 2 } }, phase: 'between' })
  const write = (who: string, g: Doc, data: Doc) => mayWrite(member(who), g, { table: 'garden' }, 'update', data, null)
  it('you set down in your own name; either of you lifts', () => {
    expect(write(A, room(), { room: { placed: { 'floor-a': { item: 'cushion', owner: A, at: 3 } } } }).ok).toBe(true)
    expect(write(A, room(), { room: { placed: { 'floor-a': { item: 'cushion', owner: B, at: 3 } } } }).ok).toBe(false)
    const g = { ...room(), room: { placed: { 'floor-a': { item: 'cushion', owner: A, at: 3 } } } }
    expect(write(B, g, { room: { placed: { 'floor-a': null } } }).ok).toBe(true)
    expect(write(B, g, { room: { placed: { 'floor-a': { item: 'rug', owner: B, at: 4 } } } }).ok).toBe(false) // lift it first
  })
  it('a placement must fit its shell', () => {
    expect(write(A, room(), { room: { placed: { 'floor-a': { item: 'lantern', owner: A, at: 3 } } } }).ok).toBe(false)
    expect(write(A, room(), { room: { placed: { 'seat-0': { item: 'cushion', owner: A, at: 3 } } } }).ok).toBe(false)
    expect(write(A, room(), { room: { shell: 'nook' } }).ok).toBe(false)
    const home = plantedHome(A, 1)
    expect(write(A, home, { room: { placed: { hook: { item: 'lantern', owner: A, at: 3 } } } }).ok).toBe(true)
    expect(write(A, home, { room: { placed: { stool: { item: 'seed-pot', owner: A, at: 3 } } } }).ok).toBe(false)
  })
})
