import assert from 'node:assert'
import { cyoaBuildSchema, cyoaBuildFromGeneratedSpokeInputs } from '@/lib/cyoa-build'
import type { GeneratedSpokeInputs } from '@/lib/generated-spoke-cyoa/types'

const minimal: GeneratedSpokeInputs = {
  campaignRef: 'bruised-banana',
  spokeIndex: 0,
  kotterStage: 2,
  instanceName: 'Test',
  moveFocus: 'wakeUp',
  chargeText: 'A charge',
  gmFace: 'shaman',
}

const build = cyoaBuildFromGeneratedSpokeInputs(minimal)
const parsed = cyoaBuildSchema.safeParse(build)
assert.strictEqual(parsed.success, true)

const bad = cyoaBuildSchema.safeParse({ ...build, gameMasterFace: 'invalid' })
assert.strictEqual(bad.success, false)

console.log('cyoa-build schema tests passed')
