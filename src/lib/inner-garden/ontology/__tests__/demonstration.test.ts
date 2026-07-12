/**
 * Demonstration-bar tests — proves completing a quest grants REAL capacity, not clicks.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/demonstration.test.ts
 */
import assert from 'node:assert'
import { resolveBlocker, type BlockerSignature, type CapacityKey } from '../gate-confrontation'
import { completeQuest, runIntegrationCheck, type Demonstration } from '../demonstration'

// A transcend gate (neutral → satisfied, same channel) — its technique needs an artifact/action.
const gate: BlockerSignature = {
  fromElement: 'fire',
  fromAltitude: 'neutral',
  toElement: 'fire',
  toAltitude: 'satisfied',
  domain: 'DIRECT_ACTION',
}
const quest = resolveBlocker(gate, new Set<CapacityKey>())
if (quest.kind !== 'quest') throw new Error('fixture: expected a quest')

const goodDemo: Demonstration = {
  techniqueApplied: quest.targetCapacity, // 'transcend:fire'
  evidenceKind: 'action',
  evidenceRef: 'Sent the hard email and logged the outcome.',
  preState: { element: 'fire', altitude: 'neutral' },
  postState: { element: 'fire', altitude: 'satisfied' },
}

// === 1. Right kind + edge crossed → passes → card granted → gate becomes a Task ===
{
  const c = completeQuest(quest, goodDemo, new Set())
  assert.ok(c.result.passed, 'good demonstration passes the Integration Check')
  assert.ok(c.granted, 'the technique-card is granted')
  assert.ok(c.owned.has(quest.targetCapacity), 'the capacity is now in a slot')
  // loop closure: the same gate is now a Task.
  assert.strictEqual(resolveBlocker(gate, c.owned).kind, 'task', 'gate is now a Task')
  console.log('  ✓ 1. right evidence + edge crossed → capacity earned → gate becomes a Task')
}

// === 2. Wrong evidence KIND → no card (you can't read your way to an action card) ===
{
  const readItsWay: Demonstration = { ...goodDemo, evidenceKind: 'reflection' }
  const c = completeQuest(quest, readItsWay, new Set())
  assert.ok(!c.granted, 'a reflection cannot demonstrate a transcend/outer-action technique')
  assert.ok(
    c.result.reasons.some(r => r.includes('cannot be demonstrated by a reflection')),
    'the check explains the evidence-kind mismatch',
  )
  console.log('  ✓ 2. wrong evidence kind → no card (the teeth)')
}

// === 3. Right kind but edge NOT crossed → "data, not failure", no card =========
{
  const noMovement: Demonstration = { ...goodDemo, postState: { element: 'fire', altitude: 'neutral' } }
  const c = completeQuest(quest, noMovement, new Set())
  assert.ok(!c.granted, 'no movement across the edge → not complete')
  assert.ok(c.result.reasons.some(r => r.includes('data, not failure')), 'framed as data, not failure')
  console.log('  ✓ 3. no movement → data, not failure → no card')
}

// === 4. Empty evidence, and addressing the wrong gate, both fail ================
{
  const empty: Demonstration = { ...goodDemo, evidenceRef: '   ' }
  assert.ok(!runIntegrationCheck(quest, empty).passed, 'empty evidence fails (recommendation ≠ completion)')

  const wrongGate: Demonstration = { ...goodDemo, preState: { element: 'water', altitude: 'neutral' } }
  const r = runIntegrationCheck(quest, wrongGate)
  assert.ok(!r.passed && r.reasons.some(x => x.includes('did not start from this gate')), 'wrong gate fails')
  console.log('  ✓ 4. empty evidence and wrong-gate demonstrations both fail')
}

// === 5. A metabolize gate demands a traced practice (per-role evidence) =========
{
  const innerGate: BlockerSignature = {
    fromElement: 'water',
    fromAltitude: 'dissatisfied',
    toElement: 'water',
    toAltitude: 'neutral',
    domain: 'SKILLFUL_ORGANIZING',
  }
  const innerQuest = resolveBlocker(innerGate, new Set<CapacityKey>())
  if (innerQuest.kind !== 'quest') throw new Error('fixture')
  const traced: Demonstration = {
    techniqueApplied: innerQuest.targetCapacity, // 'metabolize:water'
    evidenceKind: 'traced_practice',
    evidenceRef: '3-2-1 session recorded; the grief moved.',
    preState: { element: 'water', altitude: 'dissatisfied' },
    postState: { element: 'water', altitude: 'neutral' },
  }
  assert.ok(completeQuest(innerQuest, traced, new Set()).granted, 'traced practice completes a metabolize gate')
  const asArtifact: Demonstration = { ...traced, evidenceKind: 'artifact' }
  assert.ok(!completeQuest(innerQuest, asArtifact, new Set()).granted, 'an artifact does NOT complete an inner metabolize gate')
  console.log('  ✓ 5. evidence kind is constrained per move-role (metabolize needs a traced practice)')
}

console.log('inner-garden/ontology (demonstration bar): all tests passed ✓')
