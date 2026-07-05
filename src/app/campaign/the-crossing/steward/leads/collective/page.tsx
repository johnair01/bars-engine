import type { Metadata } from 'next'
import { CollectivePage } from '@/app/campaign/[ref]/leads/CollectivePage'

export const metadata: Metadata = { title: 'The Collective · The Crossing | BARs' }

/**
 * @page /campaign/the-crossing/steward/leads/collective
 * @entity CAMPAIGN
 * @description The Crossing collective directory (static-segment shim) for campaignRef 'the-crossing'.
 * @permissions steward (assertCampaignSteward)
 * @relationships CampaignLead (collective), Invite
 * @dimensions WHO:campaign steward, WHAT:adopt-a-lead, WHERE:the-crossing, ENERGY:show-up
 */
export default function TheCrossingCollective() {
  return <CollectivePage campaignRef="the-crossing" basePath="/campaign/the-crossing/steward/leads" />
}
