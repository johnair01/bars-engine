/**
 * Gate-confrontation (quest mechanic) tests — proves the loop, not the narrative.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/gate-confrontation.test.ts
 */
import assert from 'node:assert'
import {
  deriveRequiredCapacity,
  earnCapacity,
  requiredRole,
  resolveBlocker,
  type BlockerSignature,
  type CapacityKey,
} from '../gate-confrontation'

const b = (over: Partial<BlockerSignature> = {}): BlockerSignature => ({
  fromElement: 'water',
  fromAltitude: 'dissatisfied',
  toElement: 'water',
  toAltitude: 'neutral',
  domain: 'RAISE_AWARENESS',
  ...over,
})

// === 1. Required capacity is DERIVED from the signature (principled, deterministic) ===
{
  // dissatisfied → neutral, same channel = metabolize
  assert.strictEqual(requiredRole(b()), 'metabolize')
  assert.strictEqual(deriveRequiredCapacity(b()), 'metabolize:water')

  // neutral → satisfied, same channel = transcend
  const asc = b({ fromAltitude: 'neutral', toAltitude: 'satisfied' })
  assert.strictEqual(requiredRole(asc), 'transcend')
  assert.strictEqual(deriveRequiredCapacity(asc), 'transcend:water')

  // cross-channel = translate
  const cross = b({ fromElement: 'water', toElement: 'fire', fromAltitude: 'neutral', toAltitude: 'neutral' })
  assert.strictEqual(requiredRole(cross), 'translate')
  assert.strictEqual(deriveRequiredCapacity(cross), 'translate:water->fire')

  // determinism + domain-invariance: domain does not change the key
  assert.strictEqual(
    deriveRequiredCapacity(b({ domain: 'DIRECT_ACTION' })),
    deriveRequiredCapacity(b({ domain: 'RAISE_AWARENESS' })),
    'domain does not change the required capacity',
  )
  console.log('  ✓ 1. required capacity derives deterministically from the blocker signature')
}

// === 2. Own the key → Task; missing → a well-formed Quest =====================
{
  const sig = b()
  const key = deriveRequiredCapacity(sig)

  const withKey = resolveBlocker(sig, new Set([key]))
  assert.strictEqual(withKey.kind, 'task', 'owning the capacity → Task (Clean Up)')
  if (withKey.kind === 'task') assert.strictEqual(withKey.move, 'clean_up')

  const without = resolveBlocker(sig, new Set<CapacityKey>())
  assert.strictEqual(without.kind, 'quest', 'missing the capacity → gate confrontation Quest')
  if (without.kind === 'quest') {
    // The "good quest" contract: every field present.
    assert.strictEqual(without.targetCapacity, key, 'quest targets the missing capacity')
    assert.strictEqual(without.mintedBy, 'grow_up', 'gate confrontation is a Grow Up')
    assert.strictEqual(without.winCondition, 'demonstrate_then_integration_check', 'anti-hollow win-condition')
    assert.ok(without.reward.permanent, 'reward card is permanent (a slot)')
    assert.deepStrictEqual(without.returnsTo, sig, 'quest returns you to the gate')
  }
  console.log('  ✓ 2. own→Task, missing→well-formed Quest (trigger/target/win/reward/return)')
}

// === 3. Loop closure: earning the capacity turns the WHOLE CLASS into a Task ===
{
  const owned0 = new Set<CapacityKey>()
  const sig = b()
  const first = resolveBlocker(sig, owned0)
  assert.strictEqual(first.kind, 'quest', 'first encounter is a Quest')

  // Complete the quest → earn the capacity.
  const owned1 = earnCapacity(owned0, deriveRequiredCapacity(sig))

  // The same blocker is now a Task…
  assert.strictEqual(resolveBlocker(sig, owned1).kind, 'task', 'after earning, same blocker is a Task')
  // …AND so is any OTHER blocker of the same signature-class (capacity compounds; anti-grind).
  const sibling = b({ domain: 'SKILLFUL_ORGANIZING', toAltitude: 'neutral' }) // same water:dissatisfied→neutral edge
  assert.strictEqual(resolveBlocker(sibling, owned1).kind, 'task', 'whole class unblocked by one technique')

  // But a DIFFERENT edge is still a Quest (you only earned one capacity).
  const otherEdge = b({ fromElement: 'fire', toElement: 'fire' })
  assert.strictEqual(resolveBlocker(otherEdge, owned1).kind, 'quest', 'a different edge still needs its own quest')
  console.log('  ✓ 3. loop closure — one technique unblocks a whole class, forever (economy C)')
}

console.log('inner-garden/ontology (gate confrontation): all tests passed ✓')
