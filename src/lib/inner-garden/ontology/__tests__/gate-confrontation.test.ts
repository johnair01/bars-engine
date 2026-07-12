/**
 * Gate-confrontation (multi-channel blocker) tests — proves the loop AND the bug fix.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/gate-confrontation.test.ts
 */
import assert from 'node:assert'
import {
  DEFAULT_STAGNATION_WINDOW_DAYS,
  decomposeBlockerFromText,
  inferBlockerForStagnantSeed,
  requiredRouteHand,
  resolveBlocker,
  threadRouteHand,
  type BlockerSignature,
  type CapacityKey,
  type ChannelThread,
} from '../gate-confrontation'

const fearThread: ChannelThread = { channel: 'fear', presentAltitude: 'dissatisfied', target: 'wonder' }
const angerThread: ChannelThread = { channel: 'anger', presentAltitude: 'dissatisfied', target: 'triumph' }

// === 1. Route-hand: required (to neutral) vs optional (to spirit); altitude preserved =====
{
  const rh = threadRouteHand(fearThread)
  assert.deepStrictEqual(rh.required, ['metabolize:fear'], 'dissatisfied → required metabolize')
  assert.deepStrictEqual(rh.optional, ['transcend:fear->wonder'], 'spirit is optional depth')

  // altitude preserved: a neutral-present thread has NO required step (distinct route).
  const fromNeutral = threadRouteHand({ channel: 'fear', presentAltitude: 'neutral', target: 'wonder' })
  assert.deepStrictEqual(fromNeutral.required, [], 'neutral present → nothing required')
  assert.notDeepStrictEqual(rh.required, fromNeutral.required, 'dissatisfied vs neutral yield different routes')

  assert.deepStrictEqual(
    requiredRouteHand([fearThread, angerThread]).sort(),
    ['metabolize:anger', 'metabolize:fear'],
    'blocker route-hand = union of threads’ required moves',
  )
  console.log('  ✓ 1. route-hand: required/optional split; altitude preserved')
}

// === 2. Neutral suffices — a thread resolves at metabolize, spirit optional =============
{
  const owned = new Set<CapacityKey>(['metabolize:fear'])
  const r = resolveBlocker([fearThread], owned)
  assert.ok(r.resolved, 'single-thread blocker resolves at neutral')
  assert.ok(r.threads[0]!.reachedNeutral && !r.threads[0]!.reachedSpirit, 'reached neutral, not spirit')
  console.log('  ✓ 2. neutral suffices — thread resolves at metabolize; spirit optional')
}

// === 3. THE BUG FIX — owning one thread's capacity does NOT resolve a multi-thread blocker =
{
  const blocker: BlockerSignature = [fearThread, angerThread] // "avoiding the hard email"
  const oneOwned = new Set<CapacityKey>(['metabolize:fear'])
  const partial = resolveBlocker(blocker, oneOwned)
  assert.ok(!partial.resolved, 'owning one thread must NOT clear a two-thread blocker (over-grant fixed)')
  assert.ok(partial.threads.find(t => t.thread.channel === 'anger')!.reachedNeutral === false, 'anger thread unmet')

  const bothOwned = new Set<CapacityKey>(['metabolize:fear', 'metabolize:anger'])
  assert.ok(resolveBlocker(blocker, bothOwned).resolved, 'clears when both threads reach neutral')
  console.log('  ✓ 3. over-grant bug fixed — all threads must reach neutral')
}

// === 4. Gate path per thread (task / school / craft) ====================================
{
  const library = new Set<CapacityKey>(['metabolize:anger'])
  const r = resolveBlocker([fearThread, angerThread], new Set(), library)
  const fear = r.threads.find(t => t.thread.channel === 'fear')!
  const anger = r.threads.find(t => t.thread.channel === 'anger')!
  assert.strictEqual(fear.path, 'craft', 'no card anywhere → craft')
  assert.strictEqual(anger.path, 'school', 'card in library → school')
  console.log('  ✓ 4. per-thread path — craft vs school')
}

// === 5. Inferred blocker window (default 3d, player-overridable) =========================
{
  assert.strictEqual(
    inferBlockerForStagnantSeed({ plantedChannel: 'sadness', daysSinceAction: 2 }),
    null,
    'within the window → no inferred blocker',
  )
  const b = inferBlockerForStagnantSeed({ plantedChannel: 'sadness', daysSinceAction: DEFAULT_STAGNATION_WINDOW_DAYS })
  assert.ok(b && b.origin === 'inferred' && b.threads[0]!.channel === 'sadness', 'past window → inferred blocker')
  assert.strictEqual(inferBlockerForStagnantSeed({ plantedChannel: 'sadness', daysSinceAction: 2 }, 2)?.origin, 'inferred', 'custom window shifts boundary')
  console.log('  ✓ 5. inferred blocker — 3d default, player-overridable')
}

// === 6. Canonical decomposition — "avoiding the hard email" → fear + anger ==============
{
  const { draft } = decomposeBlockerFromText('I keep avoiding the hard email')
  const channels = draft.map(t => t.channel).sort()
  assert.deepStrictEqual(channels, ['anger', 'fear'], 'reads fear (avoidance) + anger (hard)')
  assert.ok(draft.every(t => t.presentAltitude === 'dissatisfied'), 'threads start dissatisfied')
  // resolves only when both threads reach neutral (both metabolize steps owned).
  const oneOwned = new Set<CapacityKey>(['metabolize:fear'])
  assert.ok(!resolveBlocker(draft, oneOwned).resolved, 'one thread owned → not resolved')
  const bothOwned = new Set<CapacityKey>(['metabolize:fear', 'metabolize:anger'])
  assert.ok(resolveBlocker(draft, bothOwned).resolved, 'both threads to neutral → resolved')
  console.log('  ✓ 6. decomposition — hard-email reads fear+anger; clears when both reach neutral')
}

console.log('inner-garden/ontology (gate confrontation): all tests passed ✓')
