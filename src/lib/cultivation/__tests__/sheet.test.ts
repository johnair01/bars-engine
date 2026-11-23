import { describe, it, expect } from 'vitest'
import {
  type Sheet,
  WEAPONS,
  WEAPON_STAT,
  layers,
  floor,
  heldAtGate,
  proficiency,
  skill,
  gainQi,
  landStrike,
  pointsToPlace,
  placePoint,
} from '../sheet'

function make(over: Partial<Sheet> = {}): Sheet {
  return {
    id: 't',
    origin: 'player',
    look: {},
    priors: { archetype: 'a', nation: 'n', element: 'wood' },
    qi: 0,
    breakthroughs: 0,
    stats: { might: 0, grace: 0, root: 0 },
    weapons: Object.fromEntries(WEAPONS.map((w) => [w, { uses: 0, element: 'wood' }])) as Sheet['weapons'],
    ...over,
  }
}

describe('layers and floors', () => {
  it('lower floor costs 30 qi a layer', () => {
    expect(layers(make({ qi: 29 }))).toBe(0)
    expect(layers(make({ qi: 30 }))).toBe(1)
    expect(layers(make({ qi: 270 }))).toBe(9)
  })
  it('holds the ninth layer until a breakthrough and keeps the qi', () => {
    const s = make({ qi: 5000 })
    expect(layers(s)).toBe(9)
    expect(heldAtGate(s)).toBe(true)
    expect(floor(s)).toBe('lower')
    const open = make({ qi: 5000, breakthroughs: 1 })
    expect(layers(open)).toBe(18)
    expect(floor(open)).toBe('middle')
    expect(heldAtGate(open)).toBe(true)
  })
  it('middle floor costs 60 and upper 120', () => {
    expect(layers(make({ qi: 270 + 60, breakthroughs: 1 }))).toBe(10)
    expect(layers(make({ qi: 270 + 540 + 120, breakthroughs: 2 }))).toBe(19)
  })
  it('stops at 27 layers with no gate on the upper floor', () => {
    const s = make({ qi: 100000, breakthroughs: 2 })
    expect(layers(s)).toBe(27)
    expect(floor(s)).toBe('upper')
    expect(heldAtGate(s)).toBe(false)
  })
  it('is not held below the ninth layer', () => {
    expect(heldAtGate(make({ qi: 240 }))).toBe(false)
  })
})

describe('proficiency, skill and cap', () => {
  it('reads a square-root curve', () => {
    expect(proficiency(0)).toBe(0)
    expect(proficiency(25)).toBe(10)
    expect(proficiency(100)).toBe(20)
    expect(proficiency(400)).toBe(40)
  })
  it('maps weapons to Might, Grace and Root', () => {
    expect(WEAPON_STAT).toEqual({ dao: 'might', fist: 'might', jian: 'grace', fan: 'grace', spear: 'root', staff: 'root' })
  })
  it('adds twice the weapon stat and caps at 10 plus 10 a layer', () => {
    const s = make({ qi: 90, stats: { might: 0, grace: 3, root: 0 } }) // 3 layers
    s.weapons.jian.uses = 100
    expect(skill(s, 'jian')).toEqual({ skill: 26, raw: 26, cap: 40 })
    s.weapons.dao.uses = 100
    expect(skill(s, 'dao')).toEqual({ skill: 20, raw: 20, cap: 40 })
  })
  it('caps the grinder at the layer cap', () => {
    const s = make()
    s.weapons.jian.uses = 2100
    expect(skill(s, 'jian')).toEqual({ skill: 10, raw: 91, cap: 10 })
  })
})

describe('banked uses', () => {
  it('counts strikes past the cap and jumps when a layer opens', () => {
    let s = make()
    for (let i = 0; i < 400; i++) s = landStrike(s, 'jian')
    expect(s.weapons.jian.uses).toBe(400)
    expect(skill(s, 'jian').skill).toBe(10)
    const { sheet, opened } = gainQi(s, 3) // 30 qi
    expect(opened).toBe(1)
    expect(skill(sheet, 'jian').skill).toBe(20)
  })
  it('landStrike does not mutate', () => {
    const s = make()
    landStrike(s, 'fan')
    expect(s.weapons.fan.uses).toBe(0)
  })
})

describe('qi', () => {
  it('adds 10 a move and never falls', () => {
    const a = gainQi(make({ qi: 5 }), 2)
    expect(a.sheet.qi).toBe(25)
    expect(gainQi(a.sheet, 0).sheet.qi).toBe(25)
    expect(gainQi(a.sheet, -4).sheet.qi).toBe(25)
  })
  it('reports layers opened', () => {
    expect(gainQi(make(), 9).opened).toBe(3)
  })
})

describe('stat points', () => {
  it('gives one point a layer to place', () => {
    let s = make({ qi: 60 })
    expect(pointsToPlace(s)).toBe(2)
    s = placePoint(s, 'grace')
    expect(pointsToPlace(s)).toBe(1)
    s = placePoint(s, 'root')
    expect(pointsToPlace(s)).toBe(0)
    expect(placePoint(s, 'might')).toBe(s)
    expect(s.stats).toEqual({ might: 0, grace: 1, root: 1 })
  })
})
