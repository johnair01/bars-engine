/**
 * Run: npx tsx src/lib/council/__tests__/constraint.test.ts
 *
 * The constraint read's wire shape, against the real dated snapshot the council pushed on 2026-11-09: a valid read
 * passes whole, a broken one is refused, and a lane token never sees a lane it was not given.
 */

import { readFileSync } from 'fs'
import { checkSnapshot, laneTokens, READ_KEYS, scoped, shape } from '../constraint'

let fails = 0
function ok(cond: boolean, msg: string) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg)
  if (!cond) fails++
}

const fixture = JSON.parse(readFileSync(new URL('./constraint-snapshot.json', import.meta.url), 'utf8'))

// The real read, as council/tools/constraint.py --json writes it.
const good = checkSnapshot(fixture)
ok(good.ok, 'the 2026-11-09 snapshot passes whole')
if (!good.ok) {
  console.log('  refused because: ' + good.error)
  process.exit(1)
}
const snap = good.snapshot

ok(snap.as_of === '2026-11-09', 'as_of is the snapshot date')
ok(Object.keys(shape(snap)).join() === READ_KEYS.join(), 'the body carries the read\'s keys and nothing else')
ok(!('card_html' in shape(snap)), 'the card is not one of the JSON keys')
ok(snap.constraint.key === snap.lanes[0].key, 'the constraint is the oldest lane')
ok(snap.move.lane === snap.constraint.key, 'the move is aimed at the constraint')

// Weights, one at a time, because a read that ranks on a half-summed unit is the failure this check exists for.
const heavy = { ...fixture, weights: { asks: 0.5, builds: 0.5, dollars_per_hundred: 0.2 } }
ok(!checkSnapshot(heavy).ok, 'weights summing to 1.2 are refused')
const missingWeight = { ...fixture, weights: { asks: 0.5, builds: 0.5 } }
ok(!checkSnapshot(missingWeight).ok, 'a missing weight is refused')

// A move on a lane that is not there means the read and the store disagree.
const stray = { ...fixture, move: { ...fixture.move, lane: 'no-such-lane' } }
ok(!checkSnapshot(stray).ok, 'a move naming a lane that is not in lanes is refused')
const noLanes = { ...fixture, lanes: [] }
ok(!checkSnapshot(noLanes).ok, 'a snapshot with no lanes is refused')
const badDate = { ...fixture, as_of: '2026-02-30' }
ok(!checkSnapshot(badDate).ok, 'an impossible date is refused')
ok(!checkSnapshot(null).ok, 'null is refused')
ok(!checkSnapshot({ ...fixture, unit: 7 }).ok, 'a unit that is not a sentence is refused')

// The whole portfolio, for the council token.
ok(snap.lanes.length > 2, 'the real read carries more than two lanes')

// One lane and the constraint, for a client token.
const own = 'pulls'
const mine = scoped(snap, own)
ok(mine !== null, 'a known lane is served')
if (mine) {
  const lanes = mine.lanes as { key: string }[]
  ok(lanes.every((l) => l.key === own || l.key === snap.constraint.key), 'only the client\'s lane and the constraint')
  ok(lanes.length <= 2, 'at most two lanes')
  ok(mine.lanes_hidden === snap.lanes.length - lanes.length, 'the hidden count matches what was withheld')
  const then = mine.then as { lane: string }[]
  ok(then.every((t) => t.lane === own || t.lane === snap.constraint.key), 'the ranked remainder is cut to those lanes')
  ok(Object.keys(mine).join() === [...READ_KEYS, 'lanes_hidden'].join(), 'a lane token adds lanes_hidden and nothing else')
  const text = JSON.stringify(mine)
  for (const lane of snap.lanes) {
    if (lane.key === own || lane.key === snap.constraint.key) continue
    ok(!text.includes(lane.label), `the withheld lane "${lane.key}" is not named`)
    ok(!text.includes(lane.source), `the withheld lane "${lane.key}" does not leak its source`)
  }
}

ok(scoped(snap, snap.constraint.key) !== null, 'a token on the constraint lane itself is served once')
const itself = scoped(snap, snap.constraint.key) as { lanes: unknown[] }
ok(itself.lanes.length === 1, 'and the constraint is listed once, not twice')

ok(scoped(snap, 'no-such-lane') === null, 'a lane the snapshot does not carry is refused, never widened')

// The lane map: one entry per client, compared against the request's token.
const parsed = laneTokens('{"tok-a":"asks","tok-b":"pulls"}')
ok(Object.keys(parsed.tokens).length === 2 && parsed.tokens['tok-a'] === 'asks', 'the lane map parses token to lane')
ok(parsed.loud.length === 0, 'a good map says nothing')
ok(Object.keys(laneTokens('not json').tokens).length === 0, 'a map that is not JSON opens no lanes')
ok(laneTokens('not json').loud.length === 1, 'and says why')
ok(Object.keys(laneTokens('{"tok-a":""}').tokens).length === 0, 'an entry naming no lane opens nothing')
ok(Object.keys(laneTokens(undefined).tokens).length === 0, 'no map at all opens no lanes')

console.log(fails ? `\n${fails} FAILED` : '\nall passed')
process.exit(fails ? 1 : 0)
