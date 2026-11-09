/**
 * charge-engine parity test: the shared engine (public/calrunia/charge-engine.js) against the first game's rules.
 * Run: npx tsx src/lib/quest-grammar/__tests__/charge-engine.test.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
// @ts-expect-error plain ES module with no types
import * as E from '../../../../public/calrunia/charge-engine.js'
import table from '../move-table.json'

const game = fs.readFileSync(path.resolve(__dirname, '../../../../content/ontology-game/game.jsx'), 'utf8')

// Step order and rungs: the same as game.jsx's WAVE_STEPS.
const block = game.slice(game.indexOf('const WAVE_STEPS = ['), game.indexOf('const WAVE_STEP_LABEL'))
const gameSteps = [...block.matchAll(/\{ id: "(\w+)"(.*?)(?=\n\s*\{ id:|\n\s*\];)/gs)].map((m) => ({ id: m[1], rung: /rung: true/.test(m[2]) }))
assert.deepEqual(E.WAVE_STEPS.map((s: { id: string }) => s.id), gameSteps.map((s) => s.id))
assert.deepEqual(E.WAVE_STEPS.filter((s: { rung?: boolean }) => s.rung).map((s: { id: string }) => s.id), gameSteps.filter((s) => s.rung).map((s) => s.id))

// Routing table: same as game.jsx and the move table.
for (const [cycle, family] of [['sheng', 'generative'], ['ke', 'control']] as const) {
  const m = game.match(new RegExp(`${cycle}: \\{ dissatisfied: "(\\w+)", neutral: "(\\w+)", satisfied: "(\\w+)" \\}`))!
  assert.deepEqual(table.states.map((s) => E.ROUTING[cycle][s]), m.slice(1, 4), cycle)
  assert.deepEqual(table.states.map((s) => E.ROUTING[cycle][s]), table.states.map((s) => (table.families as any)[family].state[s]), cycle)
}
// Cycles: the engine's copy equals the table.
assert.deepEqual(E.CYCLES, table.cycles)
// The public copy of the table equals the src copy.
assert.deepEqual(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../public/calrunia/move-table.json'), 'utf8')), table)
// Every move id the engine makes exists in the table with the same ends.
for (const fam of ['sheng', 'ke'] as const) for (const [a, b] of Object.entries(E.CYCLES[fam]) as [string, string][]) {
  const el = Object.fromEntries(table.channels.map((c) => [c.id, c.element]))
  const m = table.moves.find((x) => x.id === `${el[a]}_${el[b]}`)
  assert.ok(m && m.from === a && m.to === b, `${fam} ${a}->${b}`)
}

// Names.
for (const n of ['neutral', 'neutrality', 'Neutrality', 'earth']) assert.equal(E.channelOf(n), 'neutral')
assert.equal(E.channelOf('water'), 'sadness')
assert.equal(E.tableChannel('neutral'), 'neutrality')
assert.throws(() => E.startCharge({ channel: 'rage', intensity: 3 }, 0))
assert.throws(() => E.startCharge({ channel: 'fear', intensity: 11 }, 0))

// The scripted charge: fear 7 toward, block on Allow, release, one sheng move.
const T = 1000, IN_OUT = E.BREATH.inMs + E.BREATH.outMs
let t = 0
let c = E.startCharge({ channel: 'fear', intensity: 7, direction: 'toward', body: 'tight behind the sternum', goal: null }, t)
assert.equal(c.state, 'dissatisfied'); assert.equal(c.wave.step, 'welcome')
assert.throws(() => E.nextStep(c, t + 100), /breath/)
assert.equal(E.breathOf(c, t + 1000).phase, 'in'); assert.equal(E.breathOf(c, t + 5000).phase, 'out')
t += IN_OUT; c = E.nextStep(c, t); assert.equal(c.wave.step, 'acknowledge')
t += IN_OUT; c = E.nextStep(c, t); assert.equal(c.wave.step, 'allow')
assert.throws(() => E.stopAtRung(E.startCharge({ channel: 'joy', intensity: 1 }, 0), 1))
c = E.openBlock(c, { size: 3, words: 'a stone in my chest' }, t + T)
c = E.openBlock(c, { size: 1, words: 'inner' }, t + T)
c = E.returnFromBlock(c, 'left', t + 2 * T); assert.equal(c.blockStack.length, 1)
c = E.returnFromBlock(c, 'cleared', t + 3 * T)
assert.equal(c.wave.step, 'allow'); assert.equal(c.blockStack.length, 0); assert.equal(c.wave.stepAt, t + 3 * T)
assert.throws(() => E.returnFromBlock(c, 'left', t))
assert.deepEqual(c.route.map((r: { kind: string }) => r.kind), ['block-open', 'block-open', 'block-return', 'block-return'])
t += 3 * T
for (const want of ['accept', 'appreciate', 'validate', 'exhale']) { t += IN_OUT; c = E.nextStep(c, t, want === 'exhale' ? { skipBreath: true } : {}); assert.equal(c.wave.step, want) }
assert.throws(() => E.scan(c, {}, t)); assert.throws(() => E.move(c, 'sheng', t))
c = E.exhale(c, 'release', t); assert.equal(c.wave.step, 'scan')
c = E.scan(c, { location: 'chest', texture: 'warm' }, t); assert.equal(c.wave.step, 'done')
c = E.move(c, 'sheng', t)
assert.equal(c.state, 'neutral')
assert.equal(c.moveChannel, 'sadness')
assert.deepEqual(E.emberOf(c), { feel: 'water', from: 'metal', to: 'water', by: 'metal_water' })
assert.equal(E.toRecord(c).reading.body, 'tight behind the sternum')

// No move: the ember stays where it began.
let d = E.startCharge({ channel: 'fear', intensity: 4 }, 0)
d = E.nextStep(d, 0, { skipBreath: true }); d = E.nextStep(d, 0, { skipBreath: true }); d = E.stopAtRung(d, 5)
assert.equal(d.wave.step, 'exhale'); assert.ok(d.wave.stoppedAtRung); assert.equal(d.wave.rungReached, 'allow')
d = E.scan(E.exhale(d, 'stay', 6), { location: 'a', texture: 'b' }, 7)
assert.deepEqual(E.emberOf(d), { feel: 'metal', from: 'metal', to: 'metal', by: 'wave' })
console.log('charge-engine: ok')
