/**
 * Run: npx tsx src/lib/__tests__/campaign-deck-topology.test.ts
 */
import {
  CAMPAIGN_DECK_TOPOLOGY_OPTIONS,
  campaignDeckSlotCount,
  parseCampaignDeckTopology,
} from '@/lib/campaign-deck-topology'

function assert(c: boolean, m: string) {
  if (!c) throw new Error(m)
}

function run() {
  assert(parseCampaignDeckTopology('CAMPAIGN_DECK_64') === 'CAMPAIGN_DECK_64', '64')
  assert(parseCampaignDeckTopology('CAMPAIGN_DECK_52') === 'CAMPAIGN_DECK_52', '52')
  assert(parseCampaignDeckTopology('') === 'CAMPAIGN_DECK_52', 'empty -> 52')
  assert(parseCampaignDeckTopology(undefined) === 'CAMPAIGN_DECK_52', 'undef -> 52')

  assert(campaignDeckSlotCount('CAMPAIGN_DECK_52') === 52, 'count 52')
  assert(campaignDeckSlotCount('CAMPAIGN_DECK_64') === 64, 'count 64')

  assert(CAMPAIGN_DECK_TOPOLOGY_OPTIONS.length === 2, 'two options')

  // eslint-disable-next-line no-console -- test runner
  console.log('✓ campaign-deck-topology OK')
}

run()
