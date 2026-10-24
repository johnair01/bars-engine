import assert from 'node:assert/strict'
// The portable modules the Cave of Lessons and Big Mind take as they are (public/calrunia, relationship-creature brief).
import { colorsOf, DEFAULT_LOOK, DYED, KEYS, lookText, mixHex, optionsOf, parseLook, randomLook, SKINS } from '../../../../public/calrunia/look.js'
import { applyStyle, DEFAULT_STYLE, STYLES, styleOf } from '../../../../public/calrunia/room-styles.js'
import { LANES, suggest } from '../../../../public/calrunia/next-moves.js'
import { castable, SPELLS } from '../../../../public/calrunia/spellbook.js'
import { careNow, careOf, feed, WAVE_STEPS } from '../../../../public/calrunia/spirit-care.js'

function testLookRoundTrips() {
  const t = 'a.average.light.afro.black.coat.violet' // sprout creator's default look text
  assert.deepEqual(parseLook(t), DEFAULT_LOOK)
  assert.equal(lookText(parseLook(t)!), t)
  // every choice in every row survives the trip
  for (const k of KEYS) for (const o of optionsOf(k)) {
    const l = { ...DEFAULT_LOOK, [k]: o.id }
    assert.deepEqual(parseLook(lookText(l)), l, k + '=' + o.id)
  }
  for (const bad of ['', 'a.average', 'z.average.light.afro.black.coat.violet', 'a.average.light.afro.black.coat.violet.extra', 'a.average.pink.afro.black.coat.violet', null])
    assert.equal(parseLook(bad), null, String(bad))
  let n = 0
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 50; i++) assert.ok(parseLook(lookText(randomLook(rnd))), 'Choose for me always gives a real look')
}

function testLookColours() {
  assert.equal(SKINS.length, 8, 'eight river stones')
  assert.deepEqual(SKINS.map(s => s.id), ['light', 'fawn', 'amber', 'olive', 'chestnut', 'brown', 'umber', 'black'])
  assert.equal(SKINS.find(s => s.id === 'fawn')!.swatch, mixHex('#e4a47c', '#ae6b3f'))
  const c = colorsOf('b.round.chestnut.page.red.coat.saffron')!
  assert.equal(c.skin, mixHex('#ea9f54', '#76513a')); assert.equal(c.hair, '#cb0000'); assert.deepEqual(c.cloth, DYED.saffron.coat)
  assert.equal(colorsOf('nonsense'), null)
}

// Stand-ins for three.js objects: only the setters applyStyle calls.
const col = () => ({ hex: -1, setHex(h: number) { this.hex = h } })
const vec = () => ({ v: [] as number[], set(...a: number[]) { this.v = a } })
function handles() {
  const light = () => ({ color: col(), intensity: 0 })
  return {
    sky: { uniforms: { uTop: { value: vec() }, uMid: { value: vec() }, uLow: { value: vec() }, uHor: { value: vec() } } },
    sun: { material: { color: col() } }, stars: { opacity: 0, visible: true },
    lights: { hemi: { ...light(), groundColor: col() }, dusk: light(), rim: light(), fire: light() },
    lanterns: [{ light: light() }, { light: light() }], base: { hemi: 0.55, fire: 16, lantern: 7 },
    scene: { background: col(), fog: { color: col(), near: 0, far: 0 } },
    land: { ranges: [{ color: col() }, { color: col() }, { color: col() }, { color: col() }], valley: { color: col() }, river: { color: col() }, pines: { color: col() } },
    rain: { visible: false },
  }
}

