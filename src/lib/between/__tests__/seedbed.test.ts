import { describe, expect, it } from 'vitest'
// The BARs garden, slice 1 (Six-faces-council spec .specify/specs/bars-garden): the seed bed's rules. A BAR holds one plant;
// a tend costs one mana of its element, once a day; frost after seven days untended (bg2-frost-days A), cleared by one tend;
// nothing dies or goes back; one harvest shape from either bed; no digit in the bed's words.
import { ELEMENTS, EL_WORD, FEEL_WORD, FROST_DAYS, canTend, cleanIntent, cleanMana, elementOf, harvestOf, isFrosted, isPlant, plant, stageOf, tend } from '../../../../public/between/seedbed.js'
import { mergeSeedMetabolization, parseSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { manaNotRaised, mayWrite, plantedHome, pouchWrite, type Who } from '@/lib/between/rules'

const DAY = 24 * 3600 * 1000
const T0 = Date.parse('2026-11-07T08:00:00Z')
const fresh = () => { const r = plant(null, { bed: 'hollow', element: 'metal', intent: '  I want to ask for help before I\'m drowning.  ' }, T0); if (r.ok === false) throw new Error(r.why); return r.plant }

describe('planting', () => {
  it('plants one record and keeps the player\'s line untouched but for its ends', () => {
    const p = fresh()
    expect(isPlant(p)).toBe(true)
    expect(p).toMatchObject({ bed: 'hollow', element: 'metal', tends: 0, intent: 'I want to ask for help before I\'m drowning.' })
  })
  it('never gives a BAR a second plant', () => {
    expect(plant(fresh(), { bed: 'hollow', element: 'wood' }, T0)).toEqual({ ok: false, why: 'planted' })
  })
  it('plants without a line when the heart act is skipped, and cuts a long line at 140', () => {
    const r = plant(null, { bed: 'hollow', element: 'wood', intent: '   ' }, T0)
    expect(r.ok && r.plant.intent).toBe(undefined)
    expect(cleanIntent('x'.repeat(300))!.length).toBe(140)
  })
  it('refuses an unknown bed or element', () => {
    expect(plant(null, { bed: 'roof', element: 'wood' }, T0).ok).toBe(false)
    expect(plant(null, { bed: 'hollow', element: 'void' }, T0).ok).toBe(false)
  })
  it('reads the element from the feeling: fear is metal, and nation names it first', () => {
    expect(elementOf({ emotionalAlchemyTag: 'fear' })).toBe('metal')
    expect(elementOf({ nation: 'Water', emotionalAlchemyTag: 'fear' })).toBe('water')
    expect(elementOf({})).toBe('earth')
  })
})

describe('tending', () => {
  it('takes one mana of the plant\'s element and sets the tend', () => {
    const r = tend(fresh(), { metal: 2, wood: 1 }, T0 + 1000)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.mana).toEqual({ metal: 1, wood: 1 })
    expect(r.plant.tends).toBe(1)
  })
  it('refuses, changing nothing, without mana of that element', () => {
    const p = fresh(), m = { wood: 3 }
    expect(tend(p, m, T0)).toEqual({ ok: false, why: 'mana' })
    expect(m).toEqual({ wood: 3 })
    expect(p.tends).toBe(0)
  })
  it('tends at most once a day', () => {
    const r = tend(fresh(), { metal: 3 }, T0)
    if (!r.ok) throw new Error('first tend')
    expect(canTend(r.plant, r.mana, T0 + 2 * 3600 * 1000)).toEqual({ ok: false, why: 'today' })
    expect(canTend(r.plant, r.mana, T0 + DAY).ok).toBe(true)
  })
})

describe('frost, never death', () => {
  it('frosts after seven days untended and not before (bg2-frost-days A)', () => {
    const p = fresh()
    expect(isFrosted(p, T0 + 6 * DAY)).toBe(false)
    expect(isFrosted(p, T0 + (FROST_DAYS + 0.1) * DAY)).toBe(true)
    expect(isFrosted(p, T0 + 10 * DAY, { spring: true })).toBe(false)
  })
  it('one tend clears frost, and frost never changes the record', () => {
    const p = fresh(), later = T0 + 30 * DAY, before = JSON.stringify(p)
    expect(isFrosted(p, later)).toBe(true)
    expect(JSON.stringify(p)).toBe(before)
    const r = tend(p, { metal: 1 }, later)
    expect(r.ok && isFrosted(r.plant, later + 1000)).toBe(false)
  })
  it('draws the stage from maturity alone', () => {
    expect(stageOf('context_named')).toBe(1)
    expect(stageOf('elaborated')).toBe(2)
    expect(stageOf(undefined)).toBe(1)
  })
})

describe('the record and the pouch', () => {
  it('keeps the plant on the seed record beside maturity', () => {
    const raw = mergeSeedMetabolization(JSON.stringify({ maturity: 'context_named' }), { plant: fresh() })
    const s = parseSeedMetabolization(raw)
    expect(s.maturity).toBe('context_named')
    expect(s.plant && s.plant.element).toBe('metal')
    expect(parseSeedMetabolization(JSON.stringify({ plant: { bed: 'roof' } })).plant).toBe(undefined)
  })
  it('holds mana by element, whole, and the page never raises it', () => {
    expect(pouchWrite({ mana: { metal: 2 } }).ok).toBe(true)
    expect(pouchWrite({ mana: { metal: 1.5 } }).ok).toBe(false)
    expect(pouchWrite({ mana: { void: 1 } }).ok).toBe(false)
    expect(manaNotRaised({ metal: 2 }, { metal: 1 })).toBe(true)
    expect(manaNotRaised({ metal: 2 }, { metal: 3 })).toBe(false)
    const me = 'playerA', who: Who = { playerId: me, member: true, invited: false }
    const pouch = { table: 'privates', playerId: me, key: 'pouch' } as const
    expect(mayWrite(who, plantedHome(me, 1), pouch, 'update', { mana: { wood: 5 } }, { mana: { wood: 1 } }).ok).toBe(false)
    expect(cleanMana({ metal: 2, wood: -1, fire: 0.5, void: 3 })).toEqual({ metal: 2 })
  })
  it('gives one harvest shape from either bed', () => {
    expect(harvestOf('b1', fresh(), T0)).toEqual({ bar: 'b1', element: 'metal', at: new Date(T0).toISOString() })
    expect(harvestOf('b1', { ...fresh(), bed: 'chamber' }, T0)).toEqual({ bar: 'b1', element: 'metal', at: new Date(T0).toISOString() })
  })
  it('says no digit in the bed\'s words', () => {
    for (const e of ELEMENTS) expect(/\d/.test(EL_WORD[e] + FEEL_WORD[e])).toBe(false)
  })
})
