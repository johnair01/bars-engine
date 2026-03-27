import assert from 'node:assert'
import {
  countOverlaysBySpace,
  isCampaignRefSlug,
  listCampaignOverlays,
  overlaysForSpace,
} from '../campaign-overlays'

assert.strictEqual(isCampaignRefSlug('bruised-banana'), true)
assert.strictEqual(isCampaignRefSlug('Bad'), false)

const bb = listCampaignOverlays('bruised-banana')
assert.ok(bb.length >= 4)
assert.ok(bb.every((o) => o.sourceCampaignId === 'bruised-banana'))

assert.strictEqual(listCampaignOverlays('unknown-campaign-ref').length, 0)

const forestOnly = overlaysForSpace('bruised-banana', 'forest')
assert.ok(forestOnly.every((o) => o.targetSpaceId === 'forest'))

const counts = countOverlaysBySpace(bb)
assert.ok((counts.get('library') ?? 0) >= 1)

console.log('narrative-os campaign-overlays tests ok')
