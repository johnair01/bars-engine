/**
 * Run: npx tsx src/lib/campaign-hub/__tests__/hub-journey-state.test.ts
 */

import {
  hubJourneyPatchToStateFields,
  mergeStoryProgressStatePatch,
  parseHubJourneyFromSearchParams,
} from '@/lib/campaign-hub/hub-journey-state'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  const merged = mergeStoryProgressStatePatch(
    JSON.stringify({ ouroboros: { x: 1 }, state: { lens: 'sage', foo: 1 } }),
    { campaign_hub_ref: 'bb', hub_spoke_index: 2 },
  )
  const o = JSON.parse(merged) as { ouroboros?: unknown; state?: Record<string, unknown> }
  assert(o.ouroboros != null, 'preserves top-level keys')
  assert(o.state?.lens === 'sage', 'preserves existing state')
  assert(o.state?.foo === 1, 'preserves foo')
  assert(o.state?.campaign_hub_ref === 'bb', 'merges hub ref')
  assert(o.state?.hub_spoke_index === 2, 'merges spoke index')

  const empty = mergeStoryProgressStatePatch(null, { last_spoke_move: 'wakeUp' })
  const e = JSON.parse(empty) as { state?: Record<string, unknown> }
  assert(e.state?.last_spoke_move === 'wakeUp', 'creates state from null')

  const fields = hubJourneyPatchToStateFields({
    campaignRef: 'bruised-banana',
    spokeIndex: 0,
    hexagramId: 12,
    portalPrimaryFace: 'shaman',
    kotterStage: 3,
    lastSpokeMove: 'cleanUp',
  })
  assert(fields.campaign_hub_ref === 'bruised-banana', 'ref field')
  assert(fields.hub_hexagram_id === 12, 'hex')
  assert(fields.hub_kotter_stage === 3, 'kotter')
  assert(fields.last_spoke_move === 'cleanUp', 'move')

  const sp = new URLSearchParams(
    'ref=bruised-banana&face=diplomat&hexagram=44&spoke=5&kotterStage=2',
  )
  const p = parseHubJourneyFromSearchParams(sp, 'Portal_1')
  assert(p != null, 'parses full params')
  assert(p!.spokeIndex === 5, 'spoke from param wins over node')
  assert(p!.hexagramId === 44, 'hex')
  assert(p!.portalPrimaryFace === 'diplomat', 'face')

  const sp2 = new URLSearchParams('ref=x&face=regent&hexagram=1')
  const p2 = parseHubJourneyFromSearchParams(sp2, 'Portal_3')
  assert(p2 != null, 'derives spoke from Portal_3')
  assert(p2!.spokeIndex === 2, 'Portal_3 -> index 2')

  const bad = parseHubJourneyFromSearchParams(new URLSearchParams('ref=x&face=nope&hexagram=1'), 'Portal_1')
  assert(bad == null, 'reject bad face')

  // eslint-disable-next-line no-console -- test runner
  console.log('✓ hub-journey-state OK')
}

run()
