import type { Metadata } from 'next'
import { LeadWorkspacePage } from '@/app/campaign/[ref]/leads/LeadWorkspacePage'

export const metadata: Metadata = { title: 'Lead workspace · The Crossing | BARs' }

/**
 * @page /campaign/the-crossing/steward/leads/[leadId]
 * @entity CAMPAIGN
 * @description The Crossing lead workspace (static-segment shim) for campaignRef 'the-crossing'.
 * @permissions steward (assertCampaignSteward)
 * @relationships CampaignLead, CustomBar (quest pool), Invite
 * @dimensions WHO:campaign owner, WHAT:curate-a-lead, WHERE:the-crossing, ENERGY:show-up
 */
export default async function TheCrossingLeadWorkspace({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params
  return <LeadWorkspacePage campaignRef="the-crossing" leadId={leadId} basePath="/campaign/the-crossing/steward/leads" />
}
