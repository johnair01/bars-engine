import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { claimGuest, FIELD_OWNERS, PASSPORT_KEYS, PLACES, validatePassport, writeFromPlace, type Passport } from '@/lib/passport/passport'

// The passport contract (six-faces-council pass calrunia-world1): schema/passport.schema.json, its fixtures, the guest fold the
// browser runs (public/passport/guest.js) and the claim at sign-in, with tests W1 and W2 of the pass at the desk.
const ROOT = path.resolve(__dirname, '../../..')
const FIX = path.join(ROOT, 'fixtures/passport')
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema/passport.schema.json'), 'utf8'))
const guest = createRequire(import.meta.url)(path.join(ROOT, 'public/passport/guest.js'))
const load = (dir: string) => fs.readdirSync(path.join(FIX, dir)).filter(f => f.endsWith('.json')).sort()
  .map(f => [f, JSON.parse(fs.readFileSync(path.join(FIX, dir, f), 'utf8'))] as const)
const ok = (p: unknown) => { const r = validatePassport(p); expect(r.ok ? [] : r.errors).toEqual([]); return p as Passport }

// What the cave and the ship store today (cave/spirit-store.js, cave/vessel.js on the dock branch).
const SPIRITS = { v: 1, spirits: [
  { id: 'sp-fox', name: 'Ember Fox', element: 'fire', family: 'fox', sittings: 2, born: { where: 'the Big Mind cave', at: '2026-10-19T18:00:00.000Z' }, lineage: [{ where: 'the Big Mind cave', at: '2026-10-19T18:00:00.000Z' }], loadout: true },
  { id: 'sp-heron', name: 'Still Heron', element: 'water', family: 'heron', sittings: 1, born: { where: 'the Cave of Lessons', at: '2026-10-20T08:00:00.000Z' }, lineage: [], loadout: false },
] }
const VESSEL = { v: 1, hull: { w: 3, h: 3 }, fuel: 4, parts: [], log: [],
  places: { home: 'visited', hall: 'charted', bigmind: 'visited', wood: 'unseen' },
  embers: [{ id: 'ember-1', source: 'wave', ref: null, element: 'water', look: 0.6, bonus: false, daemon: null, at: '2026-10-20T10:00:00.000Z', label: 'first tide', state: 'loose' }] }
const AT = '2026-10-21T02:00:00.000Z'

describe('passport contract', () => {
  it.each(load('valid'))('accepts %s', (_name, p) => { ok(p) })
  it.each(load('invalid'))('refuses %s', (_name, p) => { expect(validatePassport(p).ok).toBe(false) })

  it('names the same fields and places as the JSON schema', () => {
    expect([...schema.required].sort()).toEqual([...PASSPORT_KEYS].sort())
    expect(Object.keys(schema.properties).sort()).toEqual([...PASSPORT_KEYS].sort())
    expect(schema.$defs.place.enum).toEqual([...PLACES])
    expect(guest.PLACES).toEqual([...PLACES])
  })

  it('folds the cave and the ship into a guest passport without changing them', () => {
    const before = JSON.stringify([SPIRITS, VESSEL])
    const p = ok(guest.fold(SPIRITS, VESSEL, 'guest-1', AT))
    expect(JSON.stringify([SPIRITS, VESSEL])).toBe(before)
    expect(p.spirits.map(s => [s.id, s.name, s.sittings, s.loadout])).toEqual([['sp-fox', 'Ember Fox', 2, true], ['sp-heron', 'Still Heron', 1, false]])
    expect(p.embers.map(e => e.id)).toEqual(['ember-1'])
    expect(p.places_reached).toEqual(['vessel', 'cave'])
    expect(p.player).toEqual({ id: null, name: null, guest_id: 'guest-1' })
  })

  it('folds an empty browser, and broken stores, into a valid passport', () => {
    expect(ok(guest.fold(null, null, 'guest-1', AT)).places_reached).toEqual([])
    ok(guest.fold({ v: 1, spirits: [{ id: 'x' }, null, { id: 'x' }] }, { v: 1, places: null, embers: [{ id: 'e' }] }, 'guest-1', AT))
  })

  it('W1: a spirit woken as a guest is the same spirit after sign-in, and claiming twice changes nothing', () => {
    const g = guest.fold(SPIRITS, VESSEL, 'guest-1', AT) as Passport
    const once = ok(claimGuest(null, g, { id: 'pl-1', name: 'Wendell' }, AT))
    expect(once.player).toEqual({ id: 'pl-1', name: 'Wendell', guest_id: 'guest-1' })
    expect(once.spirits).toEqual(g.spirits)
    expect(claimGuest(once, g, { id: 'pl-1', name: 'Wendell' }, AT)).toEqual(once)
  })

  it('a claim onto an existing passport joins spirits, never mints, and keeps three in the loadout', () => {
    const server = ok({ ...guest.fold(null, null, 'guest-0', AT), player: { id: 'pl-1', name: 'W', guest_id: 'guest-0' }, vibeulons: 3, qi: 1,
      spirits: ['a', 'b', 'c'].map(id => ({ ...guest.fold(SPIRITS, null, 'g', AT).spirits[0], id, loadout: true })) })
    const g = { ...(guest.fold(SPIRITS, VESSEL, 'guest-1', AT) as Passport), vibeulons: 2, qi: 5 }
    const p = ok(claimGuest(server, g, { id: 'pl-1', name: 'W' }, AT))
    expect(p.spirits.map(s => s.id)).toEqual(['a', 'b', 'c', 'sp-fox', 'sp-heron'])
    expect(p.spirits.filter(s => s.loadout).map(s => s.id)).toEqual(['a', 'b', 'c'])
    expect([p.vibeulons, p.qi]).toEqual([3, 5])
  })

  it('W2: a place writes only the fields it owns, and adds only its own id to places_reached', () => {
    const p = ok(guest.fold(SPIRITS, VESSEL, 'guest-1', AT))
    for (const [field, owner] of Object.entries(FIELD_OWNERS)) {
      for (const place of PLACES) {
        const r = writeFromPlace(p, place, { [field]: (p as Record<string, unknown>)[field] })
        expect(r.ok).toBe(place === owner)
      }
    }
    expect(writeFromPlace(p, 'between', { player: p.player }).ok).toBe(false)
    expect(writeFromPlace(p, 'between', { places_reached: ['root'] }).ok).toBe(false)
    const entered = writeFromPlace(p, 'between', { places_reached: [] })
    expect(entered.ok && entered.passport.places_reached).toEqual(['vessel', 'cave', 'between'])
  })
})