function testStyles() {
  assert.ok(STYLES.length >= 3 && STYLES.length <= 4)
  assert.equal(styleOf('nope').id, DEFAULT_STYLE, 'an unknown style opens as the default')
  const dusk = styleOf('dusk-hollow')
  // Dusk hollow is the hollow as it was (public/between/hollow.js and garden.js before styles)
  assert.deepEqual(dusk.sky.top, [0.17, 0.12, 0.36]); assert.equal(dusk.fire.strength, 16); assert.equal(dusk.lantern.strength, 7)
  assert.equal(dusk.hemi.strength, 0.55); assert.equal(dusk.background, 0x1a1018)
  const h = handles()
  applyStyle(h, 'moonlit')
  const m = styleOf('moonlit')
  assert.deepEqual(h.sky.uniforms.uTop.value.v, m.sky.top)
  assert.equal(h.lights.fire.color.hex, m.fire.color); assert.equal(h.base.fire, m.fire.strength)
  assert.equal(h.lanterns[1].light.color.hex, m.lantern.color); assert.equal(h.scene.fog.far, m.fog.far)
  assert.equal(h.stars.opacity, 1)
  applyStyle(h, 'spring-morning'); assert.equal(h.stars.visible, false, 'no stars in the morning')
  const sp = styleOf('spring-morning'); assert.equal(h.land.ranges[3].color.hex, sp.land.ranges[3]); assert.equal(h.land.pines.color.hex, sp.land.pines)
  assert.equal(h.rain.visible, false)
  applyStyle(h, 'ember-rain'); assert.equal(h.rain.visible, true, 'rain falls past the opening')
  applyStyle(h, 'dusk-hollow'); assert.equal(h.rain.visible, false)
  // Dusk hollow leaves the valley as hollow.js draws it: its first range, its floor, and white over river and pines
  assert.equal(h.land.ranges[0].color.hex, 0x9a7cb0); assert.equal(h.land.valley.color.hex, 0x1f2c40); assert.equal(h.land.river.color.hex, 0xffffff)
  applyStyle({}, 'ember-rain') // a scene with no handles is left alone
  assert.equal(styleOf('ember-rain').weather, 'rain')
}

function testNextMoves() {
  const DAY = 864e5, now = new Date(2026, 9, 23, 18).getTime()
  const base = { phase: 'between', who: 'Ari', person: 'B', stale: false, joinWaiting: false, waiting: [], revisit: [], invitations: [], hereNow: false, lastSatTogether: now - DAY }
  // nothing done today, no goals, nobody waiting: check in with yourself
  let m = suggest({ home: { lastCheckin: null, goals: [] }, rooms: [base] }, now)
  assert.deepEqual(m.map(x => x.lane), ['yourself'])
  assert.equal(m[0].act, 'checkin')
  m = suggest({ home: { lastCheckin: now - 3600e3, goals: [] }, rooms: [] }, now)
  assert.equal(m[0].id, 'goals')
  assert.equal(suggest({ home: { lastCheckin: now, goals: [{ id: 'g' }] }, rooms: [] }, now).length, 0)
  // at most one per lane, in lane order
  const busy = { ...base, id: 'r1', stale: true, waiting: [{ id: 'l', what: 'lantern' }, { id: 'a', what: 'agreement' }], revisit: ['x'], invitations: [{ id: 's1', when: null, note: '' }] }
  m = suggest({ home: { lastCheckin: null, goals: [] }, rooms: [busy] }, now)
  assert.deepEqual(m.map(x => x.lane), LANES)
  assert.equal(m[1].id, 'lantern:r1'); assert.equal(m[2].id, 'invite:r1:s1')
  assert.equal(m[1].act, 'room:r1', 'from the homeroom, a move goes to the room')
  m = suggest({ rooms: [busy], here: 'r1' }, now)
  assert.equal(m[0].lane, 'between'); assert.equal(m[1].act, 'invitations', 'inside the room, a move opens a sheet')
  // the partner lane walks down: waiting, revisit, here now, not sat this week
  const p = (r: object) => suggest({ rooms: [{ ...base, id: 'r', ...r }] }, now).find(x => x.lane === 'partner')
  assert.equal(p({ waiting: [{ id: 'o', what: 'offer' }] })!.id, 'wait:r:o')
  assert.equal(p({ revisit: ['a'] })!.id, 'revisit:r')
  assert.equal(p({ styleAsk: { style: 'moonlit', at: 1 }, waiting: [{ id: 'o', what: 'offer' }] })!.id, 'style:r', 'their ask to change the room comes before what waits')
  assert.equal(suggest({ rooms: [{ ...base, id: 'r', styleAsk: { style: 'moonlit', at: 1 } }], here: 'r' }, now).find(x => x.lane === 'partner')!.act, 'style')
  assert.equal(p({ hereNow: true })!.id, 'here:r')
  assert.equal(p({ lastSatTogether: now - 8 * DAY })!.id, 'sit:r')
  assert.equal(p({}), undefined)
  assert.equal(p({ phase: 'spark', person: null, hereNow: true }), undefined, 'a spark has no partner yet')
  // never a count or a score
  for (const x of suggest({ home: { lastCheckin: null, goals: [] }, rooms: [busy, { ...busy, id: 'r2' }] }, now))
    assert.ok(!/\d/.test(x.title + x.line), x.line)
}

