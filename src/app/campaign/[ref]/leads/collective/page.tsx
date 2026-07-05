import type { Metadata } from 'next'
import { CollectivePage } from '../CollectivePage'

export const metadata: Metadata = { title: 'The Collective | BARs' }

/**
 * @page /campaign/[ref]/leads/collective
 * @entity CAMPAIGN
 * @description The collective directory — published leads any steward of the campaign can adopt.
 * @permissions steward (assertCampaignSteward)
 * @relationships CampaignLead (collective), Invite
 * @dimensions WHO:campaign steward, WHAT:adopt-a-lead, WHERE:[ref], ENERGY:show-up
 */
export default async function CollectiveRoute({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return <CollectivePage campaignRef={ref} basePath={`/campaign/${ref}/leads`} />
}
