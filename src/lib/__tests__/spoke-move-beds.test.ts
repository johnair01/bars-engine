/**
 * Run: npx tsx src/lib/__tests__/spoke-move-beds.test.ts
 */
import {
  isBarEligibleSpokeAnchor,
  parsePortalMoveFromBlueprintKey,
  parseSpokePortalFromAgentMetadata,
  passesSpokeKernelQualityGate,
} from '@/lib/spoke-move-beds'

function assert(c: boolean, m: string) {
  if (!c) throw new Error(m)
}

function run() {
  assert(parsePortalMoveFromBlueprintKey('face_shaman_move_wakeUp') === 'wakeUp', 'wakeUp')
  assert(parsePortalMoveFromBlueprintKey('face_regent_move_cleanUp') === 'cleanUp', 'cleanUp')
  assert(parsePortalMoveFromBlueprintKey('face_sage_move_showUp') === 'showUp', 'showUp')
  assert(parsePortalMoveFromBlueprintKey(undefined) === null, 'undef')
  assert(parsePortalMoveFromBlueprintKey('other') === null, 'other')

  const meta = JSON.stringify({
    spokePortal: { campaignRef: 'bruised-banana', spokeIndex: 2, moveType: 'wakeUp' },
  })
  const parsed = parseSpokePortalFromAgentMetadata(meta)
  assert(parsed?.campaignRef === 'bruised-banana' && parsed.spokeIndex === 2 && parsed.moveType === 'wakeUp', 'parse meta')

  const bar = {
    type: 'vibe',
    agentMetadata: meta,
    mergedIntoId: null,
    archivedAt: null,
  }
  assert(isBarEligibleSpokeAnchor(bar, 'bruised-banana', 2, 'wakeUp'), 'eligible')
  assert(!isBarEligibleSpokeAnchor(bar, 'other', 2, 'wakeUp'), 'wrong ref')
  assert(!isBarEligibleSpokeAnchor({ ...bar, type: 'quest' }, 'bruised-banana', 2, 'wakeUp'), 'not vibe')

  assert(passesSpokeKernelQualityGate('Yes', '12345678901'), 'quality ok')
  assert(!passesSpokeKernelQualityGate('Yo', 'short'), 'quality fail')

  // eslint-disable-next-line no-console -- test runner
  console.log('✓ spoke-move-beds OK')
}

run()