function testSpellbook() {
  assert.deepEqual(SPELLS.map(s => s.kind), ['solo', 'dual', 'async-dual'])
  const [solo, dual, async] = SPELLS
  assert.equal(castable(solo, {}).ok, false, 'spells start from the cushion')
  assert.equal(castable(solo, { sitting: true }).ok, true)
  assert.equal(castable(dual, { sitting: true, otherSitting: true }).ok, false, 'dual needs a sit invitation said yes')
  assert.equal(castable(dual, { sitting: true, sitAccepted: true }).ok, false, 'and both on cushions')
  assert.equal(castable(dual, { sitting: true, otherSitting: true, sitAccepted: true }).ok, true)
  assert.deepEqual(castable(async, { sitting: true }), { ok: true, finishes: false })
  assert.deepEqual(castable(async, { sitting: true, started: true }), { ok: true, finishes: true })
  assert.equal(castable('nope', { sitting: true }).ok, false)
}

function testSpiritCare() {
  assert.deepEqual(WAVE_STEPS.map(s => s.id), ['welcome', 'acknowledge', 'allow', 'accept', 'appreciate', 'validate', 'exhale'])
  assert.equal(WAVE_STEPS[0].line, "Let whatever's here be here for a moment, without needing it to be different yet.")
  const D = 864e5, t0 = 10 * D
  assert.deepEqual(careOf(null), { sat: 7, vit: 100, at: null }, 'a new spirit starts at 7 and 100')
  assert.deepEqual(careOf({ sat: 40, vit: -5, at: 3 }), { sat: 10, vit: 0, at: 3 }, 'kept in bounds')
  const c = { sat: 7, vit: 100, at: t0 }
  assert.equal(careNow(c, t0).word, 'thriving')
  assert.deepEqual(careNow(c, t0 + 2 * D), { sat: 7, vit: 90, days: 2, word: 'thriving' }, 'vitality falls 5 a day')
  assert.equal(careNow(c, t0 + 3 * D).sat, 6, 'a point of satisfaction every third untended day')
  assert.equal(careNow(c, t0 + 6 * D).word, 'dimming')
  const low = careNow(c, t0 + 12 * D)
  assert.equal(low.sat, 3); assert.equal(low.word, 'unsettled', 'low satisfaction is unsettled, never corrupted')
  assert.equal(careNow(c, t0 + 200 * D).sat, 1); assert.equal(careNow(c, t0 + 200 * D).vit, 0)
  assert.equal(careNow({}, t0 + 50 * D).word, 'thriving', 'a spirit never tended has no untended days to count')
  assert.deepEqual(feed(c, 'water', 'Fire', t0), { sat: 8, vit: 100, at: t0 }, 'care adds one, vitality caps at 100')
  assert.deepEqual(feed(c, 'fire', 'Fire', t0), { sat: 9, vit: 100, at: t0 }, 'its own element feeds it twice over')
  assert.deepEqual(feed({ sat: 10, vit: 30, at: t0 }, 'wood', 'Wood', t0), { sat: 10, vit: 50, at: t0 })
  const later = feed(c, 'earth', 'Metal', t0 + 6 * D)
  assert.deepEqual(later, { sat: 6, vit: 90, at: t0 + 6 * D }, 'feeding starts from the decayed care')
  assert.equal(careNow(later, t0 + 6 * D).days, 0, 'and resets the untended days')
}

testLookRoundTrips()
testLookColours()
testStyles()
testNextMoves()
testSpellbook()
testSpiritCare()
console.log('calrunia modules: all passed')
