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

// Chapter 1's arrival aboard the ship (/calrunia/arrive): the passport rides in the URL fragment as #p=<base64url JSON>
// (public/passport/arrive.js), is checked with validatePassport, and is laid into the stores guest.js folds back.
const arrive = createRequire(import.meta.url)(path.join(ROOT, 'public/passport/arrive.js'))
const vessel = createRequire(import.meta.url)(path.join(ROOT, 'content/ontology-game/cave/vessel.js'))
const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(FIX, 'valid', name), 'utf8'))
// A URL a phone opens without trouble: well under the 2,000 characters older browsers and link previews keep.
const PHONE_SAFE_URL = 2000
const ARRIVE_URL = 'https://bars-engine.vercel.app/calrunia/arrive'

describe('arrival from Chapter 1', () => {
  const ch1 = fixture('chapter1-sprout.json')

  it('the Chapter 1 passport round-trips through the fragment and validates', () => {
    const frag = arrive.encode(ch1)
    expect(frag).toMatch(/^#p=[A-Za-z0-9_-]+$/)
    const d = arrive.decode(frag)
    expect(d.found).toBe(true)
    expect(d.value).toEqual(ch1)
    ok(d.value)
    expect((ARRIVE_URL + frag).length).toBeLessThan(PHONE_SAFE_URL)
  })

  it('refuses a corrupted fragment', () => {
    const frag = arrive.encode(ch1)
    expect(arrive.decode(frag.slice(0, -7)).error).toBeTruthy() // cut short in a message
    expect(arrive.decode('#p=' + frag.slice(3, 40) + '!*' + frag.slice(40)).error).toBeTruthy() // characters base64url never uses
    const tampered = arrive.decode(arrive.encode({ ...ch1, vibeulons: 2.5 }))
    expect(validatePassport(tampered.value).ok).toBe(false) // parses, but the contract refuses it
    expect(arrive.decode('').found).toBe(false)
    expect(arrive.decode('#wave=board').found).toBe(false)
  })

  it('lays the passport into the browser stores so the guest fold gives it back, and arriving twice changes nothing', () => {
    const empty = { spirits: null, vessel: null, hand: null, guest: null }
    const once = arrive.merge(empty, ch1, vessel.blank, AT)
    const p = ok(guest.fold(once.spirits, once.vessel, once.guest, AT, once.hand))
    expect(p.spirits.map(s => [s.id, s.name, s.element, s.sittings, s.loadout])).toEqual(ch1.spirits.map((s: Passport['spirits'][0]) => [s.id, s.name, s.element, s.sittings, s.loadout]))
    expect(p.hand).toEqual(ch1.hand)
    expect([p.vibeulons, p.qi]).toEqual([ch1.vibeulons, ch1.qi])
    expect(p.places_reached).toEqual(['vessel', 'sprout', 'cave'])
    expect(p.player.guest_id).toBe(ch1.player.guest_id)
    expect(vessel.canLaunch(once.vessel)).toBe(true) // a new browser gets the sample ship, Helm and Sail fitted
    expect(arrive.merge(once, ch1, vessel.blank, AT)).toEqual(once)
  })

  it('joins an arrival with what the browser already holds, without minting', () => {
    const before = { spirits: SPIRITS, vessel: { ...VESSEL, vibeulons: 5 }, hand: { v: 1, hand: [{ id: 'old', kind: 'card', title: 'Kept', from: 'sprout' }] }, guest: 'guest-here' }
    const s = arrive.merge(before, ch1, vessel.blank, AT)
    expect(s.spirits.spirits.map((r: { id: string }) => r.id)).toEqual(['sp-fox', 'sp-heron', 'sp-still-heron'])
    expect(s.vessel.vibeulons).toBe(5)
    expect(s.vessel.embers.map((e: { id: string }) => e.id)).toEqual(['ember-1'])
    expect(s.hand.hand.map((h: { id: string }) => h.id)).toEqual(['old', 'a6', 'bar-ch1-1'])
    expect(s.guest).toBe('guest-here')
  })

  it('keeps the signed-in passport fragment within a phone-safe URL too', () => {
    const full = fixture('signed-in-full.json')
    const frag = arrive.encode(full)
    expect(arrive.decode(frag).value).toEqual(full)
    expect((ARRIVE_URL + frag).length).toBeLessThan(PHONE_SAFE_URL)
  })
})
