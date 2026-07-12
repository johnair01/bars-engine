/**
 * Move-crafting tests (per-thread) — library grows at the speed of need, without rotting.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/move-crafting.test.ts
 */
import assert from 'node:assert'
import { type CapacityKey, type ChannelThread } from '../gate-confrontation'
import {
  buildCraftSkeleton,
  craftMove,
  promoteTier,
  resolveGatePath,
  threadPrimaryCapacity,
  validateGrammaticalMove,
  type GrammaticalMove,
} from '../move-crafting'

const thread: ChannelThread = { channel: 'fear', presentAltitude: 'dissatisfied', target: 'wonder' }
const key = threadPrimaryCapacity(thread) // 'metabolize:fear'

// === 1. Gate path: task / school / craft ======================================
{
  assert.strictEqual(resolveGatePath(key, new Set([key]), new Set()), 'task', 'own it → Task')
  assert.strictEqual(resolveGatePath(key, new Set(), new Set([key])), 'school', 'card exists → School')
  assert.strictEqual(resolveGatePath(key, new Set(), new Set()), 'craft', 'no card anywhere → Craft')
  console.log('  ✓ 1. gate path — own→task, exists→school, absent→craft')
}

// === 2. Crafting is grammatical BY CONSTRUCTION ===============================
{
  const { move, validation } = craftMove(
    thread,
    { baseAct: 'Name the avoidance, then take one 5-minute step toward the email.', name: 'Name & Step' },
    'ai_ratified',
  )
  assert.ok(validation.valid, 'a ratified draft yields a valid move')
  assert.strictEqual(move.capacityKey, key, 'capacity key stamped from the thread')
  assert.strictEqual(move.role, 'metabolize', 'role derived from the thread step')
  assert.strictEqual(move.channel, 'fear', 'channel from the thread')
  assert.strictEqual(move.target, 'wonder', 'target spirit from the thread')
  assert.strictEqual(move.waveMove, 'clean_up', 'blocker-clearing move is a Clean Up')
  assert.strictEqual(move.fruit, 'insight', 'fruit fixed by wave move')
  assert.deepStrictEqual(move.evidenceKinds, ['traced_practice'], 'evidence fixed by role')
  assert.strictEqual(move.tier, 'candidate', 'enters as a private candidate')
  console.log('  ✓ 2. crafted move is grammatical by construction; enters as candidate')
}

// === 3. Authored fields are required =========================================
{
  assert.ok(!craftMove(thread, { baseAct: '  ', name: 'X' }).validation.valid, 'empty baseAct rejected')
  assert.ok(!craftMove(thread, { baseAct: 'do a thing', name: ' ' }).validation.valid, 'empty name rejected')
  console.log('  ✓ 3. baseAct and name must be authored')
}

// === 4. A move cannot LIE about its grammar ==================================
{
  const skeleton = buildCraftSkeleton(thread)
  const liar: GrammaticalMove = {
    ...skeleton,
    role: 'transcend', // tampered — thread step is metabolize
    baseAct: 'pretend',
    name: 'Impostor',
    craftedBy: 'player',
    tier: 'candidate',
    provenance: { sourceThreadChannel: thread.channel },
  }
  const v = validateGrammaticalMove(liar, thread)
  assert.ok(!v.valid && v.reasons.some(r => r.includes('role')), 'grammar mismatch is rejected')
  console.log('  ✓ 4. a move cannot lie about its grammar')
}

// === 5. Alternatives allowed; dedup prevents RE-crafting =====================
{
  const a = craftMove(thread, { baseAct: 'Box-breathe, then open the draft.', name: 'Box & Open' })
  const b = craftMove(thread, { baseAct: 'Walk it out, then write one line.', name: 'Walk & Line' })
  assert.ok(a.validation.valid && b.validation.valid, 'two alternatives for one key are both valid')
  assert.strictEqual(a.move.capacityKey, b.move.capacityKey, 'they share the capacity key')
  const library = new Set<CapacityKey>([a.move.capacityKey])
  assert.strictEqual(resolveGatePath(key, new Set(), library), 'school', 'existing card → no re-forge')
  console.log('  ✓ 5. alternatives allowed; dedup routes to school')
}

// === 6. Promotion is earned, not asserted ====================================
{
  assert.strictEqual(promoteTier({ demonstratedReuse: 0, adoptions: 0, gmReviewed: false }), 'candidate')
  assert.strictEqual(promoteTier({ demonstratedReuse: 3, adoptions: 0, gmReviewed: false }), 'demonstrated')
  assert.strictEqual(promoteTier({ demonstratedReuse: 9, adoptions: 1, gmReviewed: false }), 'adopted')
  assert.strictEqual(promoteTier({ demonstratedReuse: 9, adoptions: 2, gmReviewed: true }), 'canonical')
  console.log('  ✓ 6. promotion earned through demonstrated reuse → adoption → review')
}

console.log('inner-garden/ontology (move crafting): all tests passed ✓')
