/**
 * Demonstration-bar tests (per-thread) — proves a step grants REAL capacity, not clicks.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/demonstration.test.ts
 */
import assert from 'node:assert'
import { resolveBlocker, type CapacityKey, type ChannelThread } from '../gate-confrontation'
import { completeThread, runIntegrationCheck, type ThreadDemonstration } from '../demonstration'

// The fear thread of "avoiding the hard email": dissatisfied → (metabolize) → neutral.
const fearThread: ChannelThread = { channel: 'fear', presentAltitude: 'dissatisfied', target: 'wonder' }

const goodMetabolize: ThreadDemonstration = {
  channel: 'fear',
  evidenceKind: 'traced_practice',
  evidenceRef: 'Named the avoidance out loud; 5-min felt-sense sit, the grip loosened.',
  preAltitude: 'dissatisfied',
  postAltitude: 'neutral',
}

// === 1. Right kind + moved to neutral → capacity earned → thread resolves ===============
{
  const c = completeThread(fearThread, goodMetabolize, new Set())
  assert.ok(c.result.passed && c.granted, 'metabolize demonstration passes and grants')
  assert.strictEqual(c.result.earnedKey, 'metabolize:fear', 'earns the altitude-preserving key')
  assert.ok(resolveBlocker([fearThread], c.owned).resolved, 'thread now resolves')
  console.log('  ✓ 1. right evidence + movement → capacity earned → thread resolves')
}

// === 2. Wrong evidence KIND → no card (metabolize needs a traced practice) ==============
{
  const asArtifact: ThreadDemonstration = { ...goodMetabolize, evidenceKind: 'artifact' }
  const c = completeThread(fearThread, asArtifact, new Set())
  assert.ok(!c.granted && c.result.reasons.some(r => r.includes('cannot be demonstrated by a artifact')), 'artifact cannot demonstrate a metabolize step')
  console.log('  ✓ 2. wrong evidence kind → no card (the teeth)')
}

// === 3. No movement → "data, not failure" → no card ====================================
{
  const stuck: ThreadDemonstration = { ...goodMetabolize, postAltitude: 'dissatisfied' }
  const c = completeThread(fearThread, stuck, new Set())
  assert.ok(!c.granted && c.result.reasons.some(r => r.includes('data, not failure')), 'no movement → data, not failure')
  console.log('  ✓ 3. no movement → data, not failure')
}

// === 4. Wrong thread / empty evidence both fail ========================================
{
  const wrongChannel: ThreadDemonstration = { ...goodMetabolize, channel: 'anger' }
  assert.ok(!runIntegrationCheck(fearThread, wrongChannel).passed, 'wrong channel fails')
  const empty: ThreadDemonstration = { ...goodMetabolize, evidenceRef: '   ' }
  assert.ok(!runIntegrationCheck(fearThread, empty).passed, 'empty evidence fails')
  console.log('  ✓ 4. wrong-channel and empty-evidence both fail')
}

// === 5. Transcend (optional depth): neutral→satisfied needs an artifact/action =========
{
  const angerThread: ChannelThread = { channel: 'anger', presentAltitude: 'neutral', target: 'triumph' }
  const transcend: ThreadDemonstration = {
    channel: 'anger',
    evidenceKind: 'action',
    evidenceRef: 'Sent the hard email; logged the win.',
    preAltitude: 'neutral',
    postAltitude: 'satisfied',
  }
  const c = completeThread(angerThread, transcend, new Set())
  assert.ok(c.granted && c.result.earnedKey === 'transcend:anger->triumph', 'transcend earns the spirit key via action')
  const asReflection: ThreadDemonstration = { ...transcend, evidenceKind: 'reflection' }
  assert.ok(!completeThread(angerThread, asReflection, new Set()).granted, 'a reflection cannot demonstrate a transcend step')
  console.log('  ✓ 5. transcend depth needs artifact/action (not reflection)')
}

console.log('inner-garden/ontology (demonstration bar): all tests passed ✓')
