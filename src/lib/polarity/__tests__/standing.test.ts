import assert from 'node:assert'
import { CHALLENGER_DECK } from '../challenger-deck'
import { isLive, keepAct, liveCards, standingFor, TURN_AFTER_KEPT, TURN_LINE, type KeptAct } from '../standing'

const act = (i: number, pole = 'Shielding'): KeptAct => ({ barId: `b${i}`, pole, move: 'wakeUp', at: `2026-11-16T00:00:0${i}Z` })
const many = (n: number, pole = 'Shielding') => Array.from({ length: n }, (_, i) => act(i, pole))

// The deck: 32 cards, 4 live for a new player (It Shielding), the rest sealed; Grow Up cards carry the book note.
assert.strictEqual(CHALLENGER_DECK.length, 32)
const fresh = standingFor([])
assert.deepStrictEqual(fresh.opened, ['Shielding'])
assert.strictEqual(liveCards(fresh).length, 4)
assert.ok(liveCards(fresh).every((c) => c.pole === 'Shielding' && c.prompt))
assert.ok(CHALLENGER_DECK.filter((c) => c.move === 'growUp').every((c) => c.note === '(book to name)'))

// Wording: future action, redeemed by a BAR of the act; never a look-back or an assumed opponent.
const worded = CHALLENGER_DECK.filter((c) => c.prompt)
assert.strictEqual(worded.length, 5) // four Shielding cards + Sparring Wake Up
assert.ok(worded.every((c) => c.redeem && /BAR/.test(c.redeem)))
assert.ok(CHALLENGER_DECK.filter((c) => !c.prompt).every((c) => c.redeem === null))
assert.ok(worded.every((c) => !/\b(did you|today|yesterday|whom did|where did)\b/i.test(c.prompt!)))
assert.match(CHALLENGER_DECK.find((c) => c.pole === 'Sparring' && c.move === 'wakeUp')!.prompt!, /push you/)
// The turn-up card carries its wording and redeem line.
assert.ok(keepAct(many(TURN_AFTER_KEPT - 1), act(9)).turned!.card.redeem)

// Never after one: a single kept act, or any count under the setting, opens nothing.
assert.deepStrictEqual(standingFor(many(1)).opened, ['Shielding'])
assert.deepStrictEqual(standingFor(many(TURN_AFTER_KEPT - 1)).opened, ['Shielding'])

// Enough kept acts open Sparring BESIDE Shielding, for that player; Shielding stays live.
const turned = standingFor(many(TURN_AFTER_KEPT))
assert.deepStrictEqual(turned.opened, ['Shielding', 'Sparring'])
assert.strictEqual(liveCards(turned).length, 8)

// One-way: more acts never close either pole.
assert.deepStrictEqual(standingFor(many(TURN_AFTER_KEPT + 20)).opened, ['Shielding', 'Sparring'])

// For that player only: another player's standing is separate.
assert.deepStrictEqual(standingFor([]).opened, ['Shielding'])

// Each pole builds its own count: Sparring acts alone do not turn a player who never kept Shielding acts.
assert.deepStrictEqual(standingFor(many(TURN_AFTER_KEPT * 2, 'Sparring')).opened, ['Shielding'])
// ...unless the other-pole question is ruled yes (threshold and flag are arguments for that walk).
assert.deepStrictEqual(
  standingFor(many(3, 'Sparring'), { held: 'Shielding', other: 'Sparring' }, 3, true).opened,
  ['Shielding', 'Sparring'],
)

// The keep path: the turn shows as a card in the hand, with no number; nothing before it.
let kept: KeptAct[] = []
for (let i = 0; i < TURN_AFTER_KEPT - 1; i++) {
  const r = keepAct(kept, act(i))
  assert.strictEqual(r.turned, null)
  kept = [...kept, act(i)]
}
const last = keepAct(kept, act(TURN_AFTER_KEPT))
assert.ok(last.turned)
assert.strictEqual(last.turned!.line, TURN_LINE)
assert.strictEqual(last.turned!.card.pole, 'Sparring')
assert.strictEqual(last.turned!.card.move, 'wakeUp')
assert.ok(isLive(last.turned!.card, last.standing))
// After it has turned, a further keep turns nothing again.
assert.strictEqual(keepAct([...kept, act(TURN_AFTER_KEPT)], act(TURN_AFTER_KEPT + 1)).turned, null)
// Nothing returned to the player carries a count.
assert.deepStrictEqual(Object.keys(last.standing), ['opened'])

// Kept cards stay in the deck.
assert.strictEqual(CHALLENGER_DECK.length, 32)
console.log('standing tests passed')
