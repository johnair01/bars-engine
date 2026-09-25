/**
 * Goodbye Yellow Brick Road — projection and time-gate tests.
 *
 *   npx tsx src/lib/goodbye-party/__tests__/party-one-shot.test.ts
 *
 * Covers the mechanics that have no second chance on the night: the 8 PM deal,
 * hand replenishment, no-repeat-within-a-cycle, the midnight gate, and the
 * 20-minute Game Master schedule.
 */

import assert from 'node:assert/strict'
import {
  deriveAchievements,
  deriveBoardPlays,
  deriveGmState,
  deriveHandState,
  drawablePool,
  planDraws,
  type GameEvent,
} from '../events'
import {
  PARTY_START_MS,
  SPICY_UNLOCK_MS,
  gmSlotsUnlockedByClock,
  isPartyStarted,
  isSpicyPlayUnlocked,
} from '../time'
import { GM_SLOTS } from '../data/party'
import { ACHIEVEMENT_FAMILIES, GM_SLOT_COUNT, HAND_SIZE } from '../config'
import { getReading, getReadingAchievement, playableCardIds } from '../interpretations'

let seq = 0
const t0 = new Date('2026-08-15T20:00:00-07:00').getTime()

function event(type: string, cardId: string | null, payload: Record<string, unknown> = {}): GameEvent {
  seq += 1
  return {
    id: `e${seq}`,
    playerId: 'p1',
    type,
    cardId,
    payloadJson: payload,
    createdAt: new Date(t0 + seq * 1000),
  }
}

const tests: [string, () => void][] = []
function test(name: string, fn: () => void) {
  tests.push([name, fn])
}

// ── Time gates ──────────────────────────────────────────────────────────────

test('party starts exactly at 8:00 PM PDT, not a minute before', () => {
  assert.equal(isPartyStarted(PARTY_START_MS - 60_000), false, '7:59 PM')
  assert.equal(isPartyStarted(PARTY_START_MS), true, '8:00 PM')
  assert.equal(isPartyStarted(PARTY_START_MS + 60_000), true, '8:01 PM')
})

test('spicy play unlocks exactly at midnight, browsing is never gated by it', () => {
  assert.equal(isSpicyPlayUnlocked(SPICY_UNLOCK_MS - 60_000), false, '11:59 PM')
  assert.equal(isSpicyPlayUnlocked(SPICY_UNLOCK_MS), true, '12:00 AM')
  // The gate sits 4 hours after the start — the 12 GM slots all land before it.
  assert.equal(SPICY_UNLOCK_MS - PARTY_START_MS, 4 * 60 * 60 * 1000)
})

test('GM slots unlock on the 20-minute wall clock', () => {
  assert.equal(gmSlotsUnlockedByClock(PARTY_START_MS - 1), 0, '7:59 PM: nothing')
  assert.equal(gmSlotsUnlockedByClock(PARTY_START_MS), 1, '8:00 PM: slot 1')
  assert.equal(gmSlotsUnlockedByClock(PARTY_START_MS + 19 * 60_000), 1, '8:19 PM: still 1')
  assert.equal(gmSlotsUnlockedByClock(PARTY_START_MS + 20 * 60_000), 2, '8:20 PM: slot 2')
  assert.equal(gmSlotsUnlockedByClock(PARTY_START_MS + 220 * 60_000), 12, '11:40 PM: slot 12')
  assert.equal(gmSlotsUnlockedByClock(PARTY_START_MS + 600 * 60_000), 12, 'never exceeds 12')
})

test('the GM deck has 12 slots at the specified times', () => {
  assert.equal(GM_SLOTS.length, GM_SLOT_COUNT)
  const labels = GM_SLOTS.map((slot) => slot.timeLabel)
  assert.deepEqual(labels, [
    '8:00 PM', '8:20 PM', '8:40 PM', '9:00 PM', '9:20 PM', '9:40 PM',
    '10:00 PM', '10:20 PM', '10:40 PM', '11:00 PM', '11:20 PM', '11:40 PM',
  ])
})

// ── Hand projection ─────────────────────────────────────────────────────────

test('no events means no hand — browsing before 8 PM changes nothing', () => {
  const state = deriveHandState([])
  assert.deepEqual(state.hand, [])
  assert.equal(state.cycle, 1)
  assert.equal(state.resolvedCount, 0)
})

test('the opening deal is exactly three unique cards', () => {
  const corpus = ['A', 'B', 'C', 'D', 'E']
  const draws = planDraws(deriveHandState([]), corpus, (pool) => pool[0])
  assert.equal(draws.length, HAND_SIZE)
  assert.deepEqual(draws.map((d) => d.cardId), ['A', 'B', 'C'])
  assert.deepEqual(new Set(draws.map((d) => d.cardId)).size, HAND_SIZE)
})

