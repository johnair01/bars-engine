import type { Metadata } from 'next'
import { BeginPage } from '@/app/campaign/[ref]/begin/BeginPage'

export const metadata: Metadata = {
  title: 'Cross the threshold · The Crossing | BARs',
  description: 'Discover your allyship superpower, shed a myth, choose your domain, and create your character.',
}

/**
 * @page /campaign/the-crossing/begin
 * @entity CAMPAIGN
 * @description The Crossing onboarding funnel (static-segment shim). Renders the
 *   shared [ref]/begin funnel for campaignRef 'the-crossing' — a static folder,
 *   so the generic dynamic route does not resolve here.
 * @permissions public
 * @relationships CampaignLead (automated), CustomBar (quest pool)
 * @dimensions WHO:prospective player, WHAT:choose-a-path, WHERE:the-crossing, ENERGY:invite
 */
export default function TheCrossingBeginPage() {
  return <BeginPage campaignRef="the-crossing" />
}
