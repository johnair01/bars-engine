import type { Metadata } from 'next'
import { CampaignLeadsPage } from '@/app/campaign/[ref]/leads/CampaignLeadsPage'

export const metadata: Metadata = { title: 'Leads · The Crossing | BARs' }

/**
 * @page /campaign/the-crossing/steward/leads
 * @entity CAMPAIGN
 * @description The Crossing lead console (static-segment shim). Renders the shared
 *   [ref]/leads owner console for campaignRef 'the-crossing' under the steward area,
 *   since the-crossing is a static route folder.
 * @permissions steward (assertCampaignSteward)
 * @relationships CampaignLead, Invite (starterQuest), CustomBar (quest pool)
 * @dimensions WHO:campaign owner, WHAT:forge-and-follow-up, WHERE:the-crossing, ENERGY:show-up
 */
export default function TheCrossingLeadsPage() {
  return <CampaignLeadsPage campaignRef="the-crossing" basePath="/campaign/the-crossing/steward/leads" />
}