test('play and discard both resolve the card and free a slot', () => {
  const events = [
    event('card_drawn', 'A', { cycle: 1 }),
    event('card_drawn', 'B', { cycle: 1 }),
    event('card_drawn', 'C', { cycle: 1 }),
    event('card_played', 'A', { cycle: 1 }),
    event('card_discarded', 'B', { cycle: 1 }),
  ]
  const state = deriveHandState(events)
  assert.deepEqual(state.hand, ['C'])
  assert.equal(state.resolvedCount, 2)
})

test('replenishment brings the hand back to three without repeating a resolved card', () => {
  const corpus = ['A', 'B', 'C', 'D', 'E']
  const events = [
    event('card_drawn', 'A', { cycle: 1 }),
    event('card_drawn', 'B', { cycle: 1 }),
    event('card_drawn', 'C', { cycle: 1 }),
    event('card_played', 'A', { cycle: 1 }),
  ]
  const state = deriveHandState(events)
  const draws = planDraws(state, corpus, (pool) => pool[0])
  assert.equal(draws.length, 1)
  assert.equal(draws[0].cardId, 'D', 'A was already encountered this cycle')
  assert.equal(draws[0].cycle, 1)
})

test('a card never reappears for the same player before the corpus is exhausted', () => {
  const corpus = ['A', 'B', 'C', 'D', 'E', 'F']
  let events: GameEvent[] = []
  const seen: string[] = []

  // Play through the whole corpus one card at a time.
  for (let i = 0; i < corpus.length; i += 1) {
    const state = deriveHandState(events)
    const draws = planDraws(state, corpus, (pool) => pool[0])
    for (const draw of draws) {
      seen.push(draw.cardId)
      events = [...events, event('card_drawn', draw.cardId, { cycle: draw.cycle })]
    }
    const held = deriveHandState(events).hand
    events = [...events, event('card_played', held[0], { cycle: 1 })]
  }

  const firstCycleDraws = seen.slice(0, corpus.length)
  assert.equal(
    new Set(firstCycleDraws).size,
    corpus.length,
    'every card in the cycle was distinct',
  )
})

test('the cycle advances only after the corpus runs out, and held cards do not double up', () => {
  const corpus = ['A', 'B', 'C', 'D']
  // A, B, C drawn; A and B resolved; D drawn. Corpus exhausted, hand = C, D.
  const events = [
    event('card_drawn', 'A', { cycle: 1 }),
    event('card_drawn', 'B', { cycle: 1 }),
    event('card_drawn', 'C', { cycle: 1 }),
    event('card_played', 'A', { cycle: 1 }),
    event('card_drawn', 'D', { cycle: 1 }),
    event('card_discarded', 'B', { cycle: 1 }),
  ]
  const state = deriveHandState(events)
  assert.deepEqual(state.hand, ['C', 'D'])
  assert.deepEqual(drawablePool(state, corpus), [], 'corpus exhausted for cycle 1')

  const draws = planDraws(state, corpus, (pool) => pool[0])
  assert.equal(draws.length, 1)
  assert.equal(draws[0].cycle, 2, 'cycle advanced')
  assert.ok(!['C', 'D'].includes(draws[0].cardId), 'held cards cannot be dealt again')
})

test('a card held across a cycle boundary stays blocked in the new cycle', () => {
  const corpus = ['A', 'B', 'C', 'D']
  const events = [
    event('card_drawn', 'A', { cycle: 1 }),
    event('card_drawn', 'B', { cycle: 1 }),
    event('card_drawn', 'C', { cycle: 1 }),
    event('card_played', 'A', { cycle: 1 }),
    event('card_drawn', 'D', { cycle: 1 }),
    event('card_played', 'B', { cycle: 1 }),
    // Cycle 2 opens; C and D are still held.
    event('card_drawn', 'A', { cycle: 2 }),
  ]
  const state = deriveHandState(events)
  assert.equal(state.cycle, 2)
  assert.deepEqual(state.hand.sort(), ['A', 'C', 'D'])
  assert.deepEqual(
    drawablePool(state, corpus),
    ['B'],
    'only B is drawable — C and D are held, A was just drawn',
  )
})

// ── Board ───────────────────────────────────────────────────────────────────

test('a play stays active until its own completion, and plays are distinct per player', () => {
  const p1Play = event('card_played', 'A', { cycle: 1, lens: 'goodbye', depth: 'easy' })
  const p2Play = { ...event('card_played', 'A', { cycle: 1, lens: 'goodbye', depth: 'easy' }), playerId: 'p2' }
  const completion = event('card_completed', 'A', { playEventId: p1Play.id })

  const board = deriveBoardPlays([p1Play, p2Play, completion])
  assert.deepEqual(board.active, [p2Play.id], 'only the uncompleted play stays active')
  assert.equal(board.completed.has(p1Play.id), true)
  assert.equal(board.completed.has(p2Play.id), false, 'same card, different play, untouched')
})

