/**
 * Campaign hub deck topology (52 vs 64 slots). See .specify/specs/campaign-hub-spoke-landing-architecture/spec.md
 */
import type { CampaignDeckTopology } from '@prisma/client'

export type { CampaignDeckTopology }

export const CAMPAIGN_DECK_TOPOLOGY_VALUES: readonly CampaignDeckTopology[] = [
  'CAMPAIGN_DECK_52',
  'CAMPAIGN_DECK_64',
] as const

export function parseCampaignDeckTopology(raw: string | null | undefined): CampaignDeckTopology {
  if (raw === 'CAMPAIGN_DECK_64') return 'CAMPAIGN_DECK_64'
  return 'CAMPAIGN_DECK_52'
}

export function campaignDeckSlotCount(topology: CampaignDeckTopology): 52 | 64 {
  return topology === 'CAMPAIGN_DECK_64' ? 64 : 52
}

/** Steward UI: labels + short Diplomat-style hints (spec § Deck topology). */
export const CAMPAIGN_DECK_TOPOLOGY_OPTIONS: {
  value: CampaignDeckTopology
  label: string
  hint: string
}[] = [
  {
    value: 'CAMPAIGN_DECK_52',
    label: 'Roster pack (52 slots)',
    hint: 'Classic card-roster energy — great for people-and-beats arcs; you only play what you’ve added.',
  },
  {
    value: 'CAMPAIGN_DECK_64',
    label: 'Lattice (64 slots)',
    hint: 'Shared board / map-of-change — great when each chapter has a place on the grid; same rule: only bound slots are in play.',
  },
]
