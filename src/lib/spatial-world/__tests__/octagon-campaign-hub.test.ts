/**
 * Run: npx tsx src/lib/spatial-world/__tests__/octagon-campaign-hub.test.ts
 */
import {
  buildOctagonCampaignHubRoom,
  buildOctagonTilemap,
  listOctagonEdgeTiles,
} from '../octagon-campaign-hub'

function assert(c: boolean, m: string) {
  if (!c) throw new Error(m)
}

function run() {
  const tm = buildOctagonTilemap(25)
  assert(tm['0,0']?.impassable === true, 'corner impassable')
  assert(!tm['12,12']?.impassable, 'center walkable')

  const edge = listOctagonEdgeTiles(tm, 25)
  assert(edge.length > 16, 'rim non-empty')

  const { anchors } = buildOctagonCampaignHubRoom('bruised-banana', 25)
  const cardClub = anchors.filter(a => a.anchorType === 'portal' && a.label === 'Card Club')
  const spokes = anchors.filter(a => a.anchorType === 'spoke_portal')
  assert(cardClub.length === 1, 'one card club portal')
  assert(spokes.length === 8, 'eight spokes')
  const ext = JSON.parse(cardClub[0]!.config ?? '{}') as { externalPath?: string }
  assert(ext.externalPath === '/world/lobby/card-club', 'card club path')

  console.log('octagon-campaign-hub tests ok')
}

run()