test('a host hide removes a play from the board', () => {
  const play = event('card_played', 'A', { lens: 'goodbye', depth: 'easy' })
  const hide = event('host_override', null, { action: 'hide_play', playEventId: play.id })
  const board = deriveBoardPlays([play, hide])
  assert.deepEqual(board.active, [])
  assert.equal(board.hidden.has(play.id), true)
})

test('cards may stay active forever — nothing expires them', () => {
  const plays = [event('card_played', 'A', {}), event('card_played', 'B', {})]
  assert.equal(deriveBoardPlays(plays).active.length, 2)
})

// ── GM state ────────────────────────────────────────────────────────────────

test('host early-unlock beats the clock and never re-locks', () => {
  const unlock = event('gm_card_unlocked', null, { slot: 5, early: true })
  const state = deriveGmState([unlock], 2, GM_SLOT_COUNT)
  assert.equal(state.unlockedCount, 5)
  // Later, the clock catches up and passes it.
  assert.equal(deriveGmState([unlock], 8, GM_SLOT_COUNT).unlockedCount, 8)
})

test('featured card defaults to the newest unlocked slot and cannot point past it', () => {
  assert.equal(deriveGmState([], 3, GM_SLOT_COUNT).featuredSlot, 3)
  const featured = event('gm_card_featured', null, { slot: 2 })
  assert.equal(deriveGmState([featured], 3, GM_SLOT_COUNT).featuredSlot, 2, 'host choice wins')
  assert.equal(
    deriveGmState([event('gm_card_featured', null, { slot: 9 })], 3, GM_SLOT_COUNT).featuredSlot,
    3,
    'a stale feature past the unlock falls back',
  )
  assert.equal(deriveGmState([], 0, GM_SLOT_COUNT).featuredSlot, null, 'nothing before 8 PM')
})

// ── Achievements + content ──────────────────────────────────────────────────

test('achievements project from the stream and dedupe by id', () => {
  const achievement = { id: 'a1', family: 'invocation', title: 'T', description: 'D', affordance: 'A' }
  const events = [
    event('achievement_unlocked', 'A', { achievement }),
    event('achievement_unlocked', 'A', { achievement }),
  ]
  assert.equal(deriveAchievements(events).length, 1)
})

test('every playable card has both lenses at all three depths', () => {
  const ids = playableCardIds()
  assert.equal(ids.length, 52, 'the full corpus has party readings')
  for (const id of ids) {
    for (const lens of ['goodbye', 'spicy'] as const) {
      for (const depth of ['easy', 'medium', 'hard'] as const) {
        const reading = getReading(id, lens, depth)
        assert.ok(reading, `${id} ${lens} ${depth} exists`)
        assert.ok(reading!.prompt.length > 20, `${id} ${lens} ${depth} has a real prompt`)
        assert.ok(reading!.emotionalAlchemy?.move, `${id} ${lens} ${depth} has an alchemy move`)
      }
    }
  }
})

test('every achievement family is one of the six legal ones', () => {
  for (const id of playableCardIds()) {
    for (const lens of ['goodbye', 'spicy'] as const) {
      for (const depth of ['easy', 'medium', 'hard'] as const) {
        const achievement = getReadingAchievement(id, lens, depth)
        assert.ok(achievement, `${id} ${lens} ${depth} has an achievement`)
        assert.ok(
          (ACHIEVEMENT_FAMILIES as readonly string[]).includes(achievement!.family),
          `${id} ${lens} ${depth} family "${achievement!.family}" is legal`,
        )
      }
    }
  }
})

test('hard readings are the ones that ask for a BAR', () => {
  for (const id of playableCardIds()) {
    for (const lens of ['goodbye', 'spicy'] as const) {
      assert.equal(getReading(id, lens, 'hard')?.hard?.requiresBar, true, `${id} ${lens} hard`)
      assert.equal(getReading(id, lens, 'easy')?.hard, undefined, `${id} ${lens} easy`)
    }
  }
})

test('every GM slot points at a real card with a real reading', () => {
  const ids = new Set(playableCardIds())
  for (const slot of GM_SLOTS) {
    assert.ok(ids.has(slot.cardId), `slot ${slot.slot} card ${slot.cardId} exists`)
    assert.ok(getReading(slot.cardId, slot.lens, slot.depth), `slot ${slot.slot} reading exists`)
    assert.ok(slot.prompt.length > 30, `slot ${slot.slot} has a real prompt`)
  }
})

// ── Runner ──────────────────────────────────────────────────────────────────

let failures = 0
for (const [name, fn] of tests) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failures += 1
    console.error(`  ✗ ${name}`)
    console.error(`    ${error instanceof Error ? error.message : String(error)}`)
  }
}

console.log(`\n${tests.length - failures}/${tests.length} passed`)
if (failures) process.exit(1)
