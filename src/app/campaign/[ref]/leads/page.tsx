import type { Metadata } from 'next'
import { CampaignLeadsPage } from './CampaignLeadsPage'

export const metadata: Metadata = { title: 'Campaign Leads | BARs' }

/**
 * @page /campaign/[ref]/leads
 * @entity CAMPAIGN
 * @description Campaign owner's lead console — hand-forge tailored leads + starter
 *   quests (issues an Invite), and review the follow-up board of manual +
 *   self-created leads with a shared status machine.
 * @permissions steward (assertCampaignSteward — owner/steward of the campaign)
 * @relationships CampaignLead, Invite (starterQuest), CustomBar (quest pool)
 * @dimensions WHO:campaign owner, WHAT:forge-and-follow-up, WHERE:[ref], ENERGY:show-up
 */
export default async function LeadsRoute({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return <CampaignLeadsPage campaignRef={ref} basePath={`/campaign/${ref}/leads`} />
}
