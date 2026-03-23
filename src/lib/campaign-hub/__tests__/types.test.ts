import {
  hubStateMatchesKotter,
  isCampaignHubStateV1,
  type CampaignHubStateV1,
} from '@/lib/campaign-hub/types'

const valid: CampaignHubStateV1 = {
  v: 1,
  kotterStage: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  spokes: Array.from({ length: 8 }, (_, i) => ({
    hexagramId: i + 1,
    changingLines: [1],
    primaryFace: 'shaman' as const,
  })),
}

if (!isCampaignHubStateV1(valid)) throw new Error('expected valid')
if (!hubStateMatchesKotter(valid, 1)) throw new Error('expected match')
if (hubStateMatchesKotter(valid, 2)) throw new Error('expected no match')
if (isCampaignHubStateV1({ v: 1, kotterStage: 1, spokes: [], updatedAt: 'x' })) throw new Error('expected invalid spokes')
console.log('campaign-hub types: OK')
