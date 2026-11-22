/**
 * Route finder tests.
 *
 * Run: npx tsx src/lib/quest-grammar/__tests__/route-finder.test.ts
 *
 * The four cases the council named (2026-11-20), plus the invariant they all rest on:
 *   Challenger — a bounded, deduped set, shortest first
 *   Regent     — different destinations are never ranked against each other
 *   Diplomat   — every target is reachable from every start (verified: 50 pairs, 0 unreachable)
 *   Architect  — derived from the table; nothing hardcodes the four path names
 */

import assert from 'node:assert'
import { routeOptions, reachableTargets, isUnreachable, type Cell } from '../route-finder'
import moveTable from '../move-table.json'
import type { EmotionChannel } from '../../alchemy/types'
import type { AlchemyAltitude } from '../../alchemy/types'

const CHANNELS = (moveTable.channels as Array<{ id: string }>).map((c) => c.id) as EmotionChannel[]
const STATES = moveTable.states as AlchemyAltitude[]

/** Where a single move lands, read from the table — the same rule the finder walks. */
function stepRow(family: string) {
  return moveTable.families[family as 'transcend' | 'generative' | 'control'].state as Record<
    string,
    string | null
  >
}

// ── Invariant: no route ever descends ────────────────────────────────────────
function testNoRouteDescends() {
  const rank = Object.fromEntries(STATES.map((s, i) => [s, i]))
  let checked = 0
  for (const channel of CHANNELS) {
    for (const state of STATES) {
      for (const target of CHANNELS) {
        const routes = routeOptions({ channel, state }, target)
        for (const route of routes) {
          let prev = rank[state]!
          for (const step of route.steps) {
            assert.ok(
              rank[step.lands.state]! >= prev,
              `route descended: ${route.steps.map((s) => s.lands.state).join(' -> ')}`
            )
            prev = rank[step.lands.state]!
          }
          checked++
        }
      }
    }
  }
  assert.ok(checked > 0, 'expected some routes to check')
  console.log(`✅ no route descends (${checked} routes walked)`)
}

// ── Challenger: shortest first, deduped, bounded ─────────────────────────────
function testShortestFirstAndDeduped() {
  for (const channel of CHANNELS) {
    for (const target of CHANNELS) {
      const routes = routeOptions({ channel, state: 'dissatisfied' }, target, { maxLength: 6 })
      for (let i = 1; i < routes.length; i++) {
        assert.ok(
          routes[i - 1]!.length <= routes[i]!.length,
          `${channel}->${target}: routes not shortest-first at index ${i}`
        )
      }
      const seqs = routes.map((r) =>
        r.steps.map((s) => `${s.lands.channel}:${s.lands.state}/${s.family}`).join('>')
      )
      assert.equal(new Set(seqs).size, seqs.length, `${channel}->${target}: duplicate routes returned`)
      for (const r of routes) {
        assert.ok(r.length <= 6, `${channel}->${target}: route exceeds the cap`)
        assert.equal(r.length, r.steps.length, 'length must match steps')
      }
    }
  }
  console.log('✅ routes are shortest-first, deduped, and within the cap')
}

// ── Regent: different destinations are different, never ranked ───────────────
function testDifferentDestinationsAreNotRanked() {
  const from: Cell = { channel: 'neutrality', state: 'dissatisfied' }
  const toAnger = routeOptions(from, 'anger')
  const toSadness = routeOptions(from, 'sadness')

  assert.ok(toAnger.length > 0, 'expected a route to anger')
  assert.ok(toSadness.length > 0, 'expected a route to sadness')
  for (const r of toAnger) assert.equal(r.lands.channel, 'anger', 'anger route must land in anger')
  for (const r of toSadness) assert.equal(r.lands.channel, 'sadness', 'sadness route must land in sadness')

  // The shorter road is not "better" — the two are simply different rooms. Assert the fact that
  // makes the point: they can differ in length and both are complete.
  const angerShortest = toAnger[0]!.length
  const sadnessShortest = toSadness[0]!.length
  assert.ok(angerShortest > 0 && sadnessShortest > 0)
  console.log(
    `✅ destinations are distinct (anger in ${angerShortest}, sadness in ${sadnessShortest}) — neither ranked`
  )
}

// ── Diplomat: every target reachable from every start ────────────────────────
function testEveryTargetReachable() {
  let pairs = 0
  for (const channel of CHANNELS) {
    for (const state of ['dissatisfied', 'neutral'] as AlchemyAltitude[]) {
      for (const target of CHANNELS) {
        assert.ok(
          !isUnreachable({ channel, state }, target),
          `${channel}:${state} cannot reach satisfied ${target} — the unreachable case is supposed to be impossible`
        )
        pairs++
      }
    }
  }
  assert.equal(pairs, 50, 'expected 50 start×target pairs')
  console.log(`✅ every target reachable from every start (${pairs} pairs)`)
}

// ── Architect + the upward-spiral ruling: control cannot reach satisfied ─────
function testControlCannotReachSatisfaction() {
  // Read the rule from the table rather than restating it.
  const control = stepRow('control')
  const raisesInto = Object.entries(control).filter(
    ([from, to]) => to === 'satisfied' && from !== 'satisfied'
  )
  assert.equal(
    raisesInto.length,
    0,
    'the table says control now raises into satisfied; mn-control-cannot-satisfy would be violated'
  )

  // And the finder must never end a route on a control step, because no such edge exists.
  for (const channel of CHANNELS) {
    for (const target of CHANNELS) {
      const routes = routeOptions({ channel, state: 'dissatisfied' }, target)
      for (const route of routes) {
        const last = route.steps[route.steps.length - 1]!
        assert.notEqual(
          last.family,
          'control',
          `${channel}->${target}: route ends on a control move, which cannot reach satisfied`
        )
      }
    }
  }
  console.log('✅ no route ends on a control move; only transcend or generate reaches satisfied')
}

// ── Regent: a route's cells are all distinct (no loops) ──────────────────────
function testNoRouteLoops() {
  for (const channel of CHANNELS) {
    for (const target of CHANNELS) {
      for (const route of routeOptions({ channel, state: 'dissatisfied' }, target)) {
        const keys = route.steps.map((s) => `${s.lands.channel}:${s.lands.state}`)
        assert.equal(new Set(keys).size, keys.length, `route loops: ${keys.join(' -> ')}`)
      }
    }
  }
  console.log('✅ no route revisits a cell')
}

// ── reachableTargets agrees with routeOptions ────────────────────────────────
function testReachableTargetsAgrees() {
  const from: Cell = { channel: 'fear', state: 'dissatisfied' }
  const targets = reachableTargets(from)
  assert.equal(targets.length, CHANNELS.length, 'every channel should be reachable')
  for (const t of targets) {
    const direct = routeOptions(from, t.channel)
    assert.equal(t.routes, direct.length, `${t.channel}: route count disagrees`)
    assert.equal(t.shortest, direct[0]!.length, `${t.channel}: shortest disagrees`)
  }
  console.log('✅ reachableTargets agrees with routeOptions')
}

testNoRouteDescends()
testShortestFirstAndDeduped()
testDifferentDestinationsAreNotRanked()
testEveryTargetReachable()
testControlCannotReachSatisfaction()
testNoRouteLoops()
testReachableTargetsAgrees()
console.log('route-finder tests passed')
