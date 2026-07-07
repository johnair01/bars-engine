import type { Metadata } from 'next'
import { LeadWorkspacePage } from '../LeadWorkspacePage'

export const metadata: Metadata = { title: 'Lead workspace | BARs' }

/**
 * @page /campaign/[ref]/leads/[leadId]
 * @entity CAMPAIGN
 * @description Per-lead workspace — set goals, curate matched quests, edit actions +
 *   invite message, copy the warm link, and publish to the collective.
 * @permissions steward (assertCampaignSteward via the lead's campaign)
 * @relationships CampaignLead, CustomBar (quest pool), Invite (warm link + message)
 * @dimensions WHO:campaign owner, WHAT:curate-a-lead, WHERE:[ref], ENERGY:show-up
 */
export default async function LeadWorkspaceRoute({ params }: { params: Promise<{ ref: string; leadId: string }> }) {
  const { ref, leadId } = await params
  return <LeadWorkspacePage campaignRef={ref} leadId={leadId} basePath={`/campaign/${ref}/leads`} />
}
