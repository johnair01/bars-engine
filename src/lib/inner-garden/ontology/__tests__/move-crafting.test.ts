/**
 * Move-crafting tests — the library grows at the speed of need, without rotting.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/move-crafting.test.ts
 */
import assert from 'node:assert'
import { deriveRequiredCapacity, type BlockerSignature, type CapacityKey } from '../gate-confrontation'
import {
  buildCraftSkeleton,
  craftMove,
  promoteTier,
  resolveGatePath,
  validateGrammaticalMove,
  type GrammaticalMove,
} from '../move-crafting'

const gate: BlockerSignature = {
  fromElement: 'water',
  fromAltitude: 'dissatisfied',
  toElement: 'water',
  toAltitude: 'neutral',
  domain: 'SKILLFUL_ORGANIZING',
}
const key = deriveRequiredCapacity(gate) // 'metabolize:water'

// === 1. Gate path: task / school / craft ======================================
{
  assert.strictEqual(resolveGatePath(gate, new Set([key]), new Set()), 'task', 'own it → Task')
  assert.strictEqual(resolveGatePath(gate, new Set(), new Set([key])), 'school', 'card exists → School')
  assert.strictEqual(resolveGatePath(gate, new Set(), new Set()), 'craft', 'no card anywhere → Craft')
  console.log('  ✓ 1. gate path — own→task, exists→school, absent→craft')
}

// === 2. Crafting is grammatical BY CONSTRUCTION ===============================
{
  const { move, validation } = craftMove(
    gate,
    { baseAct: 'Name the grief out loud, then set a 5-minute timer and let it move.', name: 'Timed Grief Release' },
    'ai_ratified',
  )
  assert.ok(validation.valid, 'a ratified draft yields a valid move')
  assert.strictEqual(move.capacityKey, key, 'capacity key is stamped from the gate')
  assert.strictEqual(move.role, 'metabolize', 'role derived from the gate edge')
  assert.strictEqual(move.waveMove, 'clean_up', 'blocker-clearing move is a Clean Up')
  assert.strictEqual(move.fruit, 'insight', 'fruit fixed by wave move')
  assert.deepStrictEqual(move.evidenceKinds, ['traced_practice'], 'evidence fixed by role')
  assert.strictEqual(move.tier, 'candidate', 'enters as a private candidate')
  console.log('  ✓ 2. crafted move is grammatical by construction; enters as candidate')
}

// === 3. Authored fields are required; you can't craft an empty move ===========
{
  assert.ok(!craftMove(gate, { baseAct: '  ', name: 'X' }).validation.valid, 'empty baseAct rejected')
  assert.ok(!craftMove(gate, { baseAct: 'do a thing', name: ' ' }).validation.valid, 'empty name rejected')
  console.log('  ✓ 3. baseAct and name must be authored')
}

// === 4. A move cannot LIE about its grammar (tampered skeleton is caught) ======
{
  const skeleton = buildCraftSkeleton(gate)
  const liar: GrammaticalMove = {
    ...skeleton,
    role: 'transcend', // tampered — gate is a metabolize edge
    baseAct: 'pretend',
    name: 'Impostor',
    craftedBy: 'player',
    tier: 'candidate',
    provenance: { sourceGateKey: skeleton.capacityKey },
  }
  const v = validateGrammaticalMove(liar, gate)
  assert.ok(!v.valid && v.reasons.some(r => r.includes('role')), 'grammar mismatch is rejected')
  console.log('  ✓ 4. a move cannot lie about its grammar')
}

// === 5. Alternatives allowed; dedup prevents RE-crafting ======================
{
  const a = craftMove(gate, { baseAct: 'Box-breathe, then journal the knot.', name: 'Box & Journal' })
  const b = craftMove(gate, { baseAct: 'Walk it out and name it at the door.', name: 'Walk the Knot' })
  assert.ok(a.validation.valid && b.validation.valid, 'two alternatives for one key are both valid')
  assert.strictEqual(a.move.capacityKey, b.move.capacityKey, 'they share the capacity key')

  // Once crafted, the key is in the library → the gate no longer routes to craft.
  const library = new Set<CapacityKey>([a.move.capacityKey])
  assert.strictEqual(resolveGatePath(gate, new Set(), library), 'school', 'existing card → no re-forge (dedup)')
  console.log('  ✓ 5. alternatives allowed; dedup routes to school, not re-craft')
}

// === 6. Promotion is earned, not asserted =====================================
{
  assert.strictEqual(promoteTier({ demonstratedReuse: 0, adoptions: 0, gmReviewed: false }), 'candidate')
  assert.strictEqual(promoteTier({ demonstratedReuse: 3, adoptions: 0, gmReviewed: false }), 'demonstrated')
  assert.strictEqual(promoteTier({ demonstratedReuse: 9, adoptions: 1, gmReviewed: false }), 'adopted')
  assert.strictEqual(promoteTier({ demonstratedReuse: 9, adoptions: 2, gmReviewed: true }), 'canonical')
  console.log('  ✓ 6. promotion earned through demonstrated reuse → adoption → review')
}

console.log('inner-garden/ontology (move crafting): all tests passed ✓')
